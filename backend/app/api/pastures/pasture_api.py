# backend/app/api/pastures/pasture_api.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from database.db import get_db
from core.security import get_current_user
from model.models import User
from app.api.pastures.schemas.pasture_schemas import (
    PastureCreate,
    PastureUpdate,
    PastureResponse
)
from app.api.pastures.crud import pasture_crud

router = APIRouter(prefix="/pastures", tags=["Pastures"])

@router.get("/", response_model=List[PastureResponse])
async def get_all_pastures(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Получить все пастбища текущего пользователя"""
    pastures = pasture_crud.get_pastures(db, current_user.id, skip, limit)
    return pastures

@router.get("/farm/{farm_id}", response_model=List[PastureResponse])
async def get_farm_pastures(
    farm_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Получить все пастбища конкретной фермы"""
    pastures = pasture_crud.get_pastures_by_farm(db, farm_id, current_user.id)
    return pastures

@router.get("/{pasture_id}", response_model=PastureResponse)
async def get_pasture(
    pasture_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Получить конкретное пастбище"""
    pasture = pasture_crud.get_pasture(db, pasture_id, current_user.id)
    if not pasture:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Пастбище не найдено"
        )
    return pasture

@router.post("/", response_model=PastureResponse, status_code=status.HTTP_201_CREATED)
async def create_pasture(
    pasture_data: PastureCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Создать новое пастбище"""
    try:
        pasture = pasture_crud.create_pasture(db, pasture_data, current_user.id)
        return pasture
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.put("/{pasture_id}", response_model=PastureResponse)
async def update_pasture(
    pasture_id: int,
    pasture_data: PastureUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Обновить пастбище"""
    try:
        pasture = pasture_crud.update_pasture(db, pasture_id, pasture_data, current_user.id)
        if not pasture:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Пастбище не найдено"
            )
        return pasture
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.delete("/{pasture_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_pasture(
    pasture_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Удалить пастбище"""
    success = pasture_crud.delete_pasture(db, pasture_id, current_user.id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Пастбище не найдено"
        )
    return None