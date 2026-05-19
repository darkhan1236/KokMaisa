def derive_biomass_metrics(biomass_cents_per_ha: float) -> dict:
    bm = max(0.0, biomass_cents_per_ha or 0.0)

    if bm >= 5:
        coverage = min(97.0, 55.0 + (bm - 5.0) * 6.5)
    else:
        coverage = max(5.0, bm * 10.0)

    quality_score = (
        95.0 if bm >= 15
        else 72.0 if bm >= 7.5
        else 50.0 if bm >= 5
        else 30.0 if bm >= 2
        else 12.0
    )

    return {
        "coverage_percent": round(coverage, 2),
        "quality_score": round(quality_score, 2),
    }
