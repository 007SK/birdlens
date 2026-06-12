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


class FeedDetectionOut(BaseModel):
    species_common: str
    confidence: float
    confidence_label: str
    image_url: Optional[str] = None


class FeedRunOut(BaseModel):
    run_id: str
    created_at: str
    duration_seconds: int
    source: str
    detections: list[FeedDetectionOut]


class FeedResponse(BaseModel):
    runs: list[FeedRunOut]


class DiscoveryOut(BaseModel):
    species_common: str
    species_scientific: str
    image_url: Optional[str] = None
    total_detections: int
    last_detected: str
    location_label: Optional[str] = None


class DiscoveriesResponse(BaseModel):
    species: list[DiscoveryOut]
