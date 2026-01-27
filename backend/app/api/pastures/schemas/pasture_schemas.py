# backend/app/api/pastures/schemas/pasture_schemas.py
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class PastureBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    farm_id: int
    area: float = Field(..., gt=0)
    pasture_type: Optional[str] = None
    coordinates_lat: Optional[float] = None
    coordinates_lng: Optional[float] = None
    description: Optional[str] = None
    status: str = "active"

class PastureCreate(PastureBase):
    pass

class PastureUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    farm_id: Optional[int] = None
    area: Optional[float] = Field(None, gt=0)
    pasture_type: Optional[str] = None
    coordinates_lat: Optional[float] = None
    coordinates_lng: Optional[float] = None
    description: Optional[str] = None
    status: Optional[str] = None

class PastureResponse(PastureBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True