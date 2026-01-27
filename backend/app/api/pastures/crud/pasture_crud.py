# backend/app/api/pastures/crud/pasture_crud.py
from sqlalchemy.orm import Session
from typing import List, Optional
from model.models import Pasture, Farm
from app.api.pastures.schemas.pasture_schemas import PastureCreate, PastureUpdate

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

def create_pasture(db: Session, pasture_data: PastureCreate, user_id: int) -> Pasture:
    """Создать новое пастбище"""
    # Проверяем, что ферма принадлежит пользователю
    farm = db.query(Farm).filter(Farm.id == pasture_data.farm_id, Farm.owner_id == user_id).first()
    if not farm:
        raise ValueError("Ферма не найдена или не принадлежит пользователю")
    
    db_pasture = Pasture(**pasture_data.dict())
    db.add(db_pasture)
    db.commit()
    db.refresh(db_pasture)
    return db_pasture

def update_pasture(db: Session, pasture_id: int, pasture_data: PastureUpdate, user_id: int) -> Optional[Pasture]:
    """Обновить пастбище"""
    db_pasture = get_pasture(db, pasture_id, user_id)
    if not db_pasture:
        return None
    
    update_data = pasture_data.dict(exclude_unset=True)
    
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