# backend/app/api/farms/farm_api.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from core.security import get_current_user
from database.db import get_db
from model.models import Farm
from app.api.farms.schemas.farm_schemas import FarmResponse, FarmCreate, FarmUpdate
from app.api.farms.crud.farm_crud import get_farms, get_farm, create_farm, update_farm, delete_farm

router = APIRouter(prefix="/farms", tags=["farms"])


@router.get("/", response_model=list[FarmResponse])
def read_farms(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    if current_user.account_type != "farmer":
        raise HTTPException(status_code=403, detail="Only farmers can view their farms")
    return get_farms(db, current_user.id)


@router.get("/{farm_id}", response_model=FarmResponse)
def read_farm(farm_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    if current_user.account_type != "farmer":
        raise HTTPException(status_code=403, detail="Only farmers can view farms")
    farm = get_farm(db, farm_id, current_user.id)
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")
    return farm


@router.post("/", response_model=FarmResponse, status_code=status.HTTP_201_CREATED)
def create_new_farm(farm: FarmCreate, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    if current_user.account_type != "farmer":
        raise HTTPException(status_code=403, detail="Only farmers can create farms")
    return create_farm(db, farm, current_user.id)


@router.put("/{farm_id}", response_model=FarmResponse)
def update_existing_farm(farm_id: int, farm_update: FarmUpdate, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    if current_user.account_type != "farmer":
        raise HTTPException(status_code=403, detail="Only farmers can update farms")
    updated = update_farm(db, farm_id, farm_update, current_user.id)
    if not updated:
        raise HTTPException(status_code=404, detail="Farm not found or access denied")
    return updated


@router.delete("/{farm_id}")
def delete_existing_farm(farm_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    if current_user.account_type != "farmer":
        raise HTTPException(status_code=403, detail="Only farmers can delete farms")
    deleted = delete_farm(db, farm_id, current_user.id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Farm not found or access denied")
    return {"message": "Farm deleted successfully"}