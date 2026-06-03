"""Wikipedia-based species enrichment for BirdLens."""
import httpx


async def fetch_species_enrichment(
    species_scientific: str, species_common: str
) -> dict:
    """Fetch a bird photo and fun fact from the Wikipedia REST API.

    Never raises — returns null fields on any failure so the caller
    can always proceed regardless of enrichment availability.

    Args:
        species_scientific: Scientific name (e.g. "Alauda arvensis").
        species_common: Common name, used only for logging context.

    Returns:
        Dict with keys ``image_url`` and ``fun_fact`` (either may be None).
    """
    try:
        name = species_scientific.replace(" ", "_")
        url = f"https://en.wikipedia.org/api/rest_v1/page/summary/{name}"
        async with httpx.AsyncClient(timeout=8.0) as client:
            response = await client.get(url, follow_redirects=True)
        if response.status_code != 200:
            return {"image_url": None, "fun_fact": None}

        data = response.json()
        image_url: str | None = data.get("thumbnail", {}).get("source")
        extract: str = data.get("extract", "")
        # First sentence only — keep the fun fact brief
        first_sentence = extract.split(".")[0].strip()
        fun_fact = first_sentence + "." if first_sentence else None

        return {"image_url": image_url, "fun_fact": fun_fact}

    except Exception:
        return {"image_url": None, "fun_fact": None}
