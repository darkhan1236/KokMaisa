export function deriveMetrics(biomassCentsPerHa, areaHa = 1) {
  const bm = Math.max(0, biomassCentsPerHa ?? 0);
  const ha = Math.max(0, areaHa || 1);

  const biomassKgHa = bm * 100;
  const ndvi = Math.min(0.88, Math.max(0.05, 0.12 + 0.04 * bm));
  const coverage = bm >= 5
    ? Math.min(97, 55 + (bm - 5) * 6.5)
    : Math.max(5, bm * 10);

  const totalBiomassKg = biomassKgHa * ha;
  const usableBiomassKg = totalBiomassKg;
  const usableForWinterKg = totalBiomassKg;

  const ndviGrade =
    ndvi >= 0.65 ? { letter: "A", labelKey: "biomass.ndvi.excellent", color: "#22c55e", pct: 95 } :
    ndvi >= 0.42 ? { letter: "B", labelKey: "biomass.ndvi.good", color: "#84cc16", pct: 72 } :
    ndvi >= 0.28 ? { letter: "C", labelKey: "biomass.ndvi.moderate", color: "#fbbf24", pct: 50 } :
    ndvi >= 0.16 ? { letter: "D", labelKey: "biomass.ndvi.weak", color: "#f97316", pct: 30 } :
    { letter: "F", labelKey: "biomass.ndvi.critical", color: "#ef4444", pct: 12 };

  const biomassRating =
    bm >= 15 ? { labelKey: "biomass.rating.veryHigh", color: "#22c55e", tipKey: "biomass.rating.veryHighTip" } :
    bm >= 7.5 ? { labelKey: "biomass.rating.high", color: "#4ade80", tipKey: "biomass.rating.highTip" } :
    bm >= 5 ? { labelKey: "biomass.rating.moderate", color: "#84cc16", tipKey: "biomass.rating.moderateTip" } :
    bm >= 2 ? { labelKey: "biomass.rating.low", color: "#f97316", tipKey: "biomass.rating.lowTip" } :
    { labelKey: "biomass.rating.critical", color: "#ef4444", tipKey: "biomass.rating.criticalTip" };

  const grazingDays = 30;
  const cowsPerHa = Math.max(
    0,
    parseFloat((((usableBiomassKg / ha) / (10 * grazingDays))).toFixed(1))
  );

  const benchmarkLoad = 5;
  const daysUntilRotation = usableBiomassKg > 0
    ? Math.max(0, Math.round((usableBiomassKg / ha) / (benchmarkLoad * 10)))
    : 0;

  const grazingRec =
    bm >= 7.5 && coverage >= 50
      ? { status: "optimal", labelKey: "biomass.grazing.ready", color: "#22c55e", icon: "✓" }
      : bm >= 5 && coverage >= 30
        ? { status: "caution", labelKey: "biomass.grazing.caution", color: "#fbbf24", icon: "⚠" }
        : { status: "rest", labelKey: "biomass.grazing.rest", color: "#ef4444", icon: "✕" };

  const coverageHealth =
    coverage >= 75 ? { labelKey: "biomass.cover.dense", color: "#22c55e" } :
    coverage >= 50 ? { labelKey: "biomass.cover.good", color: "#84cc16" } :
    coverage >= 30 ? { labelKey: "biomass.cover.sparse", color: "#fbbf24" } :
    { labelKey: "biomass.cover.bare", color: "#ef4444" };

  const regrowthDays = ndvi >= 0.6 ? 18 : ndvi >= 0.42 ? 24 : ndvi >= 0.28 ? 32 : 45;

  return {
    biomassKgHa,
    totalBiomassKg,
    usableBiomassKg,
    usableForWinterKg,
    ndvi,
    coverage,
    ndviGrade,
    biomassRating,
    cowsPerHa,
    daysUntilRotation,
    grazingRec,
    coverageHealth,
    regrowthDays,
  };
}
