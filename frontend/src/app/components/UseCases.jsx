// src/app/components/UseCases.jsx
// KokMaisa 2025 — Dark premium style, responsive, theme-aware

import { Users, Leaf, FlaskConical, ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";

const UC_STYLES = `
  .uc-root {
    background: linear-gradient(180deg, #061309 0%, #071a0c 100%);
  }
  [data-theme="light"] .uc-root {
    background: linear-gradient(180deg, #f0faf2 0%, #e8f7ea 100%);
  }

  .uc-card {
    position: relative;
    background: rgba(255,255,255,.04);
    border: 1px solid rgba(255,255,255,.07);
    border-radius: 24px;
    overflow: hidden;
    transition: border-color .3s, transform .35s, background .3s;
  }
  .uc-card:hover {
    border-color: rgba(34,197,94,.25);
    transform: translateY(-6px);
    background: rgba(255,255,255,.065);
  }
  [data-theme="light"] .uc-card {
    background: rgba(255,255,255,.85);
    border-color: rgba(34,197,94,.15);
    box-shadow: 0 4px 20px rgba(34,197,94,.07);
  }
  [data-theme="light"] .uc-card:hover {
    background: rgba(255,255,255,1);
    border-color: rgba(34,197,94,.3);
    box-shadow: 0 12px 40px rgba(34,197,94,.12);
  }

  /* Image pill */
  .uc-img-wrap {
    width: calc(100% - 2rem);
    aspect-ratio: 16/9;
    overflow: hidden;
    border-radius: 16px;
    position: relative;
  }
  .uc-img-wrap img {
    width: 100%; height: 100%;
    object-fit: cover;
    transition: transform .55s cubic-bezier(.22,1,.36,1);
    filter: brightness(.75) saturate(1.1);
  }
  .uc-card:hover .uc-img-wrap img { transform: scale(1.06); }

  /* Gradient overlay on image */
  .uc-img-overlay {
    position: absolute; inset: 0;
    background: linear-gradient(to bottom, transparent 30%, rgba(4,13,6,.85) 100%);
    z-index: 1;
  }
  [data-theme="light"] .uc-img-overlay {
    background: linear-gradient(to bottom, transparent 30%, rgba(232,247,234,.7) 100%);
  }

  /* Number badge */
  .uc-num {
    font-family: 'Syne', sans-serif;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: .18em;
    color: rgba(74,222,128,.55);
    margin-bottom: 8px;
  }
  [data-theme="light"] .uc-num { color: rgba(22,163,74,.7); }

  .uc-title {
    font-family: 'Syne', sans-serif;
    font-size: clamp(1.1rem, 2.5vw, 1.35rem);
    font-weight: 700;
    color: #fff;
    margin-bottom: 10px;
    line-height: 1.3;
  }
  [data-theme="light"] .uc-title { color: #1a3d20; }

  .uc-desc {
    font-size: 14px;
    color: rgba(255,255,255,.45);
    line-height: 1.7;
  }
  [data-theme="light"] .uc-desc { color: rgba(20,55,20,.6); }

  .uc-icon-wrap {
    width: 48px; height: 48px;
    border-radius: 14px;
    display: flex; align-items: center; justify-content: center;
    margin-bottom: 18px;
    flex-shrink: 0;
  }

  .uc-arrow {
    display: flex; align-items: center; justify-content: center;
    width: 36px; height: 36px; border-radius: 50%;
    background: rgba(74,222,128,.1);
    color: #4ade80;
    transition: background .25s, transform .25s;
    flex-shrink: 0;
  }
  [data-theme="light"] .uc-arrow { background: rgba(22,163,74,.12); color: #16a34a; }
  .uc-card:hover .uc-arrow { background: rgba(74,222,128,.2); transform: translateX(4px); }

  /* Tag chip */
  .uc-tag {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 3px 10px; border-radius: 999px; font-size: 11px; font-weight: 600;
    letter-spacing: .04em;
  }

  @media (max-width: 640px) {
    .uc-card {
      border-radius: 18px;
    }
    .uc-img-wrap {
      width: calc(100% - 1.5rem);
      margin-left: .75rem;
      margin-right: .75rem;
      margin-top: .75rem;
      aspect-ratio: 4/3;
      border-radius: 14px;
    }
    .uc-card:hover {
      transform: none;
    }
    .uc-card:hover .uc-img-wrap img {
      transform: none;
    }
    .uc-title,
    .uc-desc,
    .uc-tag {
      overflow-wrap: anywhere;
    }
  }
`;

const CASES = [
  {
    icon: Users,
    img: "https://images.unsplash.com/photo-1677126577258-1a82fdf1a976?auto=format&fit=crop&w=800&q=70",
    titleKey: "useCases.case1",
    descKey:  "useCases.case1Desc",
    tagKey:   "useCases.tag1",
    tagDefault: "Livestock",
    accent: "#4ade80",
    num: "01",
  },
  {
    icon: Leaf,
    img: "https://images.unsplash.com/photo-1640076277636-e381e8645362?auto=format&fit=crop&w=800&q=70",
    titleKey: "useCases.case2",
    descKey:  "useCases.case2Desc",
    tagKey:   "useCases.tag2",
    tagDefault: "Research",
    accent: "#22d3ee",
    num: "02",
  },
  {
    icon: FlaskConical,
    img: "https://images.unsplash.com/photo-1659564455690-fee35bff87f6?auto=format&fit=crop&w=800&q=70",
    titleKey: "useCases.case3",
    descKey:  "useCases.case3Desc",
    tagKey:   "useCases.tag3",
    tagDefault: "Land Mgmt",
    accent: "#a78bfa",
    num: "03",
  },
];

export default function UseCases() {
  const { t } = useTranslation();

  return (
    <>
      <style>{UC_STYLES}</style>
      <section className="uc-root py-20 sm:py-24 px-4 sm:px-6" id="use-cases">
        <div className="max-w-6xl mx-auto">

          {/* Header */}
          <div className="text-center mb-14 sm:mb-16">
            <span className="inline-block text-xs font-semibold tracking-[.2em] uppercase mb-4 px-4 py-1.5 rounded-full"
              style={{ background:"rgba(34,197,94,.1)", border:"1px solid rgba(34,197,94,.25)", color:"#4ade80", fontFamily:"DM Sans,sans-serif" }}>
              Applications
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-5"
              style={{ fontFamily:"Syne,sans-serif", color:"var(--text-primary,#fff)" }}>
              {t("useCases.title")}
            </h2>
            <div className="w-14 h-0.5 mx-auto mb-5" style={{ background:"linear-gradient(90deg,#4ade80,#22d3ee)" }}/>
            <p className="text-sm sm:text-base md:text-lg max-w-xl mx-auto leading-relaxed" style={{ color:"var(--text-secondary,rgba(255,255,255,.5))" }}>
              {t("useCases.subtitle")}
            </p>
          </div>

          {/* Cards grid — 1 col mobile, 3 col desktop */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {CASES.map(({ icon: Icon, img, titleKey, descKey, tagKey, tagDefault, accent, num }) => (
              <div key={num} className="uc-card">
                {/* Glow top accent */}
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full pointer-events-none"
                  style={{ background:`radial-gradient(circle,${accent}1a 0%,transparent 70%)`, filter:"blur(20px)", zIndex:0 }}/>

                {/* Image */}
                <div className="uc-img-wrap mx-4 mt-4">
                  <img src={img} alt={t(titleKey)} loading="lazy"/>
                  <div className="uc-img-overlay"/>
                  {/* Tag on image */}
                  <div className="absolute bottom-3 left-3 z-10">
                    <div className="uc-tag" style={{ background:`${accent}22`, border:`1px solid ${accent}40`, color:accent }}>
                      <div className="w-1.5 h-1.5 rounded-full" style={{ background:accent }}/>
                      {t(tagKey, tagDefault)}
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="relative z-10 p-5 sm:p-6">
                  <div className="uc-num">CASE {num}</div>

                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="uc-icon-wrap" style={{ background:`${accent}18`, border:`1px solid ${accent}30` }}>
                      <Icon className="w-5 h-5" style={{ color:accent }}/>
                    </div>
                    <div className="uc-arrow">
                      <ArrowRight className="w-4 h-4"/>
                    </div>
                  </div>

                  <h3 className="uc-title">{t(titleKey)}</h3>
                  <p className="uc-desc">{t(descKey)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
