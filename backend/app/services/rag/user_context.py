from sqlalchemy import desc
from sqlalchemy.orm import Session

from model.models import Farm, Measurement, Pasture


MAX_CONTEXT_CHARS = 6000


def _value(value, empty: str = "no data") -> str:
    if value is None:
        return empty
    if value == "":
        return empty
    return str(value)


def build_user_context(db: Session, user_id: int) -> str:
    """
    Build a safe, compact context for the current authenticated user.

    Privacy rule:
    - Farms are filtered by Farm.owner_id.
    - Pastures and measurements are reached through the user's farms.
    - Private fields such as passwords, tokens, phone, email, and owner_iin are not included.
    """
    parts: list[str] = []

    farms = (
        db.query(Farm)
        .filter(Farm.owner_id == user_id)
        .order_by(Farm.created_at.desc())
        .all()
    )

    pastures = (
        db.query(Pasture)
        .join(Farm, Pasture.farm_id == Farm.id)
        .filter(Farm.owner_id == user_id)
        .order_by(Pasture.created_at.desc())
        .all()
    )

    measurements = (
        db.query(Measurement)
        .join(Pasture, Measurement.pasture_id == Pasture.id)
        .join(Farm, Pasture.farm_id == Farm.id)
        .filter(Farm.owner_id == user_id)
        .order_by(desc(Measurement.created_at))
        .limit(20)
        .all()
    )

    parts.append(
        "Private user database context for KokMaisa AI.\n"
        "Use this context only for the current authenticated user.\n"
        "Never reveal or guess data from other users."
    )

    if farms:
        parts.append("\nFarms:")
        for farm in farms:
            parts.append(
                f"- Farm: {_value(farm.name)}; "
                f"region: {_value(farm.region)}; "
                f"area ha: {_value(farm.area)}; "
                f"type: {_value(farm.farm_type)}; "
                f"status: {_value(farm.status)}; "
                f"description: {_value(farm.description)}"
            )
    else:
        parts.append("\nFarms: current user has no farms in database.")

    if pastures:
        parts.append("\nPastures:")
        for pasture in pastures:
            parts.append(
                f"- Pasture: {_value(pasture.name)}; "
                f"area ha: {_value(pasture.area)}; "
                f"type: {_value(pasture.pasture_type)}; "
                f"status: {_value(pasture.status)}; "
                f"description: {_value(pasture.description)}"
            )
    else:
        parts.append("\nPastures: current user has no pastures in database.")

    pasture_by_id = {pasture.id: pasture for pasture in pastures}
    farm_by_id = {farm.id: farm for farm in farms}

    if measurements:
        parts.append("\nLatest biomass measurements:")
        for index, measurement in enumerate(measurements, start=1):
            pasture = pasture_by_id.get(measurement.pasture_id)
            farm = farm_by_id.get(pasture.farm_id) if pasture else None
            label = "latest measurement" if index == 1 else f"measurement #{index}"

            parts.append(
                f"- {label}: "
                f"farm: {_value(farm.name if farm else None)}; "
                f"pasture: {_value(pasture.name if pasture else None)}; "
                f"method: {_value(measurement.method)}; "
                f"status: {_value(measurement.status)}; "
                f"biomass centner/ha: {_value(measurement.biomass_value)}; "
                f"plant coverage percent: {_value(measurement.coverage_percent)}; "
                f"AI quality score percent: {_value(measurement.quality_score)}; "
                f"date: {_value(measurement.created_at)}; "
                f"description: {_value(measurement.description)}"
            )
    else:
        parts.append("\nBiomass measurements: current user has no measurements in database.")

    context = "\n".join(parts)

    if len(context) > MAX_CONTEXT_CHARS:
        context = context[:MAX_CONTEXT_CHARS] + "\n\n[User context was shortened.]"

    return context
