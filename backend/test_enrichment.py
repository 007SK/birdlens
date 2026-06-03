"""Standalone test for fetch_species_enrichment.

Run from the backend/ directory:
    python test_enrichment.py
"""
import asyncio
import sys
import os

sys.path.insert(0, os.path.dirname(__file__))

from app.enrichment import fetch_species_enrichment


async def main() -> None:
    result = await fetch_species_enrichment("Alauda arvensis", "Eurasian Skylark")
    print("\n=== Results ===")
    print(f"image_url : {result['image_url']}")
    print(f"fun_fact  : {result['fun_fact']}")


asyncio.run(main())
