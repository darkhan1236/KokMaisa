# backend/app/api/farms/crud/farm_crud.py
from sqlalchemy.orm import Session
from model.models import Farm
from app.api.farms.schemas.farm_schemas import FarmCreate, FarmUpdate


def get_farms(db: Session, owner_id: int):
    return db.query(Farm).filter(Farm.owner_id == owner_id).all()


def get_farm(db: Session, farm_id: int, owner_id: int):
    return db.query(Farm).filter(Farm.id == farm_id, Farm.owner_id == owner_id).first()


def create_farm(db: Session, farm: FarmCreate, owner_id: int):
    db_farm = Farm(**farm.dict(), owner_id=owner_id)
    db.add(db_farm)
    db.commit()
    db.refresh(db_farm)
    return db_farm


def update_farm(db: Session, farm_id: int, farm_update: FarmUpdate, owner_id: int):
    db_farm = get_farm(db, farm_id, owner_id)
    if not db_farm:
        return None
    update_data = farm_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_farm, key, value)
    db.commit()
    db.refresh(db_farm)
    return db_farm


def delete_farm(db: Session, farm_id: int, owner_id: int):
    db_farm = get_farm(db, farm_id, owner_id)
    if not db_farm:
        return None
    db.delete(db_farm)
    db.commit()
    return db_farm