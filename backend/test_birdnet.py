"""
Standalone smoke test for birdnetlib.
Run from the backend/ directory:
    python3 test_birdnet.py

Uses local sample WAV files from the birdlensProject folder to confirm
BirdNET loads and returns detections before we build the API around it.
"""
import os
from birdnetlib import Recording
from birdnetlib.analyzer import Analyzer

SAMPLE_FILES = [
    "/Users/swatikumari/Documents/birdlensProject/mixkit-flock-of-wild-geese-20.wav",
    "/Users/swatikumari/Documents/birdlensProject/mixkit-little-birds-singing-in-the-trees-17.wav",
    "/Users/swatikumari/Documents/birdlensProject/mixkit-short-rooster-crowing-2470.wav",
]


def main() -> None:
    print("Loading BirdNET analyzer...")
    analyzer = Analyzer()
    print("Analyzer loaded.\n")

    for path in SAMPLE_FILES:
        name = os.path.basename(path)
        print(f"Running analysis on: {name}")
        recording = Recording(
            analyzer,
            path,
            min_conf=0.1,   # low threshold to see everything; app filters to ≥0.40
            overlap=0.5,
        )
        recording.analyze()

        detections = recording.detections
        print(f"  Raw detections: {len(detections)}")
        above = [d for d in detections if d["confidence"] >= 0.40]
        print(f"  Detections ≥ 0.40: {len(above)}")
        for d in sorted(above, key=lambda x: x["confidence"], reverse=True):
            print(
                f"    {d['common_name']:<35} ({d['scientific_name']})  "
                f"conf={d['confidence']:.2f}"
            )
        print()


if __name__ == "__main__":
    main()
