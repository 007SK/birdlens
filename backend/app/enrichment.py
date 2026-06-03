"""Wikipedia + iNaturalist species enrichment for BirdLens."""
from __future__ import annotations

import re
import urllib.parse

import httpx

_HEADERS = {"User-Agent": "BirdLens/1.0 (https://github.com/birdlens; contact@birdlens.app)"}


async def fetch_species_enrichment(
    species_scientific: str, species_common: str
) -> dict:
    """Fetch a bird photo from Wikipedia and a fun fact from iNaturalist.

    Never raises — returns null fields on any failure so the caller
    can always proceed regardless of enrichment availability.

    Args:
        species_scientific: Scientific name (e.g. "Alauda arvensis").
        species_common: Common name used to filter out generic opening sentences.

    Returns:
        Dict with keys ``image_url`` and ``fun_fact`` (either may be None).
    """
    image_url: str | None = None
    fun_fact: str | None = None

    async with httpx.AsyncClient(timeout=10.0, headers=_HEADERS) as client:
        # --- IMAGE: Wikipedia REST API thumbnail ---
        try:
            wiki_name = species_scientific.replace(" ", "_")
            wiki_url = f"https://en.wikipedia.org/api/rest_v1/page/summary/{wiki_name}"
            print(f"[enrichment] Fetching Wikipedia for '{species_scientific}': {wiki_url}")
            resp = await client.get(wiki_url, follow_redirects=True)
            print(f"[enrichment] Wikipedia status: {resp.status_code}")
            if resp.status_code == 200:
                wiki_data = resp.json()
                image_url = wiki_data.get("thumbnail", {}).get("source")
                print(f"[enrichment] Wikipedia image_url: {image_url}")
            else:
                print(f"[enrichment] Wikipedia non-200 → image_url=None")
        except Exception as exc:
            print(f"[enrichment] Wikipedia request failed: {exc}")

        # --- FUN FACT: iNaturalist wikipedia_summary (two-step: search → detail) ---
        try:
            search_url = (
                "https://api.inaturalist.org/v1/taxa"
                f"?q={urllib.parse.quote(species_scientific)}&rank=species"
            )
            print(f"[enrichment] iNaturalist search for '{species_scientific}': {search_url}")
            resp = await client.get(search_url, follow_redirects=True)
            print(f"[enrichment] iNaturalist search status: {resp.status_code}")
            if resp.status_code == 200:
                search_results = resp.json().get("results", [])
                print(f"[enrichment] iNaturalist search result count: {len(search_results)}")
                if search_results:
                    taxon_id = search_results[0]["id"]
                    detail_url = f"https://api.inaturalist.org/v1/taxa/{taxon_id}"
                    print(f"[enrichment] iNaturalist detail fetch: {detail_url}")
                    detail_resp = await client.get(detail_url, follow_redirects=True)
                    print(f"[enrichment] iNaturalist detail status: {detail_resp.status_code}")
                    if detail_resp.status_code == 200:
                        detail_results = detail_resp.json().get("results", [])
                        summary: str = (
                            detail_results[0].get("wikipedia_summary") or ""
                            if detail_results
                            else ""
                        )
                        print(
                            f"[enrichment] wikipedia_summary (first 200 chars): "
                            f"{summary[:200]!r}"
                        )
                        fun_fact = _pick_fun_fact(summary, species_scientific, species_common)
                        print(f"[enrichment] Extracted fun_fact: {fun_fact!r}")
                    else:
                        print(f"[enrichment] iNaturalist detail non-200 → fun_fact=None")
                else:
                    print("[enrichment] No iNaturalist results → fun_fact=None")
            else:
                print(f"[enrichment] iNaturalist search non-200 → fun_fact=None")
        except Exception as exc:
            print(f"[enrichment] iNaturalist request failed: {exc}")

    return {"image_url": image_url, "fun_fact": fun_fact}


def _strip_html(text: str) -> str:
    """Remove HTML tags and decode common entities from a string."""
    text = re.sub(r"<[^>]+>", "", text)
    text = text.replace("&amp;", "&").replace("&lt;", "<").replace("&gt;", ">")
    return text


def _pick_fun_fact(
    summary: str, species_scientific: str, species_common: str
) -> str | None:
    """Return a non-generic sentence from a Wikipedia summary.

    Prefers sentences that don't open with the species name and avoid
    boilerplate like "is a species". Falls back to any sentence with at
    least 8 words. Returns None only if the summary is empty or all
    sentences are too short.
    """
    if not summary:
        return None

    clean = _strip_html(summary)
    raw = clean.replace("\n", " ").split(". ")
    sentences = [s.strip().rstrip(".") + "." for s in raw if s.strip()]

    sci_lower = species_scientific.lower()
    com_lower = species_common.lower()
    name_prefixes = tuple(
        {
            sci_lower,
            com_lower,
            sci_lower.split()[0],
            com_lower.split()[0],
            "the " + sci_lower,
            "the " + com_lower,
            "the " + sci_lower.split()[0],
            "the " + com_lower.split()[0],
        }
    )
    generic_phrases = ("is a species", "is a bird")

    def _good(s: str) -> bool:
        low = s.lower()
        return (
            not any(low.startswith(p) for p in name_prefixes)
            and not any(p in low for p in generic_phrases)
            and len(s.split()) >= 8
        )

    for s in sentences:
        if _good(s):
            return s

    # Fallback: any sentence long enough (after HTML strip)
    for s in sentences:
        if len(s.split()) >= 8:
            return s

    return None
