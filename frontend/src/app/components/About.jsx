// src/app/components/About.jsx
// KokMaisa 2025 — полная мультиязычность, светлая/тёмная тема

import { useTranslation } from "react-i18next";
import { Brain, Database, MessageCircle } from "lucide-react";

const ABOUT_STYLES = `
  .about-root {
    background: linear-gradient(180deg, #061309 0%, #071a0c 100%);
  }
  .about-card {
    background: rgba(255,255,255,.04);
    border: 1px solid rgba(34,197,94,.12);
    border-radius: 20px;
    transition: background .3s, border-color .3s, transform .3s;
  }
  .about-card:hover {
    background: rgba(34,197,94,.07);
    border-color: rgba(34,197,94,.3);
    transform: translateY(-4px);
  }
  .about-hl {
    background: linear-gradient(90deg, #4ade80, #22d3ee);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    font-weight: 600;
  }
`;

export default function About() {
  const { t } = useTranslation();

  const highlights = [
    {
      icon : Brain,
      titleKey: "about.highlight1Title",
      descKey : "about.highlight1Desc",
      color: "#4ade80",
    },
    {
      icon : Database,
      titleKey: "about.highlight2Title",
      descKey : "about.highlight2Desc",
      color: "#22d3ee",
    },
    {
      icon : MessageCircle,
      titleKey: "about.highlight3Title",
      descKey : "about.highlight3Desc",
      color: "#86efac",
    },
  ];

  return (
    <>
      <style>{ABOUT_STYLES}</style>
      <section className="about-root py-24 px-6" id="about">
        <div className="max-w-6xl mx-auto">

          {/* Header */}
          <div className="text-center mb-16">
            <span
              className="inline-block text-xs font-semibold tracking-[.2em] uppercase mb-4 px-4 py-1.5 rounded-full section-badge"
              style={{
                background: "rgba(34,197,94,.1)",
                border: "1px solid rgba(34,197,94,.25)",
                color: "#4ade80",
                fontFamily: "DM Sans, sans-serif",
              }}
            >
              {t("about.badge", "Platform")}
            </span>
            <h2
              className="text-4xl md:text-5xl font-extrabold text-white mb-6"
              style={{ fontFamily: "Syne, sans-serif" }}
            >
              {t("about.title")}
            </h2>
            <div className="w-16 h-0.5 mx-auto mb-8" style={{ background: "linear-gradient(90deg, #4ade80, #22d3ee)" }} />
            <p className="text-white/55 text-lg max-w-2xl mx-auto leading-relaxed">
              {t("about.description")}
            </p>
          </div>

          {/* Main description block */}
          <div
            className="rounded-3xl p-8 md:p-12 mb-12 text-center"
            style={{
              background: "linear-gradient(135deg, rgba(34,197,94,.08) 0%, rgba(34,211,238,.05) 100%)",
              border: "1px solid rgba(34,197,94,.15)",
            }}
          >
            <p className="text-lg md:text-xl text-white/70 leading-relaxed max-w-3xl mx-auto">
              {t("about.details.part1")}{" "}
              <span className="about-hl">{t("about.details.highlight1")}</span>{" "}
              {t("about.details.part2")}{" "}
              <span className="about-hl">{t("about.details.highlight2")}</span>
              {t("about.details.part3")}{" "}
              <span className="about-hl">{t("about.details.highlight3")}</span>
              {t("about.details.part4")}
            </p>
          </div>

          {/* Highlight cards — полностью переведены */}
          <div className="grid md:grid-cols-3 gap-6">
            {highlights.map(({ icon: Icon, titleKey, descKey, color }) => (
              <div key={titleKey} className="about-card p-7">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                  style={{ background: color + "1a", border: `1px solid ${color}33` }}
                >
                  <Icon className="w-6 h-6" style={{ color }} />
                </div>
                <h3
                  className="font-semibold text-lg mb-2"
                  style={{ fontFamily: "Syne, sans-serif", color: "var(--text-primary, #fff)" }}
                >
                  {t(titleKey)}
                </h3>
                <p style={{ color: "var(--text-secondary, rgba(255,255,255,.45))", fontSize: 14, lineHeight: 1.7 }}>
                  {t(descKey)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
