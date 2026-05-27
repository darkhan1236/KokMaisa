// src/app/components/Metrics.jsx
// KokMaisa 2025 — Dark premium redesign, full i18n (EN/RU/KK), light/dark theme, responsive

import { Image, TrendingDown, Calendar } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

const METRICS_STYLES = `
  .metrics-root {
    background: linear-gradient(135deg, #071a0c 0%, #061309 60%, #071218 100%);
    position: relative;
    overflow: hidden;
  }
  .metrics-root::before {
    content: '';
    position: absolute;
    width: 600px; height: 600px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(34,197,94,.1) 0%, transparent 70%);
    top: -200px; left: -200px;
    pointer-events: none;
  }
  .metrics-root::after {
    content: '';
    position: absolute;
    width: 500px; height: 500px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(34,211,238,.07) 0%, transparent 70%);
    bottom: -150px; right: -150px;
    pointer-events: none;
  }
  .metric-card {
    background: rgba(255,255,255,.04);
    border: 1px solid rgba(255,255,255,.08);
    border-radius: 24px;
    padding: 36px 28px;
    text-align: center;
    transition: background .3s, border-color .3s, transform .35s;
    position: relative;
    overflow: hidden;
  }
  .metric-card:hover {
    background: rgba(255,255,255,.07);
    border-color: rgba(34,197,94,.25);
    transform: translateY(-6px);
  }
  .metric-value {
    font-family: 'Syne', sans-serif;
    font-size: 3rem;
    font-weight: 800;
    line-height: 1;
    background: linear-gradient(135deg, #4ade80, #22d3ee);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin: 16px 0 8px;
  }

  /* CTA banner */
  .metrics-cta {
    background: linear-gradient(135deg, rgba(34,197,94,.1) 0%, rgba(34,211,238,.07) 100%);
    border: 1px solid rgba(34,197,94,.2);
  }
  .metrics-cta-title {
    overflow-wrap: anywhere;
    text-wrap: balance;
  }

  /* Light theme overrides */
  [data-theme="light"] .metrics-root {
    background: linear-gradient(135deg, #e8f7ea 0%, #f0faf2 60%, #e6f4f8 100%);
  }
  [data-theme="light"] .metrics-root::before {
    background: radial-gradient(circle, rgba(34,197,94,.12) 0%, transparent 70%);
  }
  [data-theme="light"] .metrics-root::after {
    background: radial-gradient(circle, rgba(34,211,238,.08) 0%, transparent 70%);
  }
  [data-theme="light"] .metric-card {
    background: rgba(255,255,255,.92);
    border-color: rgba(34,197,94,.18);
    box-shadow: 0 4px 20px rgba(34,197,94,.07);
  }
  [data-theme="light"] .metric-card:hover {
    background: #fff;
    border-color: rgba(34,197,94,.3);
    box-shadow: 0 12px 32px rgba(34,197,94,.12);
  }
  [data-theme="light"] .metric-value {
    background: linear-gradient(135deg, #16a34a, #0891b2);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  [data-theme="light"] .metrics-cta {
    background: linear-gradient(135deg, rgba(22,163,74,.09) 0%, rgba(8,145,178,.06) 100%);
    border-color: rgba(22,163,74,.2);
  }

  /* Responsive */
  @media (max-width: 640px) {
    .metric-card { padding: 24px 18px; }
    .metric-value { font-size: 2.25rem; }
    .metrics-cta {
      border-radius: 20px;
      padding: 28px 18px;
      margin-left: auto;
      margin-right: auto;
      max-width: 100%;
    }
    .metrics-cta-title {
      font-size: clamp(1.45rem, 8vw, 1.9rem);
      line-height: 1.15;
      margin-bottom: 14px;
    }
    .metrics-cta-link {
      width: 100%;
      max-width: 280px;
      justify-content: center;
      white-space: normal;
      text-align: center;
    }
  }
`;

const metricsData = [
  { icon: Image,       key: "images",   descriptionKey: "imagesDesc",   accent: "#4ade80" },
  { icon: TrendingDown,key: "accuracy", descriptionKey: "accuracyDesc", accent: "#22d3ee" },
  { icon: Calendar,    key: "coverage", descriptionKey: "coverageDesc", accent: "#a78bfa" },
];

export default function Metrics() {
  const { t } = useTranslation();

  const titleColor   = "var(--text-primary, #fff)";
  const subtitleColor= "var(--text-secondary, rgba(255,255,255,.5))";
  const labelColor   = "var(--text-primary, #fff)";
  const descColor    = "var(--text-muted, rgba(255,255,255,.4))";

  return (
    <>
      <style>{METRICS_STYLES}</style>
      <section className="metrics-root py-20 sm:py-24 px-4 sm:px-6">
        <div className="relative z-10 max-w-6xl mx-auto">

          {/* ── Header ── */}
          <div className="text-center mb-14 sm:mb-16">
            <span
              className="inline-block text-xs font-semibold tracking-[.2em] uppercase mb-4 px-4 py-1.5 rounded-full"
              style={{
                background: "rgba(34,197,94,.1)",
                border: "1px solid rgba(34,197,94,.25)",
                color: "#4ade80",
              }}
            >
              {t("metrics.badge", "Results")}
            </span>
            <h2
              className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-5"
              style={{ fontFamily: "Syne, sans-serif", color: titleColor }}
            >
              {t("metrics.title")}
            </h2>
            <div className="w-14 h-0.5 mx-auto mb-6" style={{ background: "linear-gradient(90deg, #4ade80, #22d3ee)" }} />
            <p className="text-sm sm:text-base md:text-lg max-w-xl mx-auto leading-relaxed" style={{ color: subtitleColor }}>
              {t("metrics.subtitle")}
            </p>
          </div>

          {/* ── Metric cards ── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 sm:gap-6">
            {metricsData.map(({ icon: Icon, key, descriptionKey, accent }) => (
              <div key={key} className="metric-card">
                {/* Glow */}
                <div
                  className="absolute -top-8 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full pointer-events-none"
                  style={{ background: `radial-gradient(circle, ${accent}18 0%, transparent 70%)`, filter: "blur(20px)" }}
                />

                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto relative z-10"
                  style={{ background: accent + "18", border: `1px solid ${accent}30` }}
                >
                  <Icon className="w-7 h-7" style={{ color: accent }} />
                </div>

                <div className="metric-value">{t(`metrics.values.${key}`)}</div>

                <div
                  className="font-semibold text-base mb-3"
                  style={{ fontFamily: "Syne, sans-serif", color: labelColor }}
                >
                  {t(`metrics.labels.${key}`)}
                </div>

                <p className="text-sm leading-relaxed" style={{ color: descColor }}>
                  {t(`metrics.descriptions.${descriptionKey}`)}
                </p>
              </div>
            ))}
          </div>

          {/* ── CTA banner — fully i18n ── */}
          <div className="metrics-cta mt-12 sm:mt-14 rounded-3xl p-8 sm:p-10 md:p-14 text-center">
            <h3
              className="metrics-cta-title text-2xl sm:text-3xl md:text-4xl font-extrabold mb-4"
              style={{ fontFamily: "Syne, sans-serif", color: labelColor }}
            >
              {t("metrics.cta.title")}
            </h3>
            <p className="text-sm sm:text-base mb-7 sm:mb-8 max-w-md mx-auto leading-relaxed" style={{ color: subtitleColor }}>
              {t("metrics.cta.desc")}
            </p>
            <Link
              to="/register"
              className="metrics-cta-link inline-flex items-center gap-3 px-7 sm:px-8 py-3.5 sm:py-4 rounded-full font-semibold text-white text-sm sm:text-base"
              style={{
                background: "linear-gradient(135deg, #22c55e 0%, #0d9488 100%)",
                boxShadow: "0 8px 32px rgba(34,197,94,.3)",
                transition: "transform .25s, box-shadow .25s",
                textDecoration: "none",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = "scale(1.05) translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 14px 40px rgba(34,197,94,.45)";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = "";
                e.currentTarget.style.boxShadow = "0 8px 32px rgba(34,197,94,.3)";
              }}
            >
              {t("metrics.cta.btn")}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </Link>
          </div>

        </div>
      </section>
    </>
  );
}
