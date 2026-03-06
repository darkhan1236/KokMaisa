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
from typing import List, Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session

from database.db import get_db
from core.security import get_current_user
from model.models import User

from .inference import predictor
from .schemas.biomass_schemas import MeasurementOut, PastureStats
from .crud.measurement_crud import (
    create_measurement,
    update_measurement_result,
    mark_measurement_failed,
    get_measurement,
    get_measurements_by_pasture,
    get_all_measurements,
    delete_measurement,
    enrich_with_names,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/measurements", tags=["measurements"])

MAX_IMAGE_SIZE = 50 * 1024 * 1024   # 50 MB


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
    # Validate file type
    if not photo.content_type or not photo.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    image_bytes = await photo.read()
    if len(image_bytes) > MAX_IMAGE_SIZE:
        raise HTTPException(status_code=413, detail="Image too large (max 50 MB)")

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
    measurements = get_all_measurements(db)
    return enrich_with_names(measurements, db)


@router.get("/pasture/{pasture_id}", response_model=List[MeasurementOut])
def list_pasture_measurements(
    pasture_id:   int,
    db:           Session = Depends(get_db),
    current_user: User    = Depends(get_current_user),
):
    measurements = get_measurements_by_pasture(db, pasture_id)
    return enrich_with_names(measurements, db)


@router.get("/pasture/{pasture_id}/stats", response_model=Optional[PastureStats])
def get_pasture_stats(
    pasture_id:   int,
    db:           Session = Depends(get_db),
    current_user: User    = Depends(get_current_user),
):
    measurements = get_measurements_by_pasture(db, pasture_id)
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
    if not delete_measurement(db, measurement_id):
        raise HTTPException(status_code=404, detail="Measurement not found")