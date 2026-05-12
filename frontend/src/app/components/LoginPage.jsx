// src/app/components/LoginPage.jsx
// KokMaisa 2025 — controls inside card, no fixed header

import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Eye, EyeOff, Leaf, ArrowRight, Mail, Lock, Sun, Moon, Globe } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import { apiErrorMessage } from "@/app/utils/apiErrors";

const STYLE = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500&display=swap');

  .lg-root {
    font-family:'DM Sans',sans-serif;
    min-height:100vh;
    display:flex;
    align-items:center;
    justify-content:center;
    padding:24px;
    transition:background .4s;
  }

  .lg-card { width:100%; max-width:420px; border-radius:28px; padding:36px 40px 44px; }
  .lg-card-d { background:rgba(255,255,255,.05); border:1px solid rgba(255,255,255,.1); backdrop-filter:blur(20px); }
  .lg-card-l { background:#fff; border:1px solid rgba(34,197,94,.18); box-shadow:0 8px 40px rgba(34,197,94,.1); }

  /* card top row: logo left, controls right */
  .card-toprow { display:flex; align-items:center; justify-content:space-between; margin-bottom:28px; }
  .card-controls { display:flex; align-items:center; gap:8px; }

  /* language dropdown */
  .lang-wrap { position:relative; }
  .lang-trigger { display:flex; align-items:center; justify-content:center; width:34px; height:34px; border-radius:9px; border:none; cursor:pointer; transition:background .2s,transform .2s; }
  .lang-trigger:hover { transform:scale(1.08); }
  .lang-trigger-d { background:rgba(255,255,255,.08); color:rgba(255,255,255,.72); }
  .lang-trigger-l { background:rgba(20,55,20,.07); color:#475569; }
  .lang-dropdown {
    position:absolute; right:0; top:calc(100% + 10px);
    display:flex; gap:6px; padding:8px; border-radius:14px;
    animation:lf .18s cubic-bezier(.22,1,.36,1) both;
    z-index:20;
  }
  .lang-dd-d { background:rgba(6,19,9,.97); border:1px solid rgba(255,255,255,.1); box-shadow:0 14px 38px rgba(0,0,0,.4); }
  .lang-dd-l { background:#fff; border:1px solid rgba(34,197,94,.18); box-shadow:0 10px 30px rgba(34,197,94,.12); }

  .lb { padding:4px 9px; border-radius:6px; font-size:11px; font-weight:700; letter-spacing:.04em; cursor:pointer; border:none; outline:none; transition:background .15s,color .15s; font-family:'DM Sans',sans-serif; }
  .lb-act-d { background:rgba(74,222,128,.18); color:#4ade80; }
  .lb-off-d { background:transparent; color:rgba(255,255,255,.35); }
  .lb-off-d:hover { color:rgba(255,255,255,.75); }
  .lb-act-l { background:rgba(22,163,74,.14); color:#16a34a; }
  .lb-off-l { background:transparent; color:rgba(20,55,20,.4); }
  .lb-off-l:hover { color:rgba(20,55,20,.8); }

  /* theme button */
  .tb { display:flex; align-items:center; justify-content:center; width:34px; height:34px; border-radius:9px; border:none; cursor:pointer; transition:background .2s,transform .2s; }
  .tb:hover { transform:rotate(18deg) scale(1.1); }
  .tb-d { background:rgba(255,255,255,.08); color:#fbbf24; }
  .tb-l { background:rgba(20,55,20,.07); color:#475569; }

  /* inputs */
  .fw { position:relative; }
  .fi { position:absolute; left:14px; top:50%; transform:translateY(-50%); pointer-events:none; }

  .id { width:100%; padding:13px 14px 13px 42px; border-radius:12px; background:rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.12); color:#fff; font-size:14px; outline:none; transition:border-color .2s; font-family:'DM Sans',sans-serif; }
  .id::placeholder { color:rgba(255,255,255,.3); }
  .id:focus { border-color:rgba(74,222,128,.5); box-shadow:0 0 0 3px rgba(74,222,128,.08); }

  .il { width:100%; padding:13px 14px 13px 42px; border-radius:12px; background:#f8fdf8; border:1px solid rgba(34,197,94,.25); color:#1a3d20; font-size:14px; outline:none; transition:border-color .2s; font-family:'DM Sans',sans-serif; }
  .il::placeholder { color:rgba(20,55,20,.35); }
  .il:focus { border-color:#22c55e; background:#fff; box-shadow:0 0 0 3px rgba(34,197,94,.1); }

  .lbd { font-size:12px; font-weight:600; color:rgba(255,255,255,.55); margin-bottom:6px; display:block; letter-spacing:.04em; }
  .lbl { font-size:12px; font-weight:600; color:rgba(20,55,20,.6);    margin-bottom:6px; display:block; letter-spacing:.04em; }

  /* submit */
  .bs { width:100%; padding:14px; border-radius:999px; border:none; cursor:pointer; background:linear-gradient(135deg,#22c55e 0%,#0d9488 100%); color:#fff; font-size:15px; font-weight:600; font-family:'DM Sans',sans-serif; transition:transform .2s,box-shadow .2s; display:flex; align-items:center; justify-content:center; gap:8px; }
  .bs:hover:not(:disabled) { transform:translateY(-2px); box-shadow:0 10px 30px rgba(34,197,94,.4); }
  .bs:disabled { opacity:.65; cursor:not-allowed; }

  /* reset modal */
  .mo { position:fixed; inset:0; background:rgba(0,0,0,.6); backdrop-filter:blur(4px); z-index:100; display:flex; align-items:center; justify-content:center; padding:24px; }
  .md { background:#061309; border:1px solid rgba(255,255,255,.12); border-radius:22px; padding:32px; width:100%; max-width:380px; }
  .ml { background:#fff; border:1px solid rgba(34,197,94,.2); border-radius:22px; padding:32px; width:100%; max-width:380px; box-shadow:0 20px 60px rgba(0,0,0,.15); }

  @keyframes lf { from{opacity:0;transform:translateY(16px);} to{opacity:1;transform:translateY(0);} }
  .lf { animation:lf .45s cubic-bezier(.22,1,.36,1) both; }

  @keyframes errSlide { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }
  .err-banner {
    animation:errSlide .3s cubic-bezier(.22,1,.36,1) both;
    padding:11px 15px; border-radius:12px; margin-bottom:16px;
    font-size:13px; display:flex; align-items:center; gap:8px;
  }
  .err-d { background:rgba(239,68,68,.12); border:1px solid rgba(239,68,68,.3); color:#fca5a5; }
  .err-l { background:rgba(239,68,68,.07); border:1px solid rgba(239,68,68,.25); color:#dc2626; }

  .ok-banner {
    animation:errSlide .3s cubic-bezier(.22,1,.36,1) both;
    padding:11px 15px; border-radius:12px; margin-bottom:12px;
    font-size:13px; display:flex; align-items:center; gap:8px;
  }
  .ok-d { background:rgba(74,222,128,.12); border:1px solid rgba(74,222,128,.25); color:#86efac; }
  .ok-l { background:rgba(22,163,74,.08); border:1px solid rgba(22,163,74,.25); color:#15803d; }

  @media(max-width:440px){
  .lg-card{ padding:24px 18px 32px; }
  }
  @media(max-width:380px){
    .lg-card{ padding:20px 14px 28px; }
    .card-toprow{ flex-wrap:wrap; row-gap:8px; }
    .card-controls{ margin-left:auto; }
    .lb{ padding:3px 6px; font-size:10px; }
    .tb{ width:28px; height:28px; }
  }
`;

const LANGS = [
  { code:"ru",  label:"RU"  },
  { code:"en",  label:"EN"  },
  { code:"kk",  label:"ҚАЗ" },
];

const langLabel = (code, label) => code === "kk" ? "KAZ" : label;

export function LoginPage() {
  const { t, i18n }   = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const { login }     = useAuth();
  const navigate      = useNavigate();
  const isDark        = theme === "dark";

  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPw,   setShowPw]   = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [apiError, setApiError] = useState("");

  const [forgot,       setForgot]       = useState(false);
  const [resetEmail,   setResetEmail]   = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMsg,     setResetMsg]     = useState("");
  const [langOpen,     setLangOpen]     = useState(false);
  const langRef = useRef(null);

  const cls = isDark ? "id" : "il";
  const ic  = isDark ? "rgba(255,255,255,.3)" : "rgba(20,55,20,.35)";

  useEffect(() => {
    if (!langOpen) return;
    const close = (e) => {
      if (langRef.current && !langRef.current.contains(e.target)) setLangOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [langOpen]);

  const changeLanguage = (code) => {
    i18n.changeLanguage(code);
    setLangOpen(false);
  };

  const submit = async () => {
    if (!email || !password) return;
    setLoading(true);
    setApiError("");
    try {
      const user = await login?.({ email, password });
      if (user?.account_type === "admin") navigate("/admin");
      else navigate("/farms");
    } catch (err) {
      const detail =
        err?.response?.data?.detail ||
        err?.detail ||
        err?.message ||
        null;
      setApiError(apiErrorMessage(detail || err, i18n));
    } finally {
      setLoading(false);
    }
  };

  const sendReset = async () => {
    if (!resetEmail) return;
    setResetLoading(true);
    setResetMsg("");
    try {
      const res = await fetch("/api/users/password-reset-request", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email: resetEmail }),
      });
      setResetMsg(res.ok ? t("login.resetEmailSent") : t("login.resetError"));
    } catch {
      setResetMsg(t("login.resetError"));
    } finally {
      setResetLoading(false);
    }
  };

  const bg = isDark
    ? "radial-gradient(ellipse 80% 70% at 60% 40%,#0f2d1a 0%,#061309 55%,#030b05 100%)"
    : "radial-gradient(ellipse 80% 70% at 60% 40%,#c8edcc 0%,#e0f5e4 55%,#f5fcf2 100%)";

  return (
    <>
      <style>{STYLE}</style>

      <div className="lg-root" style={{ background: bg }}>
        <div className={`lg-card lf ${isDark ? "lg-card-d" : "lg-card-l"}`}>

          {/* ── Card top row: logo + controls ── */}
          <div className="card-toprow">
            <Link to="/" className="flex items-center gap-2" style={{ textDecoration:"none" }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background:"linear-gradient(135deg,#22c55e,#0d9488)" }}>
                <Leaf className="w-4 h-4 text-white" />
              </div>
              <span className="font-extrabold text-base"
                style={{ fontFamily:"Syne,sans-serif", color: isDark?"#4ade80":"#16a34a" }}>
                KokMaisa
              </span>
            </Link>

            <div className="card-controls">
              <div className="lang-wrap" ref={langRef}>
                <button
                  type="button"
                  onClick={() => setLangOpen(v => !v)}
                  className={`lang-trigger ${isDark ? "lang-trigger-d" : "lang-trigger-l"}`}
                  aria-label="Change language"
                >
                  <Globe className="w-4 h-4" />
                </button>
                {langOpen && (
                  <div className={`lang-dropdown ${isDark ? "lang-dd-d" : "lang-dd-l"}`}>
                    {LANGS.map(({ code, label }) => (
                      <button
                        key={code}
                        onClick={() => changeLanguage(code)}
                        className={`lb ${i18n.language === code
                          ? (isDark ? "lb-act-d" : "lb-act-l")
                          : (isDark ? "lb-off-d" : "lb-off-l")
                        }`}
                      >
                        {langLabel(code, label)}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button
                onClick={toggleTheme}
                className={`tb ${isDark ? "tb-d" : "tb-l"}`}
                aria-label="Toggle theme"
              >
                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* ── Heading ── */}
          <h1 className="text-2xl font-extrabold mb-1"
            style={{ fontFamily:"Syne,sans-serif", color: isDark?"#fff":"#1a3d20" }}>
            {t("login.title")}
          </h1>
          <p className="text-sm mb-8"
            style={{ color: isDark?"rgba(255,255,255,.45)":"rgba(20,55,20,.55)" }}>
            {t("login.welcome")}
          </p>

          {/* Error banner */}
          {apiError && (
            <div className={`err-banner ${isDark ? "err-d" : "err-l"}`}>
              <span>⚠</span>
              <span>{apiError}</span>
            </div>
          )}

          <div className="space-y-4">
            {/* Email */}
            <div>
              <label className={isDark ? "lbd" : "lbl"}>{t("login.email")}</label>
              <div className="fw">
                <Mail className="fi w-4 h-4" style={{ color:ic }} />
                <input
                  className={cls}
                  value={email}
                  type="email"
                  onChange={e => { setEmail(e.target.value); setApiError(""); }}
                  onKeyDown={e => e.key === "Enter" && submit()}
                  placeholder={t("login.emailPlaceholder")}
                  maxLength={255}
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className={isDark ? "lbd" : "lbl"} style={{ margin:0 }}>
                  {t("login.password")}
                </label>
                <button
                  type="button"
                  onClick={() => setForgot(true)}
                  style={{ fontSize:12, color: isDark?"rgba(74,222,128,.8)":"#16a34a", background:"none", border:"none", cursor:"pointer" }}
                >
                  {t("login.forgotPassword")}
                </button>
              </div>
              <div className="fw">
                <Lock className="fi w-4 h-4" style={{ color:ic }} />
                <input
                  className={cls}
                  value={password}
                  type={showPw ? "text" : "password"}
                  onChange={e => { setPassword(e.target.value); setApiError(""); }}
                  onKeyDown={e => e.key === "Enter" && submit()}
                  placeholder={t("login.passwordPlaceholder")}
                  style={{ paddingRight:40 }}
                  maxLength={128}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", color:ic, background:"none", border:"none", cursor:"pointer" }}
                  aria-label="Toggle password visibility"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          <button className="bs mt-8" onClick={submit} disabled={loading}>
            {loading
              ? t("common.loading")
              : <>{t("login.submitButton")} <ArrowRight className="w-4 h-4" /></>
            }
          </button>

          <p className="text-center text-sm mt-5"
            style={{ color: isDark?"rgba(255,255,255,.4)":"rgba(20,55,20,.5)" }}>
            {t("login.noAccount")}{" "}
            <Link to="/register"
              style={{ color: isDark?"#4ade80":"#16a34a", fontWeight:600, textDecoration:"none" }}>
              {t("login.registerLink")}
            </Link>
          </p>
        </div>
      </div>

      {/* ── Forgot password modal ── */}
      {forgot && (
        <div className="mo" onClick={e => e.target === e.currentTarget && setForgot(false)}>
          <div className={`${isDark ? "md" : "ml"} lf`}>
            <h3 className="text-lg font-bold mb-2"
              style={{ fontFamily:"Syne,sans-serif", color: isDark?"#fff":"#1a3d20" }}>
              {t("login.resetPassword")}
            </h3>
            <p className="text-sm mb-5"
              style={{ color: isDark?"rgba(255,255,255,.45)":"rgba(20,55,20,.55)" }}>
              {t("login.resetInstructions")}
            </p>

            <div className="fw mb-4">
              <Mail className="fi w-4 h-4" style={{ color:ic }} />
              <input
                className={cls}
                value={resetEmail}
                type="email"
                onChange={e => setResetEmail(e.target.value)}
                placeholder={t("login.emailPlaceholder")}
                maxLength={255}
              />
            </div>

            {resetMsg && (
              <div className={`ok-banner ${isDark ? "ok-d" : "ok-l"}`}>
                <span>✓</span>
                <span>{resetMsg}</span>
              </div>
            )}

            <div className="flex gap-3 mt-2">
              <button
                onClick={() => { setForgot(false); setResetMsg(""); setResetEmail(""); }}
                style={{
                  flex:1, padding:"10px", borderRadius:"12px",
                  border: isDark?"1px solid rgba(255,255,255,.15)":"1px solid rgba(34,197,94,.25)",
                  background:"transparent",
                  color: isDark?"rgba(255,255,255,.6)":"rgba(20,55,20,.6)",
                  cursor:"pointer", fontSize:14, fontFamily:"'DM Sans',sans-serif",
                }}
              >
                {t("common.cancel")}
              </button>
              <button
                onClick={sendReset}
                disabled={resetLoading}
                style={{
                  flex:1, padding:"10px", borderRadius:"12px", border:"none",
                  background:"linear-gradient(135deg,#22c55e,#0d9488)",
                  color:"#fff", cursor:"pointer", fontSize:14,
                  fontWeight:600, fontFamily:"'DM Sans',sans-serif",
                  opacity: resetLoading ? .65 : 1,
                }}
              >
                {resetLoading ? "..." : t("login.sendResetLink")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
