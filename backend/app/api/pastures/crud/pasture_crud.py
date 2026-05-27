# backend/app/api/pastures/crud/pasture_crud.py
from sqlalchemy.orm import Session
from typing import List, Optional
from model.models import Pasture, Farm
from app.api.pastures.schemas.pasture_schemas import PastureCreate, PastureUpdate
from app.services.i18n.db_translations import update_translations


PASTURE_TRANSLATABLE_FIELDS = ("name", "pasture_type", "description")


def _serialize_coords(coords):
    if not coords:
        return None
    return [{"lat": c.lat, "lng": c.lng} for c in coords]

def get_pasture(db: Session, pasture_id: int, user_id: int) -> Optional[Pasture]:
    """Получить пастбище по ID (с проверкой владельца)"""
    return db.query(Pasture).join(Farm).filter(
        Pasture.id == pasture_id,
        Farm.owner_id == user_id
    ).first()

def get_pastures(db: Session, user_id: int, skip: int = 0, limit: int = 100) -> List[Pasture]:
    """Получить все пастбища пользователя"""
    return db.query(Pasture).join(Farm).filter(
        Farm.owner_id == user_id
    ).offset(skip).limit(limit).all()

def get_pastures_by_farm(db: Session, farm_id: int, user_id: int) -> List[Pasture]:
    """Получить все пастбища конкретной фермы"""
    farm = db.query(Farm).filter(Farm.id == farm_id, Farm.owner_id == user_id).first()
    if not farm:
        return []
    
    return db.query(Pasture).filter(Pasture.farm_id == farm_id).all()

def create_pasture(db: Session, pasture_data: PastureCreate, user_id: int, source_lang: str | None = None) -> Pasture:
    """Создать новое пастбище"""
    # Проверяем, что ферма принадлежит пользователю
    farm = db.query(Farm).filter(Farm.id == pasture_data.farm_id, Farm.owner_id == user_id).first()
    if not farm:
        raise ValueError("Ферма не найдена или не принадлежит пользователю")
    
    payload = pasture_data.model_dump()
    payload["coordinates"] = _serialize_coords(pasture_data.coordinates)
    db_pasture = Pasture(**payload)
    update_translations(
        db_pasture,
        {field: getattr(pasture_data, field, None) for field in PASTURE_TRANSLATABLE_FIELDS},
        source_lang,
    )
    db.add(db_pasture)
    db.commit()
    db.refresh(db_pasture)
    return db_pasture

def update_pasture(
    db: Session,
    pasture_id: int,
    pasture_data: PastureUpdate,
    user_id: int,
    source_lang: str | None = None,
) -> Optional[Pasture]:
    """Обновить пастбище"""
    db_pasture = get_pasture(db, pasture_id, user_id)
    if not db_pasture:
        return None
    
    update_data = pasture_data.model_dump(exclude_unset=True)

    if "coordinates" in update_data:
        update_data["coordinates"] = _serialize_coords(pasture_data.coordinates)
    
    # Если меняется farm_id, проверяем что новая ферма тоже принадлежит пользователю
    if 'farm_id' in update_data:
        farm = db.query(Farm).filter(
            Farm.id == update_data['farm_id'],
            Farm.owner_id == user_id
        ).first()
        if not farm:
            raise ValueError("Ферма не найдена или не принадлежит пользователю")
    
    for field, value in update_data.items():
        setattr(db_pasture, field, value)

    changed = {field: update_data[field] for field in PASTURE_TRANSLATABLE_FIELDS if field in update_data}
    update_translations(db_pasture, changed, source_lang)
    
    db.commit()
    db.refresh(db_pasture)
    return db_pasture

def delete_pasture(db: Session, pasture_id: int, user_id: int) -> bool:
    """Удалить пастбище"""
    db_pasture = get_pasture(db, pasture_id, user_id)
    if not db_pasture:
        return False
    
    db.delete(db_pasture)
    db.commit()
    return True
