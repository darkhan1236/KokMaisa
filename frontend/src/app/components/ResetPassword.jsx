// src/app/components/ResetPassword.jsx
// KokMaisa 2025 — Premium dark/light theme, full i18n (EN/RU/KK), XSS-safe, responsive

import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/contexts/ThemeContext";
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle, ArrowLeft, Leaf } from "lucide-react";

const STYLE = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500&display=swap');

  .rp-root { font-family:'DM Sans',sans-serif; min-height:100vh; display:flex; align-items:center; justify-content:center; position:relative; overflow:hidden; }
  .rp-dark  { background:radial-gradient(ellipse 80% 70% at 50% 30%,#0f2d1a 0%,#061309 55%,#030b05 100%); }
  .rp-light { background:radial-gradient(ellipse 80% 70% at 50% 30%,#c8edcc 0%,#e0f5e4 55%,#f5fcf2 100%); }

  .rp-card-dark  { background:rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.1); backdrop-filter:blur(24px); -webkit-backdrop-filter:blur(24px); }
  .rp-card-light { background:rgba(255,255,255,.92); border:1px solid rgba(34,197,94,.2); backdrop-filter:blur(20px); -webkit-backdrop-filter:blur(20px); box-shadow:0 20px 60px rgba(34,197,94,.12); }

  .rp-input-dark  { background:rgba(255,255,255,.07); border:1.5px solid rgba(255,255,255,.12); color:#fff; }
  .rp-input-dark:focus  { border-color:rgba(74,222,128,.55); box-shadow:0 0 0 3px rgba(74,222,128,.1); outline:none; }
  .rp-input-dark::placeholder  { color:rgba(255,255,255,.3); }

  .rp-input-light { background:rgba(255,255,255,.95); border:1.5px solid rgba(34,197,94,.25); color:#1a3d20; }
  .rp-input-light:focus { border-color:#16a34a; box-shadow:0 0 0 3px rgba(22,163,74,.12); outline:none; }
  .rp-input-light::placeholder { color:rgba(20,55,20,.35); }

  .rp-input-err-dark  { border-color:rgba(239,68,68,.5) !important; }
  .rp-input-err-light { border-color:rgba(239,68,68,.6) !important; }

  .rp-btn { background:linear-gradient(135deg,#22c55e 0%,#0d9488 100%); color:#fff; border:none; cursor:pointer; transition:transform .2s,box-shadow .2s; }
  .rp-btn:hover:not(:disabled) { transform:translateY(-2px) scale(1.02); box-shadow:0 10px 32px rgba(34,197,94,.4); }
  .rp-btn:disabled { opacity:.5; cursor:not-allowed; }

  @keyframes rpFadeUp {
    from { opacity:0; transform:translateY(30px); }
    to   { opacity:1; transform:translateY(0); }
  }
  .rp-anim   { animation:rpFadeUp .7s cubic-bezier(.22,1,.36,1) both; }
  .rp-anim-2 { animation:rpFadeUp .7s cubic-bezier(.22,1,.36,1) .15s both; }

  @keyframes rpPulse { 0%,100%{transform:scale(1);} 50%{transform:scale(1.05);} }
  .rp-pulse { animation:rpPulse 2s ease-in-out infinite; }

  .rp-label-dark  { color:rgba(255,255,255,.7); }
  .rp-label-light { color:rgba(20,55,20,.75); }
`;

export function ResetPassword() {
  const { t }        = useTranslation();
  const { theme }    = useTheme();
  const navigate     = useNavigate();
  const [params]     = useSearchParams();
  const isDark       = theme === "dark";
  const token        = params.get("token") || "";

  const [form, setForm]         = useState({ newPassword: "", confirmPassword: "" });
  const [show, setShow]         = useState({ new: false, confirm: false });
  const [status, setStatus]     = useState("idle"); // idle | loading | success | error | noToken
  const [errMsg, setErrMsg]     = useState("");
  const [fieldErr, setFieldErr] = useState({});

  useEffect(() => {
    if (!token) setStatus("noToken");
  }, [token]);

  const validate = () => {
    const errs = {};
    if (form.newPassword.length < 6)
      errs.newPassword = t("reset.passwordTooShort");
    if (form.newPassword !== form.confirmPassword)
      errs.confirmPassword = t("reset.passwordMismatch");
    setFieldErr(errs);
    return Object.keys(errs).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value.replace(/\0/g, "") }));
    setFieldErr(prev => ({ ...prev, [name]: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setStatus("loading");
    setErrMsg("");
    try {
      // ✅ Исправлено: /api/users/password-reset (было /api/auth/reset-password — 404)
      const res = await fetch("/api/users/password-reset", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ token, new_password: form.newPassword }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || t("reset.error"));
      }
      setStatus("success");
      setTimeout(() => navigate("/login"), 3000);
    } catch (err) {
      setStatus("error");
      setErrMsg(err.message || t("reset.error"));
    }
  };

  const bg     = isDark ? "rp-dark"       : "rp-light";
  const card   = isDark ? "rp-card-dark"  : "rp-card-light";
  const inp    = isDark ? "rp-input-dark" : "rp-input-light";
  const lbl    = isDark ? "rp-label-dark" : "rp-label-light";
  const errCls = isDark ? "rp-input-err-dark" : "rp-input-err-light";
  const titleC = isDark ? "#fff" : "#1a3d20";
  const subC   = isDark ? "rgba(255,255,255,.5)" : "rgba(20,55,20,.6)";
  const blob1  = isDark ? "rgba(34,197,94,.12)"  : "rgba(34,197,94,.2)";
  const blob2  = isDark ? "rgba(34,211,238,.08)" : "rgba(34,211,238,.12)";

  return (
    <>
      <style>{STYLE}</style>
      <div className={`rp-root ${bg} px-4`}>

        {/* Ambient blobs */}
        <div aria-hidden className="absolute rounded-full pointer-events-none"
          style={{ width:600, height:600, top:"-20%", right:"-15%",
            background:`radial-gradient(circle,${blob1} 0%,transparent 70%)`, filter:"blur(40px)" }} />
        <div aria-hidden className="absolute rounded-full pointer-events-none"
          style={{ width:400, height:400, bottom:"-10%", left:"-10%",
            background:`radial-gradient(circle,${blob2} 0%,transparent 70%)`, filter:"blur(50px)" }} />

        {/* Logo */}
        <div className="rp-anim absolute top-6 left-6 sm:left-8">
          <Link to="/" style={{ textDecoration:"none" }} className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background:"linear-gradient(135deg,#22c55e,#0d9488)" }}>
              <Leaf className="w-5 h-5 text-white" />
            </div>
            <span className="font-extrabold text-xl"
              style={{ fontFamily:"Syne,sans-serif", color: isDark?"#4ade80":"#16a34a" }}>
              KokMaisa
            </span>
          </Link>
        </div>

        {/* Card */}
        <div className={`rp-anim-2 ${card} relative z-10 w-full rounded-3xl px-6 py-10 sm:px-10 sm:py-12`}
          style={{ maxWidth:440 }}>

          {/* ── No token ── */}
          {status === "noToken" && (
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
                style={{ background:"rgba(239,68,68,.15)", border:"1px solid rgba(239,68,68,.25)" }}>
                <AlertCircle className="w-8 h-8 text-red-400" />
              </div>
              <h1 className="text-2xl font-bold mb-3"
                style={{ fontFamily:"Syne,sans-serif", color:titleC }}>
                {t("reset.tokenMissing")}
              </h1>
              <p className="text-sm mb-6" style={{ color:subC }}>
                {t("reset.error")}
              </p>
              <Link to="/login" className="inline-flex items-center gap-2 text-sm font-medium"
                style={{ color: isDark?"#4ade80":"#16a34a", textDecoration:"none" }}>
                <ArrowLeft className="w-4 h-4" />{t("reset.backToLogin")}
              </Link>
            </div>
          )}

          {/* ── Success ── */}
          {status === "success" && (
            <div className="text-center">
              <div className="rp-pulse w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
                style={{ background:"rgba(74,222,128,.15)", border:"1px solid rgba(74,222,128,.3)" }}>
                <CheckCircle className="w-8 h-8 text-emerald-400" />
              </div>
              <h1 className="text-2xl font-bold mb-3"
                style={{ fontFamily:"Syne,sans-serif", color:titleC }}>
                {t("common.success", "Success!")}
              </h1>
              <p className="text-sm leading-relaxed" style={{ color:subC }}>
                {t("reset.success")}
              </p>
            </div>
          )}

          {/* ── Form ── */}
          {(status === "idle" || status === "loading" || status === "error") && (
            <>
              <div className="mb-8">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
                  style={{ background:"linear-gradient(135deg,#22c55e,#0d9488)" }}>
                  <Lock className="w-7 h-7 text-white" />
                </div>
                <h1 className="text-3xl font-extrabold mb-2"
                  style={{ fontFamily:"Syne,sans-serif", color:titleC }}>
                  {t("reset.title")}
                </h1>
                <p className="text-sm" style={{ color:subC }}>
                  {t("login.resetInstructions")}
                </p>
              </div>

              {/* Error banner */}
              {status === "error" && errMsg && (
                <div className="rp-anim flex items-start gap-3 p-4 rounded-2xl mb-6"
                  style={{ background:"rgba(239,68,68,.1)", border:"1px solid rgba(239,68,68,.25)" }}>
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-400">{errMsg}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} noValidate>
                {/* New password */}
                <div className="mb-5">
                  <label className={`block text-sm font-medium mb-2 ${lbl}`}>
                    {t("reset.newPassword")}
                  </label>
                  <div className="relative">
                    <input
                      type={show.new ? "text" : "password"}
                      name="newPassword"
                      value={form.newPassword}
                      onChange={handleChange}
                      autoComplete="new-password"
                      className={`w-full rounded-2xl px-4 py-3 pr-12 text-sm transition-all ${inp} ${fieldErr.newPassword ? errCls : ""}`}
                      placeholder="••••••••"
                      maxLength={128}
                      required
                    />
                    <button type="button" tabIndex={-1}
                      onClick={() => setShow(s => ({ ...s, new: !s.new }))}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                      style={{ background:"none", border:"none", cursor:"pointer",
                        color: isDark?"rgba(255,255,255,.4)":"rgba(20,55,20,.4)", padding:4 }}
                      aria-label={show.new ? "Hide password" : "Show password"}>
                      {show.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {fieldErr.newPassword && (
                    <p className="text-red-400 text-xs mt-1.5">{fieldErr.newPassword}</p>
                  )}
                </div>

                {/* Confirm password */}
                <div className="mb-7">
                  <label className={`block text-sm font-medium mb-2 ${lbl}`}>
                    {t("reset.confirmPassword")}
                  </label>
                  <div className="relative">
                    <input
                      type={show.confirm ? "text" : "password"}
                      name="confirmPassword"
                      value={form.confirmPassword}
                      onChange={handleChange}
                      autoComplete="new-password"
                      className={`w-full rounded-2xl px-4 py-3 pr-12 text-sm transition-all ${inp} ${fieldErr.confirmPassword ? errCls : ""}`}
                      placeholder="••••••••"
                      maxLength={128}
                      required
                    />
                    <button type="button" tabIndex={-1}
                      onClick={() => setShow(s => ({ ...s, confirm: !s.confirm }))}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                      style={{ background:"none", border:"none", cursor:"pointer",
                        color: isDark?"rgba(255,255,255,.4)":"rgba(20,55,20,.4)", padding:4 }}
                      aria-label={show.confirm ? "Hide password" : "Show password"}>
                      {show.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {fieldErr.confirmPassword && (
                    <p className="text-red-400 text-xs mt-1.5">{fieldErr.confirmPassword}</p>
                  )}
                </div>

                <button type="submit" disabled={status === "loading"}
                  className="rp-btn w-full py-3.5 rounded-2xl font-semibold text-sm">
                  {status === "loading" ? t("common.saving") : t("reset.submit")}
                </button>
              </form>

              <div className="mt-6 text-center">
                <Link to="/login" className="inline-flex items-center gap-2 text-sm font-medium"
                  style={{ color: isDark?"rgba(255,255,255,.45)":"rgba(20,55,20,.5)", textDecoration:"none" }}>
                  <ArrowLeft className="w-4 h-4" />{t("reset.backToLogin")}
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}