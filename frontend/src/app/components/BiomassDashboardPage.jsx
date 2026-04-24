import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Clock3,
  Leaf,
  Loader2,
  MapPinned,
  RefreshCw,
  Target,
  TrendingDown,
  TrendingUp,
  Wheat,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import Header from "@/app/components/Header";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { deriveMetrics } from "@/app/utils/biomassMetrics";

const DASHBOARD_STYLE = `
  @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Cabinet+Grotesk:wght@400;500;700;800;900&family=DM+Sans:wght@400;500;700&display=swap');

  .bd-root { min-height: 100vh; font-family: 'DM Sans', sans-serif; transition: background .35s ease, color .35s ease; }
  .bd-dark { background: #061008; color: #edf8ee; }
  .bd-light { background: #f6fbf3; color: #112217; }

  .bd-shell { max-width: 1240px; margin: 0 auto; padding: 0 20px 0px; }
  .bd-main { margin-top: 22px; }

  .bd-hero {
    position: relative;
    overflow: hidden;
    padding: 116px 0 36px;
  }
  .bd-hero::before {
    content: "";
    position: absolute;
    inset: 0;
    background:
      radial-gradient(circle at top left, rgba(74,222,128,.2), transparent 36%),
      radial-gradient(circle at bottom right, rgba(34,211,238,.14), transparent 28%),
      linear-gradient(155deg, #0b2211 0%, #0c341a 38%, #07130c 100%);
  }
  .bd-light .bd-hero::before {
    background:
      radial-gradient(circle at top left, rgba(34,197,94,.18), transparent 34%),
      radial-gradient(circle at bottom right, rgba(16,185,129,.12), transparent 28%),
      linear-gradient(160deg, #eef8ee 0%, #e3f4e6 52%, #f7fbf5 100%);
  }
  .bd-hero::after {
    content: "";
    position: absolute;
    inset: 0;
    background-image: linear-gradient(rgba(255,255,255,.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.05) 1px, transparent 1px);
    background-size: 34px 34px;
    mask-image: linear-gradient(to bottom, rgba(0,0,0,.6), transparent);
    opacity: .35;
    pointer-events: none;
  }

  .bd-hero-inner { position: relative; z-index: 1; }
  .bd-badge {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 7px 14px;
    border-radius: 999px;
    border: 1px solid rgba(74,222,128,.28);
    background: rgba(74,222,128,.12);
    color: #4ade80;
    font-size: 11px;
    font-weight: 800;
    letter-spacing: .12em;
    text-transform: uppercase;
    margin-bottom: 20px;
  }
  .bd-light .bd-badge {
    border-color: rgba(22,163,74,.24);
    background: rgba(22,163,74,.1);
    color: #15803d;
  }
  .bd-title {
    margin: 0;
    font-family: 'Cabinet Grotesk', sans-serif;
    font-size: clamp(2.4rem, 6vw, 5.2rem);
    line-height: .96;
    letter-spacing: -.04em;
    max-width: 760px;
  }
  .bd-title em {
    font-family: 'Instrument Serif', serif;
    font-style: italic;
    font-weight: 400;
    color: #9ef0b7;
  }
  .bd-light .bd-title em { color: #15803d; }
  .bd-subtitle {
    max-width: 620px;
    margin: 16px 0 0;
    font-size: 15px;
    line-height: 1.7;
    color: rgba(237,248,238,.72);
  }
  .bd-light .bd-subtitle { color: rgba(17,34,23,.68); }

  .bd-hero-grid {
    display: grid;
    grid-template-columns: minmax(0, 1.35fr) minmax(320px, .9fr);
    gap: 24px;
    align-items: start;
  }

  .bd-hero-card {
    border-radius: 28px;
    padding: 22px;
    backdrop-filter: blur(16px);
    border: 1px solid rgba(255,255,255,.08);
    background: rgba(255,255,255,.05);
    box-shadow: 0 26px 60px rgba(0,0,0,.16);
  }
  .bd-light .bd-hero-card {
    border-color: rgba(22,163,74,.14);
    background: rgba(255,255,255,.78);
    box-shadow: 0 22px 50px rgba(22,163,74,.1);
  }

  .bd-label {
    display: flex;
    align-items: center;
    gap: 7px;
    margin-bottom: 12px;
    font-size: 10px;
    font-weight: 800;
    letter-spacing: .16em;
    text-transform: uppercase;
    color: rgba(237,248,238,.45);
  }
  .bd-light .bd-label { color: rgba(17,34,23,.46); }
  .bd-label-dot {
    width: 6px;
    height: 6px;
    border-radius: 999px;
    background: #4ade80;
  }

  .bd-pills {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .bd-pill {
    border: none;
    cursor: pointer;
    border-radius: 999px;
    padding: 10px 16px;
    font-size: 13px;
    font-weight: 700;
    transition: transform .18s ease, background .18s ease, color .18s ease;
  }
  .bd-pill:hover { transform: translateY(-1px); }
  .bd-pill-dark { background: rgba(255,255,255,.08); color: rgba(237,248,238,.72); }
  .bd-pill-dark.active { background: linear-gradient(135deg, #22c55e, #0d9488); color: #fff; }
  .bd-pill-light { background: rgba(22,163,74,.08); color: rgba(17,34,23,.76); }
  .bd-pill-light.active { background: linear-gradient(135deg, #16a34a, #0d9488); color: #fff; }

  .bd-head-actions {
    display: grid;
    grid-template-columns: minmax(0, 1.45fr) minmax(320px, 1fr);
    gap: 18px;
    align-items: end;
    margin: 28px 0 18px;
  }
  .bd-control-group {
    display: grid;
    gap: 10px;
    min-width: 0;
  }
  .bd-pills-row {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
  }
  .bd-refresh-btn { margin-left: auto; }

  .bd-inline-btn {
    border: none;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    border-radius: 14px;
    padding: 12px 18px;
    font-family: inherit;
    font-size: 13px;
    font-weight: 700;
    transition: transform .18s ease, box-shadow .18s ease, background .18s ease;
  }
  .bd-inline-btn:hover { transform: translateY(-1px); }
  .bd-btn-primary {
    color: #fff;
    background: linear-gradient(135deg, #22c55e, #0d9488);
    box-shadow: 0 10px 24px rgba(34,197,94,.24);
  }
  .bd-btn-secondary-dark {
    color: rgba(237,248,238,.86);
    background: rgba(255,255,255,.06);
    border: 1px solid rgba(255,255,255,.08);
  }
  .bd-btn-secondary-light {
    color: rgba(17,34,23,.82);
    background: rgba(255,255,255,.86);
    border: 1px solid rgba(22,163,74,.15);
  }

  .bd-grid-stats {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 18px;
    margin-bottom: 26px;
  }
  .bd-card {
    border-radius: 24px;
    padding: 22px;
    border: 1px solid rgba(255,255,255,.08);
    background: rgba(255,255,255,.04);
    box-shadow: 0 18px 40px rgba(0,0,0,.12);
  }
  .bd-light .bd-card {
    border-color: rgba(22,163,74,.12);
    background: rgba(255,255,255,.92);
    box-shadow: 0 14px 34px rgba(22,163,74,.08);
  }
  .bd-card-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 14px;
    margin-bottom: 16px;
  }
  .bd-card-title {
    margin: 0;
    font-family: 'Cabinet Grotesk', sans-serif;
    font-size: 1.1rem;
    font-weight: 800;
    letter-spacing: -.02em;
  }
  .bd-card-desc {
    margin: 6px 0 0;
    font-size: 13px;
    line-height: 1.6;
    color: rgba(237,248,238,.52);
  }
  .bd-light .bd-card-desc { color: rgba(17,34,23,.55); }

  .bd-stat-value {
    font-family: 'Cabinet Grotesk', sans-serif;
    font-size: clamp(1.8rem, 4vw, 2.8rem);
    line-height: 1;
    letter-spacing: -.04em;
    margin: 0 0 8px;
  }
  .bd-stat-sub {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    font-size: 12px;
    color: rgba(237,248,238,.58);
  }
  .bd-light .bd-stat-sub { color: rgba(17,34,23,.56); }

  .bd-icon-chip {
    width: 46px;
    height: 46px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 16px;
    flex-shrink: 0;
  }

  .bd-layout-2,
  .bd-layout-3 {
    display: grid;
    gap: 18px;
    margin-bottom: 26px;
  }
  .bd-layout-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .bd-layout-3 { grid-template-columns: minmax(0, 1.7fr) minmax(290px, .95fr); }

  .bd-chart { height: 318px; }
  .bd-chart-short { height: 286px; }

  .bd-indicators {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 12px;
  }
  .bd-indicator {
    border-radius: 20px;
    padding: 18px;
    border: 1px solid rgba(255,255,255,.07);
    background: rgba(255,255,255,.03);
  }
  .bd-light .bd-indicator {
    border-color: rgba(22,163,74,.1);
    background: #f6fbf5;
  }
  .bd-indicator-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    margin-bottom: 10px;
  }
  .bd-indicator-name {
    font-size: 12px;
    font-weight: 700;
    color: rgba(237,248,238,.54);
  }
  .bd-light .bd-indicator-name { color: rgba(17,34,23,.54); }
  .bd-indicator-value {
    font-family: 'Cabinet Grotesk', sans-serif;
    font-size: 1.9rem;
    line-height: 1;
    letter-spacing: -.03em;
    margin: 0 0 8px;
  }
  .bd-indicator-desc {
    margin: 0;
    font-size: 12px;
    line-height: 1.55;
    color: rgba(237,248,238,.5);
  }
  .bd-light .bd-indicator-desc { color: rgba(17,34,23,.5); }

  .bd-alerts {
    display: grid;
    gap: 10px;
  }
  .bd-alert {
    display: flex;
    gap: 12px;
    padding: 15px 16px;
    border-radius: 18px;
    border: 1px solid transparent;
  }
  .bd-alert-title {
    margin: 0 0 4px;
    font-size: 14px;
    font-weight: 700;
  }
  .bd-alert-text {
    margin: 0;
    font-size: 12px;
    line-height: 1.55;
    color: rgba(237,248,238,.6);
  }
  .bd-light .bd-alert-text { color: rgba(17,34,23,.56); }
  .bd-alert-date {
    margin-top: 7px;
    font-size: 11px;
    color: rgba(237,248,238,.42);
  }
  .bd-light .bd-alert-date { color: rgba(17,34,23,.42); }

  .bd-legend-list {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
    margin-top: 14px;
  }
  .bd-legend-item {
    display: flex;
    align-items: center;
    gap: 9px;
    min-width: 0;
    font-size: 12px;
  }
  .bd-legend-item span:last-child {
    margin-left: auto;
    font-weight: 700;
  }

  .bd-empty {
    min-height: 240px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    gap: 12px;
    color: rgba(237,248,238,.56);
  }
  .bd-light .bd-empty { color: rgba(17,34,23,.56); }
  .bd-empty p { margin: 0; max-width: 360px; line-height: 1.65; }

  .bd-divider {
    height: 1px;
    margin: 18px 0;
    background: rgba(255,255,255,.08);
  }
  .bd-light .bd-divider { background: rgba(22,163,74,.1); }

  .bd-tone-good,
  .bd-tone-warning,
  .bd-tone-critical {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    border-radius: 999px;
    padding: 6px 11px;
    font-size: 11px;
    font-weight: 800;
    letter-spacing: .06em;
    text-transform: uppercase;
  }
  .bd-tone-good { color: #22c55e; background: rgba(34,197,94,.12); }
  .bd-tone-warning { color: #f59e0b; background: rgba(245,158,11,.12); }
  .bd-tone-critical { color: #ef4444; background: rgba(239,68,68,.12); }

  @media (max-width: 1100px) {
    .bd-hero-grid,
    .bd-grid-stats,
    .bd-layout-2,
    .bd-layout-3,
    .bd-indicators {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    .bd-head-actions {
      grid-template-columns: 1fr;
      align-items: stretch;
    }
  }

  @media (max-width: 768px) {
    .bd-shell { padding: 0 14px 52px; }
    .bd-main { margin-top: 16px; }
    .bd-hero { padding-top: 102px; }
    .bd-hero-grid,
    .bd-grid-stats,
    .bd-layout-2,
    .bd-layout-3,
    .bd-indicators,
    .bd-legend-list {
      grid-template-columns: 1fr;
    }
    .bd-card,
    .bd-hero-card { padding: 18px; border-radius: 22px; }
    .bd-chart,
    .bd-chart-short { height: 260px; }
    .bd-head-actions { margin-top: 22px; }
    .bd-refresh-btn { margin-left: 0; }
  }

  @media (max-width: 480px) {
    .bd-title { font-size: clamp(2rem, 12vw, 3.1rem); }
    .bd-subtitle { font-size: 14px; }
    .bd-pill { width: 100%; justify-content: center; }
    .bd-inline-btn { width: 100%; justify-content: center; }
  }
`;

const PERIODS = [
  { value: "week", key: "common.week" },
  { value: "month", key: "common.month" },
  { value: "year", key: "common.year" },
];

const GRASS_TYPE_MAP = {
  alfalfa: "pastures.grassTypes.alfalfa",
  clover: "pastures.grassTypes.clover",
  timothy: "pastures.grassTypes.timothy",
  fescue: "pastures.grassTypes.fescue",
  mixed: "pastures.grassTypes.mixed",
  lyucerna: "pastures.grassOptions.lyucerna",
  donnik: "pastures.grassOptions.donnik",
  klever: "pastures.grassOptions.klever",
  timofeevka: "pastures.grassOptions.timofeevka",
  kostrec: "pastures.grassOptions.kostrec",
  smeshanny: "pastures.grassOptions.smeshanny",
  zhityak: "pastures.grassOptions.zhityak",
  pyrey: "pastures.grassOptions.pyrey",
  lisohvost: "pastures.grassOptions.lisohvost",
  myatlik: "pastures.grassOptions.myatlik",
  chiy: "pastures.grassOptions.chiy",
  trostnik: "pastures.grassOptions.trostnik",
  kamysh: "pastures.grassOptions.kamysh",
  polyyn_belaya: "pastures.grassOptions.polyyn_belaya",
  polyyn_chernaya: "pastures.grassOptions.polyyn_chernaya",
  boyalych: "pastures.grassOptions.boyalych",
  biyurgun: "pastures.grassOptions.biyurgun",
  kokpek: "pastures.grassOptions.kokpek",
  kovyl_peristy: "pastures.grassOptions.kovyl_peristy",
  kovyl_lessing: "pastures.grassOptions.kovyl_lessing",
  tipchak: "pastures.grassOptions.tipchak",
  tonkonog: "pastures.grassOptions.tonkonog",
};

const PIE_COLORS = ["#22c55e", "#0d9488", "#84cc16", "#eab308", "#f97316", "#60a5fa"];

function getLocale(language) {
  if (language === "kk") return "kk-KZ";
  if (language === "en") return "en-US";
  return "ru-RU";
}

function average(values) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function formatValue(value, digits = 1, language = "ru") {
  return new Intl.NumberFormat(getLocale(language), {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(value);
}

function toSafeDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function startOfWeek(date) {
  const d = new Date(date);
  const day = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

function buildWindowedSeries(measurements, period, language) {
  if (!measurements.length) return [];

  const locale = getLocale(language);
  const dayFormatter = new Intl.DateTimeFormat(locale, { day: "numeric", month: "short" });
  const monthFormatter = new Intl.DateTimeFormat(locale, { month: "short" });
  const map = new Map();

  measurements.forEach((measurement) => {
    const date = toSafeDate(measurement.created_at);
    if (!date) return;

    let key;
    let label;

    if (period === "week") {
      key = date.toISOString().slice(0, 10);
      label = dayFormatter.format(date);
    } else if (period === "month") {
      const weekStart = startOfWeek(date);
      key = weekStart.toISOString().slice(0, 10);
      label = dayFormatter.format(weekStart);
    } else {
      key = `${date.getFullYear()}-${date.getMonth()}`;
      label = monthFormatter.format(date);
    }

    const next = map.get(key) || { label, biomassSum: 0, ndviSum: 0, count: 0 };
    const derivedNdvi = measurement.ndvi_value ?? deriveMetrics(measurement.biomass_value ?? 0, 1).ndvi;
    next.biomassSum += measurement.biomass_value ?? 0;
    next.ndviSum += derivedNdvi;
    next.count += 1;
    map.set(key, next);
  });

  const limit = period === "week" ? 7 : period === "month" ? 8 : 12;
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-limit)
    .map(([, entry]) => ({
      label: entry.label,
      biomass: Number((entry.biomassSum / entry.count).toFixed(1)),
      ndvi: Number((entry.ndviSum / entry.count).toFixed(3)),
    }));
}

function toneFromScore(score) {
  if (score >= 72) return "good";
  if (score >= 45) return "warning";
  return "critical";
}

function normalizeGrassTypeCode(pasture) {
  return String(pasture?.grass_type ?? pasture?.pasture_type ?? "")
    .trim()
    .toLowerCase();
}

function getGrazingMinimum(grassTypeCode) {
  const code = String(grassTypeCode || "").toLowerCase();
  if (["lyucerna", "donnik", "klever", "alfalfa", "clover"].includes(code)) return 12;
  if (["timofeevka", "pyrey", "kostrec", "myatlik", "lisohvost", "timothy", "fescue"].includes(code)) return 10;
  if (["kovyl_peristy", "kovyl_lessing", "tipchak", "tonkonog", "zhityak"].includes(code)) return 8;
  if (["polyyn_belaya", "polyyn_chernaya", "boyalych", "biyurgun", "kokpek"].includes(code)) return 6;
  if (["chiy", "trostnik", "kamysh"].includes(code)) return 5;
  if (["smeshanny", "mixed"].includes(code)) return 9;
  return 8;
}

function getHealthScoreForPasture(latestBiomass, latestMetrics) {
  if (!latestMetrics || latestBiomass == null) return 0;

  const biomassScore = clamp((latestBiomass / 15) * 100, 0, 100);
  const ndviScore = latestMetrics.ndviGrade?.pct ?? 0;
  const coverScore = clamp(latestMetrics.coverage ?? 0, 0, 100);
  const grazingScore = latestMetrics.grazingRec?.status === "optimal"
    ? 100
    : latestMetrics.grazingRec?.status === "caution"
      ? 65
      : 35;

  return Math.round(
    biomassScore * 0.35 +
    ndviScore * 0.3 +
    coverScore * 0.2 +
    grazingScore * 0.15
  );
}

function chartTooltipStyle(isDark) {
  return {
    backgroundColor: isDark ? "rgba(7,14,9,.96)" : "rgba(255,255,255,.96)",
    borderColor: isDark ? "rgba(255,255,255,.1)" : "rgba(22,163,74,.15)",
    borderRadius: "16px",
    boxShadow: isDark ? "0 16px 36px rgba(0,0,0,.26)" : "0 12px 28px rgba(22,163,74,.08)",
  };
}

function EmptyState({ isDark, icon: Icon, title, text, actionLabel, onAction }) {
  const actionClass = isDark ? "bd-btn-secondary-dark" : "bd-btn-secondary-light";

  return (
    <div className="bd-empty">
      <div
        style={{
          width: 54,
          height: 54,
          borderRadius: 18,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: isDark ? "rgba(255,255,255,.05)" : "rgba(22,163,74,.08)",
          border: `1px solid ${isDark ? "rgba(255,255,255,.08)" : "rgba(22,163,74,.14)"}`,
        }}
      >
        <Icon style={{ width: 24, height: 24, color: isDark ? "#4ade80" : "#15803d" }} />
      </div>
      <div>
        <p style={{ fontWeight: 700, fontSize: 15 }}>{title}</p>
        <p>{text}</p>
      </div>
      {actionLabel && onAction ? (
        <button type="button" className={`bd-inline-btn ${actionClass}`} onClick={onAction}>
          {actionLabel}
          <ArrowRight style={{ width: 14, height: 14 }} />
        </button>
      ) : null}
    </div>
  );
}

function StatCard({ isDark, title, value, subtitle, icon: Icon, iconBg, iconColor, tone, helper }) {
  return (
    <div className="bd-card">
      <div className="bd-card-header">
        <div>
          <div className="bd-label" style={{ marginBottom: 10 }}>
            <span className="bd-label-dot" />
            {title}
          </div>
          <p className="bd-stat-value">{value}</p>
          <div className="bd-stat-sub">{subtitle}</div>
        </div>
        <div className="bd-icon-chip" style={{ background: iconBg }}>
          <Icon style={{ width: 22, height: 22, color: iconColor }} />
        </div>
      </div>
      {tone ? (
        <div className={`bd-tone-${tone}`}>{helper}</div>
      ) : (
        <div className="bd-card-desc" style={{ marginTop: 0 }}>{helper}</div>
      )}
    </div>
  );
}

function IndicatorCard({ isDark, name, value, description, icon: Icon, color }) {
  return (
    <div className="bd-indicator">
      <div className="bd-indicator-top">
        <span className="bd-indicator-name">{name}</span>
        <Icon style={{ width: 18, height: 18, color }} />
      </div>
      <p className="bd-indicator-value" style={{ color }}>{value}</p>
      <p className="bd-indicator-desc">{description}</p>
    </div>
  );
}

export default function BiomassDashboardPage() {
  const { t, i18n } = useTranslation();
  const { theme } = useTheme();
  const {
    user,
    isAuthenticated,
    loading: authLoading,
    getPastures,
    getPastureMeasurements,
  } = useAuth();
  const navigate = useNavigate();

  const isDark = theme === "dark";
  const locale = getLocale(i18n.language);
  const measurementUnit = t("pastures.units.biomass", "c/ha");

  const [pastures, setPastures] = useState([]);
  const [measurementsByPasture, setMeasurementsByPasture] = useState({});
  const [selectedPeriod, setSelectedPeriod] = useState("month");
  const [selectedPasture, setSelectedPasture] = useState("all");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(async () => {
    setError("");
    setRefreshing(true);

    try {
      const pastureList = await getPastures();
      const safePastures = Array.isArray(pastureList) ? pastureList : [];
      setPastures(safePastures);

      if (!safePastures.length) {
        setMeasurementsByPasture({});
        return;
      }

      const results = await Promise.allSettled(
        safePastures.map((pasture) => getPastureMeasurements(pasture.id))
      );

      const nextMeasurements = {};
      safePastures.forEach((pasture, index) => {
        const result = results[index];
        const rawItems = result?.status === "fulfilled" && Array.isArray(result.value)
          ? result.value
          : [];

        nextMeasurements[pasture.id] = rawItems
          .filter((item) => item && item.status === "completed" && item.biomass_value != null)
          .sort((a, b) => {
            const left = toSafeDate(a.created_at)?.getTime() ?? 0;
            const right = toSafeDate(b.created_at)?.getTime() ?? 0;
            return right - left;
          });
      });

      setMeasurementsByPasture(nextMeasurements);
    } catch (err) {
      setError(err?.message || t("common.connectionError"));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [getPastureMeasurements, getPastures, t]);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    loadDashboard();
  }, [authLoading, isAuthenticated, loadDashboard, navigate]);

  const pastureModels = useMemo(() => {
    return pastures.map((pasture) => {
      const completed = measurementsByPasture[pasture.id] || [];
      const latest = completed[0] || null;
      const previous = completed[1] || null;
      const areaHa = Number(pasture.area_ha ?? pasture.area ?? 0) || 0;
      const latestMetrics = latest ? deriveMetrics(latest.biomass_value, areaHa || 1) : null;
      const previousBiomass = previous?.biomass_value ?? null;
      const latestBiomass = latest?.biomass_value ?? null;

      const trendPct = latestBiomass != null && previousBiomass != null && previousBiomass > 0
        ? ((latestBiomass - previousBiomass) / previousBiomass) * 100
        : 0;

      return {
        ...pasture,
        areaHa,
        grassTypeCode: normalizeGrassTypeCode(pasture),
        completedMeasurements: completed,
        latestMeasurement: latest,
        latestBiomass,
        latestMetrics,
        previousBiomass,
        trendPct,
      };
    });
  }, [measurementsByPasture, pastures]);

  useEffect(() => {
    if (selectedPasture === "all") return;
    const exists = pastureModels.some((item) => String(item.id) === String(selectedPasture));
    if (!exists) setSelectedPasture("all");
  }, [pastureModels, selectedPasture]);

  const visiblePastures = useMemo(() => {
    if (selectedPasture === "all") return pastureModels;
    return pastureModels.filter((item) => String(item.id) === String(selectedPasture));
  }, [pastureModels, selectedPasture]);

  const visibleMeasurements = useMemo(() => {
    return visiblePastures
      .flatMap((pasture) =>
        pasture.completedMeasurements.map((measurement) => ({
          ...measurement,
          pastureName: pasture.name,
          pastureId: pasture.id,
          areaHa: pasture.areaHa,
          grassTypeCode: pasture.grassTypeCode,
        }))
      )
      .sort((a, b) => {
        const left = toSafeDate(a.created_at)?.getTime() ?? 0;
        const right = toSafeDate(b.created_at)?.getTime() ?? 0;
        return right - left;
      });
  }, [visiblePastures]);

  const measuredPastures = visiblePastures.filter((item) => item.latestBiomass != null);
  const hasMeasurements = visibleMeasurements.length > 0;

  const trendData = useMemo(
    () => buildWindowedSeries(visibleMeasurements, selectedPeriod, i18n.language),
    [visibleMeasurements, selectedPeriod, i18n.language]
  );

  const comparisonData = useMemo(() => {
    return measuredPastures
      .slice()
      .sort((a, b) => (b.latestBiomass ?? 0) - (a.latestBiomass ?? 0))
      .map((pasture, index) => ({
        name: pasture.name || t("biomass.dashboard.fallbackPasture"),
        biomass: Number((pasture.latestBiomass ?? 0).toFixed(1)),
        area: pasture.areaHa,
        fill: PIE_COLORS[index % PIE_COLORS.length],
      }));
  }, [measuredPastures, t]);

  const recentData = useMemo(() => {
    const formatter = new Intl.DateTimeFormat(locale, {
      day: "numeric",
      month: "short",
    });

    return visibleMeasurements
      .slice(0, 4)
      .reverse()
      .map((measurement) => ({
        label: visiblePastures.length === 1
          ? formatter.format(toSafeDate(measurement.created_at) || new Date())
          : `${measurement.pastureName || t("biomass.dashboard.fallbackPasture")} · ${formatter.format(toSafeDate(measurement.created_at) || new Date())}`,
        biomass: Number((measurement.biomass_value ?? 0).toFixed(1)),
        recommendedMinimum: getGrazingMinimum(measurement.grassTypeCode),
      }));
  }, [locale, t, visibleMeasurements, visiblePastures.length]);

  const distributionData = useMemo(() => {
    const grouped = new Map();
    visiblePastures.forEach((pasture) => {
      const code = pasture.grassTypeCode;
      if (!code) return;
      const name = t(GRASS_TYPE_MAP[code] || code, code);
      const next = grouped.get(name) || { name, value: 0 };
      next.value += pasture.areaHa || 0;
      grouped.set(name, next);
    });

    return [...grouped.values()]
      .sort((a, b) => b.value - a.value)
      .map((item, index) => ({
        ...item,
        color: PIE_COLORS[index % PIE_COLORS.length],
      }));
  }, [t, visiblePastures]);

  const latestMetrics = measuredPastures
    .map((pasture) => pasture.latestMetrics)
    .filter(Boolean);

  const avgBiomass = average(visibleMeasurements.map((measurement) => measurement.biomass_value ?? 0));
  const totalArea = visiblePastures.reduce((sum, pasture) => sum + (pasture.areaHa || 0), 0);
  const avgNdvi = average(latestMetrics.map((metric) => metric.ndvi));
  const avgCoverage = average(latestMetrics.map((metric) => metric.coverage));
  const avgCapacity = average(latestMetrics.map((metric) => metric.cowsPerHa));
  const avgRotation = average(latestMetrics.map((metric) => metric.daysUntilRotation));
  const avgHeight = avgBiomass ? Math.max(8, avgBiomass * 1.8 + 6) : 0;
  const winterReserveTons = latestMetrics.reduce((sum, metric) => sum + metric.totalBiomassKg, 0) / 1000;
  const avgTrendPct = average(
    measuredPastures
      .map((pasture) => pasture.trendPct)
      .filter((value) => Number.isFinite(value))
  );

  const healthScore = measuredPastures.length
    ? Math.round(
      average(
        measuredPastures.map((pasture) =>
          getHealthScoreForPasture(pasture.latestBiomass, pasture.latestMetrics)
        )
      )
    )
    : 0;

  const healthTone = toneFromScore(healthScore);
  const healthToneLabel = t(`biomass.dashboard.healthStates.${healthTone}`);

  const indicatorCards = [
    {
      key: "ndvi",
      name: "NDVI",
      value: avgNdvi ? avgNdvi.toFixed(3) : "0.000",
      description: t("biomass.dashboard.indicators.ndviDescription"),
      icon: Activity,
      color: "#22c55e",
    },
    {
      key: "cover",
      name: t("biomass.coverDensity"),
      value: `${Math.round(avgCoverage || 0)}%`,
      description: t("biomass.dashboard.indicators.coverDescription"),
      icon: Leaf,
      color: "#0d9488",
    },
    {
      key: "height",
      name: t("biomass.grassHeight"),
      value: `${Math.round(avgHeight || 0)} cm`,
      description: t("biomass.dashboard.indicators.heightDescription"),
      icon: Wheat,
      color: "#f59e0b",
    },
    {
      key: "capacity",
      name: t("biomass.dashboard.indicators.capacity"),
      value: t("biomass.dashboard.indicators.capacityValue", {
        count: formatValue(avgCapacity || 0, 1, i18n.language),
      }),
      description: t("biomass.dashboard.indicators.capacityDescription"),
      icon: Target,
      color: "#60a5fa",
    },
  ];

  const alerts = useMemo(() => {
    const result = [];
    const lowPasture = measuredPastures
      .slice()
      .sort((a, b) => (a.latestBiomass ?? 0) - (b.latestBiomass ?? 0))
      .find((item) => (item.latestBiomass ?? 0) < 5);

    if (lowPasture) {
      result.push({
        type: "warning",
        title: t("biomass.dashboard.alerts.lowBiomassTitle"),
        text: t("biomass.dashboard.alerts.lowBiomassDesc", {
          pasture: lowPasture.name,
          value: formatValue(lowPasture.latestBiomass ?? 0, 1, i18n.language),
        }),
        date: new Intl.DateTimeFormat(locale, {
          dateStyle: "medium",
          timeStyle: "short",
        }).format(toSafeDate(lowPasture.latestMeasurement?.created_at) || new Date()),
      });
    }

    const readyPasture = measuredPastures.find(
      (item) => item.latestMetrics?.grazingRec?.status === "optimal"
    );

    if (readyPasture) {
      result.push({
        type: "success",
        title: t("biomass.dashboard.alerts.readyTitle"),
        text: t("biomass.dashboard.alerts.readyDesc", {
          pasture: readyPasture.name,
          value: formatValue(readyPasture.latestBiomass ?? 0, 1, i18n.language),
        }),
        date: new Intl.DateTimeFormat(locale, {
          dateStyle: "medium",
          timeStyle: "short",
        }).format(toSafeDate(readyPasture.latestMeasurement?.created_at) || new Date()),
      });
    }

    const latestMeasurement = visibleMeasurements[0];
    if (latestMeasurement) {
      result.push({
        type: "info",
        title: t("biomass.dashboard.alerts.latestTitle"),
        text: t("biomass.dashboard.alerts.latestDesc", {
          pasture: latestMeasurement.pastureName,
          value: formatValue(latestMeasurement.biomass_value ?? 0, 1, i18n.language),
        }),
        date: new Intl.DateTimeFormat(locale, {
          dateStyle: "medium",
          timeStyle: "short",
        }).format(toSafeDate(latestMeasurement.created_at) || new Date()),
      });
    }

    if (!result.length) {
      result.push({
        type: "info",
        title: t("biomass.notifications"),
        text: t("biomass.dashboard.alerts.noAlerts"),
        date: new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date()),
      });
    }

    return result.slice(0, 3);
  }, [i18n.language, locale, measuredPastures, t, visibleMeasurements]);

  const axisColor = isDark ? "rgba(237,248,238,.44)" : "rgba(17,34,23,.46)";
  const gridColor = isDark ? "rgba(255,255,255,.08)" : "rgba(22,163,74,.1)";
  const chartTooltip = chartTooltipStyle(isDark);
  const activeSecondaryBtn = isDark ? "bd-btn-secondary-dark" : "bd-btn-secondary-light";

  if (authLoading || loading) {
    return (
      <>
        <style>{DASHBOARD_STYLE}</style>
        <div className={`bd-root ${isDark ? "bd-dark" : "bd-light"}`} style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Loader2 style={{ width: 34, height: 34, color: "#22c55e" }} className="animate-spin" />
        </div>
      </>
    );
  }

  if (!user) {
    return (
      <>
        <style>{DASHBOARD_STYLE}</style>
        <div className={`bd-root ${isDark ? "bd-dark" : "bd-light"}`} style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
          <EmptyState
            isDark={isDark}
            icon={MapPinned}
            title={t("common.pleaseLogin")}
            text={t("biomass.dashboard.noPasturesHint")}
            actionLabel={t("nav.login")}
            onAction={() => navigate("/login")}
          />
        </div>
      </>
    );
  }

  return (
    <>
      <style>{DASHBOARD_STYLE}</style>

      <div className={`bd-root ${isDark ? "bd-dark" : "bd-light"}`}>
        <Header />

        <div className="bd-hero">
          <div className="bd-shell bd-hero-inner">
            <div className="bd-hero-grid">
              <div>
                <div className="bd-badge">
                  <Activity style={{ width: 12, height: 12 }} />
                  {t("biomass.dashboard.heroNote")}
                </div>
                <h1 className="bd-title">{t("nav.biomassDashboard")}</h1>
                <p className="bd-subtitle">{t("biomass.subtitle")}</p>
              </div>

              <div className="bd-hero-card">
                <div className="bd-label">
                  <span className="bd-label-dot" />
                  {t("common.statistics")}
                </div>
                <div style={{ display: "grid", gap: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                    <span style={{ color: isDark ? "rgba(237,248,238,.56)" : "rgba(17,34,23,.54)", fontSize: 13 }}>
                      {t("biomass.dashboard.stats.completedMeasurements")}
                    </span>
                    <strong>{visibleMeasurements.length}</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                    <span style={{ color: isDark ? "rgba(237,248,238,.56)" : "rgba(17,34,23,.54)", fontSize: 13 }}>
                      {t("biomass.dashboard.stats.selectedPastures")}
                    </span>
                    <strong>{visiblePastures.length}</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                    <span style={{ color: isDark ? "rgba(237,248,238,.56)" : "rgba(17,34,23,.54)", fontSize: 13 }}>
                      {t("biomass.totalArea")}
                    </span>
                    <strong>{formatValue(totalArea || 0, 1, i18n.language)} {t("common.hectares")}</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                    <span style={{ color: isDark ? "rgba(237,248,238,.56)" : "rgba(17,34,23,.54)", fontSize: 13 }}>
                      {t("biomass.dashboard.stats.healthScore")}
                    </span>
                    <span className={`bd-tone-${healthTone}`}>{healthToneLabel}</span>
                  </div>
                  <div className="bd-divider" style={{ margin: "4px 0" }} />
                  <div className="bd-card-desc" style={{ margin: 0 }}>
                    {t("biomass.dashboard.stats.reserveHint", { ratio: 100 })}
                  </div>
                </div>
              </div>
            </div>

            <div className="bd-head-actions">
              <div className="bd-control-group">
                <div className="bd-label" style={{ marginBottom: 0 }}>
                  <span className="bd-label-dot" />
                  {t("biomass.pastureComparison")}
                </div>
                <div className="bd-pills">
                  <button
                    type="button"
                    className={`bd-pill ${isDark ? "bd-pill-dark" : "bd-pill-light"} ${selectedPasture === "all" ? "active" : ""}`}
                    onClick={() => setSelectedPasture("all")}
                  >
                    {t("biomass.dashboard.allPastures")}
                  </button>
                  {pastureModels.map((pasture) => (
                    <button
                      key={pasture.id}
                      type="button"
                      className={`bd-pill ${isDark ? "bd-pill-dark" : "bd-pill-light"} ${String(selectedPasture) === String(pasture.id) ? "active" : ""}`}
                      onClick={() => setSelectedPasture(String(pasture.id))}
                    >
                      {pasture.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bd-control-group">
                <div className="bd-label" style={{ marginBottom: 0 }}>
                  <span className="bd-label-dot" />
                  {t("biomass.biomassTrend")}
                </div>
                <div className="bd-pills-row">
                  {PERIODS.map((period) => (
                    <button
                      key={period.value}
                      type="button"
                      className={`bd-pill ${isDark ? "bd-pill-dark" : "bd-pill-light"} ${selectedPeriod === period.value ? "active" : ""}`}
                      onClick={() => setSelectedPeriod(period.value)}
                    >
                      {t(period.key)}
                    </button>
                  ))}
                  <button
                    type="button"
                    className={`bd-inline-btn ${activeSecondaryBtn} bd-refresh-btn`}
                    onClick={loadDashboard}
                    disabled={refreshing}
                  >
                    <RefreshCw style={{ width: 14, height: 14 }} className={refreshing ? "animate-spin" : ""} />
                    {t("common.refresh")}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bd-shell bd-main">
          {error ? (
            <div className="bd-card" style={{ marginBottom: 16 }}>
              <div className="bd-alert" style={{ background: "rgba(239,68,68,.08)", borderColor: "rgba(239,68,68,.18)" }}>
                <div className="bd-icon-chip" style={{ width: 38, height: 38, borderRadius: 14, background: "rgba(239,68,68,.14)" }}>
                  <AlertTriangle style={{ width: 18, height: 18, color: "#ef4444" }} />
                </div>
                <div>
                  <p className="bd-alert-title">{t("common.connectionError")}</p>
                  <p className="bd-alert-text">{error}</p>
                </div>
              </div>
            </div>
          ) : null}

          {!pastures.length ? (
            <div className="bd-card">
              <EmptyState
                isDark={isDark}
                icon={MapPinned}
                title={t("biomass.dashboard.noPastures")}
                text={t("biomass.dashboard.noPasturesHint")}
                actionLabel={t("biomass.dashboard.openMeasurements")}
                onAction={() => navigate("/pastures")}
              />
            </div>
          ) : !hasMeasurements ? (
            <div className="bd-card">
              <EmptyState
                isDark={isDark}
                icon={Leaf}
                title={t("biomass.dashboard.noMeasurements")}
                text={t("biomass.dashboard.noMeasurementsHint")}
                actionLabel={t("biomass.dashboard.openMeasurements")}
                onAction={() => navigate("/biomass")}
              />
            </div>
          ) : (
            <>
              <div className="bd-grid-stats">
                <StatCard
                  isDark={isDark}
                  title={t("biomass.avgBiomass")}
                  value={`${formatValue(avgBiomass || 0, 1, i18n.language)} ${measurementUnit}`}
                  subtitle={
                    avgTrendPct > 0 ? (
                      <>
                        <TrendingUp style={{ width: 14, height: 14, color: "#22c55e" }} />
                        {`+${formatValue(Math.abs(avgTrendPct), 1, i18n.language)}%`}
                      </>
                    ) : avgTrendPct < 0 ? (
                      <>
                        <TrendingDown style={{ width: 14, height: 14, color: "#ef4444" }} />
                        {`-${formatValue(Math.abs(avgTrendPct), 1, i18n.language)}%`}
                      </>
                    ) : (
                      <>
                        <Activity style={{ width: 14, height: 14 }} />
                        {t("biomass.dashboard.stats.changeStable")}
                      </>
                    )
                  }
                  icon={Leaf}
                  iconBg={isDark ? "rgba(34,197,94,.14)" : "rgba(22,163,74,.1)"}
                  iconColor={isDark ? "#4ade80" : "#15803d"}
                  helper={t("biomass.dashboard.trendDescription")}
                />
                <StatCard
                  isDark={isDark}
                  title={t("biomass.totalArea")}
                  value={`${formatValue(totalArea || 0, 1, i18n.language)} ${t("common.hectares")}`}
                  subtitle={
                    <>
                      <MapPinned style={{ width: 14, height: 14 }} />
                      {t("biomass.dashboard.stats.pastureCount", { count: visiblePastures.length })}
                    </>
                  }
                  icon={Wheat}
                  iconBg={isDark ? "rgba(96,165,250,.14)" : "rgba(96,165,250,.12)"}
                  iconColor="#60a5fa"
                  helper={t("biomass.dashboard.comparisonDescription")}
                />
                <StatCard
                  isDark={isDark}
                  title={t("biomass.dashboard.stats.healthScore")}
                  value={`${healthScore}%`}
                  subtitle={
                    <>
                      <Target style={{ width: 14, height: 14 }} />
                      {healthToneLabel}
                    </>
                  }
                  icon={Target}
                  iconBg={isDark ? "rgba(245,158,11,.14)" : "rgba(245,158,11,.12)"}
                  iconColor="#f59e0b"
                  tone={healthTone}
                  helper={healthToneLabel}
                />
                <StatCard
                  isDark={isDark}
                  title={t("biomass.dashboard.stats.winterReserve")}
                  value={`${formatValue(winterReserveTons || 0, 1, i18n.language)} ${t("biomass.dashboard.units.tons")}`}
                  subtitle={
                    <>
                      <Clock3 style={{ width: 14, height: 14 }} />
                      {t("biomass.dashboard.stats.reserveHint", { ratio: 100 })}
                    </>
                  }
                  icon={BarChart3}
                  iconBg={isDark ? "rgba(34,211,238,.14)" : "rgba(34,211,238,.12)"}
                  iconColor="#22d3ee"
                  helper={t("biomass.dashboard.stats.latestMeasurements", { count: visibleMeasurements.length })}
                />
              </div>

              <div className="bd-layout-2">
                <div className="bd-card">
                  <div className="bd-card-header">
                    <div>
                      <h2 className="bd-card-title">{t("biomass.biomassTrend")}</h2>
                      <p className="bd-card-desc">{t("biomass.dashboard.trendDescription")}</p>
                    </div>
                  </div>
                  <div className="bd-chart">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={trendData}>
                        <defs>
                          <linearGradient id="bdBiomassGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.32} />
                            <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                        <XAxis dataKey="label" tick={{ fill: axisColor, fontSize: 12 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: axisColor, fontSize: 12 }} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={chartTooltip} />
                        <Legend />
                        <Area
                          type="monotone"
                          dataKey="biomass"
                          name={`${t("biomass.biomassName")} (${measurementUnit})`}
                          stroke="#22c55e"
                          fill="url(#bdBiomassGradient)"
                          strokeWidth={2.5}
                        />
                        <Line
                          type="monotone"
                          dataKey="ndvi"
                          name="NDVI"
                          stroke="#22d3ee"
                          strokeWidth={2.2}
                          dot={{ r: 3, strokeWidth: 0 }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bd-card">
                  <div className="bd-card-header">
                    <div>
                      <h2 className="bd-card-title">{t("biomass.dashboard.recentTitle")}</h2>
                      <p className="bd-card-desc">{t("biomass.dashboard.recentDescription")}</p>
                    </div>
                  </div>
                  <div className="bd-chart">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={recentData}>
                        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                        <XAxis dataKey="label" tick={{ fill: axisColor, fontSize: 12 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: axisColor, fontSize: 12 }} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={chartTooltip} />
                        <Legend />
                        <Bar dataKey="biomass" name={`${t("biomass.actual")} (${measurementUnit})`} fill="#22c55e" radius={[8, 8, 0, 0]} />
                        <Bar dataKey="recommendedMinimum" name={`${t("biomass.dashboard.recommendedMinimum")} (${measurementUnit})`} fill="#94a3b8" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              <div className="bd-layout-3">
                <div className="bd-card">
                  <div className="bd-card-header">
                    <div>
                      <h2 className="bd-card-title">{t("biomass.pastureComparison")}</h2>
                      <p className="bd-card-desc">{t("biomass.dashboard.comparisonDescription")}</p>
                    </div>
                  </div>
                  <div className="bd-chart-short">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={comparisonData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                        <XAxis type="number" tick={{ fill: axisColor, fontSize: 12 }} axisLine={false} tickLine={false} />
                        <YAxis
                          dataKey="name"
                          type="category"
                          width={110}
                          tick={{ fill: axisColor, fontSize: 12 }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip contentStyle={chartTooltip} />
                        <Bar dataKey="biomass" name={`${t("biomass.biomassName")} (${measurementUnit})`} radius={[0, 8, 8, 0]}>
                          {comparisonData.map((entry) => (
                            <Cell key={entry.name} fill={entry.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bd-card">
                  <div className="bd-card-header">
                    <div>
                      <h2 className="bd-card-title">{t("biomass.grassTypes")}</h2>
                      <p className="bd-card-desc">{t("biomass.dashboard.distributionDescription")}</p>
                    </div>
                  </div>
                  {distributionData.length ? (
                    <>
                      <div className="bd-chart-short">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={distributionData}
                              dataKey="value"
                              nameKey="name"
                              cx="50%"
                              cy="50%"
                              innerRadius={54}
                              outerRadius={88}
                              paddingAngle={3}
                            >
                              {distributionData.map((entry) => (
                                <Cell key={entry.name} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip contentStyle={chartTooltip} formatter={(value) => `${formatValue(value, 1, i18n.language)} ${t("common.hectares")}`} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="bd-legend-list">
                        {distributionData.map((item) => (
                          <div key={item.name} className="bd-legend-item">
                            <span style={{ width: 10, height: 10, borderRadius: 999, background: item.color, flexShrink: 0 }} />
                            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.name}</span>
                            <span>{formatValue(item.value, 1, i18n.language)}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <EmptyState
                      isDark={isDark}
                      icon={Leaf}
                      title={t("biomass.grassTypes")}
                      text={t("biomass.dashboard.noGrassTypes")}
                    />
                  )}
                </div>
              </div>

              <div className="bd-layout-2">
                <div className="bd-card">
                  <div className="bd-card-header">
                    <div>
                      <h2 className="bd-card-title">{t("biomass.healthIndicators")}</h2>
                      <p className="bd-card-desc">{t("biomass.dashboard.indicatorsDescription")}</p>
                    </div>
                  </div>
                  <div className="bd-indicators">
                    {indicatorCards.map((indicator) => (
                      <IndicatorCard
                        key={indicator.key}
                        isDark={isDark}
                        name={indicator.name}
                        value={indicator.value}
                        description={indicator.description}
                        icon={indicator.icon}
                        color={indicator.color}
                      />
                    ))}
                  </div>
                </div>

                <div className="bd-card">
                  <div className="bd-card-header">
                    <div>
                      <h2 className="bd-card-title">{t("biomass.notifications")}</h2>
                      <p className="bd-card-desc">{t("biomass.dashboard.alertsDescription")}</p>
                    </div>
                  </div>
                  <div className="bd-alerts">
                    {alerts.map((alert, index) => {
                      const tone = alert.type === "warning"
                        ? { bg: "rgba(245,158,11,.1)", border: "rgba(245,158,11,.18)", color: "#f59e0b", icon: AlertTriangle }
                        : alert.type === "success"
                          ? { bg: "rgba(34,197,94,.1)", border: "rgba(34,197,94,.18)", color: "#22c55e", icon: CheckCircle2 }
                          : { bg: "rgba(96,165,250,.1)", border: "rgba(96,165,250,.18)", color: "#60a5fa", icon: Activity };
                      const Icon = tone.icon;

                      return (
                        <div key={`${alert.title}-${index}`} className="bd-alert" style={{ background: tone.bg, borderColor: tone.border }}>
                          <div className="bd-icon-chip" style={{ width: 40, height: 40, borderRadius: 14, background: `${tone.color}18` }}>
                            <Icon style={{ width: 18, height: 18, color: tone.color }} />
                          </div>
                          <div>
                            <p className="bd-alert-title">{alert.title}</p>
                            <p className="bd-alert-text">{alert.text}</p>
                            <div className="bd-alert-date">{alert.date}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <button
                    type="button"
                    className={`bd-inline-btn ${activeSecondaryBtn}`}
                    style={{ width: "100%", justifyContent: "center", marginTop: 14 }}
                    onClick={() => navigate("/biomass")}
                  >
                    {t("biomass.dashboard.openMeasurements")}
                    <ArrowRight style={{ width: 14, height: 14 }} />
                  </button>
                </div>
              </div>

              <div className="bd-card">
                <div className="bd-card-header">
                  <div>
                    <h2 className="bd-card-title">{t("biomass.dashboard.stats.winterReserve")}</h2>
                    <p className="bd-card-desc">
                      {t("biomass.dashboard.stats.reserveHint", { ratio: 100 })}
                    </p>
                  </div>
                  <div className="bd-tone-good">
                    <BarChart3 style={{ width: 14, height: 14 }} />
                    {formatValue(avgRotation || 0, 0, i18n.language)} {t("biomass.dashboard.units.days")}
                  </div>
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                    gap: 12,
                  }}
                >
                  <div className="bd-indicator">
                    <div className="bd-indicator-name">{t("biomass.dashboard.stats.winterReserve")}</div>
                    <p className="bd-indicator-value" style={{ color: "#22c55e" }}>
                      {formatValue(winterReserveTons || 0, 1, i18n.language)} {t("biomass.dashboard.units.tons")}
                    </p>
                    <p className="bd-indicator-desc">{t("biomass.dashboard.stats.latestMeasurements", { count: visibleMeasurements.length })}</p>
                  </div>
                  <div className="bd-indicator">
                    <div className="bd-indicator-name">{t("biomass.dashboard.indicators.capacity")}</div>
                    <p className="bd-indicator-value" style={{ color: "#60a5fa" }}>
                      {formatValue(avgCapacity || 0, 1, i18n.language)}
                    </p>
                    <p className="bd-indicator-desc">{t("biomass.dashboard.indicators.capacityDescription")}</p>
                  </div>
                  <div className="bd-indicator">
                    <div className="bd-indicator-name">{t("biomass.dashboard.recentTitle")}</div>
                    <p className="bd-indicator-value" style={{ color: "#f59e0b" }}>
                      {recentData.length}
                    </p>
                    <p className="bd-indicator-desc">{t("biomass.dashboard.recentDescription")}</p>
                  </div>
                  <div className="bd-indicator">
                    <div className="bd-indicator-name">{t("biomass.dashboard.stats.healthScore")}</div>
                    <p className="bd-indicator-value" style={{ color: "#a78bfa" }}>
                      {healthScore}%
                    </p>
                    <p className="bd-indicator-desc">{healthToneLabel}</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
