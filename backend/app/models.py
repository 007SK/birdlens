"""Pydantic models for BirdLens API request/response validation."""
from typing import Optional
from pydantic import BaseModel


class DetectionOut(BaseModel):
    species_common: str
    species_scientific: str
    confidence: float
    confidence_label: str
    image_url: Optional[str] = None
    fun_fact: Optional[str] = None


class StatsOut(BaseModel):
    total_runs: int
    total_detections: int
    unique_species: int


class AnalyzeResponse(BaseModel):
    run_id: str
    duration_seconds: int
    detections: list[DetectionOut]
    stats: StatsOut


class TopSpeciesOut(BaseModel):
    species_common: str
    confidence: float
    image_url: Optional[str] = None


class FeedRunOut(BaseModel):
    run_id: str
    created_at: str
    duration_seconds: int
    source: str
    top_species: list[TopSpeciesOut]


class FeedResponse(BaseModel):
    runs: list[FeedRunOut]
