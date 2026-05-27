# backend/app/api/farms/schemas/farm_schemas.py
# KokMaisa 2025 — добавлены polygon coordinates + color

from pydantic import BaseModel, Field, ConfigDict
from typing import Any, Dict, Optional, List
from datetime import date, datetime


class CoordPoint(BaseModel):
    lat: float
    lng: float


class FarmCreate(BaseModel):
    name           : str = Field(..., max_length=255)
    region         : str = Field(..., max_length=200)
    area           : float = Field(..., gt=0)                 # га — считается на фронте из полигона
    address        : Optional[str]        = None
    description    : Optional[str]        = None
    coordinates_lat: Optional[float]      = None              # центроид
    coordinates_lng: Optional[float]      = None
    coordinates    : Optional[List[CoordPoint]] = None        # ← полигон [{lat,lng},...]
    color          : Optional[str]        = "#22c55e"         # ← цвет полигона
    phone          : Optional[str]        = None
    owner_name     : Optional[str]        = None
    owner_iin      : Optional[str]        = None
    farm_type      : Optional[str]        = None
    established_date: Optional[date]      = None
    crops          : Optional[List[str]]  = None
    equipment      : Optional[List[str]]  = None
    translations   : Optional[Dict[str, Dict[str, Any]]] = None
    status         : Optional[str]        = "active"
    photos         : Optional[List[str]]  = None


class FarmUpdate(BaseModel):
    name           : Optional[str]        = None
    region         : Optional[str]        = None
    area           : Optional[float]      = None
    address        : Optional[str]        = None
    description    : Optional[str]        = None
    coordinates_lat: Optional[float]      = None
    coordinates_lng: Optional[float]      = None
    coordinates    : Optional[List[CoordPoint]] = None
    color          : Optional[str]        = None
    phone          : Optional[str]        = None
    owner_name     : Optional[str]        = None
    owner_iin      : Optional[str]        = None
    farm_type      : Optional[str]        = None
    established_date: Optional[date]      = None
    crops          : Optional[List[str]]  = None
    equipment      : Optional[List[str]]  = None
    translations   : Optional[Dict[str, Dict[str, Any]]] = None
    status         : Optional[str]        = None
    photos         : Optional[List[str]]  = None


class FarmResponse(BaseModel):
    id             : int
    name           : str
    region         : str
    area           : float
    address        : Optional[str]
    description    : Optional[str]
    coordinates_lat: Optional[float]
    coordinates_lng: Optional[float]
    coordinates    : Optional[List[CoordPoint]]   # ← полигон
    color          : Optional[str]
    phone          : Optional[str]
    owner_name     : Optional[str]
    owner_iin      : Optional[str]
    farm_type      : Optional[str]
    established_date: Optional[date]
    crops          : Optional[List[str]]
    equipment      : Optional[List[str]]
    translations   : Optional[Dict[str, Dict[str, Any]]] = None
    status         : Optional[str]
    photos         : Optional[List[str]]
    created_at     : Optional[datetime]

    model_config = ConfigDict(from_attributes=True)


# ─── Migration SQL (добавьте к таблице farms) ──────────────────────────────
# ALTER TABLE farms ADD COLUMN IF NOT EXISTS coordinates  JSON;
# ALTER TABLE farms ADD COLUMN IF NOT EXISTS color        VARCHAR(20) DEFAULT '#22c55e';
