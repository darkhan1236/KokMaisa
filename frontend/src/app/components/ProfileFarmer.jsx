// src/app/components/ProfileFarmer.jsx
// KokMaisa 2025 — Minimal premium SaaS profile, dark/light, i18n, responsive

import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/app/components/Header";
import {
  MapPin, Mail, Phone, Settings, LogOut,
  Wheat, LayoutGrid, ChevronRight, Loader2,
  Camera, Edit3,
} from "lucide-react";

/* ─── Styles ──────────────────────────────────────────────────────────────── */
const S = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500;600&display=swap');

  .pfm { font-family:'DM Sans',sans-serif; min-height:100vh; transition:background .4s; }
  .pfm-d { background:#061309; }
  .pfm-l { background:#f5fcf2; }

  /* ── Center column ── */
  .pfm-col {
    max-width: 560px;
    margin: 0 auto;
    padding: 96px 20px 64px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  /* ── Card ── */
  .pfm-card { border-radius: 22px; padding: 28px; transition: box-shadow .2s; }
  .pfm-card-d {
    background: rgba(255,255,255,.04);
    border: 1px solid rgba(255,255,255,.08);
  }
  .pfm-card-l {
    background: #fff;
    border: 1px solid rgba(34,197,94,.14);
    box-shadow: 0 2px 20px rgba(34,197,94,.06);
  }

  /* ── Avatar ── */
  .pfm-av {
    width: 80px; height: 80px; border-radius: 22px; flex-shrink: 0;
    background: linear-gradient(135deg,#22c55e,#0d9488);
    display: flex; align-items: center; justify-content: center;
    font-family: 'Syne',sans-serif; font-size: 1.8rem; font-weight: 800; color: #fff;
    overflow: hidden; position: relative;
  }
  .pfm-av img { width:100%;height:100%;object-fit:cover; }
  .pfm-av-btn {
    position: absolute; inset: 0; background: rgba(0,0,0,.38);
    display: flex; align-items: center; justify-content: center;
    opacity: 0; transition: opacity .2s; cursor: pointer; border: none;
  }
  .pfm-av:hover .pfm-av-btn { opacity: 1; }

  /* ── Role chip ── */
  .pfm-chip {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 3px 10px; border-radius: 999px;
    font-size: 11px; font-weight: 700; letter-spacing: .05em;
    background: rgba(34,197,94,.12); border: 1px solid rgba(34,197,94,.25); color: #22c55e;
  }

  /* ── Divider ── */
  .pfm-div-d { height:1px; background:rgba(255,255,255,.06); margin:4px 0; }
  .pfm-div-l { height:1px; background:rgba(34,197,94,.09);  margin:4px 0; }

  /* ── Info row ── */
  .pfm-row {
    display: flex; align-items: center; gap: 11px;
    padding: 11px 0;
    border-bottom: 1px solid;
  }
  .pfm-row:last-child { border-bottom: none; padding-bottom: 0; }
  .pfm-row-d { border-bottom-color: rgba(255,255,255,.06); }
  .pfm-row-l { border-bottom-color: rgba(34,197,94,.08); }

  /* ── Stat ── */
  .pfm-stat {
    flex: 1; padding: 16px 18px; border-radius: 16px;
    display: flex; flex-direction: column; gap: 4px;
    transition: transform .2s;
  }
  .pfm-stat:hover { transform: translateY(-2px); }
  .pfm-stat-d { background:rgba(255,255,255,.035); border:1px solid rgba(255,255,255,.07); }
  .pfm-stat-l { background:rgba(34,197,94,.05); border:1px solid rgba(34,197,94,.12); }

  /* ── Action button ── */
  .pfm-action {
    display: flex; align-items: center; justify-content: space-between;
    padding: 13px 16px; border-radius: 14px; cursor: pointer;
    transition: background .15s, transform .15s;
    border: none; width: 100%; text-align: left; text-decoration: none;
    font-family: 'DM Sans',sans-serif; font-size: 14px; font-weight: 500;
  }
  .pfm-action:hover { transform: translateX(3px); }
  .pfm-action-d { background:transparent; color:rgba(255,255,255,.7); }
  .pfm-action-d:hover { background:rgba(255,255,255,.05); color:#fff; }
  .pfm-action-l { background:transparent; color:rgba(20,55,20,.7); }
  .pfm-action-l:hover { background:rgba(34,197,94,.07); color:#166534; }

  /* ── Primary btn ── */
  .pfm-btn-primary {
    display: flex; align-items: center; justify-content: center; gap: 8px;
    padding: 12px 24px; border-radius: 999px; border: none; cursor: pointer;
    background: linear-gradient(135deg,#22c55e,#0d9488);
    color: #fff; font-size: 14px; font-weight: 600;
    font-family: 'DM Sans',sans-serif;
    transition: transform .2s, box-shadow .2s;
    text-decoration: none;
    width: 100%;
  }
  .pfm-btn-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(34,197,94,.35);
  }

  /* ── Section label ── */
  .pfm-section-label {
    font-size: 10px; font-weight: 700; letter-spacing: .14em;
    text-transform: uppercase; margin-bottom: 4px;
  }

  /* ── Animations ── */
  @keyframes pfmFade { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
  .pfm-a1 { animation:pfmFade .5s cubic-bezier(.22,1,.36,1) .05s both; }
  .pfm-a2 { animation:pfmFade .5s cubic-bezier(.22,1,.36,1) .12s both; }
  .pfm-a3 { animation:pfmFade .5s cubic-bezier(.22,1,.36,1) .20s both; }
  .pfm-a4 { animation:pfmFade .5s cubic-bezier(.22,1,.36,1) .28s both; }

  /* ── Logout red ── */
  .pfm-logout-d { color:rgba(248,113,113,.8) !important; }
  .pfm-logout-d:hover { background:rgba(239,68,68,.1) !important; color:#f87171 !important; }
  .pfm-logout-l { color:rgba(185,28,28,.75) !important; }
  .pfm-logout-l:hover { background:rgba(239,68,68,.07) !important; }

  /* ── Spin ── */
  @keyframes pfmSpin { to{transform:rotate(360deg)} }
  .pfm-spin { animation:pfmSpin 1s linear infinite; }

  @media(max-width:480px) {
    .pfm-col { padding-top:80px; padding-left:14px; padding-right:14px; }
    .pfm-card { padding:20px; }
  }
`;

/* ─── Helpers ─────────────────────────────────────────────────────────────── */
function InfoRow({ icon: Icon, label, value, accent, isDark }) {
  if (!value) return null;
  return (
    <div className={`pfm-row ${isDark ? "pfm-row-d" : "pfm-row-l"}`}>
      <div style={{
        width: 34, height: 34, borderRadius: 10, flexShrink: 0,
        background: `${accent}14`, border: `1px solid ${accent}25`,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <Icon style={{ width: 14, height: 14, color: accent }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 11, color: isDark ? "rgba(255,255,255,.35)" : "rgba(20,55,20,.4)",
          marginBottom: 1,
        }}>{label}</div>
        <div style={{
          fontSize: 13, fontWeight: 500,
          color: isDark ? "rgba(255,255,255,.82)" : "#1a3d20",
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>{value}</div>
      </div>
    </div>
  );
}

function StatBox({ value, label, accent, isDark }) {
  return (
    <div className={`pfm-stat ${isDark ? "pfm-stat-d" : "pfm-stat-l"}`}>
      <div style={{
        fontFamily: "'Syne',sans-serif", fontSize: "1.5rem", fontWeight: 800,
        color: accent, lineHeight: 1,
      }}>{value}</div>
      <div style={{
        fontSize: 11, fontWeight: 500,
        color: isDark ? "rgba(255,255,255,.4)" : "rgba(20,55,20,.5)",
      }}>{label}</div>
    </div>
  );
}

/* ─── Main Component ──────────────────────────────────────────────────────── */
export default function ProfileFarmer() {
  const { t }                = useTranslation();
  const { theme }            = useTheme();
  const { user, logout, loading: authLoading, getFarms, isAuthenticated } = useAuth();
  const navigate             = useNavigate();
  const isDark               = theme === "dark";

  const [farms, setFarms]     = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) { navigate("/login"); return; }
    getFarms?.()
      .then(d => setFarms(Array.isArray(d) ? d : []))
      .catch(() => setFarms([]))
      .finally(() => setLoading(false));
  }, [authLoading, isAuthenticated]);

  const handleLogout = async () => {
    await logout?.();
    navigate("/");
  };

  /* Loading */
  if (authLoading || loading) return (
    <>
      <style>{S}</style>
      <div className={`pfm ${isDark ? "pfm-d" : "pfm-l"}`}
        style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Loader2 className="pfm-spin" style={{ width: 28, height: 28, color: "#22c55e" }} />
      </div>
    </>
  );

  if (!user) return null;

  /* Derived values */
  const initials    = user.full_name?.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase() || "U";
  const photoSrc    = user.profile_photo
    ? (user.profile_photo.startsWith("http") ? user.profile_photo : `http://127.0.0.1:8000${user.profile_photo}`)
    : null;
  const totalArea   = farms.reduce((s, f) => s + parseFloat(f.area || 0), 0);
  const location    = [user.city, user.country].filter(Boolean).join(", ");

  /* Colors */
  const tc = isDark ? "rgba(255,255,255,.88)" : "#0f2d14";
  const sc = isDark ? "rgba(255,255,255,.38)" : "rgba(20,55,20,.45)";
  const card = `pfm-card ${isDark ? "pfm-card-d" : "pfm-card-l"}`;
  const act  = `pfm-action ${isDark ? "pfm-action-d" : "pfm-action-l"}`;

  const ACTIONS = [
    { to: "/settings", icon: Edit3,      label: t("profile.quickActions.managePastures", "Edit Profile"),    accent: "#22c55e" },
    { to: "/settings", icon: Settings,   label: t("nav.settings"),                                           accent: "#22d3ee" },
    { to: "/farms",    icon: LayoutGrid, label: t("nav.myFarms"),                                             accent: "#a78bfa" },
    { to: "/pastures", icon: Wheat,      label: t("nav.myPastures"),                                         accent: "#fbbf24" },
  ];

  return (
    <>
      <style>{S}</style>
      <div className={`pfm ${isDark ? "pfm-d" : "pfm-l"}`}>
        <Header />

        <div className="pfm-col">

          {/* ── Identity card ── */}
          <div className={`${card} pfm-a1`}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 18 }}>

              {/* Avatar */}
              <div className="pfm-av" role="img" aria-label={user.full_name || "Avatar"}>
                {photoSrc
                  ? <img src={photoSrc} alt={user.full_name || ""} onError={e => { e.target.style.display = "none"; }} />
                  : initials
                }
                <Link to="/settings" className="pfm-av-btn" aria-label={t("common.edit")}>
                  <Camera style={{ width: 18, height: 18, color: "#fff" }} />
                </Link>
              </div>

              {/* Name & role */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="pfm-chip" style={{ marginBottom: 8 }}>
                  {t("roles.farmer")}
                </div>
                <h1 style={{
                  fontFamily: "'Syne',sans-serif", fontWeight: 800,
                  fontSize: "clamp(1.25rem,5vw,1.65rem)",
                  color: tc, margin: 0, lineHeight: 1.15,
                  overflow: "hidden", textOverflow: "ellipsis",
                }}>
                  {user.full_name || t("common.user")}
                </h1>
                {location && (
                  <div style={{
                    display: "flex", alignItems: "center", gap: 4,
                    fontSize: 12, color: sc, marginTop: 5,
                  }}>
                    <MapPin style={{ width: 11, height: 11 }} />
                    {location}
                  </div>
                )}
              </div>
            </div>

            {/* Stats row */}
            <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
              <StatBox
                value={farms.length}
                label={t("profile.stats.farms")}
                accent="#22c55e"
                isDark={isDark}
              />
              <StatBox
                value={`${totalArea.toFixed(0)} ${t("common.hectares")}`}
                label={t("profile.stats.hectares")}
                accent="#22d3ee"
                isDark={isDark}
              />
            </div>
          </div>

          {/* ── Contact info ── */}
          <div className={`${card} pfm-a2`}>
            <div className="pfm-section-label" style={{ color: sc }}>
              {t("profile.contactInfo.title")}
            </div>

            <InfoRow
              icon={Mail}
              label="Email"
              value={user.email}
              accent="#22c55e"
              isDark={isDark}
            />
            <InfoRow
              icon={Phone}
              label={t("register.phone")}
              value={user.phone}
              accent="#22d3ee"
              isDark={isDark}
            />
            <InfoRow
              icon={MapPin}
              label={t("register.city")}
              value={location}
              accent="#a78bfa"
              isDark={isDark}
            />
          </div>

          {/* ── Quick actions ── */}
          <div className={`${card} pfm-a3`} style={{ padding: "12px 16px" }}>
            <div className="pfm-section-label" style={{ color: sc, padding: "8px 4px 6px" }}>
              {t("profile.quickActions.title")}
            </div>

            {ACTIONS.map(({ to, icon: Icon, label, accent }) => (
              <Link key={to + label} to={to} className={act}>
                <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
                  <div style={{
                    width: 30, height: 30, borderRadius: 9, flexShrink: 0,
                    background: `${accent}12`, border: `1px solid ${accent}22`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <Icon style={{ width: 13, height: 13, color: accent }} />
                  </div>
                  {label}
                </div>
                <ChevronRight style={{ width: 14, height: 14, color: sc, flexShrink: 0 }} />
              </Link>
            ))}

            <div className={isDark ? "pfm-div-d" : "pfm-div-l"} style={{ margin: "6px 0" }} />

            <button
              onClick={handleLogout}
              className={`${act} ${isDark ? "pfm-logout-d" : "pfm-logout-l"}`}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
                <div style={{
                  width: 30, height: 30, borderRadius: 9,
                  background: "rgba(239,68,68,.1)", border: "1px solid rgba(239,68,68,.2)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <LogOut style={{ width: 13, height: 13, color: "#f87171" }} />
                </div>
                {t("nav.logout")}
              </div>
            </button>
          </div>

          {/* ── Go to biomass CTA ── */}
          <div className="pfm-a4">
            <Link to="/biomass" className="pfm-btn-primary">
              <Wheat style={{ width: 16, height: 16 }} />
              {t("nav.biomass")}
            </Link>
          </div>

        </div>
      </div>
    </>
  );
}