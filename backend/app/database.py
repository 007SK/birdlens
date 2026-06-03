"""Supabase client and all database query functions for BirdLens."""
import os
from typing import Optional

from supabase import create_client, Client

_client: Optional[Client] = None


def get_supabase_client() -> Client:
    """Return a cached Supabase client, creating it on first call."""
    global _client
    if _client is None:
        url = os.environ["SUPABASE_URL"]
        key = os.environ["SUPABASE_SERVICE_KEY"]
        _client = create_client(url, key)
    return _client


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


def get_feed() -> list[dict]:
    """Return the last 10 runs with their top 2 detections, including cached image URLs."""
    client = get_supabase_client()

    runs_result = (
        client.table("runs")
        .select("*")
        .order("created_at", desc=True)
        .limit(10)
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

    # Look up image URLs for all unique scientific names in one query
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

    # Group detections by run_id
    dets_by_run: dict[str, list] = {}
    for d in dets_result.data:
        dets_by_run.setdefault(d["run_id"], []).append(d)

    feed = []
    for run in runs_result.data:
        top = sorted(
            dets_by_run.get(run["id"], []),
            key=lambda x: x["confidence"],
            reverse=True,
        )[:2]
        feed.append(
            {
                "run_id": run["id"],
                "created_at": run["created_at"],
                "duration_seconds": run["duration_seconds"],
                "source": run["source"],
                "top_species": [
                    {
                        "species_common": d["species_common"],
                        "confidence": d["confidence"],
                        "image_url": image_by_species.get(d["species_scientific"]),
                    }
                    for d in top
                ],
            }
        )
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
