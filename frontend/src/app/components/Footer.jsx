// src/app/components/Footer.jsx
// KokMaisa 2025 — Light/dark text fixed, responsive, XSS-safe

import { Leaf, Mail, Github, BookOpen, Lightbulb } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/contexts/ThemeContext";

const FOOTER_STYLES = `
  /* ─── Dark footer ─── */
  .footer-root-dark {
    background: #040d06;
    border-top: 1px solid rgba(34,197,94,.1);
  }

  /* ─── Light footer — proper contrast ─── */
  .footer-root-light {
    background: #e8f5ea;
    border-top: 1px solid rgba(34,197,94,.2);
  }

  /* Links — dark */
  .footer-link-dark {
    color: rgba(255,255,255,.5);
    transition: color .2s;
    font-size: 14px;
    display: flex;
    align-items: center;
    gap: 8px;
    text-decoration: none;
  }
  .footer-link-dark:hover { color: #4ade80; }

  /* Links — light: dark green text */
  .footer-link-light {
    color: rgba(20,55,20,.65) !important;
    transition: color .2s;
    font-size: 14px;
    display: flex;
    align-items: center;
    gap: 8px;
    text-decoration: none;
  }
  .footer-link-light:hover { color: #16a34a !important; }

  /* Divider */
  .footer-divider-dark  { height:1px;background:rgba(255,255,255,.06); margin:32px 0 28px; }
  .footer-divider-light { height:1px;background:rgba(34,197,94,.15);   margin:32px 0 28px; }

  /* Brand name */
  .footer-brand-dark  { color: #ffffff; }
  .footer-brand-light { color: #1a3d20; }

  /* Description text */
  .footer-desc-dark  { color: rgba(255,255,255,.4); }
  .footer-desc-light { color: rgba(20,55,20,.6) !important; }

  /* Academic note */
  .footer-note-dark  { color: rgba(255,255,255,.22); }
  .footer-note-light { color: rgba(20,55,20,.45) !important; }

  /* Section heading */
  .footer-heading-dark  { color: #ffffff; }
  .footer-heading-light { color: #1a3d20 !important; }

  /* Bottom bar text */
  .footer-copy-dark  { color: rgba(255,255,255,.25); }
  .footer-copy-light { color: rgba(20,55,20,.5) !important; }

  /* Status dot text */
  .footer-status-dark  { color: rgba(255,255,255,.25); }
  .footer-status-light { color: rgba(20,55,20,.45) !important; }

  @keyframes heroPulse {
    0%, 100% { opacity:.55; transform:scale(1); }
    50%       { opacity:.9;  transform:scale(1.07); }
  }

  /* Responsive footer grid */
  @media (max-width: 640px) {
    .footer-grid { grid-template-columns: 1fr !important; gap: 32px !important; }
    .footer-brand-col { max-width: 100% !important; }
  }
`;

export default function Footer() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const isDark = theme === "dark";
  const currentYear = new Date().getFullYear();

  const rootCls  = isDark ? "footer-root-dark"    : "footer-root-light";
  const linkCls  = isDark ? "footer-link-dark"    : "footer-link-light";
  const divCls   = isDark ? "footer-divider-dark"  : "footer-divider-light";
  const brandCls = isDark ? "footer-brand-dark"   : "footer-brand-light";
  const descCls  = isDark ? "footer-desc-dark"    : "footer-desc-light";
  const noteCls  = isDark ? "footer-note-dark"    : "footer-note-light";
  const headCls  = isDark ? "footer-heading-dark" : "footer-heading-light";
  const copyCls  = isDark ? "footer-copy-dark"    : "footer-copy-light";
  const statusCls= isDark ? "footer-status-dark"  : "footer-status-light";

  const handleSectionLink = (event, hash) => {
    event.preventDefault();
    const scroll = () => document.getElementById(hash)?.scrollIntoView({ behavior: "smooth" });
    if (location.pathname === "/") {
      scroll();
      return;
    }
    navigate(`/#${hash}`);
    window.setTimeout(scroll, 60);
  };

  return (
    <>
      <style>{FOOTER_STYLES}</style>
      <footer className={`${rootCls} py-14 sm:py-16 px-4 sm:px-6`} role="contentinfo">
        <div className="max-w-6xl mx-auto">

          {/* Top grid */}
          <div
            className="footer-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "40px 32px",
              marginBottom: "0",
            }}
          >
            {/* Brand — spans wider */}
            <div className="footer-brand-col" style={{ gridColumn: "span 2", maxWidth: 400 }}>
              <div className="flex items-center gap-3 mb-5">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "linear-gradient(135deg, #22c55e, #0d9488)" }}
                  aria-hidden="true"
                >
                  <Leaf className="w-5 h-5 text-white" aria-hidden="true" />
                </div>
                <span
                  className={`text-2xl font-extrabold ${brandCls}`}
                  style={{ fontFamily: "Syne, sans-serif" }}
                >
                  KokMaisa
                </span>
              </div>
              <p className={`text-sm leading-relaxed mb-4 max-w-xs ${descCls}`}>
                {t("footer.description")}
              </p>
              <p className={`text-xs italic ${noteCls}`}>
                {t("footer.academicNote") || "Academic project for sustainable pasture management in Kazakhstan"}
              </p>
            </div>

            {/* Quick links */}
            <div>
              <h3
                className={`font-semibold text-sm tracking-wide uppercase mb-5 ${headCls}`}
                style={{ fontFamily: "Syne, sans-serif", letterSpacing: ".1em" }}
              >
                {t("footer.quickLinks")}
              </h3>
              <ul className="space-y-3" role="list">
                {[
                  { hash: "about",       label: t("nav.about") },
                  { hash: "how-it-works",label: t("nav.howItWorks") },
                  { hash: "features",    label: t("nav.features") },
                  { hash: "use-cases",   label: t("nav.useCases") },
                ].map(({ hash, label }) => (
                  <li key={label}>
                    <Link to={`/#${hash}`} onClick={event => handleSectionLink(event, hash)} className={linkCls}>
                      <span style={{ color: isDark ? "rgba(74,222,128,.6)" : "rgba(22,163,74,.7)" }} aria-hidden="true">›</span>
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h3
                className={`font-semibold text-sm tracking-wide uppercase mb-5 ${headCls}`}
                style={{ fontFamily: "Syne, sans-serif", letterSpacing: ".1em" }}
              >
                {t("footer.contact")}
              </h3>
              <ul className="space-y-3" role="list">
                <li>
                  <a href="mailto:info@kokmaisa.kz" className={linkCls}>
                    <Mail className="w-4 h-4" aria-hidden="true" />
                    info@kokmaisa.kz
                  </a>
                </li>
                <li>
                  <a
                    href="https://github.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={linkCls}
                  >
                    <Github className="w-4 h-4" aria-hidden="true" />
                    GitHub
                  </a>
                </li>
                <li>
                  <Link to="/suggestions" className={linkCls}>
                    <Lightbulb className="w-4 h-4" aria-hidden="true" />
                    {t("footer.suggestions")}
                  </Link>
                </li>
                <li>
                  <Link to="/register" className={linkCls}>
                    <BookOpen className="w-4 h-4" aria-hidden="true" />
                    {t("nav.register")}
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className={divCls} />

          {/* Bottom bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className={`text-sm ${copyCls}`}>
              © {currentYear} KokMaisa. {t("footer.rights") || "All rights reserved."}
            </p>
            <div className="flex items-center gap-2">
              <div
                className="w-1.5 h-1.5 rounded-full bg-emerald-500"
                style={{ animation: "heroPulse 2s ease-in-out infinite" }}
                aria-hidden="true"
              />
              <span className={`text-xs ${statusCls}`}>{t("footer.status")}</span>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
