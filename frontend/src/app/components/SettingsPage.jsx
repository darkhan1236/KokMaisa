// src/app/components/SettingsPage.jsx
// KokMaisa 2025 — Real backend, full i18n (EN/RU/KK), fixed inputs

import { useState, useRef, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/app/components/Header";
import {
  User, Monitor, Shield, Database,
  Eye, EyeOff, CheckCircle, AlertCircle,
  Sun, Moon, Camera, Trash2, Download,
  Lock, Loader2, X, AlertTriangle,
} from "lucide-react";

import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { apiErrorMessage, extractApiDetail } from "@/app/utils/apiErrors";

/* ─── API helpers ─────────────────────────────────────────────────────────── */
/* ─── API helpers ─────────────────────────────────────────────────────────── */
const BASE = "/api";

function getToken() {
  return (
    localStorage.getItem("token") ||
    ""
  );
}

function authHeaders(json = true) {
  const h = { Authorization: `Bearer ${getToken()}` };
  if (json) h["Content-Type"] = "application/json";
  return h;
}

async function apiGet(path) {
  const r = await fetch(`${BASE}${path}`, { headers: authHeaders() });
  const json = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(extractApiDetail(json.detail || r.statusText));
  return json;
}

async function apiPut(path, body) {
  const r = await fetch(`${BASE}${path}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  const json = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(extractApiDetail(json.detail || r.statusText));
  return json;
}

async function apiPostForm(path, formData) {
  const r = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${getToken()}` },
    body: formData,
  });
  const json = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(extractApiDetail(json.detail || r.statusText));
  return json;
}

async function apiDelete(path) {
  const r = await fetch(`${BASE}${path}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  const json = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(extractApiDetail(json.detail || r.statusText));
  return json;
}
/* ─── Styles ──────────────────────────────────────────────────────────────── */
const S = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500&display=swap');

  .sp-root{font-family:'DM Sans',sans-serif;min-height:100vh;transition:background .4s;}
  .sp-dark{background:#061309;color:#fff;}
  .sp-light{background:#f5fcf2;color:#1a3d20;}

  .sp-card-dark{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:24px;}
  .sp-card-light{background:rgba(255,255,255,.92);border:1px solid rgba(34,197,94,.18);border-radius:24px;box-shadow:0 4px 24px rgba(34,197,94,.07);}

  .sp-input-dark{background:rgba(255,255,255,.06);border:1.5px solid rgba(255,255,255,.1);color:#fff;border-radius:14px;padding:10px 14px;font-size:14px;width:100%;transition:border-color .2s,box-shadow .2s;box-sizing:border-box;font-family:'DM Sans',sans-serif;}
  .sp-input-dark:focus{border-color:rgba(74,222,128,.5);box-shadow:0 0 0 3px rgba(74,222,128,.1);outline:none;}
  .sp-input-dark::placeholder{color:rgba(255,255,255,.3);}
  .sp-input-light{background:#fff;border:1.5px solid rgba(34,197,94,.22);color:#1a3d20;border-radius:14px;padding:10px 14px;font-size:14px;width:100%;transition:border-color .2s,box-shadow .2s;box-sizing:border-box;font-family:'DM Sans',sans-serif;}
  .sp-input-light:focus{border-color:#16a34a;box-shadow:0 0 0 3px rgba(22,163,74,.1);outline:none;}
  .sp-input-light::placeholder{color:rgba(20,55,20,.3);}

  .sp-tab-dark{color:rgba(255,255,255,.5);background:transparent;border:none;cursor:pointer;transition:color .2s,background .2s;border-radius:14px;}
  .sp-tab-dark:hover{color:rgba(255,255,255,.85);background:rgba(255,255,255,.06);}
  .sp-tab-dark.active{color:#fff;background:rgba(74,222,128,.12);border:1px solid rgba(74,222,128,.2);}
  .sp-tab-light{color:rgba(20,55,20,.5);background:transparent;border:none;cursor:pointer;transition:color .2s,background .2s;border-radius:14px;}
  .sp-tab-light:hover{color:rgba(20,55,20,.85);background:rgba(34,197,94,.07);}
  .sp-tab-light.active{color:#166534;background:rgba(34,197,94,.12);border:1px solid rgba(34,197,94,.25);}

  .sp-save{background:linear-gradient(135deg,#22c55e,#0d9488);color:#fff;border:none;border-radius:14px;padding:10px 24px;font-size:14px;font-weight:600;cursor:pointer;transition:transform .2s,box-shadow .2s;display:inline-flex;align-items:center;gap:8px;font-family:'DM Sans',sans-serif;}
  .sp-save:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 8px 24px rgba(34,197,94,.35);}
  .sp-save:disabled{opacity:.5;cursor:not-allowed;}

  @keyframes spSlide{from{opacity:0;transform:translateY(-12px)}to{opacity:1;transform:translateY(0)}}
  .sp-toast{animation:spSlide .35s cubic-bezier(.22,1,.36,1) both;}

  .sp-danger{background:transparent;border:1.5px solid rgba(239,68,68,.35);color:#f87171;border-radius:14px;padding:9px 18px;font-size:13px;font-weight:600;cursor:pointer;transition:background .2s,border-color .2s;display:inline-flex;align-items:center;gap:6px;font-family:'DM Sans',sans-serif;}
  .sp-danger:hover{background:rgba(239,68,68,.12);border-color:rgba(239,68,68,.55);}

  .sp-avatar{width:80px;height:80px;border-radius:50%;overflow:hidden;flex-shrink:0;position:relative;background:linear-gradient(135deg,#22c55e,#0d9488);display:flex;align-items:center;justify-content:center;font-size:28px;font-weight:700;color:#fff;font-family:'Syne',sans-serif;}
  .sp-avatar img{width:100%;height:100%;object-fit:cover;}
  .sp-avatar-edit{position:absolute;bottom:0;right:0;width:26px;height:26px;border-radius:50%;background:linear-gradient(135deg,#22c55e,#0d9488);display:flex;align-items:center;justify-content:center;cursor:pointer;border:2px solid #061309;}

  .sp-theme-opt-dark{border:1.5px solid rgba(255,255,255,.08);border-radius:14px;padding:12px 16px;cursor:pointer;transition:border-color .2s,background .2s;text-align:center;background:transparent;}
  .sp-theme-opt-dark:hover{border-color:rgba(74,222,128,.3);background:rgba(255,255,255,.04);}
  .sp-theme-opt-dark.sel{border-color:#4ade80;background:rgba(74,222,128,.1);}
  .sp-theme-opt-light{border:1.5px solid rgba(34,197,94,.15);border-radius:14px;padding:12px 16px;cursor:pointer;transition:border-color .2s,background .2s;text-align:center;background:transparent;}
  .sp-theme-opt-light:hover{border-color:rgba(34,197,94,.4);background:rgba(34,197,94,.05);}
  .sp-theme-opt-light.sel{border-color:#16a34a;background:rgba(34,197,94,.1);}

  .sp-modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.65);backdrop-filter:blur(6px);z-index:100;display:flex;align-items:center;justify-content:center;padding:20px;}

  @keyframes spin{to{transform:rotate(360deg)}}
  .sp-spin{animation:spin 1s linear infinite;}

  @media(max-width:640px){
    .sp-layout{flex-direction:column !important;}
    .sp-sidebar{width:100% !important;min-width:unset !important;max-width:unset !important;}
    .sp-tabs-scroll{overflow-x:auto;display:flex;flex-direction:row !important;}
  }
`;

const LANGS = [
  { code: "en", label: "English" },
  { code: "ru", label: "Русский" },
  { code: "kk", label: "Қазақша" },
];

const TABS = [
  { id: "profile",  icon: User,     key: "settings.tabs.profile"  },
  { id: "display",  icon: Monitor,  key: "settings.tabs.display"  },
  { id: "security", icon: Shield,   key: "settings.tabs.security" },
  { id: "data",     icon: Database, key: "settings.tabs.data"     },
];

/* ─────────────────────────────────────────────────────────────────────────────
   Sub-components MUST be declared OUTSIDE SettingsPage.
   If they are inside, React treats them as new component types on every render
   and unmounts the input — causing the "one character at a time" bug.
───────────────────────────────────────────────────────────────────────────── */

function InputField({ label, name, value, onChange, type = "text", placeholder = "", isDark }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-2"
        style={{ color: isDark ? "rgba(255,255,255,.65)" : "rgba(20,55,20,.7)" }}>
        {label}
      </label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        maxLength={255}
        autoComplete="off"
        className={`sp-input-${isDark ? "dark" : "light"}`}
      />
    </div>
  );
}

function SectionCard({ titleKey, descKey, isDark, t, children }) {
  return (
    <div className={`sp-card-${isDark ? "dark" : "light"} p-6 sm:p-7`}>
      <div className="mb-6">
        <h2 className="font-bold text-lg"
          style={{ fontFamily: "Syne,sans-serif", color: isDark ? "#fff" : "#1a3d20" }}>
          {t(titleKey)}
        </h2>
        {descKey && (
          <p className="text-sm mt-1" style={{ color: isDark ? "rgba(255,255,255,.45)" : "rgba(20,55,20,.55)" }}>
            {t(descKey)}
          </p>
        )}
      </div>
      {children}
    </div>
  );
}

/* ─── Delete account modal ────────────────────────────────────────────────── */
function DeleteAccountModal({ user, isDark, onClose, onConfirmed }) {
  const { i18n } = useTranslation();
  const [step, setStep]                 = useState("email");
  const [inputEmail, setInputEmail]     = useState("");
  const [code, setCode]                 = useState("");
  const [confirmationToken, setConfirmationToken] = useState(null);
  const [err, setErr]                   = useState("");
  const [sending, setSending]           = useState(false);

  const textMuted = isDark ? "rgba(255,255,255,.5)" : "rgba(20,55,20,.55)";
  const inputCls  = `sp-input-${isDark ? "dark" : "light"}`;

  // Шаг 1 — отправить email на бэкенд, получить confirmation_token
  const handleEmailSubmit = async () => {
    setErr("");
    setSending(true);
    try {
      const res = await fetch(`${BASE}/users/me/delete-request`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ email: inputEmail }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(extractApiDetail(json.detail || "delete_code_send_failed"));
      setConfirmationToken(json.confirmation_token);
      setStep("code");
    } catch (e) {
      setErr(apiErrorMessage(e, i18n));
    } finally {
      setSending(false);
    }
  };

  // Шаг 2 — подтвердить код через бэкенд, аккаунт удаляется на сервере
  const handleCodeSubmit = async () => {
    setErr("");
    setSending(true);
    try {
      const res = await fetch(`${BASE}/users/me/delete-confirm`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ confirmation_token: confirmationToken, code }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(extractApiDetail(json.detail || "invalid_delete_code"));
      onConfirmed();
    } catch (e) {
      setErr(apiErrorMessage(e, i18n));
      setSending(false);
    }
  };

  return (
    <div className="sp-modal-overlay" onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: isDark ? "#0b1f0e" : "#fff",
        border: `1.5px solid ${isDark ? "rgba(239,68,68,.3)" : "rgba(239,68,68,.25)"}`,
        borderRadius: 24, padding: 32, width: "100%", maxWidth: 440,
        boxShadow: "0 24px 64px rgba(0,0,0,.35)",
      }}>
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-3">
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: "rgba(239,68,68,.15)", border: "1px solid rgba(239,68,68,.3)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <AlertTriangle className="w-5 h-5" style={{ color: "#f87171" }} />
            </div>
            <div>
              <div style={{ fontFamily: "Syne,sans-serif", fontWeight: 800, fontSize: 17, color: "#f87171" }}>
                Удаление аккаунта
              </div>
              <div style={{ fontSize: 12, color: textMuted }}>Это действие необратимо</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: textMuted }}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Шаг 1 — email */}
        {step === "email" && (
          <>
            <p style={{ fontSize: 14, color: textMuted, marginBottom: 20, lineHeight: 1.6 }}>
              Введите email вашего аккаунта. Мы вышлем 6-значный код на почту.
            </p>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 8, color: textMuted }}>
                Email аккаунта
              </label>
              <input
                className={inputCls}
                type="email"
                value={inputEmail}
                onChange={e => { setInputEmail(e.target.value); setErr(""); }}
                placeholder={user.email}
                autoComplete="off"
              />
              {err && <p style={{ color: "#f87171", fontSize: 12, marginTop: 6 }}>{err}</p>}
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={onClose} className="sp-danger">Отмена</button>
              <button
                onClick={handleEmailSubmit}
                disabled={sending || !inputEmail}
                style={{
                  background: "linear-gradient(135deg,#ef4444,#dc2626)", color: "#fff",
                  border: "none", borderRadius: 14, padding: "10px 22px",
                  fontSize: 14, fontWeight: 600,
                  cursor: sending || !inputEmail ? "not-allowed" : "pointer",
                  opacity: sending || !inputEmail ? .5 : 1,
                  display: "inline-flex", alignItems: "center", gap: 8,
                  fontFamily: "'DM Sans',sans-serif",
                }}>
                {sending && <Loader2 className="w-4 h-4 sp-spin" />}
                Отправить код
              </button>
            </div>
          </>
        )}

        {/* Шаг 2 — код */}
        {step === "code" && (
          <>
            <div style={{
              background: isDark ? "rgba(34,197,94,.08)" : "rgba(34,197,94,.06)",
              border: "1px solid rgba(34,197,94,.2)", borderRadius: 12,
              padding: "12px 16px", marginBottom: 20, fontSize: 13,
              color: isDark ? "#86efac" : "#15803d",
            }}>
              Код отправлен на <strong>{inputEmail}</strong>. Проверьте почту.
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 8, color: textMuted }}>
                Код подтверждения (6 цифр)
              </label>
              <input
                className={inputCls}
                type="text"
                value={code}
                onChange={e => { setCode(e.target.value.replace(/\D/g, "").slice(0, 6)); setErr(""); }}
                placeholder="000000"
                style={{ letterSpacing: "0.3em", fontSize: 22, textAlign: "center" }}
                maxLength={6}
                autoComplete="off"
              />
              {err && <p style={{ color: "#f87171", fontSize: 12, marginTop: 6 }}>{err}</p>}
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={() => { setStep("email"); setCode(""); setErr(""); }} className="sp-danger">
                Назад
              </button>
              <button
                onClick={handleCodeSubmit}
                disabled={code.length !== 6 || sending}
                style={{
                  background: "linear-gradient(135deg,#ef4444,#dc2626)", color: "#fff",
                  border: "none", borderRadius: 14, padding: "10px 22px",
                  fontSize: 14, fontWeight: 600,
                  cursor: code.length !== 6 || sending ? "not-allowed" : "pointer",
                  opacity: code.length !== 6 || sending ? .5 : 1,
                  display: "inline-flex", alignItems: "center", gap: 8,
                  fontFamily: "'DM Sans',sans-serif",
                }}>
                {sending && <Loader2 className="w-4 h-4 sp-spin" />}
                Удалить аккаунт навсегда
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ─── Main component ──────────────────────────────────────────────────────── */
export default function SettingsPage() {
  const { t, i18n }              = useTranslation();
  const { theme, toggleTheme }   = useTheme();
  const { user: ctxUser, logout } = useAuth();
  const isDark                   = theme === "dark";
  const fileInputRef             = useRef(null);

  const [user, setUser]               = useState(ctxUser || null);
  const [loading, setLoading]         = useState(!ctxUser);
  const [activeTab, setActiveTab]     = useState("profile");
  const [isSaving, setIsSaving]       = useState(false);
  const [toast, setToast]             = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [profileForm, setProfileForm] = useState({
    full_name: "", email: "", phone: "", city: "", country: "",
  });
  const [pwdForm, setPwdForm] = useState({ oldPassword: "", newPassword: "", confirmPassword: "" });
  const [showPwd, setShowPwd] = useState({ old: false, new: false, confirm: false });
  const [pwdErr, setPwdErr]   = useState({});

  /* ── Load user ──────────────────────────────────────────────────────────── */
  const fetchUser = useCallback(async () => {
    try {
      const data = await apiGet("/users/me");
      setUser(data);
      setProfileForm({
        full_name: data.full_name || "",
        email:     data.email     || "",
        phone:     data.phone     || "",
        city:      data.city      || "",
        country:   data.country   || "",
      });
    } catch (err) {
      showToast("error", apiErrorMessage(err, i18n));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUser(); }, [fetchUser]);

  /* ── Toast ──────────────────────────────────────────────────────────────── */
  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  /* ── Profile ────────────────────────────────────────────────────────────── */
  const handleProfileChange = useCallback((e) => {
    const { name, value } = e.target;
    setProfileForm(prev => ({ ...prev, [name]: value.replace(/\0/g, "") }));
  }, []);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const data = await apiPut("/users/me", profileForm);
      setUser(data);
      showToast("success", t("common.saveChanges", "Сохранено") + " ✓");
    } catch (err) { showToast("error", apiErrorMessage(err, i18n)); }
    finally { setIsSaving(false); }
  };

  /* ── Photo ──────────────────────────────────────────────────────────────── */
  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { showToast("error", apiErrorMessage("unsupported image", i18n)); return; }
    if (file.size > 5 * 1024 * 1024)    { showToast("error", apiErrorMessage("file too large", i18n)); return; }
    const fd = new FormData();
    fd.append("file", file);
    setIsSaving(true);
    try {
      await apiPostForm("/users/me/photo", fd);
      await fetchUser();
      showToast("success", "Фото обновлено ✓");
    } catch (err) { showToast("error", apiErrorMessage(err, i18n)); }
    finally { setIsSaving(false); }
  };

  const handleDeletePhoto = async () => {
    setIsSaving(true);
    try {
      await apiDelete("/users/me/photo");
      await fetchUser();
      showToast("success", "Фото удалено");
    } catch (err) { showToast("error", apiErrorMessage(err, i18n)); }
    finally { setIsSaving(false); }
  };

  /* ── Password ───────────────────────────────────────────────────────────── */
  const handlePwdChange = useCallback((e) => {
    const { name, value } = e.target;
    setPwdForm(p => ({ ...p, [name]: value.replace(/\0/g, "") }));
    setPwdErr(p => ({ ...p, [name]: "" }));
  }, []);

  const handleSavePassword = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!pwdForm.oldPassword)                            errs.oldPassword     = t("errors.required");
    if (pwdForm.newPassword.length < 10)                 errs.newPassword     = apiErrorMessage("at least 10", i18n);
    if (pwdForm.newPassword !== pwdForm.confirmPassword) errs.confirmPassword = t("reset.passwordMismatch");
    setPwdErr(errs);
    if (Object.keys(errs).length) return;
    setIsSaving(true);
    try {
      await apiPut("/users/me/password", {
        old_password: pwdForm.oldPassword,
        new_password: pwdForm.newPassword,
      });
      setPwdForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
      showToast("success", "Пароль изменён ✓");
    } catch (err) { showToast("error", apiErrorMessage(err, i18n)); }
    finally { setIsSaving(false); }
  };

  /* ── Export ─────────────────────────────────────────────────────────────── */

const handleExport = async () => {
  try {
    const profile = await apiGet("/users/me");
    let farms = [];
    try { farms = await apiGet("/farms/"); } catch (_) {}

    const date = new Date().toLocaleString("ru-RU");
    const regDate = profile.created_at
      ? new Date(profile.created_at).toLocaleDateString("ru-RU") : "—";

    const farmsHtml = farms && farms.length > 0
      ? farms.map((farm, i) => `
          <div style="border:1.5px solid #bbf7d0;border-radius:10px;padding:14px 18px;margin-bottom:10px;background:#f0fdf4;">
            <div style="font-weight:700;font-size:13px;color:#166534;margin-bottom:6px;">${i + 1}. ${farm.name || "Ферма"}</div>
            <div style="display:flex;gap:18px;flex-wrap:wrap;font-size:11px;color:#374151;">
              ${farm.location ? `<span>📍 ${farm.location}</span>` : ""}
              ${farm.area     ? `<span>📐 ${farm.area} га</span>`  : ""}
              ${farm.type     ? `<span>🌿 ${farm.type}</span>`      : ""}
            </div>
          </div>`).join("")
      : `<p style="color:#9ca3af;font-size:12px;font-style:italic;">Нет данных о фермах</p>`;

    // Создаём скрытый div с HTML
    const container = document.createElement("div");
    container.style.cssText = `
      position:fixed; left:-9999px; top:0;
      width:794px; background:#fff;
      font-family:Arial,sans-serif; color:#1a1a1a;
    `;
    container.innerHTML = `
      <div style="background:linear-gradient(135deg,#166534,#0d9488);color:white;padding:28px 40px;display:flex;justify-content:space-between;align-items:center;">
        <div>
          <div style="font-size:26px;font-weight:800;">🌿 KokMaisa</div>
          <div style="font-size:12px;opacity:.8;margin-top:4px;">Экспорт данных аккаунта</div>
        </div>
        <div style="font-size:11px;opacity:.75;text-align:right;">${date}</div>
      </div>

      <div style="padding:32px 40px;">
        <div style="font-size:15px;font-weight:700;color:#166534;margin-bottom:4px;">Профиль пользователя</div>
        <div style="height:1.5px;background:linear-gradient(90deg,#166534,transparent);margin-bottom:14px;"></div>

        <table style="width:100%;border-collapse:collapse;">
          ${[
            ["Полное имя",       profile.full_name   || "—"],
            ["Email",            profile.email        || "—"],
            ["Телефон",          profile.phone        || "—"],
            ["Город",            profile.city         || "—"],
            ["Страна",           profile.country      || "—"],
            ["Тип аккаунта",     profile.account_type || "—"],
            ["Активен",          profile.is_active ? "Да" : "Нет"],
            ["Дата регистрации", regDate],
          ].map(([label, value], i) => `
            <tr style="background:${i % 2 === 0 ? "#f0fdf4" : "#fff"};">
              <td style="padding:8px 12px;font-size:12px;color:#6b7280;width:42%;border-bottom:1px solid #e5e7eb;">${label}</td>
              <td style="padding:8px 12px;font-size:12px;font-weight:600;color:#111827;border-bottom:1px solid #e5e7eb;">${value}</td>
            </tr>`).join("")}
        </table>

        <div style="font-size:15px;font-weight:700;color:#166534;margin:28px 0 4px;">Фермы</div>
        <div style="height:1.5px;background:linear-gradient(90deg,#166534,transparent);margin-bottom:14px;"></div>
        ${farmsHtml}

        <div style="margin-top:40px;padding-top:12px;border-top:1px solid #e5e7eb;text-align:center;font-size:10px;color:#9ca3af;">
          KokMaisa · Сформировано ${date}
        </div>
      </div>
    `;

    document.body.appendChild(container);

    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
    });

    document.body.removeChild(container);

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pdfW = pdf.internal.pageSize.getWidth();
    const pdfH = (canvas.height * pdfW) / canvas.width;

    pdf.addImage(imgData, "PNG", 0, 0, pdfW, pdfH);
    pdf.save(`kokmaisa-export-${new Date().toISOString().slice(0, 10)}.pdf`);

    showToast("success", "PDF экспортирован ✓");
  } catch (err) {
    showToast("error", apiErrorMessage(err, i18n));
  }
};
  /* ── Delete confirmed ───────────────────────────────────────────────────── */
  const handleDeleteConfirmed = () => {
    setShowDeleteModal(false);
    localStorage.removeItem("token");           // ← было "access_token"
    logout?.();
    window.location.href = "/";
  };

  const tabCls = (id) =>
    `sp-tab sp-tab-${isDark ? "dark" : "light"} ${activeTab === id ? "active" : ""} flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium w-full`;

  /* ── Loading ────────────────────────────────────────────────────────────── */
  if (loading) {
    return (
      <>
        <style>{S}</style>
        <div className={`sp-root ${isDark ? "sp-dark" : "sp-light"} flex items-center justify-center`}
          style={{ minHeight: "100vh" }}>
          <Loader2 className="sp-spin w-8 h-8" style={{ color: "#4ade80" }} />
        </div>
      </>
    );
  }

  if (!user) {
    return (
      <>
        <style>{S}</style>
        <div className={`sp-root ${isDark ? "sp-dark" : "sp-light"} flex items-center justify-center`}
          style={{ minHeight: "100vh" }}>
          <div className="text-center">
            <p className="mb-4" style={{ color: isDark ? "rgba(255,255,255,.6)" : "rgba(20,55,20,.6)" }}>
              {t("settings.pleaseLogin", "Пожалуйста, войдите")}
            </p>
            <Link to="/login" className="sp-save" style={{ textDecoration: "none", display: "inline-flex", padding: "10px 24px" }}>
              {t("nav.login", "Войти")}
            </Link>
          </div>
        </div>
      </>
    );
  }

  const initials = user.full_name?.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase() || "U";
  const photoSrc = user.profile_photo
    ? user.profile_photo.startsWith("http")
      ? user.profile_photo
      : user.profile_photo
    : null;

  /* ── Render ─────────────────────────────────────────────────────────────── */
  return (
    <>
      <style>{S}</style>
      <div className={`sp-root ${isDark ? "sp-dark" : "sp-light"}`}>
        <Header />

        {showDeleteModal && (
          <DeleteAccountModal
            user={user}
            isDark={isDark}
            onClose={() => setShowDeleteModal(false)}
            onConfirmed={handleDeleteConfirmed}
          />
        )}

        {toast && (
          <div className="sp-toast fixed top-20 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl flex items-center gap-3 text-sm font-medium"
            style={{
              background: toast.type === "success"
                ? (isDark ? "rgba(34,197,94,.18)" : "rgba(34,197,94,.12)")
                : (isDark ? "rgba(239,68,68,.18)" : "rgba(239,68,68,.1)"),
              border: `1px solid ${toast.type === "success" ? "rgba(34,197,94,.35)" : "rgba(239,68,68,.35)"}`,
              color: toast.type === "success" ? (isDark ? "#86efac" : "#15803d") : (isDark ? "#fca5a5" : "#dc2626"),
              boxShadow: "0 8px 32px rgba(0,0,0,.12)",
            }}>
            {toast.type === "success"
              ? <CheckCircle className="w-4 h-4 flex-shrink-0" />
              : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
            {toast.msg}
          </div>
        )}

        <div className="pt-20 pb-12 px-4 sm:px-6">
          <div className="max-w-5xl mx-auto">

            <div className="mb-8">
              <h1 className="text-3xl sm:text-4xl font-extrabold"
                style={{ fontFamily: "Syne,sans-serif", color: isDark ? "#fff" : "#1a3d20" }}>
                {t("settings.title", "Настройки аккаунта")}
              </h1>
              <p className="mt-2 text-sm sm:text-base"
                style={{ color: isDark ? "rgba(255,255,255,.5)" : "rgba(20,55,20,.6)" }}>
                {t("settings.subtitle", "Управляйте профилем, безопасностью и внешним видом")}
              </p>
            </div>

            <div className="sp-layout flex gap-6 items-start">

              {/* Sidebar */}
              <div className="sp-sidebar flex-shrink-0" style={{ minWidth: 200, maxWidth: 220 }}>
                <div className={`sp-card-${isDark ? "dark" : "light"} p-3`}>
                  <div className="flex items-center gap-3 px-2 py-3 mb-2"
                    style={{ borderBottom: `1px solid ${isDark ? "rgba(255,255,255,.07)" : "rgba(34,197,94,.12)"}` }}>
                    <div className="sp-avatar" style={{ width: 40, height: 40, fontSize: 15 }}>
                      {photoSrc ? <img src={photoSrc} alt="" /> : initials}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-bold truncate"
                        style={{ color: isDark ? "#fff" : "#1a3d20", fontFamily: "Syne,sans-serif" }}>
                        {user.full_name?.split(" ")[0] || "Пользователь"}
                      </div>
                      <div className="text-xs truncate"
                        style={{ color: isDark ? "rgba(255,255,255,.38)" : "rgba(20,55,20,.45)" }}>
                        {t(`roles.${user.account_type}`, user.account_type)}
                      </div>
                    </div>
                  </div>
                  <div className="sp-tabs-scroll flex flex-col gap-0.5">
                    {TABS.map(({ id, icon: Icon, key }) => (
                      <button key={id} onClick={() => setActiveTab(id)} className={tabCls(id)}>
                        <Icon className="w-4 h-4 flex-shrink-0" />
                        {t(key, id)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 flex flex-col gap-5">

                {/* ── PROFILE ─────────────────────────────────────────────── */}
                {activeTab === "profile" && (
                  <SectionCard
                    titleKey="settings.profile.title"
                    descKey="settings.profile.description"
                    isDark={isDark} t={t}
                  >
                    {/* Avatar row */}
                    <div className="flex items-center gap-5 mb-7 pb-6"
                      style={{ borderBottom: `1px solid ${isDark ? "rgba(255,255,255,.07)" : "rgba(34,197,94,.1)"}` }}>
                      <div className="sp-avatar relative">
                        {photoSrc ? <img src={photoSrc} alt="" /> : initials}
                        <div className="sp-avatar-edit"
                          onClick={() => fileInputRef.current?.click()}
                          style={{ borderColor: isDark ? "#061309" : "#f5fcf2" }}>
                          <Camera className="w-3 h-3 text-white" />
                        </div>
                        <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
                          onChange={handlePhotoChange} />
                      </div>
                      <div>
                        <div className="font-bold" style={{ color: isDark ? "#fff" : "#1a3d20" }}>
                          {user.full_name}
                        </div>
                        <div className="text-sm mt-1"
                          style={{ color: isDark ? "rgba(255,255,255,.45)" : "rgba(20,55,20,.5)" }}>
                          {user.email}
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <button onClick={() => fileInputRef.current?.click()}
                            style={{
                              fontSize: 12, fontWeight: 500, padding: "5px 12px", borderRadius: 999, cursor: "pointer",
                              background: isDark ? "rgba(74,222,128,.12)" : "rgba(22,163,74,.1)",
                              color: isDark ? "#4ade80" : "#16a34a",
                              border: `1px solid ${isDark ? "rgba(74,222,128,.2)" : "rgba(22,163,74,.2)"}`,
                            }}>
                            {t("common.edit", "Изменить")}
                          </button>
                          {photoSrc && (
                            <button onClick={handleDeletePhoto}
                              style={{
                                fontSize: 12, fontWeight: 500, padding: "5px 12px", borderRadius: 999, cursor: "pointer",
                                background: "rgba(239,68,68,.1)", color: "#f87171",
                                border: "1px solid rgba(239,68,68,.2)",
                              }}>
                              {t("common.delete", "Удалить")}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Form — InputField is external, so it never remounts */}
                    <form onSubmit={handleSaveProfile}>
                      <div className="grid sm:grid-cols-2 gap-4 mb-6">
                        <InputField isDark={isDark}
                          label={t("settings.profile.fullName", "Полное имя")}
                          name="full_name" value={profileForm.full_name} onChange={handleProfileChange}
                          placeholder={t("settings.profile.fullNamePlaceholder", "Иван Иванов")} />
                        <InputField isDark={isDark}
                          label={t("settings.profile.email", "Email")}
                          name="email" value={profileForm.email} onChange={handleProfileChange}
                          type="email" placeholder="email@example.com" />
                        <InputField isDark={isDark}
                          label={t("settings.profile.phone", "Телефон")}
                          name="phone" value={profileForm.phone} onChange={handleProfileChange}
                          placeholder="+7 (___) ___-__-__" />
                        <InputField isDark={isDark}
                          label={t("settings.profile.address", "Город")}
                          name="city" value={profileForm.city} onChange={handleProfileChange}
                          placeholder={t("settings.profile.addressPlaceholder", "Алматы")} />
                        <InputField isDark={isDark}
                          label={t("settings.profile.country", "Страна")}
                          name="country" value={profileForm.country} onChange={handleProfileChange}
                          placeholder="Казахстан" />
                      </div>
                      <div className="flex justify-end">
                        <button type="submit" disabled={isSaving} className="sp-save">
                          {isSaving && <Loader2 className="w-4 h-4 sp-spin" />}
                          {isSaving ? t("common.saving", "Сохранение...") : t("common.saveChanges", "Сохранить")}
                        </button>
                      </div>
                    </form>
                  </SectionCard>
                )}

                {/* ── DISPLAY ─────────────────────────────────────────────── */}
                {activeTab === "display" && (
                  <SectionCard
                    titleKey="settings.display.title"
                    descKey="settings.display.description"
                    isDark={isDark} t={t}
                  >
                    <div className="mb-7">
                      <label className="block text-sm font-medium mb-3"
                        style={{ color: isDark ? "rgba(255,255,255,.65)" : "rgba(20,55,20,.7)" }}>
                        {t("settings.display.theme", "Тема")}
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { id: "dark",  icon: Moon, label: t("settings.display.dark",  "Тёмная") },
                          { id: "light", icon: Sun,  label: t("settings.display.light", "Светлая") },
                        ].map(({ id, icon: Icon, label }) => (
                          <button key={id} onClick={() => id !== theme && toggleTheme()}
                            className={`sp-theme-opt-${isDark ? "dark" : "light"} ${theme === id ? "sel" : ""}`}>
                            <Icon className="w-5 h-5 mx-auto mb-1.5"
                              style={{ color: isDark ? "rgba(255,255,255,.7)" : "rgba(20,55,20,.7)" }} />
                            <div className="text-sm font-medium"
                              style={{ color: isDark ? "rgba(255,255,255,.8)" : "rgba(20,55,20,.8)" }}>
                              {label}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-3"
                        style={{ color: isDark ? "rgba(255,255,255,.65)" : "rgba(20,55,20,.7)" }}>
                        {t("settings.display.language", "Язык")}
                      </label>
                      <div className="flex gap-2 flex-wrap">
                        {LANGS.map(({ code, label }) => (
                          <button key={code} onClick={() => i18n.changeLanguage(code)}
                            style={{
                              padding: "8px 18px", borderRadius: 999, fontSize: 14, fontWeight: 600,
                              cursor: "pointer", transition: "all .2s",
                              background: i18n.language === code
                                ? (isDark ? "rgba(74,222,128,.18)" : "rgba(22,163,74,.12)")
                                : (isDark ? "rgba(255,255,255,.06)" : "rgba(255,255,255,.7)"),
                              border: i18n.language === code
                                ? `1.5px solid ${isDark ? "rgba(74,222,128,.35)" : "rgba(22,163,74,.3)"}`
                                : `1.5px solid ${isDark ? "rgba(255,255,255,.1)" : "rgba(34,197,94,.2)"}`,
                              color: i18n.language === code
                                ? (isDark ? "#4ade80" : "#15803d")
                                : (isDark ? "rgba(255,255,255,.55)" : "rgba(20,55,20,.55)"),
                            }}>
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </SectionCard>
                )}

                {/* ── SECURITY ────────────────────────────────────────────── */}
                {activeTab === "security" && (
                  <SectionCard
                    titleKey="settings.security.title"
                    descKey="settings.security.description"
                    isDark={isDark} t={t}
                  >
                    <div className="p-5 rounded-2xl" style={{
                      background: isDark ? "rgba(255,255,255,.03)" : "rgba(34,197,94,.04)",
                      border: `1px solid ${isDark ? "rgba(255,255,255,.07)" : "rgba(34,197,94,.12)"}`,
                    }}>
                      <div className="flex items-center gap-3 mb-5">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                          style={{ background: "linear-gradient(135deg,#22c55e,#0d9488)" }}>
                          <Lock className="w-5 h-5 text-white" />
                        </div>
                        <div className="font-semibold text-sm" style={{ color: isDark ? "#fff" : "#1a3d20" }}>
                          {t("settings.security.changePassword", "Изменить пароль")}
                        </div>
                      </div>
                      <form onSubmit={handleSavePassword}>
                        {[
                          { name: "oldPassword",     label: "Текущий пароль",    showKey: "old"     },
                          { name: "newPassword",     label: "Новый пароль",       showKey: "new"     },
                          { name: "confirmPassword", label: "Подтвердить пароль", showKey: "confirm" },
                        ].map(({ name, label, showKey }) => (
                          <div key={name} style={{ marginBottom: 16 }}>
                            <label style={{
                              display: "block", fontSize: 13, fontWeight: 500, marginBottom: 8,
                              color: isDark ? "rgba(255,255,255,.6)" : "rgba(20,55,20,.65)",
                            }}>
                              {label}
                            </label>
                            <div style={{ position: "relative" }}>
                              <input
                                type={showPwd[showKey] ? "text" : "password"}
                                name={name}
                                value={pwdForm[name]}
                                onChange={handlePwdChange}
                                className={`sp-input-${isDark ? "dark" : "light"}`}
                                style={{ paddingRight: 44 }}
                                maxLength={128}
                                placeholder="••••••••"
                                autoComplete="new-password"
                              />
                              <button type="button"
                                onClick={() => setShowPwd(p => ({ ...p, [showKey]: !p[showKey] }))}
                                style={{
                                  position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                                  background: "none", border: "none", cursor: "pointer",
                                  color: isDark ? "rgba(255,255,255,.35)" : "rgba(20,55,20,.4)",
                                }}>
                                {showPwd[showKey] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>
                            </div>
                            {pwdErr[name] && (
                              <p style={{ color: "#f87171", fontSize: 12, marginTop: 4 }}>{pwdErr[name]}</p>
                            )}
                          </div>
                        ))}
                        <button type="submit" disabled={isSaving} className="sp-save">
                          {isSaving && <Loader2 className="w-4 h-4 sp-spin" />}
                          {isSaving ? "Сохранение..." : t("settings.security.change", "Изменить пароль")}
                        </button>
                      </form>
                    </div>
                  </SectionCard>
                )}

                {/* ── DATA ────────────────────────────────────────────────── */}
                {activeTab === "data" && (
                  <>
                    <SectionCard
                      titleKey="settings.data.title"
                      descKey="settings.data.description"
                      isDark={isDark} t={t}
                    >
                      <div className="flex items-center justify-between gap-4 py-4"
                        style={{ borderBottom: `1px solid ${isDark ? "rgba(255,255,255,.06)" : "rgba(34,197,94,.1)"}` }}>
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{ background: "rgba(74,222,128,.1)", border: "1px solid rgba(74,222,128,.2)" }}>
                            <Download className="w-5 h-5" style={{ color: "#4ade80" }} />
                          </div>
                          <div>
                            <div className="text-sm font-semibold"
                              style={{ color: isDark ? "rgba(255,255,255,.82)" : "#1a3d20" }}>
                              {t("settings.data.export", "Экспорт данных")}
                            </div>
                            <div className="text-xs"
                              style={{ color: isDark ? "rgba(255,255,255,.38)" : "rgba(20,55,20,.5)" }}>
                              {t("settings.data.exportDesc", "Скачать профиль и данные ферм в JSON")}
                            </div>
                          </div>
                        </div>
                        <button className="sp-save" style={{ fontSize: 13, padding: "9px 18px" }}
                          onClick={handleExport}>
                          {t("settings.data.exportBtn", "Скачать")}
                        </button>
                      </div>
                    </SectionCard>

                    {/* Danger zone */}
                    <div className="rounded-2xl p-6"
                      style={{ border: "1.5px solid rgba(239,68,68,.25)", background: "rgba(239,68,68,.04)" }}>
                      <h2 className="font-bold text-base mb-1"
                        style={{ fontFamily: "Syne,sans-serif", color: "#f87171" }}>
                        {t("settings.dangerZone.title", "Опасная зона")}
                      </h2>
                      <p className="text-sm mb-4"
                        style={{ color: isDark ? "rgba(255,255,255,.45)" : "rgba(20,55,20,.5)" }}>
                        {t("settings.dangerZone.description", "Необратимые действия с аккаунтом")}
                      </p>
                      <div className="flex items-center justify-between flex-wrap gap-3 py-3"
                        style={{ borderTop: "1px solid rgba(239,68,68,.15)" }}>
                        <div>
                          <div className="text-sm font-medium" style={{ color: "#f87171" }}>
                            {t("settings.dangerZone.deleteAccount", "Удалить аккаунт")}
                          </div>
                          <div className="text-xs mt-0.5"
                            style={{ color: isDark ? "rgba(255,255,255,.38)" : "rgba(20,55,20,.45)" }}>
                            {t("settings.dangerZone.deleteWarning", "Все данные будут удалены навсегда")}
                          </div>
                        </div>
                        <button className="sp-danger" onClick={() => setShowDeleteModal(true)}>
                          <Trash2 className="w-3.5 h-3.5" />
                          {t("settings.dangerZone.deleteBtn", "Удалить аккаунт")}
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
