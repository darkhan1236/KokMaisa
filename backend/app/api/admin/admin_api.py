# backend/app/api/admin/admin_api.py
# КокМайса 2025 — Admin Panel API

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional

from database.db import get_db
from core.security import AdminUser, get_password_hash
from model.models import User, Farm, Pasture, Drone, Measurement
from app.api.users.schemas.user_schemas import (
    AdminUserList, AdminUserUpdate, UserCreate, AccountType
)

router = APIRouter(prefix="/admin", tags=["admin"])


# ── Статистика дашборда ────────────────────────────────────────────────────

@router.get("/stats")
def get_admin_stats(
    admin: AdminUser,
    db   : Session = Depends(get_db),
):
    """Основные метрики для Admin Dashboard."""
    total_users    = db.query(func.count(User.id)).scalar()
    total_farmers  = db.query(func.count(User.id)).filter(User.account_type == "farmer").scalar()
    total_admins   = db.query(func.count(User.id)).filter(User.account_type == "admin").scalar()
    active_users   = db.query(func.count(User.id)).filter(User.is_active == True).scalar()
    total_farms    = db.query(func.count(Farm.id)).scalar()
    total_pastures = db.query(func.count(Pasture.id)).scalar()
    total_drones   = db.query(func.count(Drone.id)).scalar()
    total_analyses = db.query(func.count(Measurement.id)).scalar()

    return {
        "users"     : {"total": total_users, "farmers": total_farmers, "admins": total_admins, "active": active_users},
        "farms"     : total_farms,
        "pastures"  : total_pastures,
        "drones"    : total_drones,
        "analyses"  : total_analyses,
    }


# ── Управление пользователями ──────────────────────────────────────────────

@router.get("/users", response_model=List[AdminUserList])
def list_users(
    admin       : AdminUser,
    db          : Session = Depends(get_db),
    skip        : int = Query(0, ge=0),
    limit       : int = Query(50, ge=1, le=200),
    account_type: Optional[str] = None,
    search      : Optional[str] = None,
):
    q = db.query(User)
    if account_type:
        q = q.filter(User.account_type == account_type)
    if search:
        like = f"%{search}%"
        q = q.filter(
            User.full_name.ilike(like) |
            User.email.ilike(like) |
            User.phone.ilike(like)
        )
    return q.order_by(User.created_at.desc()).offset(skip).limit(limit).all()


@router.get("/users/{user_id}", response_model=AdminUserList)
def get_user(user_id: int, admin: AdminUser, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(404, "User not found")
    return user


@router.put("/users/{user_id}", response_model=AdminUserList)
def update_user(
    user_id    : int,
    data       : AdminUserUpdate,
    admin      : AdminUser,
    db         : Session = Depends(get_db),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(404, "User not found")

    # Нельзя снять admin у самого себя
    if user.id == admin.id and data.account_type and data.account_type != "admin":
        raise HTTPException(400, "Cannot demote yourself")

    for field, val in data.model_dump(exclude_none=True).items():
        setattr(user, field, val)

    db.commit()
    db.refresh(user)
    return user


@router.delete("/users/{user_id}")
def delete_user(user_id: int, admin: AdminUser, db: Session = Depends(get_db)):
    if user_id == admin.id:
        raise HTTPException(400, "Cannot delete yourself")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(404, "User not found")
    db.delete(user)
    db.commit()
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
def create_user_by_admin(
    data  : UserCreate,
    admin : AdminUser,
    db    : Session = Depends(get_db),
):
    """Admin может создать любого пользователя в т.ч. другого admin."""
    from app.api.users.crud.user_crud import get_user_by_email
    if get_user_by_email(db, data.email):
        raise HTTPException(400, "Email already registered")

    from core.security import get_password_hash
    user = User(
        full_name       = data.full_name,
        phone           = data.phone,
        email           = data.email,
        hashed_password = get_password_hash(data.password),
        account_type    = data.account_type,
        country         = data.country,
        city            = data.city,
        is_active       = True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


# ── Управление фермами ─────────────────────────────────────────────────────

@router.get("/farms")
def list_all_farms(
    admin : AdminUser,
    db    : Session = Depends(get_db),
    skip  : int = 0,
    limit : int = 50,
):
    farms = (
        db.query(Farm)
        .order_by(Farm.created_at.desc())
        .offset(skip).limit(limit)
        .all()
    )
    return farms


@router.delete("/farms/{farm_id}")
def delete_farm(farm_id: int, admin: AdminUser, db: Session = Depends(get_db)):
    farm = db.query(Farm).filter(Farm.id == farm_id).first()
    if not farm:
        raise HTTPException(404, "Farm not found")
    db.delete(farm)
    db.commit()
    return {"ok": True}


# ── Все измерения ──────────────────────────────────────────────────────────

@router.get("/measurements")
def list_measurements(
    admin : AdminUser,
    db    : Session = Depends(get_db),
    skip  : int = 0,
    limit : int = 100,
):
    return (
        db.query(Measurement)
        .order_by(Measurement.created_at.desc())
        .offset(skip).limit(limit)
        .all()
    )