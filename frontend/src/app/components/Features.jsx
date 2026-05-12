// src/app/components/Features.jsx
// Dark premium redesign — KokMaisa 2025

import { BarChart, Brain, Camera, Database, History, MessageCircle } from "lucide-react";
import { useTranslation } from "react-i18next";

const FEAT_STYLES = `
  .feat-root {
    background: linear-gradient(180deg, #071a0c 0%, #061309 100%);
  }
  .feat-card {
    position: relative;
    background: rgba(255,255,255,.035);
    border: 1px solid rgba(255,255,255,.07);
    border-radius: 22px;
    padding: 32px;
    overflow: hidden;
    transition: background .3s, border-color .3s, transform .35s;
    cursor: default;
  }
  .feat-card::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 22px;
    opacity: 0;
    transition: opacity .35s;
    background: radial-gradient(circle at 30% 30%, rgba(74,222,128,.08), transparent 65%);
  }
  .feat-card:hover {
    background: rgba(255,255,255,.065);
    border-color: rgba(34,197,94,.22);
    transform: translateY(-6px);
  }
  .feat-card:hover::before { opacity: 1; }
  .feat-icon-wrap {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 52px;
    height: 52px;
    border-radius: 14px;
    margin-bottom: 20px;
  }
`;

export default function Features() {
  const { t } = useTranslation();

  const features = [
    {
      icon: Camera,
      title: t("features.feature1"),
      description: t("features.feature1Desc"),
      accent: "#4ade80",
    },
    {
      icon: BarChart,
      title: t("features.feature2"),
      description: t("features.feature2Desc"),
      accent: "#22d3ee",
    },
    {
      icon: Brain,
      title: t("features.feature3"),
      description: t("features.feature3Desc"),
      accent: "#a78bfa",
    },
    {
      icon: MessageCircle,
      title: t("features.feature4"),
      description: t("features.feature4Desc"),
      accent: "#f472b6",
    },
    {
      icon: Database,
      title: t("features.feature5"),
      description: t("features.feature5Desc"),
      accent: "#fb923c",
    },
    {
      icon: History,
      title: t("features.feature6"),
      description: t("features.feature6Desc"),
      accent: "#fbbf24",
    },
  ];

  return (
    <>
      <style>{FEAT_STYLES}</style>
      <section className="feat-root py-24 px-6" id="features">
        <div className="max-w-6xl mx-auto">

          {/* Header */}
          <div className="text-center mb-16">
            <span
              className="inline-block text-xs font-semibold tracking-[.2em] uppercase mb-4 px-4 py-1.5 rounded-full"
              style={{
                background: "rgba(34,197,94,.1)",
                border: "1px solid rgba(34,197,94,.25)",
                color: "#4ade80",
                fontFamily: "DM Sans, sans-serif",
              }}
            >
              Capabilities
            </span>
            <h2
              className="text-4xl md:text-5xl font-extrabold text-white mb-5"
              style={{ fontFamily: "Syne, sans-serif" }}
            >
              {t("features.title")}
            </h2>
            <div className="w-16 h-0.5 mx-auto mb-6" style={{ background: "linear-gradient(90deg, #4ade80, #22d3ee)" }} />
            <p className="text-white/50 text-lg max-w-xl mx-auto">
              {t("features.subtitle")}
            </p>
          </div>

          {/* Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map(({ icon: Icon, title, description, accent }) => (
              <div key={title} className="feat-card">
                {/* Glow blur */}
                <div
                  className="absolute -top-8 -right-8 w-36 h-36 rounded-full pointer-events-none"
                  style={{
                    background: `radial-gradient(circle, ${accent}22 0%, transparent 70%)`,
                    filter: "blur(20px)",
                  }}
                />
                <div
                  className="feat-icon-wrap"
                  style={{ background: accent + "18", border: `1px solid ${accent}30` }}
                >
                  <Icon className="w-6 h-6" style={{ color: accent }} />
                </div>
                <h3
                  className="text-white font-bold text-lg mb-3"
                  style={{ fontFamily: "Syne, sans-serif" }}
                >
                  {title}
                </h3>
                <p className="text-white/45 text-sm leading-relaxed">{description}</p>

                {/* Corner accent */}
                <div
                  className="absolute bottom-4 right-5 text-xs font-mono"
                  style={{ color: accent + "60" }}
                >
                  ↗
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
