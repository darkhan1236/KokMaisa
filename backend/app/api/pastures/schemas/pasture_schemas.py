from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class PastureBase(BaseModel):
    name: str
    area: float
    pasture_type: Optional[str]
    coordinates_lat: Optional[float]
    coordinates_lng: Optional[float]
    boundaries: Optional[List[dict]]
    description: Optional[str]
    status: Optional[str] = "active"

class PastureCreate(PastureBase):
    farm_id: int

class PastureUpdate(BaseModel):
    name: Optional[str]
    area: Optional[float]
    pasture_type: Optional[str]
    coordinates_lat: Optional[float]
    coordinates_lng: Optional[float]
    boundaries: Optional[List[dict]]
    description: Optional[str]
    status: Optional[str]

class PastureResponse(PastureBase):
    id: int
    farm_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True