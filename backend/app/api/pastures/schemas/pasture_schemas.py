from datetime import datetime
from typing import List, Optional

from pydantic import AliasChoices, BaseModel, ConfigDict, Field


class CoordPoint(BaseModel):
    lat: float
    lng: float


class PastureBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    farm_id: int
    area: float = Field(..., ge=0)
    pasture_type: Optional[str] = Field(
        default=None,
        validation_alias=AliasChoices("pasture_type", "grass_type"),
    )
    coordinates_lat: Optional[float] = None
    coordinates_lng: Optional[float] = None
    coordinates: Optional[List[CoordPoint]] = None
    color: Optional[str] = "#22c55e"
    description: Optional[str] = None
    status: str = "active"


class PastureCreate(PastureBase):
    pass


class PastureUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    farm_id: Optional[int] = None
    area: Optional[float] = Field(None, ge=0)
    pasture_type: Optional[str] = Field(
        default=None,
        validation_alias=AliasChoices("pasture_type", "grass_type"),
    )
    coordinates_lat: Optional[float] = None
    coordinates_lng: Optional[float] = None
    coordinates: Optional[List[CoordPoint]] = None
    color: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None


class PastureResponse(BaseModel):
    id: int
    name: str
    farm_id: int
    area: float
    pasture_type: Optional[str]
    coordinates_lat: Optional[float]
    coordinates_lng: Optional[float]
    coordinates: Optional[List[CoordPoint]]
    color: Optional[str]
    description: Optional[str]
    status: Optional[str]
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
