# backend/app/api/farms/farm_api.py
# KokMaisa 2025 — поддержка polygon coordinates + color

import math
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from database.db import get_db
from core.security import CurrentUser
from model.models import Farm
from app.api.farms.schemas.farm_schemas import FarmCreate, FarmUpdate, FarmResponse

router = APIRouter(prefix="/farms", tags=["farms"])


# ── Геодезическое вычисление площади из полигона (на сервере для верификации) ──
def geodesic_area_ha(coords) -> float:
    """
    Shoelace + сферическая коррекция.
    coords: list of dict {lat, lng}  OR  list of CoordPoint
    Возвращает площадь в гектарах.
    """
    if not coords or len(coords) < 3:
        return 0.0
    R = 6_371_000.0  # метры
    n = len(coords)
    area = 0.0
    for i in range(n):
        j = (i + 1) % n
        lat1 = math.radians(coords[i]["lat"] if isinstance(coords[i], dict) else coords[i].lat)
        lat2 = math.radians(coords[j]["lat"] if isinstance(coords[j], dict) else coords[j].lat)
        dlng = math.radians(
            (coords[j]["lng"] if isinstance(coords[j], dict) else coords[j].lng) -
            (coords[i]["lng"] if isinstance(coords[i], dict) else coords[i].lng)
        )
        area += dlng * (2 + math.sin(lat1) + math.sin(lat2))
    m2 = abs((area * R * R) / 2)
    return round(m2 / 10_000, 2)


def _centroid(coords):
    if not coords:
        return None, None
    lats = [c["lat"] if isinstance(c, dict) else c.lat for c in coords]
    lngs = [c["lng"] if isinstance(c, dict) else c.lng for c in coords]
    return sum(lats) / len(lats), sum(lngs) / len(lngs)


# ── CRUD ───────────────────────────────────────────────────────────────────────

@router.get("/", response_model=List[FarmResponse])
def list_farms(current_user: CurrentUser, db: Session = Depends(get_db)):
    """Вернуть все фермы текущего пользователя."""
    farms = db.query(Farm).filter(Farm.owner_id == current_user.id).all()
    return farms


@router.post("/", response_model=FarmResponse, status_code=201)
def create_farm(data: FarmCreate, current_user: CurrentUser, db: Session = Depends(get_db)):
    if current_user.account_type not in ("farmer",):
        raise HTTPException(403, "Only farmers can create farms")

    # Serialize coords to list of dicts
    coords_json = [{"lat": c.lat, "lng": c.lng} for c in data.coordinates] if data.coordinates else None
    

    # Auto-calculate area from polygon if provided
    area = geodesic_area_ha(coords_json) if coords_json else data.area

    # Centroid
    clat, clng = _centroid(coords_json) if coords_json else (data.coordinates_lat, data.coordinates_lng)

    farm = Farm(
        owner_id        = current_user.id,
        name            = data.name,
        region          = data.region,
        area            = area,
        address         = data.address,
        description     = data.description,
        coordinates_lat = clat,
        coordinates_lng = clng,
        coordinates     = coords_json,
        color           = data.color or "#22c55e",
        phone           = data.phone,
        owner_name      = data.owner_name,
        owner_iin       = data.owner_iin,
        farm_type       = data.farm_type,
        established_date= data.established_date,
        crops           = data.crops,
        equipment       = data.equipment,
        status          = data.status or "active",
        photos          = data.photos,
    )
    db.add(farm)
    db.commit()
    db.refresh(farm)
    return farm


@router.get("/{farm_id}", response_model=FarmResponse)
def get_farm(farm_id: int, current_user: CurrentUser, db: Session = Depends(get_db)):
    farm = _get_owned(farm_id, current_user, db)
    return farm


@router.put("/{farm_id}", response_model=FarmResponse)
def update_farm(farm_id: int, data: FarmUpdate, current_user: CurrentUser, db: Session = Depends(get_db)):
    farm = _get_owned(farm_id, current_user, db)

    update = data.model_dump(exclude_none=True)

    # Handle polygon update
    if "coordinates" in update:
        # ✅ dict доступ через ["key"] или .get()
        coords_json = [{"lat": c["lat"], "lng": c["lng"]} for c in update.pop("coordinates")]
        farm.coordinates = coords_json
        # Recalculate area and centroid
        farm.area = geodesic_area_ha(coords_json)
        clat, clng = _centroid(coords_json)
        farm.coordinates_lat = clat
        farm.coordinates_lng = clng

    for k, v in update.items():
        setattr(farm, k, v)

    db.commit()
    db.refresh(farm)
    return farm


@router.delete("/{farm_id}", status_code=204)
def delete_farm(farm_id: int, current_user: CurrentUser, db: Session = Depends(get_db)):
    farm = _get_owned(farm_id, current_user, db)
    db.delete(farm)
    db.commit()


# ── Helpers ────────────────────────────────────────────────────────────────────

def _get_owned(farm_id: int, current_user, db: Session) -> Farm:
    farm = db.query(Farm).filter(Farm.id == farm_id).first()
    if not farm:
        raise HTTPException(404, "Farm not found")
    # Admin can see everything; farmer only their own
    if current_user.account_type != "admin" and farm.owner_id != current_user.id:
        raise HTTPException(403, "Access denied")
    return farm