// src/app/components/Header.jsx
// KokMaisa 2025 — Полное меню пользователя, светлая/тёмная тема, адаптив

import { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Menu, X, Sun, Moon, Globe, ChevronDown,
  LogOut, User, LayoutDashboard, Map,
  Wheat, LandPlot, Leaf, MessageSquareText,
  Settings, BarChart3, Plane,
} from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";

const HEADER_STYLE = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&display=swap');

  @keyframes letterDrop {
    from { opacity:0; transform:translateY(-10px) skewX(-5deg); }
    to   { opacity:1; transform:translateY(0) skewX(0deg); }
  }
  @keyframes glowCycle {
    0%,100% { filter:drop-shadow(0 0 0px transparent); }
    50%      { filter:drop-shadow(0 0 8px rgba(74,222,128,.5)); }
  }
  @keyframes slideDown {
    from { transform:translateY(-100%); opacity:0; }
    to   { transform:translateY(0);     opacity:1; }
  }
  @keyframes dropIn {
    from { opacity:0; transform:translateY(-8px) scale(.96); }
    to   { opacity:1; transform:translateY(0)    scale(1); }
  }

  .header-slide { animation:slideDown .5s cubic-bezier(.22,1,.36,1) both; }
  .logo-ch {
    display:inline-block;
    font-family:'Syne',sans-serif;
    font-weight:800;
    animation:letterDrop .45s cubic-bezier(.22,1,.36,1) both, glowCycle 4s ease-in-out 1s infinite;
  }

  /* ── Dark scrolled ── */
  .hd-scrolled {
    background:rgba(5,16,7,.92) !important;
    border-bottom:1px solid rgba(74,222,128,.13) !important;
    backdrop-filter:blur(22px);-webkit-backdrop-filter:blur(22px);
  }
  /* ── Light scrolled ── */
  .hl-scrolled {
    background:rgba(244,251,245,.96) !important;
    border-bottom:1px solid rgba(34,197,94,.2) !important;
    backdrop-filter:blur(22px);-webkit-backdrop-filter:blur(22px);
    box-shadow:0 2px 20px rgba(34,197,94,.08);
  }

  /* Nav links */
  .nl-dark  { color:rgba(255,255,255,.6);font-size:14px;font-weight:500;text-decoration:none;position:relative;transition:color .2s; }
  .nl-light { color:rgba(20,55,20,.65);font-size:14px;font-weight:500;text-decoration:none;position:relative;transition:color .2s; }
  .nl-dark::after,.nl-light::after { content:'';position:absolute;bottom:-3px;left:0;width:0;height:1.5px;transition:width .25s; }
  .nl-dark::after  { background:#4ade80; }
  .nl-light::after { background:#16a34a; }
  .nl-dark:hover   { color:#fff; }
  .nl-light:hover  { color:#166534; }
  .nl-dark:hover::after,.nl-light:hover::after { width:100%; }

  /* Lang buttons */
  .lb { padding:3px 9px;border-radius:6px;font-size:11px;font-weight:700;letter-spacing:.04em;cursor:pointer;border:none;outline:none;transition:background .18s,color .18s; }
  .lb-ad { background:rgba(74,222,128,.18);color:#4ade80; }
  .lb-id { background:transparent;color:rgba(255,255,255,.35); }
  .lb-id:hover { color:rgba(255,255,255,.75); }
  .lb-al { background:rgba(22,163,74,.14);color:#16a34a; }
  .lb-il { background:transparent;color:rgba(20,55,20,.4); }
  .lb-il:hover { color:rgba(20,55,20,.8); }

  /* Theme btn */
  .tb { display:flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:9px;border:none;cursor:pointer;transition:background .2s,transform .2s; }
  .tb:hover { transform:rotate(16deg) scale(1.08); }
  .tb-d { background:rgba(255,255,255,.08);color:#fbbf24; }
  .tb-l { background:rgba(20,55,20,.08);color:#64748b; }

  /* Register btn */
  .rb-d { background:linear-gradient(135deg,#22c55e,#0d9488);color:#fff;font-weight:600;font-size:13px;padding:7px 18px;border-radius:999px;text-decoration:none;transition:transform .2s,box-shadow .2s;white-space:nowrap; }
  .rb-d:hover { transform:translateY(-1px);box-shadow:0 6px 20px rgba(34,197,94,.35); }
  .rb-l { background:linear-gradient(135deg,#16a34a,#0d9488);color:#fff;font-weight:600;font-size:13px;padding:7px 18px;border-radius:999px;text-decoration:none;transition:transform .2s,box-shadow .2s;white-space:nowrap; }
  .rb-l:hover { transform:translateY(-1px);box-shadow:0 6px 20px rgba(22,163,74,.3); }

  /* User avatar */
  .user-avatar {
    width:34px;height:34px;border-radius:50%;overflow:hidden;flex-shrink:0;
    background:linear-gradient(135deg,#22c55e,#0d9488);
    display:flex;align-items:center;justify-content:center;
    font-size:13px;font-weight:700;color:#fff;font-family:'Syne',sans-serif;
  }
  .user-avatar img { width:100%;height:100%;object-fit:cover; }

  .user-btn-d { display:flex;align-items:center;gap:8px;padding:4px 10px 4px 4px;border-radius:999px;cursor:pointer;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.12);transition:background .2s;border:none; }
  .user-btn-d:hover { background:rgba(255,255,255,.13); }
  .user-btn-l { display:flex;align-items:center;gap:8px;padding:4px 10px 4px 4px;border-radius:999px;cursor:pointer;background:rgba(22,163,74,.09);border:1px solid rgba(22,163,74,.2);transition:background .2s; }
  .user-btn-l:hover { background:rgba(22,163,74,.16); }

  /* Dropdown */
  .user-dropdown {
    position:absolute;right:0;top:calc(100% + 10px);
    min-width:240px;border-radius:18px;overflow:hidden;
    animation:dropIn .22s cubic-bezier(.22,1,.36,1) both;
    z-index:200;
  }
  .ud-d { background:rgba(6,19,9,.97);border:1px solid rgba(255,255,255,.1);backdrop-filter:blur(24px);box-shadow:0 16px 48px rgba(0,0,0,.5); }
  .ud-l { background:#fff;border:1px solid rgba(34,197,94,.18);backdrop-filter:blur(20px);box-shadow:0 8px 40px rgba(34,197,94,.12); }

  .ud-header-d { background:rgba(255,255,255,.05);border-bottom:1px solid rgba(255,255,255,.07); }
  .ud-header-l { background:rgba(34,197,94,.05);border-bottom:1px solid rgba(34,197,94,.12); }

  .ud-item { display:flex;align-items:center;gap:10px;padding:10px 16px;text-decoration:none;font-size:13px;font-weight:500;transition:background .15s;cursor:pointer;border:none;width:100%;text-align:left;background:transparent; }
  .ud-item-d { color:rgba(255,255,255,.72); }
  .ud-item-d:hover { background:rgba(255,255,255,.07);color:#fff; }
  .ud-item-l { color:rgba(20,55,20,.75); }
  .ud-item-l:hover { background:rgba(22,163,74,.07);color:#166534; }
  .ud-sep-d { height:1px;background:rgba(255,255,255,.07);margin:3px 0; }
  .ud-sep-l { height:1px;background:rgba(34,197,94,.12);margin:3px 0; }
  .ud-badge { display:inline-block;padding:2px 8px;border-radius:999px;font-size:10px;font-weight:600;letter-spacing:.04em; }

  /* Mobile menu */
  .mm-d { background:rgba(4,13,6,.97);border-top:1px solid rgba(74,222,128,.1);backdrop-filter:blur(24px); }
  .mm-l { background:rgba(245,252,246,.98);border-top:1px solid rgba(34,197,94,.2);backdrop-filter:blur(24px);box-shadow:0 8px 24px rgba(34,197,94,.08); }

  .mm-link-d { display:flex;align-items:center;gap:10px;padding:11px 14px;border-radius:12px;text-decoration:none;font-size:14px;font-weight:500;color:rgba(255,255,255,.7);transition:background .15s,color .15s; }
  .mm-link-d:hover { background:rgba(255,255,255,.07);color:#fff; }
  .mm-link-l { display:flex;align-items:center;gap:10px;padding:11px 14px;border-radius:12px;text-decoration:none;font-size:14px;font-weight:500;color:rgba(20,55,20,.7);transition:background .15s,color .15s; }
  .mm-link-l:hover { background:rgba(22,163,74,.08);color:#166534; }
`;

function AnimatedLogo({ isDark }) {
  return (
    <Link to="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 1 }}>
      {"KokMaisa".split("").map((ch, i) => (
        <span key={i} className="logo-ch" style={{
          animationDelay: `${i * 0.055}s`,
          fontSize: "1.35rem", lineHeight: 1,
          color: i < 3
            ? (isDark ? "#4ade80" : "#16a34a")
            : i < 7
            ? (isDark ? "rgba(255,255,255,.9)" : "rgba(15,50,15,.85)")
            : (isDark ? "#22d3ee" : "#0891b2"),
        }}>{ch}</span>
      ))}
    </Link>
  );
}

const LANGS = [
  { code: "en", label: "EN" },
  { code: "ru", label: "RU" },
  { code: "kk", label: "ҚАЗ" },
];

function UserAvatar({ user, size = 34 }) {
  const initials = user?.full_name
    ? user.full_name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase()
    : (user?.email?.[0]?.toUpperCase() ?? "U");

  if (user?.profile_photo) {
    return (
      <div className="user-avatar" style={{ width: size, height: size }}>
        <img
          src={user.profile_photo.startsWith("http") ? user.profile_photo : `http://127.0.0.1:8000${user.profile_photo}`}
          alt={user.full_name || ""}
          onError={(e) => { e.target.style.display = "none"; }}
        />
      </div>
    );
  }
  return (
    <div className="user-avatar" style={{ width: size, height: size, fontSize: size * 0.38 }}>
      {initials}
    </div>
  );
}

export default function Header() {
  const { t, i18n } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isDark = theme === "dark";
  const isHomePage = location.pathname === "/";

  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    fn();
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  useEffect(() => { setMenuOpen(false); setUserOpen(false); }, [location.pathname]);

  useEffect(() => {
    if (!userOpen) return;
    const fn = (e) => { if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setUserOpen(false); };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, [userOpen]);

  function handleNavClick(e, href) {
    if (isHomePage && href.startsWith("#")) {
      e.preventDefault();
      document.getElementById(href.slice(1))?.scrollIntoView({ behavior: "smooth" });
    }
    setMenuOpen(false);
  }

  async function handleLogout() {
    setUserOpen(false);
    setMenuOpen(false);
    await logout?.();
    navigate("/");
  }

 function getProfilePath() {
  return user?.account_type === "admin" ? "/admin" : "/profile/farmer";
}

  const isAdmin = user?.account_type === "admin";

  // ── Полное меню пользователя (восстановлено как в оригинале) ──
 const userMenuItems = user ? [
  { label: t("nav.myFarms"), icon: LandPlot, href: "/farms", accent: isDark?"#4ade80":"#16a34a" },
  { label: t("nav.myPastures"), icon: Wheat, href: "/pastures", accent: isDark?"#4ade80":"#16a34a" },
  { label: t("nav.myDrones"), icon: Plane, href: "/drones", accent: isDark?"#4ade80":"#16a34a" },
  { label: t("nav.biomass"), icon: Leaf, href: "/biomass", accent: isDark?"#fbbf24":"#d97706" },
  { type: "divider" },
  { label: t("nav.biomassDashboard"), icon: BarChart3, href: "/biomass-dashboard", accent: isDark?"#fbbf24":"#d97706" },
  { type: "divider" },
  { label: t("nav.aiConsultant"), icon: MessageSquareText, href: "/ai-chat", accent: isDark?"#60a5fa":"#2563eb" },
  ...(isAdmin ? [{ label: "Admin Panel", icon: LayoutDashboard, href: "/admin", accent: isDark?"#a78bfa":"#7c3aed" }] : []),
  { label: t("nav.settings"), icon: Settings, href: "/settings", accent: isDark?"rgba(255,255,255,.4)":"rgba(20,55,20,.4)" },
] : [];

  const navLinks = [
    { label: t("nav.about"),       href: "#about" },
    { label: t("nav.howItWorks"),  href: "#how-it-works" },
    { label: t("nav.features"),    href: "#features" },
    { label: t("nav.useCases"),    href: "#use-cases" },
  ];

  const nl = isDark ? "nl-dark" : "nl-light";
  const scrolledCls = scrolled ? (isDark ? "hd-scrolled" : "hl-scrolled") : "";
  const transparentStyle = scrolled ? {} : {
    background: isDark
      ? "linear-gradient(to bottom,rgba(3,11,5,.7) 0%,transparent 100%)"
      : "linear-gradient(to bottom,rgba(240,250,242,.65) 0%,transparent 100%)",
  };

  const nameColor = isDark ? "rgba(255,255,255,.85)" : "rgba(15,50,15,.85)";
  const chevronColor = isDark ? "rgba(255,255,255,.4)" : "rgba(15,50,15,.4)";

  return (
    <>
      <style>{HEADER_STYLE}</style>
      <header
        className={`header-slide fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolledCls}`}
        style={{ ...transparentStyle, zIndex: 1200 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">

            {/* Logo */}
            <AnimatedLogo isDark={isDark} />

            {/* Desktop nav – only on home */}
            {isHomePage && (
              <nav className="hidden md:flex items-center gap-6">
                {navLinks.map(({ href, label }) => (
                  <a key={href} href={href} onClick={e => handleNavClick(e, href)} className={nl}>{label}</a>
                ))}
              </nav>
            )}

            {/* Desktop right block */}
            <div className="hidden md:flex items-center gap-2.5">

              {/* Language switcher */}
              <div className="flex items-center gap-0.5" style={{
                background: isDark ? "rgba(255,255,255,.05)" : "rgba(20,55,20,.05)",
                borderRadius: 8, padding: "2px 3px",
              }}>
                <Globe className="w-3 h-3 mx-1" style={{ color: isDark ? "rgba(255,255,255,.3)" : "rgba(20,55,20,.3)" }} />
                {LANGS.map(({ code, label }) => (
                  <button key={code} onClick={() => i18n.changeLanguage(code)}
                    className={`lb ${i18n.language === code ? (isDark ? "lb-ad" : "lb-al") : (isDark ? "lb-id" : "lb-il")}`}>
                    {label}
                  </button>
                ))}
              </div>

              {/* Theme */}
              <button onClick={toggleTheme} className={`tb ${isDark ? "tb-d" : "tb-l"}`} aria-label="Toggle theme">
                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>

              {/* Auth block */}
              {user ? (
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setUserOpen(v => !v)}
                    className={isDark ? "user-btn-d" : "user-btn-l"}
                  >
                    <UserAvatar user={user} />
                    <span className="text-xs font-semibold max-w-[90px] truncate" style={{ color: nameColor }}>
                      {user.full_name?.split(" ")[0] || t("nav.profile")}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 flex-shrink-0 transition-transform duration-200"
                      style={{ color: chevronColor, transform: userOpen ? "rotate(180deg)" : "" }} />
                  </button>

                  {userOpen && (
                    <div className={`user-dropdown ${isDark ? "ud-d" : "ud-l"}`}>
                      {/* Header */}
                      <div className={`px-4 py-3 ${isDark ? "ud-header-d" : "ud-header-l"}`}>
                        <div className="flex items-center gap-3">
                          <UserAvatar user={user} size={40} />
                          <div className="min-w-0">
                            <div className="text-sm font-bold truncate" style={{ color: isDark ? "#fff" : "#1a3d20" }}>
                              {user.full_name || t("common.user")}
                            </div>
                            <div className="text-xs truncate" style={{ color: isDark ? "rgba(255,255,255,.35)" : "rgba(15,50,15,.45)" }}>
                              {user.email}
                            </div>
                            <div className="mt-1">
                              <span className="ud-badge" style={{
                                background: isDark ? "rgba(74,222,128,.15)" : "rgba(22,163,74,.1)",
                                color: isDark ? "#4ade80" : "#15803d",
                              }}>
                                {t(`roles.${user.account_type}`, user.account_type)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Items */}
                      <div className="py-1 max-h-72 overflow-y-auto">
                        {userMenuItems.map((item, i) =>
                          item.type === "divider" ? (
                            <div key={i} className={isDark ? "ud-sep-d" : "ud-sep-l"} />
                          ) : (
                            <Link key={i} to={item.href}
                              onClick={() => setUserOpen(false)}
                              className={`ud-item ${isDark ? "ud-item-d" : "ud-item-l"}`}
                            >
                              <item.icon className="w-4 h-4 flex-shrink-0" style={{ color: item.accent }} />
                              <span>{item.label}</span>
                            </Link>
                          )
                        )}
                        <div className={isDark ? "ud-sep-d" : "ud-sep-l"} />
                        <button onClick={handleLogout}
                          className={`ud-item ${isDark ? "ud-item-d" : "ud-item-l"}`}
                          style={{ color: isDark ? "rgba(248,113,113,.85)" : "rgba(185,28,28,.75)" }}
                        >
                          <LogOut className="w-4 h-4 flex-shrink-0" />
                          {t("nav.logout")}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <a href="/login" className={nl}>{t("nav.login")}</a>
                  <Link to="/register" className={isDark ? "rb-d" : "rb-l"}>{t("nav.register")}</Link>
                </>
              )}
            </div>

            {/* Hamburger */}
            <button
              className="md:hidden p-2 rounded-lg"
              style={{ color: isDark ? "rgba(255,255,255,.75)" : "rgba(20,55,20,.8)", background: "transparent", border: "none", cursor: "pointer" }}
              onClick={() => setMenuOpen(v => !v)}
              aria-label="Menu"
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* ── Mobile menu ── */}
        {menuOpen && (
          <div className={`md:hidden ${isDark ? "mm-d" : "mm-l"} px-4 py-5`}>

            {/* Nav links – only on home */}
            {isHomePage && (
              <nav className="space-y-1 mb-4">
                {navLinks.map(({ href, label }) => (
                  <a key={href} href={href} onClick={e => handleNavClick(e, href)}
                    className={isDark ? "mm-link-d" : "mm-link-l"}>
                    {label}
                  </a>
                ))}
              </nav>
            )}

            <div style={{ borderTop: isDark ? "1px solid rgba(255,255,255,.07)" : "1px solid rgba(34,197,94,.12)", paddingTop: 14 }}>
              {/* Lang + theme */}
              <div className="flex items-center gap-2 mb-4 flex-wrap">
                {LANGS.map(({ code, label }) => (
                  <button key={code} onClick={() => i18n.changeLanguage(code)}
                    className={`lb ${i18n.language === code ? (isDark ? "lb-ad" : "lb-al") : (isDark ? "lb-id" : "lb-il")}`}>
                    {label}
                  </button>
                ))}
                <button onClick={toggleTheme} className={`tb ml-auto ${isDark ? "tb-d" : "tb-l"}`}>
                  {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </button>
              </div>

              {user ? (
                <div>
                  {/* User info */}
                  <div className="flex items-center gap-3 mb-3 px-2 py-2 rounded-xl"
                    style={{ background: isDark ? "rgba(255,255,255,.04)" : "rgba(34,197,94,.06)" }}>
                    <UserAvatar user={user} size={44} />
                    <div className="min-w-0">
                      <div className="text-sm font-bold truncate" style={{ color: isDark ? "#fff" : "#1a3d20" }}>
                        {user.full_name || t("common.user")}
                      </div>
                      <div className="text-xs truncate" style={{ color: isDark ? "rgba(255,255,255,.4)" : "rgba(15,50,15,.5)" }}>
                        {user.email}
                      </div>
                      <span className="ud-badge" style={{
                        background: isDark ? "rgba(74,222,128,.15)" : "rgba(22,163,74,.1)",
                        color: isDark ? "#4ade80" : "#15803d",
                        marginTop: 3, display: "inline-block",
                      }}>
                        {t(`roles.${user.account_type}`, user.account_type)}
                      </span>
                    </div>
                  </div>

                  {/* All nav items */}
                  <div className="space-y-0.5 max-h-64 overflow-y-auto">
                    {userMenuItems.map((item, i) =>
                      item.type === "divider" ? (
                        <div key={i} className={isDark ? "ud-sep-d" : "ud-sep-l"} style={{ margin: "4px 0" }} />
                      ) : (
                        <Link key={i} to={item.href}
                          onClick={() => setMenuOpen(false)}
                          className={isDark ? "mm-link-d" : "mm-link-l"}
                        >
                          <item.icon className="w-4 h-4 flex-shrink-0" style={{ color: item.accent }} />
                          {item.label}
                        </Link>
                      )
                    )}
                    <div className={isDark ? "ud-sep-d" : "ud-sep-l"} style={{ margin: "4px 0" }} />
                    <button onClick={handleLogout}
                      className={isDark ? "mm-link-d" : "mm-link-l"}
                      style={{ color: isDark ? "rgba(248,113,113,.85)" : "rgba(185,28,28,.75)", border: "none", background: "transparent", width: "100%", cursor: "pointer" }}
                    >
                      <LogOut className="w-4 h-4 flex-shrink-0" />
                      {t("nav.logout")}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-3">
                  <Link to="/login" onClick={() => setMenuOpen(false)}
                    className="flex-1 text-center py-2.5 rounded-full text-sm font-medium"
                    style={{
                      textDecoration: "none",
                      color: isDark ? "rgba(255,255,255,.7)" : "#4b7a4b",
                      border: isDark ? "1px solid rgba(255,255,255,.16)" : "1px solid rgba(34,197,94,.3)",
                    }}>
                    {t("nav.login")}
                  </Link>
                  <Link to="/register" onClick={() => setMenuOpen(false)}
                    className={`flex-1 text-center py-2.5 rounded-full text-sm ${isDark ? "rb-d" : "rb-l"}`}>
                    {t("nav.register")}
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </header>
    </>
  );
}