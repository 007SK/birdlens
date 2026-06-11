"""Supabase client and all database query functions for BirdLens."""
import os
from typing import Optional

from supabase import create_client, Client


def get_supabase_client() -> Client:
    """Return a fresh Supabase client with HTTP/2 disabled to prevent idle connection errors.

    A new instance is created on each call so connections never go stale between requests.
    """
    url = os.environ["SUPABASE_URL"]
    key = os.environ["SUPABASE_SERVICE_KEY"]
    try:
        from supabase.lib.client_options import ClientOptions
        return create_client(url, key, options=ClientOptions(httpx_client_args={"http2": False}))
    except (ImportError, TypeError):
        return create_client(url, key)


def save_run(
    duration_seconds: int,
    source: str,
    species_count: int,
    detection_count: int,
    lat: Optional[float] = None,
    lon: Optional[float] = None,
) -> str:
    """Insert a new run row and return its generated UUID."""
    row: dict = {
        "duration_seconds": duration_seconds,
        "source": source,
        "species_count": species_count,
        "detection_count": detection_count,
    }
    if lat is not None:
        row["lat"] = lat
    if lon is not None:
        row["lon"] = lon

    result = get_supabase_client().table("runs").insert(row).execute()
    return result.data[0]["id"]


def save_detections(run_id: str, detections: list[dict]) -> None:
    """Bulk-insert detection rows for a run."""
    if not detections:
        return
    rows = [
        {
            "run_id": run_id,
            "species_common": d["species_common"],
            "species_scientific": d["species_scientific"],
            "confidence": d["confidence"],
        }
        for d in detections
    ]
    get_supabase_client().table("detections").insert(rows).execute()


def get_or_cache_species(species_scientific: str) -> Optional[dict]:
    """Return the species_cache row, or None if not cached or both enrichment fields are NULL.

    A row with both image_url and fun_fact NULL is treated as uncached so
    that the enrichment pipeline re-fetches it (handles the pre-existing
    NULL rows from earlier runs without manual deletion).
    """
    result = (
        get_supabase_client()
        .table("species_cache")
        .select("*")
        .eq("species_scientific", species_scientific)
        .execute()
    )
    if not result.data:
        return None
    row = result.data[0]
    if row.get("image_url") is None and row.get("fun_fact") is None:
        return None
    return row


def save_species_cache(
    species_scientific: str,
    species_common: str,
    image_url: Optional[str],
    fun_fact: Optional[str],
) -> None:
    """Upsert a species enrichment record into the cache."""
    get_supabase_client().table("species_cache").upsert(
        {
            "species_scientific": species_scientific,
            "species_common": species_common,
            "image_url": image_url,
            "fun_fact": fun_fact,
        }
    ).execute()


def _confidence_label(confidence: float) -> str:
    if confidence >= 0.75:
        return "Very likely"
    if confidence >= 0.55:
        return "Likely"
    return "Possible"


def get_feed() -> list[dict]:
    """Return the 10 most recent runs that have at least one detection, with full detection lists."""
    client = get_supabase_client()

    # Fetch recent runs in bulk, then filter to those with detections.
    # We over-fetch so we can still return 10 after excluding empty runs.
    runs_result = (
        client.table("runs")
        .select("*")
        .order("created_at", desc=True)
        .limit(50)
        .execute()
    )
    if not runs_result.data:
        return []

    run_ids = [r["id"] for r in runs_result.data]
    dets_result = (
        client.table("detections")
        .select("run_id, species_common, species_scientific, confidence")
        .in_("run_id", run_ids)
        .execute()
    )

    dets_by_run: dict[str, list] = {}
    for d in dets_result.data:
        dets_by_run.setdefault(d["run_id"], []).append(d)

    scientific_names = list({d["species_scientific"] for d in dets_result.data})
    image_by_species: dict[str, Optional[str]] = {}
    if scientific_names:
        cache_result = (
            client.table("species_cache")
            .select("species_scientific, image_url")
            .in_("species_scientific", scientific_names)
            .execute()
        )
        image_by_species = {r["species_scientific"]: r["image_url"] for r in cache_result.data}

    feed = []
    for run in runs_result.data:
        run_dets = dets_by_run.get(run["id"], [])
        if not run_dets:
            continue
        feed.append(
            {
                "run_id": run["id"],
                "created_at": run["created_at"],
                "duration_seconds": run["duration_seconds"],
                "source": run["source"],
                "detections": [
                    {
                        "species_common": d["species_common"],
                        "confidence": d["confidence"],
                        "confidence_label": _confidence_label(d["confidence"]),
                        "image_url": image_by_species.get(d["species_scientific"]),
                    }
                    for d in sorted(run_dets, key=lambda x: x["confidence"], reverse=True)
                ],
            }
        )
        if len(feed) == 10:
            break
    return feed


def get_stats() -> dict:
    """Return aggregate counts for the stats bar."""
    client = get_supabase_client()

    runs_result = client.table("runs").select("id").execute()
    total_runs = len(runs_result.data)

    dets_result = client.table("detections").select("id, species_scientific").execute()
    total_detections = len(dets_result.data)
    unique_species = (
        len({d["species_scientific"] for d in dets_result.data})
        if dets_result.data
        else 0
    )

    return {
        "total_runs": total_runs,
        "total_detections": total_detections,
        "unique_species": unique_species,
    }
