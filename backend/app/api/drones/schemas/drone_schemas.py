from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class DroneBase(BaseModel):
    model: str = Field(..., min_length=1, max_length=100, description="Модель дрона")
    serial_number: str = Field(..., min_length=1, max_length=100, description="Серийный номер")
    description: Optional[str] = Field(None, description="Описание")
    farm_id: int = Field(..., description="ID фермы, к которой привязан дрон")


class DroneCreate(DroneBase):
    pass


class DroneUpdate(BaseModel):
    model: Optional[str] = Field(None, min_length=1, max_length=100)
    serial_number: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = None
    farm_id: Optional[int] = None
    status: Optional[str] = Field(None, pattern="^(active|inactive|maintenance)$")


class DroneStatusUpdate(BaseModel):
    status: str = Field(..., pattern="^(active|inactive|maintenance)$")


class DroneResponse(DroneBase):
    id: int
    status: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True