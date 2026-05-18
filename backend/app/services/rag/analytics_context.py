from collections import defaultdict
from dataclasses import dataclass
from datetime import datetime
from statistics import mean

from sqlalchemy import desc, or_
from sqlalchemy.orm import Session

from model.models import Farm, Measurement, Pasture


MAX_ANALYTICS_CONTEXT_CHARS = 6000
MAX_MEASUREMENTS_FOR_ANALYTICS = 500


@dataclass(frozen=True)
class PastureMeasurement:
    farm_name: str
    pasture_name: str
    date: datetime | None
    biomass: float | None
    coverage: float | None
    quality: float | None


def _value(value, empty: str = "no data") -> str:
    if value is None:
        return empty
    if value == "":
        return empty
    return str(value)


def _num(value: float | None, digits: int = 2, empty: str = "no data") -> str:
    if value is None:
        return empty
    return str(round(float(value), digits))


def _date(value: datetime | None) -> str:
    if not value:
        return "no date"
    return value.isoformat()


def _avg(values: list[float | None]) -> float | None:
    clean_values = [float(value) for value in values if value is not None]
    if not clean_values:
        return None
    return round(mean(clean_values), 2)


def _delta(latest: float | None, previous: float | None) -> tuple[float | None, float | None]:
    if latest is None or previous is None:
        return None, None

    absolute = round(float(latest) - float(previous), 2)
    if previous == 0:
        return absolute, None

    percent = round((absolute / float(previous)) * 100, 2)
    return absolute, percent


def _delta_text(label: str, latest: float | None, previous: float | None, unit: str) -> str:
    absolute, percent = _delta(latest, previous)
    if absolute is None:
        return f"{label}: no comparable data"

    direction = "increased" if absolute > 0 else "decreased" if absolute < 0 else "did not change"
    percent_part = f", {percent:+.2f}%" if percent is not None else ""
    return f"{label}: {direction} by {absolute:+.2f} {unit}{percent_part}"


def _trend(latest: float | None, previous: float | None) -> str:
    absolute, percent = _delta(latest, previous)
    if absolute is None:
        return "not enough data"
    if percent is None:
        if absolute > 0:
            return "increasing"
        if absolute < 0:
            return "decreasing"
        return "stable"
    if percent >= 10:
        return "increasing"
    if percent <= -10:
        return "decreasing"
    return "stable"


def _measurement_to_context(measurement: Measurement, pasture_by_id: dict[int, Pasture], farm_by_id: dict[int, Farm]) -> PastureMeasurement:
    pasture = pasture_by_id.get(measurement.pasture_id)
    farm = farm_by_id.get(pasture.farm_id) if pasture else None

    return PastureMeasurement(
        farm_name=_value(farm.name if farm else None),
        pasture_name=_value(pasture.name if pasture else None),
        date=measurement.created_at,
        biomass=measurement.biomass_value,
        coverage=measurement.coverage_percent,
        quality=measurement.quality_score,
    )


def _latest_per_pasture(measurements: list[PastureMeasurement]) -> dict[str, PastureMeasurement]:
    latest: dict[str, PastureMeasurement] = {}
    for measurement in measurements:
        key = f"{measurement.farm_name} / {measurement.pasture_name}"
        current = latest.get(key)
        if current is None:
            latest[key] = measurement
            continue
        if measurement.date and current.date and measurement.date > current.date:
            latest[key] = measurement
    return latest


def _ranked_pasture(
    measurements: list[PastureMeasurement],
    reverse: bool,
) -> PastureMeasurement | None:
    measurable = [item for item in measurements if item.biomass is not None]
    if not measurable:
        measurable = [item for item in measurements if item.coverage is not None]
    if not measurable:
        return None

    def score(item: PastureMeasurement) -> float:
        if item.biomass is not None:
            return float(item.biomass)
        return float(item.coverage or 0)

    return sorted(measurable, key=score, reverse=reverse)[0]


def build_analytics_context(db: Session, user_id: int) -> str:
    """
    Build precomputed analytics for the current authenticated user's farms.

    Privacy rule:
    - All data is reached through Farm.owner_id == user_id.
    - Internal database IDs and private owner fields are not included.
    - Only completed measurements with at least one analytic value are used.
    """
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
        .filter(Measurement.status == "completed")
        .filter(
            or_(
                Measurement.biomass_value.isnot(None),
                Measurement.coverage_percent.isnot(None),
                Measurement.quality_score.isnot(None),
            )
        )
        .order_by(desc(Measurement.created_at))
        .limit(MAX_MEASUREMENTS_FOR_ANALYTICS)
        .all()
    )

    parts: list[str] = [
        "Precomputed KokMaisa analytics context.",
        "Use this section for trends, comparisons, averages, strongest pasture, and weakest pasture.",
        "Do not expose internal database IDs.",
    ]

    if not farms:
        parts.append("\nAnalytics summary: current user has no farms yet.")
        return "\n".join(parts)

    if not pastures:
        parts.append("\nAnalytics summary: current user has farms, but no pastures yet.")
        return "\n".join(parts)

    if not measurements:
        parts.append("\nAnalytics summary: current user has no completed biomass measurements yet.")
        return "\n".join(parts)

    pasture_by_id = {pasture.id: pasture for pasture in pastures}
    farm_by_id = {farm.id: farm for farm in farms}
    context_measurements = [
        _measurement_to_context(measurement, pasture_by_id, farm_by_id)
        for measurement in measurements
    ]

    latest = context_measurements[0]
    previous = context_measurements[1] if len(context_measurements) > 1 else None

    parts.append("\nOverall analytics:")
    parts.append(f"- Farms count: {len(farms)}")
    parts.append(f"- Pastures count: {len(pastures)}")
    parts.append(f"- Completed measurements used for analytics: {len(context_measurements)}")
    parts.append(
        "- Average biomass centner/ha: "
        f"{_num(_avg([item.biomass for item in context_measurements]))}"
    )
    parts.append(
        "- Average plant coverage percent: "
        f"{_num(_avg([item.coverage for item in context_measurements]))}"
    )
    parts.append(
        "- Average AI quality score percent: "
        f"{_num(_avg([item.quality for item in context_measurements]))}"
    )

    parts.append("\nLatest vs previous measurement:")
    parts.append(
        "- Latest measurement: "
        f"farm: {latest.farm_name}; pasture: {latest.pasture_name}; "
        f"date: {_date(latest.date)}; biomass centner/ha: {_num(latest.biomass)}; "
        f"plant coverage percent: {_num(latest.coverage)}; "
        f"AI quality score percent: {_num(latest.quality)}"
    )

    if previous:
        parts.append(
            "- Previous measurement: "
            f"farm: {previous.farm_name}; pasture: {previous.pasture_name}; "
            f"date: {_date(previous.date)}; biomass centner/ha: {_num(previous.biomass)}; "
            f"plant coverage percent: {_num(previous.coverage)}; "
            f"AI quality score percent: {_num(previous.quality)}"
        )
        parts.append(f"- {_delta_text('Biomass change', latest.biomass, previous.biomass, 'centner/ha')}")
        parts.append(f"- {_delta_text('Plant coverage change', latest.coverage, previous.coverage, 'percentage points')}")
        parts.append(f"- Overall latest trend: {_trend(latest.biomass, previous.biomass)}")
    else:
        parts.append("- Previous measurement: not enough data")
        parts.append("- Overall latest trend: not enough data")

    latest_by_pasture = _latest_per_pasture(context_measurements)
    latest_pasture_measurements = list(latest_by_pasture.values())
    strongest = _ranked_pasture(latest_pasture_measurements, reverse=True)
    weakest = _ranked_pasture(latest_pasture_measurements, reverse=False)

    parts.append("\nPasture ranking based on latest available measurements:")
    if strongest:
        parts.append(
            "- Strongest pasture: "
            f"{strongest.pasture_name} on farm {strongest.farm_name}; "
            f"biomass centner/ha: {_num(strongest.biomass)}; "
            f"plant coverage percent: {_num(strongest.coverage)}; "
            f"date: {_date(strongest.date)}"
        )
    if weakest:
        parts.append(
            "- Weakest pasture: "
            f"{weakest.pasture_name} on farm {weakest.farm_name}; "
            f"biomass centner/ha: {_num(weakest.biomass)}; "
            f"plant coverage percent: {_num(weakest.coverage)}; "
            f"date: {_date(weakest.date)}"
        )

    by_pasture: dict[str, list[PastureMeasurement]] = defaultdict(list)
    for item in context_measurements:
        by_pasture[f"{item.farm_name} / {item.pasture_name}"].append(item)

    parts.append("\nPer-pasture analytics:")
    for pasture_key, items in list(by_pasture.items())[:8]:
        items = sorted(items, key=lambda item: item.date or datetime.min, reverse=True)
        pasture_latest = items[0]
        pasture_previous = items[1] if len(items) > 1 else None
        pasture_trend = (
            _trend(pasture_latest.biomass, pasture_previous.biomass)
            if pasture_previous
            else "not enough data"
        )
        parts.append(
            f"- {pasture_key}: measurements: {len(items)}; "
            f"latest biomass centner/ha: {_num(pasture_latest.biomass)}; "
            f"latest plant coverage percent: {_num(pasture_latest.coverage)}; "
            f"average biomass centner/ha: {_num(_avg([item.biomass for item in items]))}; "
            f"average plant coverage percent: {_num(_avg([item.coverage for item in items]))}; "
            f"trend: {pasture_trend}"
        )

    if len(by_pasture) > 8:
        parts.append(f"- Additional pastures omitted from analytics context: {len(by_pasture) - 8}")

    context = "\n".join(parts)
    if len(context) > MAX_ANALYTICS_CONTEXT_CHARS:
        context = context[:MAX_ANALYTICS_CONTEXT_CHARS] + "\n\n[Analytics context was shortened.]"

    return context
