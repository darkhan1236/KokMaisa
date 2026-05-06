# backend/app/api/admin/admin_api.py
# КокМайса 2025 — Admin Panel API (полная версия)

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from typing import List, Optional

from database.db import get_db
from core.security import AdminUser, get_password_hash
from model.models import User, Farm, Pasture, Drone, Measurement, SiteSuggestion
from app.api.users.schemas.user_schemas import (
    AdminUserList, AdminUserUpdate, UserCreate, AccountType
)

router = APIRouter(prefix="/admin", tags=["admin"])


# ── Статистика ─────────────────────────────────────────────────────────────

@router.get("/stats")
def get_admin_stats(admin: AdminUser, db: Session = Depends(get_db)):
    return {
        "users": {
            "total":   db.query(func.count(User.id)).scalar(),
            "farmers": db.query(func.count(User.id)).filter(User.account_type == "farmer").scalar(),
            "admins":  db.query(func.count(User.id)).filter(User.account_type == "admin").scalar(),
            "active":  db.query(func.count(User.id)).filter(User.is_active == True).scalar(),
        },
        "farms":    db.query(func.count(Farm.id)).scalar(),
        "pastures": db.query(func.count(Pasture.id)).scalar(),
        "drones":   db.query(func.count(Drone.id)).scalar(),
        "analyses": db.query(func.count(Measurement.id)).scalar(),
        "suggestions": {
            "total": db.query(func.count(SiteSuggestion.id)).scalar(),
            "new": db.query(func.count(SiteSuggestion.id)).filter(SiteSuggestion.status == "new").scalar(),
        },
    }


# ── Пользователи ───────────────────────────────────────────────────────────

@router.get("/users", response_model=List[AdminUserList])
def list_users(
    admin: AdminUser, db: Session = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    account_type: Optional[str] = None,
    search: Optional[str] = None,
):
    q = db.query(User)
    if account_type:
        q = q.filter(User.account_type == account_type)
    if search:
        like = f"%{search}%"
        q = q.filter(User.full_name.ilike(like) | User.email.ilike(like) | User.phone.ilike(like))
    return q.order_by(User.created_at.desc()).offset(skip).limit(limit).all()


@router.get("/users/{user_id}", response_model=AdminUserList)
def get_user(user_id: int, admin: AdminUser, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(404, "User not found")
    return user


@router.put("/users/{user_id}", response_model=AdminUserList)
def update_user(user_id: int, data: AdminUserUpdate, admin: AdminUser, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(404, "User not found")
    if user.id == admin.id and data.account_type and data.account_type != "admin":
        raise HTTPException(400, "Cannot demote yourself")
    for field, val in data.model_dump(exclude_none=True).items():
        setattr(user, field, val)
    db.commit(); db.refresh(user)
    return user


@router.delete("/users/{user_id}")
def delete_user(user_id: int, admin: AdminUser, db: Session = Depends(get_db)):
    if user_id == admin.id:
        raise HTTPException(400, "Cannot delete yourself")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(404, "User not found")
    db.delete(user); db.commit()
    return {"ok": True}


@router.post("/users/{user_id}/toggle-active")
def toggle_active(user_id: int, admin: AdminUser, db: Session = Depends(get_db)):
    if user_id == admin.id:
        raise HTTPException(400, "Cannot deactivate yourself")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(404, "User not found")
    user.is_active = not user.is_active
    db.commit()
    return {"is_active": user.is_active}


@router.post("/users", response_model=AdminUserList)
def create_user(data: UserCreate, admin: AdminUser, db: Session = Depends(get_db)):
    from app.api.users.crud.user_crud import get_user_by_email
    if get_user_by_email(db, data.email):
        raise HTTPException(400, "Email already registered")
    user = User(
        full_name=data.full_name, phone=data.phone, email=data.email,
        hashed_password=get_password_hash(data.password),
        account_type=data.account_type, country=data.country,
        city=data.city, is_active=True,
    )
    db.add(user); db.commit(); db.refresh(user)
    return user


# ── Фермы ──────────────────────────────────────────────────────────────────

@router.get("/farms")
def list_farms(
    admin: AdminUser, db: Session = Depends(get_db),
    skip: int = 0, limit: int = 100,
    search: Optional[str] = None,
    status: Optional[str] = None,
):
    q = db.query(Farm).options(joinedload(Farm.owner))
    if search:
        like = f"%{search}%"
        q = q.filter(Farm.name.ilike(like) | Farm.region.ilike(like))
    if status:
        q = q.filter(Farm.status == status)

    farms = q.order_by(Farm.created_at.desc()).offset(skip).limit(limit).all()

    result = []
    for f in farms:
        pasture_count = db.query(func.count(Pasture.id)).filter(Pasture.farm_id == f.id).scalar()
        drone_count   = db.query(func.count(Drone.id)).filter(Drone.farm_id == f.id).scalar()
        result.append({
            "id": f.id, "name": f.name, "region": f.region, "area": f.area,
            "address": f.address, "farm_type": f.farm_type, "status": f.status or "active",
            "owner_id": f.owner_id,
            "owner_name": f.owner.full_name if f.owner else f.owner_name or "—",
            "owner_email": f.owner.email if f.owner else "—",
            "phone": f.phone, "crops": f.crops, "equipment": f.equipment,
            "description": f.description,
            "created_at": f.created_at.isoformat() if f.created_at else None,
            "pasture_count": pasture_count,
            "drone_count": drone_count,
        })
    return result


@router.put("/farms/{farm_id}")
def update_farm(farm_id: int, data: dict, admin: AdminUser, db: Session = Depends(get_db)):
    farm = db.query(Farm).filter(Farm.id == farm_id).first()
    if not farm:
        raise HTTPException(404, "Farm not found")
    allowed = {"name", "region", "area", "address", "farm_type", "status",
               "phone", "description", "owner_name"}
    for k, v in data.items():
        if k in allowed:
            setattr(farm, k, v)
    db.commit(); db.refresh(farm)
    return {"ok": True, "id": farm.id}


@router.delete("/farms/{farm_id}")
def delete_farm(farm_id: int, admin: AdminUser, db: Session = Depends(get_db)):
    farm = db.query(Farm).filter(Farm.id == farm_id).first()
    if not farm:
        raise HTTPException(404, "Farm not found")
    db.delete(farm); db.commit()
    return {"ok": True}


# ── Пастбища ───────────────────────────────────────────────────────────────

@router.get("/pastures")
def list_pastures(
    admin: AdminUser, db: Session = Depends(get_db),
    skip: int = 0, limit: int = 200,
    farm_id: Optional[int] = None,
):
    q = db.query(Pasture).options(joinedload(Pasture.farm))
    if farm_id:
        q = q.filter(Pasture.farm_id == farm_id)
    pastures = q.order_by(Pasture.created_at.desc()).offset(skip).limit(limit).all()

    result = []
    for p in pastures:
        meas_count = db.query(func.count(Measurement.id)).filter(Measurement.pasture_id == p.id).scalar()
        result.append({
            "id": p.id, "name": p.name, "farm_id": p.farm_id,
            "farm_name": p.farm.name if p.farm else "—",
            "area": p.area, "pasture_type": p.pasture_type,
            "status": p.status or "active", "description": p.description,
            "created_at": p.created_at.isoformat() if p.created_at else None,
            "measurement_count": meas_count,
        })
    return result


@router.delete("/pastures/{pasture_id}")
def delete_pasture(pasture_id: int, admin: AdminUser, db: Session = Depends(get_db)):
    p = db.query(Pasture).filter(Pasture.id == pasture_id).first()
    if not p:
        raise HTTPException(404, "Pasture not found")
    db.delete(p); db.commit()
    return {"ok": True}


# ── Дроны ──────────────────────────────────────────────────────────────────

@router.get("/drones")
def list_drones(
    admin: AdminUser, db: Session = Depends(get_db),
    skip: int = 0, limit: int = 100,
):
    drones = db.query(Drone).options(joinedload(Drone.farm)).order_by(Drone.created_at.desc()).offset(skip).limit(limit).all()
    return [{
        "id": dr.id, "model": dr.model, "serial_number": dr.serial_number,
        "status": dr.status or "active", "description": dr.description,
        "farm_id": dr.farm_id,
        "farm_name": dr.farm.name if dr.farm else "—",
        "created_at": dr.created_at.isoformat() if dr.created_at else None,
    } for dr in drones]


@router.put("/drones/{drone_id}")
def update_drone(drone_id: int, data: dict, admin: AdminUser, db: Session = Depends(get_db)):
    drone = db.query(Drone).filter(Drone.id == drone_id).first()
    if not drone:
        raise HTTPException(404, "Drone not found")
    for k, v in data.items():
        if k in {"model", "serial_number", "status", "description"}:
            setattr(drone, k, v)
    db.commit()
    return {"ok": True}


@router.delete("/drones/{drone_id}")
def delete_drone(drone_id: int, admin: AdminUser, db: Session = Depends(get_db)):
    drone = db.query(Drone).filter(Drone.id == drone_id).first()
    if not drone:
        raise HTTPException(404, "Drone not found")
    db.delete(drone); db.commit()
    return {"ok": True}


# ── Измерения ──────────────────────────────────────────────────────────────

@router.get("/measurements")
def list_measurements(
    admin: AdminUser, db: Session = Depends(get_db),
    skip: int = 0, limit: int = 100,
    method: Optional[str] = None,
    status: Optional[str] = None,
):
    q = db.query(Measurement).options(joinedload(Measurement.pasture))
    if method:
        q = q.filter(Measurement.method == method)
    if status:
        q = q.filter(Measurement.status == status)
    items = q.order_by(Measurement.created_at.desc()).offset(skip).limit(limit).all()

    return [{
        "id": m.id, "pasture_id": m.pasture_id,
        "pasture_name": m.pasture.name if m.pasture else "—",
        "farm_name": m.pasture.farm.name if (m.pasture and m.pasture.farm) else "—",
        "drone_id": m.drone_id, "method": m.method, "status": m.status,
        "biomass_value": m.biomass_value, "ndvi_value": m.ndvi_value,
        "coverage_percent": m.coverage_percent, "quality_score": m.quality_score,
        "description": m.description,
        "created_at": m.created_at.isoformat() if m.created_at else None,
    } for m in items]


@router.delete("/measurements/{meas_id}")
def delete_measurement(meas_id: int, admin: AdminUser, db: Session = Depends(get_db)):
    m = db.query(Measurement).filter(Measurement.id == meas_id).first()
    if not m:
        raise HTTPException(404, "Measurement not found")
    db.delete(m); db.commit()
    return {"ok": True}
