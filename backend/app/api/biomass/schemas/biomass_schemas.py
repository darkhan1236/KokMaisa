from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class MeasurementCreate(BaseModel):
    pasture_id: int
    description: Optional[str] = None
    drone_id: Optional[int] = None


class MeasurementOut(BaseModel):
    id: int
    pasture_id: int
    pasture_name: Optional[str] = None
    method: str                          # "photo_upload" | "drone_video"
    status: str                          # "completed" | "processing" | "failed"
    biomass_value: Optional[float] = None   # центнер/га
    ndvi_value: Optional[float] = None
    coverage_percent: Optional[float] = None
    quality_score: Optional[float] = None
    drone_id: Optional[int] = None
    drone_name: Optional[str] = None
    description: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class PastureStats(BaseModel):
    pasture_name: str
    total_measurements: int
    avg_biomass: Optional[float]
    latest_biomass: Optional[float]
    avg_ndvi: Optional[float]
    latest_ndvi: Optional[float]
    trend: str   # "increasing" | "decreasing" | "stable"