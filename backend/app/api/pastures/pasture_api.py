# backend/app/api/pastures/pasture_api.py
from fastapi import APIRouter, Depends, Header, HTTPException, Query, status
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
from app.services.i18n.db_translations import localized_dict, normalize_lang

router = APIRouter(prefix="/pastures", tags=["Pastures"])
PASTURE_TRANSLATABLE_FIELDS = ("name", "pasture_type", "description")


def _request_lang(lang: str | None, accept_language: str | None) -> str:
    return normalize_lang(lang or accept_language)


def _localize_pasture(db: Session, pasture, lang: str) -> dict:
    return localized_dict(pasture, PASTURE_TRANSLATABLE_FIELDS, lang)

@router.get("/", response_model=List[PastureResponse])
async def get_all_pastures(
    skip: int = 0,
    limit: int = 100,
    lang: str | None = Query(default=None),
    accept_language: str | None = Header(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Получить все пастбища текущего пользователя"""
    selected_lang = _request_lang(lang, accept_language)
    pastures = pasture_crud.get_pastures(db, current_user.id, skip, limit)
    return [_localize_pasture(db, pasture, selected_lang) for pasture in pastures]

@router.get("/farm/{farm_id}", response_model=List[PastureResponse])
async def get_farm_pastures(
    farm_id: int,
    lang: str | None = Query(default=None),
    accept_language: str | None = Header(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Получить все пастбища конкретной фермы"""
    selected_lang = _request_lang(lang, accept_language)
    pastures = pasture_crud.get_pastures_by_farm(db, farm_id, current_user.id)
    return [_localize_pasture(db, pasture, selected_lang) for pasture in pastures]

@router.get("/{pasture_id}", response_model=PastureResponse)
async def get_pasture(
    pasture_id: int,
    lang: str | None = Query(default=None),
    accept_language: str | None = Header(default=None),
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
    return _localize_pasture(db, pasture, _request_lang(lang, accept_language))

@router.post("/", response_model=PastureResponse, status_code=status.HTTP_201_CREATED)
async def create_pasture(
    pasture_data: PastureCreate,
    lang: str | None = Query(default=None),
    accept_language: str | None = Header(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Создать новое пастбище"""
    try:
        selected_lang = _request_lang(lang, accept_language)
        pasture = pasture_crud.create_pasture(db, pasture_data, current_user.id, selected_lang)
        return _localize_pasture(db, pasture, selected_lang)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.put("/{pasture_id}", response_model=PastureResponse)
async def update_pasture(
    pasture_id: int,
    pasture_data: PastureUpdate,
    lang: str | None = Query(default=None),
    accept_language: str | None = Header(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Обновить пастбище"""
    try:
        selected_lang = _request_lang(lang, accept_language)
        pasture = pasture_crud.update_pasture(db, pasture_id, pasture_data, current_user.id, selected_lang)
        if not pasture:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Пастбище не найдено"
            )
        return _localize_pasture(db, pasture, selected_lang)
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
