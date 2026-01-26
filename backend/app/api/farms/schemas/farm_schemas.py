# backend/app/api/farms/schemas/farm_schemas.py
from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime


class FarmBase(BaseModel):
    name: str
    address: Optional[str] = None
    region: str
    area: float
    description: Optional[str] = None
    coordinates_lat: Optional[float] = None
    coordinates_lng: Optional[float] = None
    phone: Optional[str] = None
    owner_name: Optional[str] = None
    owner_iin: Optional[str] = None
    farm_type: Optional[str] = None
    established_date: Optional[date] = None
    crops: Optional[List[str]] = None
    equipment: Optional[List[str]] = None
    status: Optional[str] = "active"
    photos: Optional[List[str]] = None


class FarmCreate(FarmBase):
    pass


class FarmUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    region: Optional[str] = None
    area: Optional[float] = None
    description: Optional[str] = None
    coordinates_lat: Optional[float] = None
    coordinates_lng: Optional[float] = None
    phone: Optional[str] = None
    owner_name: Optional[str] = None
    owner_iin: Optional[str] = None
    farm_type: Optional[str] = None
    established_date: Optional[date] = None
    crops: Optional[List[str]] = None
    equipment: Optional[List[str]] = None
    status: Optional[str] = None
    photos: Optional[List[str]] = None


class FarmResponse(FarmBase):
    id: int
    owner_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True