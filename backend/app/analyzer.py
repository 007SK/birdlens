"""
Audio conversion and BirdNET analysis pipeline.

Responsibilities:
- Convert any uploaded audio format to 48kHz mono WAV (required by BirdNET)
- Run birdnetlib analysis and return filtered, normalised detections
"""
import os
import subprocess
from typing import Optional

from birdnetlib import Recording
from birdnetlib.analyzer import Analyzer

# Module-level singleton — loading the model takes ~2s; we only want to do it once
# at startup, not per request.
_analyzer: Optional[Analyzer] = None


def _get_analyzer() -> Analyzer:
    global _analyzer
    if _analyzer is None:
        _analyzer = Analyzer()
    return _analyzer


def convert_to_wav(input_path: str, output_path: str) -> None:
    """Convert any audio file to 48kHz mono WAV using ffmpeg.

    Args:
        input_path: Path to the source audio file (any ffmpeg-supported format).
        output_path: Destination path for the converted WAV file.

    Raises:
        ValueError: If ffmpeg is not installed or not on PATH.
        RuntimeError: If ffmpeg exits with a non-zero status (conversion failed).
    """
    # Verify ffmpeg is available before attempting conversion.
    try:
        check = subprocess.run(
            ["ffmpeg", "-version"],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        if check.returncode != 0:
            raise ValueError(
                "ffmpeg is not installed or not on PATH. "
                "Install it with: brew install ffmpeg  (macOS) or  apt install ffmpeg  (Linux)"
            )
    except FileNotFoundError:
        raise ValueError(
            "ffmpeg is not installed or not on PATH. "
            "Install it with: brew install ffmpeg  (macOS) or  apt install ffmpeg  (Linux)"
        )

    result = subprocess.run(
        [
            "ffmpeg",
            "-y",               # overwrite output without prompting
            "-i", input_path,
            "-ar", "48000",     # 48kHz — required by BirdNET
            "-ac", "1",         # mono
            "-f", "wav",
            output_path,
        ],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.PIPE,
    )

    if result.returncode != 0:
        stderr_text = result.stderr.decode(errors="replace")
        raise RuntimeError(
            f"ffmpeg conversion failed (exit {result.returncode}):\n{stderr_text}"
        )


def run_birdnet(
    wav_path: str,
    lat: Optional[float] = None,
    lon: Optional[float] = None,
) -> list[dict]:
    """Run BirdNET analysis on a 48kHz mono WAV file.

    The WAV file is always deleted after analysis, even if an error occurs.

    Args:
        wav_path: Path to a 48kHz mono WAV file.
        lat: Optional latitude for regional species filtering.
        lon: Optional longitude for regional species filtering.

    Returns:
        List of detection dicts sorted by confidence descending, filtered to
        confidence >= 0.40. Each dict has keys:
            - species_common  (str)
            - species_scientific (str)
            - confidence (float)
    """
    try:
        kwargs: dict = {
            "min_conf": 0.1,    # fetch everything; we apply our own 0.40 cutoff below
            "overlap": 0.5,     # 0.5s overlap catches calls that straddle segment boundaries
        }
        # Pass location only when both lat and lon are provided.
        if lat is not None and lon is not None:
            kwargs["lat"] = lat
            kwargs["lon"] = lon

        recording = Recording(_get_analyzer(), wav_path, **kwargs)
        recording.analyze()

        results = [
            {
                "species_common": d["common_name"],
                "species_scientific": d["scientific_name"],
                "confidence": round(d["confidence"], 4),
            }
            for d in recording.detections
            if d["confidence"] >= 0.40
        ]

        return sorted(results, key=lambda x: x["confidence"], reverse=True)

    finally:
        # Audio must never persist — delete regardless of success or error.
        if os.path.exists(wav_path):
            os.remove(wav_path)
