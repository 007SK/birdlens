"""BirdLens FastAPI application."""
import os
import uuid
from typing import Optional

from dotenv import load_dotenv
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()  # reads backend/.env before any module accesses os.environ

from app import analyzer, database, enrichment  # noqa: E402 — must come after load_dotenv
from app.models import AnalyzeResponse, DiscoveriesResponse, FeedResponse, StatsOut  # noqa: E402

app = FastAPI(title="BirdLens API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://birdlens.vercel.app",
        "https://*.vercel.app",
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)


def _confidence_label(confidence: float) -> str:
    if confidence >= 0.75:
        return "Very likely"
    if confidence >= 0.55:
        return "Likely"
    return "Possible"


@app.get("/health")
async def health() -> dict:
    """Liveness check used by Hugging Face Spaces."""
    return {"status": "ok"}


@app.post("/analyze", response_model=AnalyzeResponse)
async def analyze(
    audio: UploadFile = File(...),
    duration: int = Form(...),
    source: str = Form(...),
    lat: Optional[float] = Form(None),
    lon: Optional[float] = Form(None),
    location_label: Optional[str] = Form(None),
) -> dict:
    """Accept an audio clip, run BirdNET, persist results, return detections."""
    if duration > 30:
        raise HTTPException(
            status_code=400,
            detail={
                "error": "duration_exceeded",
                "message": "Audio exceeds 30 seconds. Please trim and resubmit.",
            },
        )
    if source not in ("mic", "upload"):
        raise HTTPException(
            status_code=400,
            detail={
                "error": "invalid_source",
                "message": "source must be 'mic' or 'upload'.",
            },
        )

    temp_id = str(uuid.uuid4())
    original_path = f"/tmp/birdlens_{temp_id}_original"
    wav_path = f"/tmp/birdlens_{temp_id}.wav"

    try:
        # Persist upload to disk so ffmpeg can read it
        content = await audio.read()
        with open(original_path, "wb") as f:
            f.write(content)

        # Convert to 48kHz mono WAV
        try:
            analyzer.convert_to_wav(original_path, wav_path)
        except ValueError as exc:
            raise HTTPException(status_code=500, detail={"error": "ffmpeg_missing", "message": str(exc)})
        except RuntimeError as exc:
            raise HTTPException(status_code=422, detail={"error": "conversion_failed", "message": str(exc)})

        # Run BirdNET — wav_path is deleted inside run_birdnet regardless of outcome
        try:
            detections = analyzer.run_birdnet(wav_path, lat, lon)
            wav_path = ""  # mark as consumed so finally block skips it
        except Exception:
            wav_path = ""
            raise HTTPException(
                status_code=422,
                detail={
                    "error": "no_audio_detected",
                    "message": "Could not process this file. Ensure it contains audio.",
                },
            )

        # Deduplicate: one entry per species, keeping the highest confidence segment
        best: dict[str, dict] = {}
        for d in detections:
            sci = d["species_scientific"]
            if sci not in best or d["confidence"] > best[sci]["confidence"]:
                best[sci] = d
        detections = sorted(best.values(), key=lambda x: x["confidence"], reverse=True)

        # Enrich each detection via species_cache → Wikipedia fallback
        enriched = []
        for d in detections:
            cached = database.get_or_cache_species(d["species_scientific"])
            if cached is None:
                enrichment_data = await enrichment.fetch_species_enrichment(
                    d["species_scientific"], d["species_common"]
                )
                try:
                    database.save_species_cache(
                        d["species_scientific"],
                        d["species_common"],
                        enrichment_data["image_url"],
                        enrichment_data["fun_fact"],
                    )
                except Exception as e:
                    print(f"Cache write failed for {d['species_scientific']}: {e}")
                image_url = enrichment_data["image_url"]
                fun_fact = enrichment_data["fun_fact"]
            else:
                image_url = cached["image_url"]
                fun_fact = cached["fun_fact"]

            enriched.append(
                {
                    **d,
                    "confidence_label": _confidence_label(d["confidence"]),
                    "image_url": image_url,
                    "fun_fact": fun_fact,
                }
            )

        # Persist run and detections — failures must not kill the response
        run_id = temp_id  # fallback: use the temp UUID if DB write fails
        try:
            run_id = database.save_run(
                duration_seconds=duration,
                source=source,
                species_count=len(enriched),
                detection_count=len(enriched),
                lat=lat,
                lon=lon,
                location_label=location_label,
            )
        except Exception as e:
            print(f"save_run failed: {e}")

        try:
            database.save_detections(run_id, enriched)
        except Exception as e:
            print(f"save_detections failed: {e}")

        try:
            stats = database.get_stats()
        except Exception as e:
            print(f"get_stats failed: {e}")
            stats = {"total_runs": 0, "total_detections": 0, "unique_species": 0}

        return {
            "run_id": run_id,
            "duration_seconds": duration,
            "detections": enriched,
            "stats": stats,
        }

    finally:
        for path in (original_path, wav_path):
            if path and os.path.exists(path):
                os.remove(path)


@app.get("/discoveries", response_model=DiscoveriesResponse)
async def discoveries() -> dict:
    """Return all unique species ever detected with aggregate stats."""
    try:
        species = database.get_discoveries()
    except Exception as e:
        print(f"get_discoveries failed: {e}")
        species = []
    return {"species": species}


@app.get("/feed", response_model=FeedResponse)
async def feed() -> dict:
    """Return the last 10 runs with top species, newest first."""
    return {"runs": database.get_feed()}


@app.get("/stats", response_model=StatsOut)
async def stats() -> dict:
    """Return aggregate counts for the stats bar."""
    return database.get_stats()
