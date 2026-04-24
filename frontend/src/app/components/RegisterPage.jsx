// src/app/components/RegisterPage.jsx
// KokMaisa 2025 — controls inside card, no fixed header

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Eye, EyeOff, Leaf, ArrowRight, User, Mail, Phone, Lock, MapPin, AlertCircle, Sun, Moon, Globe } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";

const STYLE = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500&display=swap');

  .reg-root { font-family:'DM Sans',sans-serif; min-height:100vh; display:flex; }

  .reg-left {
    flex:0 0 420px;
    background:linear-gradient(160deg,#061309 0%,#071a0c 60%,#071218 100%);
    display:flex; flex-direction:column; justify-content:center;
    padding:56px 48px; position:relative; overflow:hidden;
  }
  .reg-left::before { content:''; position:absolute; width:500px; height:500px; border-radius:50%; background:radial-gradient(circle,rgba(34,197,94,.15) 0%,transparent 70%); top:-150px; right:-150px; }
  .reg-left::after  { content:''; position:absolute; width:300px; height:300px; border-radius:50%; background:radial-gradient(circle,rgba(34,211,238,.1) 0%,transparent 70%);  bottom:-80px; left:-80px; }
  @media(max-width:900px){ .reg-left{ display:none; } }

  .reg-right{ flex:1; display:flex; align-items:center; justify-content:center; padding:32px 24px; overflow-y:auto; }

  .reg-card{ width:100%; max-width:480px; border-radius:28px; padding:36px 40px 40px; }
  .reg-card-d{ background:rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.1); }
  .reg-card-l{ background:#fff; border:1px solid rgba(34,197,94,.18); box-shadow:0 8px 40px rgba(34,197,94,.1); }

  /* card top row */
  .card-toprow { display:flex; align-items:center; justify-content:space-between; margin-bottom:24px; }
  .card-controls { display:flex; align-items:center; gap:8px; }

  /* language pill */
  .lang-pill-d { display:flex; align-items:center; gap:1px; background:rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.1); border-radius:8px; padding:2px 4px; }
  .lang-pill-l { display:flex; align-items:center; gap:1px; background:rgba(20,55,20,.05); border:1px solid rgba(34,197,94,.2); border-radius:8px; padding:2px 4px; }
  .lb  { padding:4px 9px; border-radius:6px; font-size:11px; font-weight:700; letter-spacing:.04em; cursor:pointer; border:none; outline:none; transition:background .15s,color .15s; font-family:'DM Sans',sans-serif; }
  .lb-act-d { background:rgba(74,222,128,.18); color:#4ade80; }
  .lb-off-d { background:transparent; color:rgba(255,255,255,.35); }
  .lb-off-d:hover { color:rgba(255,255,255,.75); }
  .lb-act-l { background:rgba(22,163,74,.14); color:#16a34a; }
  .lb-off-l { background:transparent; color:rgba(20,55,20,.4); }
  .lb-off-l:hover { color:rgba(20,55,20,.8); }
  .tb  { display:flex; align-items:center; justify-content:center; width:34px; height:34px; border-radius:9px; border:none; cursor:pointer; transition:background .2s,transform .2s; }
  .tb:hover { transform:rotate(18deg) scale(1.1); }
  .tb-d { background:rgba(255,255,255,.08); color:#fbbf24; }
  .tb-l { background:rgba(20,55,20,.07); color:#475569; }

  .fwrap{ position:relative; }
  .ficon{ position:absolute; left:14px; top:50%; transform:translateY(-50%); pointer-events:none; }

  .inp-d{ width:100%; padding:12px 14px 12px 42px; border-radius:12px; background:rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.12); color:#fff; font-size:14px; outline:none; transition:border-color .2s,background .2s; font-family:'DM Sans',sans-serif; }
  .inp-d::placeholder{ color:rgba(255,255,255,.3); }
  .inp-d:focus{ border-color:rgba(74,222,128,.5); background:rgba(255,255,255,.09); }
  .inp-d.err{ border-color:rgba(239,68,68,.5); }

  .inp-l{ width:100%; padding:12px 14px 12px 42px; border-radius:12px; background:#f8fdf8; border:1px solid rgba(34,197,94,.25); color:#1a3d20; font-size:14px; outline:none; transition:border-color .2s,background .2s; font-family:'DM Sans',sans-serif; }
  .inp-l::placeholder{ color:rgba(20,55,20,.35); }
  .inp-l:focus{ border-color:#22c55e; background:#fff; box-shadow:0 0 0 3px rgba(34,197,94,.1); }
  .inp-l.err{ border-color:rgba(239,68,68,.5); }

  .lbl-d{ font-size:12px; font-weight:600; color:rgba(255,255,255,.55); margin-bottom:6px; display:block; letter-spacing:.04em; }
  .lbl-l{ font-size:12px; font-weight:600; color:rgba(20,55,20,.6);    margin-bottom:6px; display:block; letter-spacing:.04em; }

  .ferr{ font-size:11px; color:#f87171; margin-top:4px; display:flex; align-items:center; gap:4px; }

  @keyframes errSlide { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }
  .api-err {
    animation: errSlide .3s cubic-bezier(.22,1,.36,1) both;
    padding: 12px 16px; border-radius: 14px; margin-bottom: 20px;
    display: flex; align-items: flex-start; gap: 10px;
    font-size: 13px; line-height: 1.5;
  }
  .api-err-d { background:rgba(239,68,68,.12); border:1px solid rgba(239,68,68,.3); color:#fca5a5; }
  .api-err-l { background:rgba(239,68,68,.07); border:1px solid rgba(239,68,68,.25); color:#dc2626; }

  .btn-sub{ width:100%; padding:14px; border-radius:999px; border:none; cursor:pointer; background:linear-gradient(135deg,#22c55e 0%,#0d9488 100%); color:#fff; font-size:15px; font-weight:600; font-family:'DM Sans',sans-serif; transition:transform .2s,box-shadow .2s; display:flex; align-items:center; justify-content:center; gap:8px; }
  .btn-sub:hover:not(:disabled){ transform:translateY(-2px); box-shadow:0 10px 30px rgba(34,197,94,.4); }
  .btn-sub:disabled{ opacity:.65; cursor:not-allowed; }

  @keyframes rFU{ from{ opacity:0; transform:translateY(20px); } to{ opacity:1; transform:translateY(0); } }
  .rFU{ animation:rFU .5s cubic-bezier(.22,1,.36,1) both; }
  @media(max-width:440px){
    .reg-card{ padding:24px 18px 28px; }
  }
  @media(max-width:380px){
    .reg-card{ padding:18px 14px 22px; }
    .card-toprow{ flex-wrap:wrap; row-gap:8px; }
    .card-controls{ margin-left:auto; }
    .lb{ padding:3px 6px; font-size:10px; }
    .tb{ width:28px; height:28px; }
  }
  `;

const COUNTRIES = ["Kazakhstan", "Russia", "Kyrgyzstan", "Uzbekistan"];

const LANGS = [
  { code:"ru",  label:"RU"  },
  { code:"en",  label:"EN"  },
  { code:"kk",  label:"ҚАЗ" },
];

const BACKEND_ERROR_MAP = {
  "user with this email already exists": "errors.emailExists",
  "email already registered":            "errors.emailExists",
  "user with this phone already exists": "errors.phoneExists",
  "phone already registered":            "errors.phoneExists",
  "phone number already registered":     "errors.phoneExists",
  "invalid email":                       "errors.invalidEmail",
  "password too short":                  "errors.passwordTooShort",
  "value is not a valid email address":  "errors.invalidEmail",
};

function parseBackendError(detail, t) {
  if (!detail) return t("common.connectionError");
  if (Array.isArray(detail)) {
    return detail.map(d => d.msg || d.message || JSON.stringify(d)).join(", ");
  }
  const lower = String(detail).toLowerCase();
  for (const [key, i18nKey] of Object.entries(BACKEND_ERROR_MAP)) {
    if (lower.includes(key)) return t(i18nKey);
  }
  return String(detail);
}

function FField({ label, icon: Icon, error, dark, children }) {
  return (
    <div>
      <label className={dark ? "lbl-d" : "lbl-l"}>{label}</label>
      <div className="fwrap">{children}</div>
      {error && (
        <div className="ferr">
          <AlertCircle style={{ width:11, height:11, flexShrink:0 }} />
          {error}
        </div>
      )}
    </div>
  );
}

export function RegisterPage() {
  const { t, i18n }  = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const { register } = useAuth();
  const navigate     = useNavigate();
  const isDark       = theme === "dark";

  const [form, setForm]       = useState({ full_name:"", phone:"", email:"", password:"", confirm:"", country:"Kazakhstan", city:"" });
  const [errors, setErrors]   = useState({});
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw]   = useState(false);
  const [showPw2, setShowPw2] = useState(false);
  const [apiError, setApiError] = useState("");

  const set = (k, v) => {
    setForm(f => ({ ...f, [k]: v }));
    setErrors(e => ({ ...e, [k]: "" }));
    if (["email","phone"].includes(k)) setApiError("");
  };

  const validate = () => {
    const e = {};
    if (!form.full_name.trim())   e.full_name = t("errors.required");
    if (!form.phone.trim())       e.phone     = t("errors.required");
    if (!form.email.trim())       e.email     = t("errors.required");
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = t("errors.invalidEmail");
    if (form.password.length < 6) e.password  = t("errors.minLength");
    if (form.password !== form.confirm) e.confirm = t("register.passwordMismatch");
    if (!form.city.trim())        e.city      = t("errors.required");
    return e;
  };

  const submit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setLoading(true);
    setApiError("");
    try {
      await register?.({ ...form, account_type: "farmer" });
      navigate("/profile/farmer");
    } catch (err) {
      let detail =
        err?.response?.data?.detail ||
        err?.detail ||
        err?.message ||
        null;
      if (!detail && err instanceof Response) {
        try { const body = await err.json(); detail = body?.detail; } catch {}
      }
      setApiError(parseBackendError(detail, t));
    } finally {
      setLoading(false);
    }
  };

  const ic  = isDark ? "rgba(255,255,255,.3)" : "rgba(20,55,20,.35)";
  const cls = (field) =>
    `${isDark ? "inp-d" : "inp-l"}${errors[field] ? " err" : ""}`;

  return (
    <>
      <style>{STYLE}</style>
      <div className="reg-root" style={{ background: isDark ? "#040d06" : "#f5fcf2" }}>

        {/* ── Left panel ── */}
        <div className="reg-left">
          <div className="relative z-10">
            <Link to="/" className="flex items-center gap-3 mb-12" style={{ textDecoration:"none" }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background:"linear-gradient(135deg,#22c55e,#0d9488)" }}>
                <Leaf className="w-5 h-5 text-white" />
              </div>
              <span className="text-2xl font-extrabold text-white" style={{ fontFamily:"Syne,sans-serif" }}>KokMaisa</span>
            </Link>

            <h2 className="text-3xl font-extrabold text-white mb-4" style={{ fontFamily:"Syne,sans-serif" }}>
              {t("register.welcome")}
            </h2>
            <p className="text-sm mb-10" style={{ color:"rgba(255,255,255,.5)", lineHeight:1.7 }}>
              {t("hero.subtitle")}
            </p>

            {[
              { val:"1000+", lbl: t("metrics.labels.images") },
              { val:"RMSE",  lbl: t("metrics.labels.accuracy") },
              { val:"4+",    lbl: t("metrics.labels.coverage") },
            ].map(({ val, lbl }) => (
              <div key={lbl} className="flex items-center gap-4 mb-5">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background:"rgba(74,222,128,.12)", border:"1px solid rgba(74,222,128,.25)" }}>
                  <span className="text-xs font-bold text-emerald-400" style={{ fontFamily:"Syne,sans-serif" }}>{val}</span>
                </div>
                <span className="text-sm" style={{ color:"rgba(255,255,255,.6)" }}>{lbl}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Right panel ── */}
        <div className="reg-right">
          <div className={`reg-card rFU ${isDark ? "reg-card-d" : "reg-card-l"}`}>

            {/* ── Card top row: logo + controls ── */}
            <div className="card-toprow">
              <Link to="/" className="flex items-center gap-2" style={{ textDecoration:"none" }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background:"linear-gradient(135deg,#22c55e,#0d9488)" }}>
                  <Leaf className="w-4 h-4 text-white" />
                </div>
                <span className="font-extrabold" style={{ fontFamily:"Syne,sans-serif", color: isDark?"#fff":"#1a3d20" }}>KokMaisa</span>
              </Link>

              <div className="card-controls">
                <Globe className="w-3.5 h-3.5" style={{ color: isDark?"rgba(255,255,255,.3)":"rgba(20,55,20,.35)" }} />
                <div className={isDark ? "lang-pill-d" : "lang-pill-l"}>
                  {LANGS.map(({ code, label }) => (
                    <button key={code} onClick={() => i18n.changeLanguage(code)}
                      className={`lb ${i18n.language === code ? (isDark?"lb-act-d":"lb-act-l") : (isDark?"lb-off-d":"lb-off-l")}`}>
                      {label}
                    </button>
                  ))}
                </div>
                <button onClick={toggleTheme} className={`tb ${isDark?"tb-d":"tb-l"}`} aria-label="Toggle theme">
                  {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* ── Heading ── */}
            <h1 className="text-2xl font-extrabold mb-1" style={{ fontFamily:"Syne,sans-serif", color: isDark?"#fff":"#1a3d20" }}>
              {t("register.title")}
            </h1>
            <p className="text-sm mb-8" style={{ color: isDark?"rgba(255,255,255,.45)":"rgba(20,55,20,.55)" }}>
              {t("register.subtitle")}
            </p>

            {/* ── API Error banner ── */}
            {apiError && (
              <div className={`api-err ${isDark ? "api-err-d" : "api-err-l"}`}>
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{apiError}</span>
              </div>
            )}

            <div className="space-y-4">
              <FField label={t("register.fullName")} icon={User} error={errors.full_name} dark={isDark}>
                <User className="ficon w-4 h-4" style={{ color:ic }} />
                <input className={cls("full_name")} value={form.full_name} onChange={e => set("full_name", e.target.value)} placeholder={t("register.fullNamePlaceholder")} maxLength={255} />
              </FField>

              <FField label={t("register.phone")} icon={Phone} error={errors.phone} dark={isDark}>
                <Phone className="ficon w-4 h-4" style={{ color:ic }} />
                <input className={cls("phone")} value={form.phone} type="tel" onChange={e => set("phone", e.target.value)} placeholder={t("register.phonePlaceholder")} maxLength={50} />
              </FField>

              <FField label={t("register.email")} icon={Mail} error={errors.email} dark={isDark}>
                <Mail className="ficon w-4 h-4" style={{ color:ic }} />
                <input className={cls("email")} value={form.email} type="email" onChange={e => set("email", e.target.value)} placeholder={t("register.emailPlaceholder")} maxLength={255} />
              </FField>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={isDark ? "lbl-d" : "lbl-l"}>{t("register.country")}</label>
                  <div className="fwrap">
                    <MapPin className="ficon w-4 h-4" style={{ color:ic }} />
                    <select className={`${isDark ? "inp-d" : "inp-l"}`} style={{ paddingRight:14 }} value={form.country} onChange={e => set("country", e.target.value)}>
                      {COUNTRIES.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
                <FField label={t("register.city")} icon={MapPin} error={errors.city} dark={isDark}>
                  <MapPin className="ficon w-4 h-4" style={{ color:ic }} />
                  <input className={cls("city")} value={form.city} onChange={e => set("city", e.target.value)} placeholder={t("register.cityPlaceholder")} maxLength={100} />
                </FField>
              </div>

              <FField label={t("register.password")} icon={Lock} error={errors.password} dark={isDark}>
                <Lock className="ficon w-4 h-4" style={{ color:ic }} />
                <input className={cls("password")} value={form.password} type={showPw ? "text" : "password"} onChange={e => set("password", e.target.value)} placeholder={t("register.passwordPlaceholder")} style={{ paddingRight:40 }} maxLength={128} />
                <button type="button" onClick={() => setShowPw(v => !v)} style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", color:ic, background:"none", border:"none", cursor:"pointer" }} aria-label="Toggle password">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </FField>

              <FField label={t("register.confirmPassword")} icon={Lock} error={errors.confirm} dark={isDark}>
                <Lock className="ficon w-4 h-4" style={{ color:ic }} />
                <input className={cls("confirm")} value={form.confirm} type={showPw2 ? "text" : "password"} onChange={e => set("confirm", e.target.value)} placeholder={t("register.passwordPlaceholder")} style={{ paddingRight:40 }} maxLength={128} />
                <button type="button" onClick={() => setShowPw2(v => !v)} style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", color:ic, background:"none", border:"none", cursor:"pointer" }} aria-label="Toggle confirm password">
                  {showPw2 ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </FField>
            </div>

            <button className="btn-sub mt-8" onClick={submit} disabled={loading}>
              {loading
                ? <span>{t("common.loading")}</span>
                : <>{t("register.submitButton")} <ArrowRight className="w-4 h-4" /></>
              }
            </button>

            <p className="text-center text-sm mt-5" style={{ color: isDark?"rgba(255,255,255,.4)":"rgba(20,55,20,.5)" }}>
              {t("register.haveAccount")}{" "}
              <Link to="/login" style={{ color: isDark?"#4ade80":"#16a34a", fontWeight:600, textDecoration:"none" }}>
                {t("register.loginLink")}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}