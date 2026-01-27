from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from database.db import get_db
from core.security import get_current_user
from model.models import User
from app.api.drones.schemas.drone_schemas import (
    DroneCreate,
    DroneUpdate,
    DroneResponse,
    DroneStatusUpdate
)
from app.api.drones.crud import drone_crud

router = APIRouter(prefix="/drones", tags=["Drones"])


@router.get("/", response_model=List[DroneResponse])
async def get_all_drones(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Получить все дроны текущего пользователя"""
    if current_user.account_type != "farmer":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Только фермеры могут управлять дронами"
        )
    
    drones = drone_crud.get_drones(db, current_user.id, skip, limit)
    return drones


@router.get("/farm/{farm_id}", response_model=List[DroneResponse])
async def get_farm_drones(
    farm_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Получить все дроны конкретной фермы"""
    if current_user.account_type != "farmer":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Только фермеры могут просматривать дроны"
        )
    
    drones = drone_crud.get_drones_by_farm(db, farm_id, current_user.id)
    return drones


@router.get("/{drone_id}", response_model=DroneResponse)
async def get_drone(
    drone_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Получить конкретный дрон"""
    if current_user.account_type != "farmer":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Только фермеры могут просматривать дроны"
        )
    
    drone = drone_crud.get_drone(db, drone_id, current_user.id)
    if not drone:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Дрон не найден"
        )
    return drone


@router.post("/", response_model=DroneResponse, status_code=status.HTTP_201_CREATED)
async def create_drone(
    drone_data: DroneCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Создать новый дрон"""
    if current_user.account_type != "farmer":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Только фермеры могут создавать дроны"
        )
    
    try:
        drone = drone_crud.create_drone(db, drone_data, current_user.id)
        return drone
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.put("/{drone_id}", response_model=DroneResponse)
async def update_drone(
    drone_id: int,
    drone_data: DroneUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Обновить дрон"""
    if current_user.account_type != "farmer":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Только фермеры могут обновлять дроны"
        )
    
    try:
        drone = drone_crud.update_drone(db, drone_id, drone_data, current_user.id)
        if not drone:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Дрон не найден"
            )
        return drone
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.patch("/{drone_id}/status", response_model=DroneResponse)
async def update_drone_status(
    drone_id: int,
    status_data: DroneStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Обновить статус дрона"""
    if current_user.account_type != "farmer":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Только фермеры могут изменять статус дронов"
        )
    
    try:
        drone = drone_crud.update_drone_status(db, drone_id, status_data.status, current_user.id)
        if not drone:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Дрон не найден"
            )
        return drone
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.delete("/{drone_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_drone(
    drone_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Удалить дрон"""
    if current_user.account_type != "farmer":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Только фермеры могут удалять дроны"
        )
    
    success = drone_crud.delete_drone(db, drone_id, current_user.id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Дрон не найден"
        )
    return None