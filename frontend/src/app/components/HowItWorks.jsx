// src/app/components/HowItWorks.jsx
// Dark premium redesign — KokMaisa 2025

import { Camera, Upload, Brain, TrendingUp } from "lucide-react";
import { useTranslation } from "react-i18next";

const HOW_STYLES = `
  .how-root {
    background: #061309;
  }
  .how-step {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
  }
  .how-connector {
    position: absolute;
    top: 34px;
    left: 50%;
    width: 100%;
    height: 1px;
    background: linear-gradient(90deg, rgba(34,197,94,.3), rgba(34,197,94,.05));
    pointer-events: none;
  }
  .how-num {
    font-family: 'Syne', sans-serif;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: .15em;
    color: rgba(74,222,128,.5);
    margin-bottom: 6px;
  }
  .how-icon-ring {
    width: 68px;
    height: 68px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 20px;
    position: relative;
    z-index: 1;
    transition: transform .3s;
  }
  .how-step:hover .how-icon-ring { transform: scale(1.1); }
`;

export default function HowItWorks() {
  const { t } = useTranslation();

  const steps = [
    {
      number: "01",
      icon: Camera,
      title: t("howItWorks.step1Title"),
      description: t("howItWorks.step1Desc"),
      color: "#4ade80",
    },
    {
      number: "02",
      icon: Upload,
      title: t("howItWorks.step2Title"),
      description: t("howItWorks.step2Desc"),
      color: "#22d3ee",
    },
    {
      number: "03",
      icon: Brain,
      title: t("howItWorks.step3Title"),
      description: t("howItWorks.step3Desc"),
      color: "#a78bfa",
    },
    {
      number: "04",
      icon: TrendingUp,
      title: t("howItWorks.step4Title"),
      description: t("howItWorks.step4Desc"),
      color: "#fbbf24",
    },
  ];

  return (
    <>
      <style>{HOW_STYLES}</style>
      <section className="how-root py-24 px-6" id="how-it-works">
        <div className="max-w-6xl mx-auto">

          {/* Header */}
          <div className="text-center mb-20">
            <span
              className="inline-block text-xs font-semibold tracking-[.2em] uppercase mb-4 px-4 py-1.5 rounded-full"
              style={{
                background: "rgba(34,197,94,.1)",
                border: "1px solid rgba(34,197,94,.25)",
                color: "#4ade80",
              }}
            >
              Process
            </span>
            <h2
              className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white mb-5"
              style={{ fontFamily: "Syne, sans-serif" }}
            >
              {t("howItWorks.title")}
            </h2>
            <div className="w-16 h-0.5 mx-auto mb-6" style={{ background: "linear-gradient(90deg, #4ade80, #22d3ee)" }} />
            <p className="text-white/50 text-lg max-w-xl mx-auto">{t("howItWorks.subtitle")}</p>
          </div>

          {/* Steps */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6">
            {steps.map((step, i) => {
              const Icon = step.icon;
              return (
                <div key={step.number} className="how-step">
                  {/* Connector (not on last) */}
                  {i < steps.length - 1 && (
                    <div className="how-connector hidden lg:block" />
                  )}

                  <div className="how-num">STEP {step.number}</div>

                  <div
                    className="how-icon-ring"
                    style={{
                      background: step.color + "15",
                      border: `1.5px solid ${step.color}35`,
                      boxShadow: `0 0 30px ${step.color}20`,
                    }}
                  >
                    <Icon className="w-7 h-7" style={{ color: step.color }} />
                  </div>

                  <h3
                    className="text-white font-bold text-lg mb-3"
                    style={{ fontFamily: "Syne, sans-serif" }}
                  >
                    {step.title}
                  </h3>
                  <p className="text-white/45 text-sm leading-relaxed max-w-xs">
                    {step.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}