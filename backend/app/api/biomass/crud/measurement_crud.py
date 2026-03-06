from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import desc

# Adjust import path to match your project structure
from model.models import Measurement, Pasture, Drone


def create_measurement(
    db: Session,
    pasture_id: int,
    method: str,
    status: str = "processing",
    description: Optional[str] = None,
    drone_id: Optional[int] = None,
) -> Measurement:
    m = Measurement(
        pasture_id  = pasture_id,
        method      = method,
        status      = status,
        description = description,
        drone_id    = drone_id,
    )
    db.add(m)
    db.commit()
    db.refresh(m)
    return m


def update_measurement_result(
    db: Session,
    measurement_id: int,
    biomass_value: float,
    ndvi_value: Optional[float]        = None,
    coverage_percent: Optional[float]  = None,
    quality_score: Optional[float]     = None,
    status: str                        = "completed",
) -> Optional[Measurement]:
    m = db.query(Measurement).filter(Measurement.id == measurement_id).first()
    if not m:
        return None
    m.status           = status
    m.biomass_value    = biomass_value
    m.ndvi_value       = ndvi_value
    m.coverage_percent = coverage_percent
    m.quality_score    = quality_score
    db.commit()
    db.refresh(m)
    return m


def get_measurement(db: Session, measurement_id: int) -> Optional[Measurement]:
    return db.query(Measurement).filter(Measurement.id == measurement_id).first()


def get_measurements_by_pasture(
    db: Session,
    pasture_id: int,
    limit: int = 50,
) -> List[Measurement]:
    return (
        db.query(Measurement)
        .filter(Measurement.pasture_id == pasture_id)
        .order_by(desc(Measurement.created_at))
        .limit(limit)
        .all()
    )


def get_all_measurements(db: Session, limit: int = 200) -> List[Measurement]:
    return (
        db.query(Measurement)
        .order_by(desc(Measurement.created_at))
        .limit(limit)
        .all()
    )


def delete_measurement(db: Session, measurement_id: int) -> bool:
    m = db.query(Measurement).filter(Measurement.id == measurement_id).first()
    if not m:
        return False
    db.delete(m)
    db.commit()
    return True


def mark_measurement_failed(db: Session, measurement_id: int) -> None:
    m = db.query(Measurement).filter(Measurement.id == measurement_id).first()
    if m:
        m.status = "failed"
        db.commit()


def enrich_with_names(measurements: List[Measurement], db: Session) -> List[dict]:
    """Attach pasture_name and drone_name for frontend convenience."""
    result = []
    for m in measurements:
        d = {
            "id":               m.id,
            "pasture_id":       m.pasture_id,
            "method":           m.method,
            "status":           m.status,
            "biomass_value":    m.biomass_value,
            "ndvi_value":       m.ndvi_value,
            "coverage_percent": m.coverage_percent,
            "quality_score":    m.quality_score,
            "drone_id":         m.drone_id,
            "description":      m.description,
            "created_at":       m.created_at,
            "pasture_name":     None,
            "drone_name":       None,
        }
        if m.pasture_id:
            p = db.query(Pasture).filter(Pasture.id == m.pasture_id).first()
            if p:
                d["pasture_name"] = p.name
        if m.drone_id:
            dr = db.query(Drone).filter(Drone.id == m.drone_id).first()
            if dr:
                d["drone_name"] = dr.name
        result.append(d)
    return result