from sqlalchemy.orm import Session
from sqlalchemy import or_

from model.models import Drone, Farm
from app.api.drones.schemas.drone_schemas import DroneCreate, DroneUpdate


def get_drones(db: Session, user_id: int, skip: int = 0, limit: int = 100):
    """Получить все дроны пользователя (через его фермы)"""
    return db.query(Drone).join(Farm).filter(
        Farm.owner_id == user_id
    ).offset(skip).limit(limit).all()


def get_drones_by_farm(db: Session, farm_id: int, user_id: int, skip: int = 0, limit: int = 100):
    """Получить дроны конкретной фермы с проверкой доступа"""
    # Проверяем, принадлежит ли ферма пользователю
    farm = db.query(Farm).filter(
        Farm.id == farm_id,
        Farm.owner_id == user_id
    ).first()
    
    if not farm:
        raise ValueError("Ферма не найдена или доступ запрещен")
    
    return db.query(Drone).filter(
        Drone.farm_id == farm_id
    ).offset(skip).limit(limit).all()


def get_drone(db: Session, drone_id: int, user_id: int):
    """Получить дрон по ID с проверкой доступа"""
    return db.query(Drone).join(Farm).filter(
        Drone.id == drone_id,
        Farm.owner_id == user_id
    ).first()


def get_drone_by_serial(db: Session, serial_number: str):
    """Получить дрон по серийному номеру"""
    return db.query(Drone).filter(
        Drone.serial_number == serial_number
    ).first()


def create_drone(db: Session, drone_data: DroneCreate, user_id: int):
    """Создать новый дрон"""
    # Проверяем, принадлежит ли ферма пользователю
    farm = db.query(Farm).filter(
        Farm.id == drone_data.farm_id,
        Farm.owner_id == user_id
    ).first()
    
    if not farm:
        raise ValueError("Ферма не найдена или доступ запрещен")
    
    # Проверяем уникальность серийного номера
    existing = get_drone_by_serial(db, drone_data.serial_number)
    if existing:
        raise ValueError("Дрон с таким серийным номером уже существует")
    
    drone = Drone(
        model=drone_data.model,
        serial_number=drone_data.serial_number,
        description=drone_data.description,
        farm_id=drone_data.farm_id,
        status="active"  # По умолчанию активен
    )
    
    db.add(drone)
    db.commit()
    db.refresh(drone)
    return drone


def update_drone(db: Session, drone_id: int, drone_data: DroneUpdate, user_id: int):
    """Обновить информацию о дроне"""
    drone = get_drone(db, drone_id, user_id)
    if not drone:
        return None
    
    update_data = drone_data.model_dump(exclude_unset=True)
    
    # Если меняем ферму, проверяем доступ к новой ферме
    if "farm_id" in update_data:
        new_farm = db.query(Farm).filter(
            Farm.id == update_data["farm_id"],
            Farm.owner_id == user_id
        ).first()
        
        if not new_farm:
            raise ValueError("Новая ферма не найдена или доступ запрещен")
    
    # Если меняем серийный номер, проверяем уникальность
    if "serial_number" in update_data and update_data["serial_number"] != drone.serial_number:
        existing = get_drone_by_serial(db, update_data["serial_number"])
        if existing:
            raise ValueError("Дрон с таким серийным номером уже существует")
    
    for field, value in update_data.items():
        setattr(drone, field, value)
    
    db.commit()
    db.refresh(drone)
    return drone


def update_drone_status(db: Session, drone_id: int, status: str, user_id: int):
    """Обновить статус дрона"""
    drone = get_drone(db, drone_id, user_id)
    if not drone:
        return None
    
    valid_statuses = ["active", "inactive", "maintenance"]
    if status not in valid_statuses:
        raise ValueError(f"Некорректный статус. Допустимые значения: {', '.join(valid_statuses)}")
    
    drone.status = status
    db.commit()
    db.refresh(drone)
    return drone


def delete_drone(db: Session, drone_id: int, user_id: int):
    """Удалить дрон"""
    drone = get_drone(db, drone_id, user_id)
    if not drone:
        return False
    
    db.delete(drone)
    db.commit()
    return True