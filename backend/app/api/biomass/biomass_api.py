"""
/measurements  –  Biomass measurement endpoints.

POST /measurements/photo          – upload image, run inference, save result
POST /measurements/drone          – register drone scan (manual / async flow)
GET  /measurements/               – list all measurements for current user
GET  /measurements/pasture/{id}   – measurements for a specific pasture
GET  /measurements/pasture/{id}/stats – aggregated stats for a pasture
DELETE /measurements/{id}         – delete a measurement
"""
import logging
import io
from typing import List, Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from PIL import Image, UnidentifiedImageError
from sqlalchemy.orm import Session

from database.db import get_db
from core.security import get_current_user
from model.models import Drone, Farm, Pasture, User

from .inference import predictor
from .schemas.biomass_schemas import MeasurementOut, PastureStats
from .crud.measurement_crud import (
    create_measurement,
    update_measurement_result,
    mark_measurement_failed,
    get_measurement,
    get_measurements_by_pasture,
    get_measurements_by_pasture_for_user,
    get_all_measurements,
    get_measurements_for_user,
    delete_measurement,
    delete_measurement_for_user,
    enrich_with_names,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/measurements", tags=["measurements"])

MAX_IMAGE_SIZE = 50 * 1024 * 1024   # 50 MB
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp"}


def _validate_uploaded_image(content: bytes, content_type: str | None) -> None:
    if content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(status_code=400, detail="File must be a JPEG, PNG, or WebP image")
    if len(content) > MAX_IMAGE_SIZE:
        raise HTTPException(status_code=413, detail="Image too large (max 50 MB)")
    try:
        with Image.open(io.BytesIO(content)) as image:
            image.verify()
    except (UnidentifiedImageError, OSError):
        raise HTTPException(status_code=400, detail="Invalid image file")


def _get_owned_pasture(db: Session, pasture_id: int, current_user: User) -> Pasture:
    pasture = (
        db.query(Pasture)
        .join(Farm, Pasture.farm_id == Farm.id)
        .filter(Pasture.id == pasture_id)
        .first()
    )
    if not pasture:
        raise HTTPException(status_code=404, detail="Pasture not found")
    if current_user.account_type != "admin" and pasture.farm.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    return pasture


def _get_owned_drone(db: Session, drone_id: int, current_user: User) -> Drone:
    drone = (
        db.query(Drone)
        .join(Farm, Drone.farm_id == Farm.id)
        .filter(Drone.id == drone_id)
        .first()
    )
    if not drone:
        raise HTTPException(status_code=404, detail="Drone not found")
    if current_user.account_type != "admin" and drone.farm.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    return drone


# ─── Photo upload + inference ─────────────────────────────────────────────────

@router.post("/photo", response_model=MeasurementOut)
async def create_photo_measurement(
    pasture_id:  int           = Form(...),
    description: Optional[str] = Form(None),
    photo:       UploadFile    = File(...),
    db:          Session       = Depends(get_db),
    current_user: User         = Depends(get_current_user),
):
    """
    Upload a pasture photo → run biomass inference → return result.
    The endpoint is synchronous; inference typically takes 1-5 s on GPU.
    """
    image_bytes = await photo.read()
    _validate_uploaded_image(image_bytes, photo.content_type)

    _get_owned_pasture(db, pasture_id, current_user)

    # Create a DB record immediately so the frontend can track it
    measurement = create_measurement(
        db,
        pasture_id  = pasture_id,
        method      = "photo_upload",
        status      = "processing",
        description = description,
    )

    # Run inference
    if not predictor.is_loaded:
        mark_measurement_failed(db, measurement.id)
        raise HTTPException(
            status_code=503,
            detail="Model is not loaded. Check MODEL_PATH in your .env file.",
        )

    try:
        biomass = predictor.predict_from_bytes(image_bytes)
        logger.info(
            "Measurement %d: predicted biomass=%.2f ц/га for pasture %d",
            measurement.id, biomass, pasture_id,
        )
    except Exception as exc:
        logger.exception("Inference failed for measurement %d", measurement.id)
        mark_measurement_failed(db, measurement.id)
        raise HTTPException(status_code=500, detail=f"Inference error: {exc}") from exc

    # Persist result
    measurement = update_measurement_result(
        db,
        measurement_id = measurement.id,
        biomass_value  = round(biomass, 2),
        status         = "completed",
    )

    rows = enrich_with_names([measurement], db)
    return rows[0]


# ─── Drone measurement (register without inference) ───────────────────────────

@router.post("/drone", response_model=MeasurementOut)
async def create_drone_measurement(
    pasture_id:  int           = Form(...),
    drone_id:    int           = Form(...),
    description: Optional[str] = Form(None),
    db:          Session       = Depends(get_db),
    current_user: User         = Depends(get_current_user),
):
    """
    Register a drone scan. 
    If the drone uploads a frame you can also call /measurements/photo 
    and set method='drone_video' via a separate param.
    """
    pasture = _get_owned_pasture(db, pasture_id, current_user)
    drone = _get_owned_drone(db, drone_id, current_user)
    if drone.farm_id != pasture.farm_id:
        raise HTTPException(status_code=400, detail="Drone does not belong to this pasture's farm")

    measurement = create_measurement(
        db,
        pasture_id  = pasture_id,
        method      = "drone_video",
        status      = "processing",
        description = description,
        drone_id    = drone_id,
    )
    rows = enrich_with_names([measurement], db)
    return rows[0]


# ─── Read endpoints ───────────────────────────────────────────────────────────

@router.get("/", response_model=List[MeasurementOut])
def list_measurements(
    db:           Session = Depends(get_db),
    current_user: User    = Depends(get_current_user),
):
    measurements = (
        get_all_measurements(db)
        if current_user.account_type == "admin"
        else get_measurements_for_user(db, current_user.id)
    )
    return enrich_with_names(measurements, db)


@router.get("/pasture/{pasture_id}", response_model=List[MeasurementOut])
def list_pasture_measurements(
    pasture_id:   int,
    db:           Session = Depends(get_db),
    current_user: User    = Depends(get_current_user),
):
    _get_owned_pasture(db, pasture_id, current_user)
    measurements = (
        get_measurements_by_pasture(db, pasture_id)
        if current_user.account_type == "admin"
        else get_measurements_by_pasture_for_user(db, pasture_id, current_user.id)
    )
    return enrich_with_names(measurements, db)


@router.get("/pasture/{pasture_id}/stats", response_model=Optional[PastureStats])
def get_pasture_stats(
    pasture_id:   int,
    db:           Session = Depends(get_db),
    current_user: User    = Depends(get_current_user),
):
    _get_owned_pasture(db, pasture_id, current_user)
    measurements = (
        get_measurements_by_pasture(db, pasture_id)
        if current_user.account_type == "admin"
        else get_measurements_by_pasture_for_user(db, pasture_id, current_user.id)
    )
    completed    = [m for m in measurements if m.status == "completed" and m.biomass_value]

    if not completed:
        return None

    biomass_vals = [m.biomass_value for m in completed]
    ndvi_vals    = [m.ndvi_value for m in completed if m.ndvi_value]

    trend = "stable"
    if len(biomass_vals) >= 2:
        if biomass_vals[0] > biomass_vals[1] * 1.1:
            trend = "increasing"
        elif biomass_vals[0] < biomass_vals[1] * 0.9:
            trend = "decreasing"

    from model.models import Pasture
    p = db.query(Pasture).filter(Pasture.id == pasture_id).first()

    return PastureStats(
        pasture_name       = p.name if p else "Unknown",
        total_measurements = len(completed),
        avg_biomass        = round(sum(biomass_vals) / len(biomass_vals), 2),
        latest_biomass     = round(biomass_vals[0], 2),
        avg_ndvi           = round(sum(ndvi_vals) / len(ndvi_vals), 4) if ndvi_vals else None,
        latest_ndvi        = round(ndvi_vals[0], 4) if ndvi_vals else None,
        trend              = trend,
    )


# ─── Delete ───────────────────────────────────────────────────────────────────

@router.delete("/{measurement_id}", status_code=204)
def remove_measurement(
    measurement_id: int,
    db:             Session = Depends(get_db),
    current_user:   User    = Depends(get_current_user),
):
    deleted = (
        delete_measurement(db, measurement_id)
        if current_user.account_type == "admin"
        else delete_measurement_for_user(db, measurement_id, current_user.id)
    )
    if not deleted:
        raise HTTPException(status_code=404, detail="Measurement not found")
