// src/app/components/SettingsPage.jsx
// KokMaisa 2025 — Premium dark/light, full i18n (EN/RU/KK), XSS-safe, responsive

import { useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/app/components/Header";
import {
  User, Bell, Monitor, Shield, Database,
  Eye, EyeOff, CheckCircle, AlertCircle,
  Sun, Moon, Globe, Camera, Trash2, Download, Upload,
  ChevronRight, Lock,
} from "lucide-react";

/* ─── Styles ──────────────────────────────────────────────────────────────── */
const S = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500&display=swap');

  .sp-root { font-family:'DM Sans',sans-serif; min-height:100vh; transition:background .4s; }
  .sp-dark  { background:#061309; color:#fff; }
  .sp-light { background:#f5fcf2; color:#1a3d20; }

  /* Card */
  .sp-card-dark  { background:rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.08); border-radius:24px; }
  .sp-card-light { background:rgba(255,255,255,.92); border:1px solid rgba(34,197,94,.18); border-radius:24px; box-shadow:0 4px 24px rgba(34,197,94,.07); }

  /* Input */
  .sp-input-dark  { background:rgba(255,255,255,.06); border:1.5px solid rgba(255,255,255,.1); color:#fff; border-radius:14px; padding:10px 14px; font-size:14px; width:100%; transition:border-color .2s,box-shadow .2s; }
  .sp-input-dark:focus  { border-color:rgba(74,222,128,.5); box-shadow:0 0 0 3px rgba(74,222,128,.1); outline:none; }
  .sp-input-dark::placeholder  { color:rgba(255,255,255,.3); }
  .sp-input-light { background:#fff; border:1.5px solid rgba(34,197,94,.22); color:#1a3d20; border-radius:14px; padding:10px 14px; font-size:14px; width:100%; transition:border-color .2s,box-shadow .2s; }
  .sp-input-light:focus { border-color:#16a34a; box-shadow:0 0 0 3px rgba(22,163,74,.1); outline:none; }
  .sp-input-light::placeholder { color:rgba(20,55,20,.3); }

  /* Tab */
  .sp-tab-dark  { color:rgba(255,255,255,.5); background:transparent; border:none; cursor:pointer; transition:color .2s,background .2s; border-radius:14px; }
  .sp-tab-dark:hover  { color:rgba(255,255,255,.85); background:rgba(255,255,255,.06); }
  .sp-tab-dark.active  { color:#fff; background:rgba(74,222,128,.12); border:1px solid rgba(74,222,128,.2); }
  .sp-tab-light { color:rgba(20,55,20,.5); background:transparent; border:none; cursor:pointer; transition:color .2s,background .2s; border-radius:14px; }
  .sp-tab-light:hover  { color:rgba(20,55,20,.85); background:rgba(34,197,94,.07); }
  .sp-tab-light.active { color:#166534; background:rgba(34,197,94,.12); border:1px solid rgba(34,197,94,.25); }

  /* Toggle */
  .sp-toggle { position:relative; width:46px; height:26px; flex-shrink:0; }
  .sp-toggle input { opacity:0; width:0; height:0; }
  .sp-toggle-slider { position:absolute; cursor:pointer; top:0;left:0;right:0;bottom:0; border-radius:999px; transition:.3s; background:rgba(255,255,255,.15); }
  .sp-toggle-slider:before { position:absolute;content:'';height:20px;width:20px;left:3px;bottom:3px;border-radius:50%;background:#fff;transition:.3s; }
  .sp-toggle input:checked + .sp-toggle-slider { background:linear-gradient(135deg,#22c55e,#0d9488); }
  .sp-toggle input:checked + .sp-toggle-slider:before { transform:translateX(20px); }

  /* Save btn */
  .sp-save { background:linear-gradient(135deg,#22c55e,#0d9488); color:#fff; border:none; border-radius:14px; padding:10px 24px; font-size:14px; font-weight:600; cursor:pointer; transition:transform .2s,box-shadow .2s; }
  .sp-save:hover:not(:disabled) { transform:translateY(-2px); box-shadow:0 8px 24px rgba(34,197,94,.35); }
  .sp-save:disabled { opacity:.5; cursor:not-allowed; }

  /* Toast */
  @keyframes spSlide { from{opacity:0;transform:translateY(-12px)} to{opacity:1;transform:translateY(0)} }
  .sp-toast { animation:spSlide .35s cubic-bezier(.22,1,.36,1) both; }

  /* Danger btn */
  .sp-danger { background:transparent; border:1.5px solid rgba(239,68,68,.35); color:#f87171; border-radius:14px; padding:9px 18px; font-size:13px; font-weight:600; cursor:pointer; transition:background .2s,border-color .2s; }
  .sp-danger:hover { background:rgba(239,68,68,.12); border-color:rgba(239,68,68,.55); }

  /* section badge */
  .sp-section-badge { font-size:10px; font-weight:700; letter-spacing:.15em; text-transform:uppercase; padding:3px 10px; border-radius:999px; }

  /* Avatar */
  .sp-avatar { width:80px;height:80px;border-radius:50%;overflow:hidden;flex-shrink:0;position:relative; background:linear-gradient(135deg,#22c55e,#0d9488); display:flex;align-items:center;justify-content:center; font-size:28px;font-weight:700;color:#fff;font-family:'Syne',sans-serif; }
  .sp-avatar img { width:100%;height:100%;object-fit:cover; }
  .sp-avatar-edit { position:absolute;bottom:0;right:0;width:26px;height:26px;border-radius:50%;background:linear-gradient(135deg,#22c55e,#0d9488);display:flex;align-items:center;justify-content:center;cursor:pointer;border:2px solid #061309; }

  /* select */
  .sp-select-dark  { background:rgba(255,255,255,.06);border:1.5px solid rgba(255,255,255,.1);color:#fff;border-radius:14px;padding:10px 14px;font-size:14px;width:100%;outline:none;cursor:pointer; }
  .sp-select-light { background:#fff;border:1.5px solid rgba(34,197,94,.22);color:#1a3d20;border-radius:14px;padding:10px 14px;font-size:14px;width:100%;outline:none;cursor:pointer; }

  /* theme option */
  .sp-theme-opt-dark  { border:1.5px solid rgba(255,255,255,.08);border-radius:14px;padding:12px 16px;cursor:pointer;transition:border-color .2s,background .2s;text-align:center; }
  .sp-theme-opt-dark:hover { border-color:rgba(74,222,128,.3);background:rgba(255,255,255,.04); }
  .sp-theme-opt-dark.sel { border-color:#4ade80;background:rgba(74,222,128,.1); }
  .sp-theme-opt-light { border:1.5px solid rgba(34,197,94,.15);border-radius:14px;padding:12px 16px;cursor:pointer;transition:border-color .2s,background .2s;text-align:center; }
  .sp-theme-opt-light:hover { border-color:rgba(34,197,94,.4);background:rgba(34,197,94,.05); }
  .sp-theme-opt-light.sel { border-color:#16a34a;background:rgba(34,197,94,.1); }

  @media (max-width:640px) {
    .sp-layout { flex-direction:column !important; }
    .sp-sidebar { width:100% !important; min-width:unset !important; max-width:unset !important; }
    .sp-tabs-scroll { overflow-x:auto; display:flex; }
    .sp-tab { white-space:nowrap; }
  }
`;

const LANGS = [
  { code:"en", label:"English" },
  { code:"ru", label:"Русский" },
  { code:"kk", label:"Қазақша" },
];

const TABS = [
  { id:"profile",       icon:User,     key:"settings.tabs.profile" },
  { id:"notifications", icon:Bell,     key:"settings.tabs.notifications" },
  { id:"display",       icon:Monitor,  key:"settings.tabs.display" },
  { id:"security",      icon:Shield,   key:"settings.tabs.security" },
  { id:"data",          icon:Database, key:"settings.tabs.data" },
];

export default function SettingsPage() {
  const { t, i18n }    = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const { user, updateProfile, changePassword, loadUser, uploadProfilePhoto, deleteProfilePhoto } = useAuth();
  const navigate        = useNavigate();
  const isDark          = theme === "dark";
  const fileInputRef    = useRef(null);

  const [activeTab, setActiveTab]   = useState("profile");
  const [isSaving, setIsSaving]     = useState(false);
  const [toast, setToast]           = useState(null); // {type:'success'|'error', msg}

  // Profile form
  const [profileForm, setProfileForm] = useState({
    full_name: user?.full_name || "",
    email:     user?.email    || "",
    phone:     user?.phone    || "",
    city:      user?.city     || "",
    country:   user?.country  || "",
  });

  // Notifications
  const [notifs, setNotifs] = useState({
    emailNotifs: true, pushNotifs: false,
    droneNotifs: true, biomassNotifs: true, weatherNotifs: true, weeklyReport: false,
  });

  // Password form
  const [pwdForm, setPwdForm]   = useState({ oldPassword:"", newPassword:"", confirmPassword:"" });
  const [showPwd, setShowPwd]   = useState({ old:false, new:false, confirm:false });
  const [pwdErr, setPwdErr]     = useState({});

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileForm(prev => ({ ...prev, [name]: value.replace(/\0/g, "") }));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateProfile(profileForm);
      await loadUser?.();
      showToast("success", t("common.saveChanges") + " ✓");
    } catch (err) {
      showToast("error", err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { showToast("error", "Only image files allowed"); return; }
    if (file.size > 5 * 1024 * 1024) { showToast("error", "Max 5 MB"); return; }
    try {
      await uploadProfilePhoto(file);
      await loadUser?.();
      showToast("success", "Photo updated!");
    } catch (err) {
      showToast("error", err.message);
    }
  };

  const handleDeletePhoto = async () => {
    try {
      await deleteProfilePhoto?.();
      await loadUser?.();
      showToast("success", "Photo removed");
    } catch (err) {
      showToast("error", err.message);
    }
  };

  const handleSavePassword = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!pwdForm.oldPassword) errs.oldPassword = t("common.required","Required");
    if (pwdForm.newPassword.length < 6) errs.newPassword = t("reset.passwordTooShort");
    if (pwdForm.newPassword !== pwdForm.confirmPassword) errs.confirmPassword = t("reset.passwordMismatch");
    setPwdErr(errs);
    if (Object.keys(errs).length) return;
    setIsSaving(true);
    try {
      await changePassword({ old_password: pwdForm.oldPassword, new_password: pwdForm.newPassword });
      setPwdForm({ oldPassword:"", newPassword:"", confirmPassword:"" });
      showToast("success", t("common.saveChanges") + " ✓");
    } catch (err) {
      showToast("error", err.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) {
    return (
      <div className={`sp-root ${isDark?"sp-dark":"sp-light"} flex items-center justify-center`}>
        <div className="text-center">
          <p className="mb-4" style={{ color:isDark?"rgba(255,255,255,.6)":"rgba(20,55,20,.6)" }}>
            {t("settings.pleaseLogin")}
          </p>
          <Link to="/login" className="sp-save" style={{ textDecoration:"none", display:"inline-block", padding:"10px 24px" }}>
            {t("nav.login")}
          </Link>
        </div>
      </div>
    );
  }

  const initials = user.full_name?.split(" ").map(w => w[0]).slice(0,2).join("").toUpperCase() || "U";
  const tabCls   = (id) => `sp-tab sp-tab-${isDark?"dark":"light"} ${activeTab===id?"active":""} sp-tab flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium w-full`;

  const lbl = (
    <span className="sp-section-badge"
      style={{ background:isDark?"rgba(74,222,128,.12)":"rgba(22,163,74,.1)", color:isDark?"#4ade80":"#15803d", border:`1px solid ${isDark?"rgba(74,222,128,.2)":"rgba(22,163,74,.2)"}` }}>
    </span>
  );

  const Section = ({ titleKey, descKey, children }) => (
    <div className={`sp-card-${isDark?"dark":"light"} p-6 sm:p-7`}>
      <div className="mb-6">
        <h2 className="font-bold text-lg" style={{ fontFamily:"Syne,sans-serif", color:isDark?"#fff":"#1a3d20" }}>
          {t(titleKey)}
        </h2>
        {descKey && <p className="text-sm mt-1" style={{ color:isDark?"rgba(255,255,255,.45)":"rgba(20,55,20,.55)" }}>{t(descKey)}</p>}
      </div>
      {children}
    </div>
  );

  const InputField = ({ label, name, value, onChange, type="text", placeholder="" }) => (
    <div>
      <label className="block text-sm font-medium mb-2" style={{ color:isDark?"rgba(255,255,255,.65)":"rgba(20,55,20,.7)" }}>
        {label}
      </label>
      <input
        type={type} name={name} value={value} onChange={onChange}
        placeholder={placeholder} maxLength={255}
        className={`sp-input-${isDark?"dark":"light"}`}
      />
    </div>
  );

  const Toggle = ({ id, checked, onChange, label, desc }) => (
    <div className="flex items-start justify-between gap-4 py-3.5"
      style={{ borderBottom:`1px solid ${isDark?"rgba(255,255,255,.06)":"rgba(34,197,94,.1)"}` }}>
      <div>
        <div className="text-sm font-medium" style={{ color:isDark?"rgba(255,255,255,.82)":"#1a3d20" }}>{label}</div>
        {desc && <div className="text-xs mt-0.5" style={{ color:isDark?"rgba(255,255,255,.38)":"rgba(20,55,20,.5)" }}>{desc}</div>}
      </div>
      <label className="sp-toggle flex-shrink-0 mt-0.5" htmlFor={id}>
        <input id={id} type="checkbox" checked={checked} onChange={onChange} />
        <span className="sp-toggle-slider" />
      </label>
    </div>
  );

  return (
    <>
      <style>{S}</style>
      <div className={`sp-root ${isDark?"sp-dark":"sp-light"}`}>
        <Header />

        {/* Toast */}
        {toast && (
          <div className="sp-toast fixed top-20 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl flex items-center gap-3 text-sm font-medium"
            style={{
              background: toast.type === "success"
                ? (isDark?"rgba(34,197,94,.18)":"rgba(34,197,94,.12)")
                : (isDark?"rgba(239,68,68,.18)":"rgba(239,68,68,.1)"),
              border: `1px solid ${toast.type==="success"?"rgba(34,197,94,.35)":"rgba(239,68,68,.35)"}`,
              color: toast.type === "success" ? (isDark?"#86efac":"#15803d") : (isDark?"#fca5a5":"#dc2626"),
              boxShadow:"0 8px 32px rgba(0,0,0,.12)",
            }}>
            {toast.type === "success" ? <CheckCircle className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
            {toast.msg}
          </div>
        )}

        <div className="pt-20 pb-12 px-4 sm:px-6">
          <div className="max-w-5xl mx-auto">

            {/* Page header */}
            <div className="mb-8">
              <p className="text-xs font-semibold tracking-[.18em] uppercase mb-2"
                style={{ color:isDark?"#4ade80":"#16a34a", fontFamily:"DM Sans,sans-serif" }}>
                {t("nav.settings")}
              </p>
              <h1 className="text-3xl sm:text-4xl font-extrabold" style={{ fontFamily:"Syne,sans-serif", color:isDark?"#fff":"#1a3d20" }}>
                {t("settings.title")}
              </h1>
              <p className="mt-2 text-sm sm:text-base" style={{ color:isDark?"rgba(255,255,255,.5)":"rgba(20,55,20,.6)" }}>
                {t("settings.subtitle")}
              </p>
            </div>

            {/* Layout */}
            <div className="sp-layout flex gap-6 items-start">

              {/* Sidebar */}
              <div className="sp-sidebar flex-shrink-0" style={{ minWidth:200, maxWidth:220 }}>
                <div className={`sp-card-${isDark?"dark":"light"} p-3`}>
                  {/* User info */}
                  <div className="flex items-center gap-3 px-2 py-3 mb-2"
                    style={{ borderBottom:`1px solid ${isDark?"rgba(255,255,255,.07)":"rgba(34,197,94,.12)"}` }}>
                    <div className="sp-avatar" style={{ width:40, height:40, fontSize:15 }}>
                      {user.profile_photo
                        ? <img src={user.profile_photo.startsWith("http") ? user.profile_photo : `http://127.0.0.1:8000${user.profile_photo}`} alt="" />
                        : initials}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-bold truncate" style={{ color:isDark?"#fff":"#1a3d20", fontFamily:"Syne,sans-serif" }}>
                        {user.full_name?.split(" ")[0] || t("common.user")}
                      </div>
                      <div className="text-xs truncate" style={{ color:isDark?"rgba(255,255,255,.38)":"rgba(20,55,20,.45)" }}>
                        {t(`roles.${user.account_type}`, user.account_type)}
                      </div>
                    </div>
                  </div>

                  <div className="sp-tabs-scroll flex flex-col gap-0.5">
                    {TABS.map(({ id, icon: Icon, key }) => (
                      <button key={id} onClick={() => setActiveTab(id)} className={tabCls(id)}>
                        <Icon className="w-4 h-4 flex-shrink-0" />
                        {t(key)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 flex flex-col gap-5">

                {/* ── PROFILE ── */}
                {activeTab === "profile" && (
                  <>
                    <Section titleKey="settings.profile.title" descKey="settings.profile.description">
                      {/* Avatar */}
                      <div className="flex items-center gap-5 mb-7 pb-6"
                        style={{ borderBottom:`1px solid ${isDark?"rgba(255,255,255,.07)":"rgba(34,197,94,.1)"}` }}>
                        <div className="sp-avatar relative">
                          {user.profile_photo
                            ? <img src={user.profile_photo.startsWith("http") ? user.profile_photo : `http://127.0.0.1:8000${user.profile_photo}`} alt="" />
                            : initials}
                          <div className="sp-avatar-edit" onClick={() => fileInputRef.current?.click()}
                            style={{ borderColor:isDark?"#061309":"#f5fcf2" }}>
                            <Camera className="w-3 h-3 text-white" />
                          </div>
                          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
                        </div>
                        <div>
                          <div className="font-bold" style={{ color:isDark?"#fff":"#1a3d20" }}>{user.full_name}</div>
                          <div className="text-sm mt-1" style={{ color:isDark?"rgba(255,255,255,.45)":"rgba(20,55,20,.5)" }}>{user.email}</div>
                          <div className="flex items-center gap-2 mt-2">
                            <button onClick={() => fileInputRef.current?.click()}
                              className="text-xs font-medium px-3 py-1.5 rounded-full transition-all"
                              style={{ background:isDark?"rgba(74,222,128,.12)":"rgba(22,163,74,.1)", color:isDark?"#4ade80":"#16a34a", border:`1px solid ${isDark?"rgba(74,222,128,.2)":"rgba(22,163,74,.2)"}` }}>
                              {t("common.edit")}
                            </button>
                            {user.profile_photo && (
                              <button onClick={handleDeletePhoto}
                                className="text-xs font-medium px-3 py-1.5 rounded-full transition-all"
                                style={{ background:"rgba(239,68,68,.1)", color:"#f87171", border:"1px solid rgba(239,68,68,.2)" }}>
                                {t("common.delete")}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      <form onSubmit={handleSaveProfile}>
                        <div className="grid sm:grid-cols-2 gap-4 mb-6">
                          <InputField label={t("settings.profile.fullName")} name="full_name" value={profileForm.full_name}
                            onChange={handleProfileChange} placeholder={t("settings.profile.fullNamePlaceholder")} />
                          <InputField label={t("settings.profile.email")} name="email" value={profileForm.email}
                            onChange={handleProfileChange} type="email" placeholder="email@example.com" />
                          <InputField label={t("settings.profile.phone")} name="phone" value={profileForm.phone}
                            onChange={handleProfileChange} placeholder="+7 (___) ___-__-__" />
                          <InputField label={t("settings.profile.address")} name="city" value={profileForm.city}
                            onChange={handleProfileChange} placeholder={t("settings.profile.addressPlaceholder")} />
                        </div>
                        <div className="flex justify-end">
                          <button type="submit" disabled={isSaving} className="sp-save">
                            {isSaving ? t("common.saving") : t("common.saveChanges")}
                          </button>
                        </div>
                      </form>
                    </Section>
                  </>
                )}

                {/* ── NOTIFICATIONS ── */}
                {activeTab === "notifications" && (
                  <Section titleKey="settings.notifications.title" descKey="settings.notifications.description">
                    <div className="mb-5">
                      <h3 className="text-sm font-semibold mb-3" style={{ color:isDark?"rgba(255,255,255,.55)":"rgba(20,55,20,.55)", fontFamily:"Syne,sans-serif", letterSpacing:".1em", textTransform:"uppercase", fontSize:11 }}>
                        {t("settings.notifications.channels")}
                      </h3>
                      <Toggle id="emailNotifs" checked={notifs.emailNotifs} onChange={e => setNotifs(p => ({...p, emailNotifs:e.target.checked}))}
                        label={t("settings.notifications.email")} desc={t("settings.notifications.emailDesc")} />
                      <Toggle id="pushNotifs" checked={notifs.pushNotifs} onChange={e => setNotifs(p => ({...p, pushNotifs:e.target.checked}))}
                        label={t("settings.notifications.push")} desc={t("settings.notifications.pushDesc")} />
                    </div>
                    <h3 className="text-sm font-semibold mb-3" style={{ color:isDark?"rgba(255,255,255,.55)":"rgba(20,55,20,.55)", fontFamily:"Syne,sans-serif", letterSpacing:".1em", textTransform:"uppercase", fontSize:11 }}>
                      {t("settings.notifications.types")}
                    </h3>
                    <Toggle id="droneNotifs" checked={notifs.droneNotifs} onChange={e => setNotifs(p => ({...p, droneNotifs:e.target.checked}))}
                      label={t("settings.notifications.drone")} desc={t("settings.notifications.droneDesc")} />
                    <Toggle id="biomassNotifs" checked={notifs.biomassNotifs} onChange={e => setNotifs(p => ({...p, biomassNotifs:e.target.checked}))}
                      label={t("settings.notifications.biomass")} desc={t("settings.notifications.biomassDesc")} />
                    <Toggle id="weatherNotifs" checked={notifs.weatherNotifs} onChange={e => setNotifs(p => ({...p, weatherNotifs:e.target.checked}))}
                      label={t("settings.notifications.weather")} desc={t("settings.notifications.weatherDesc")} />
                    <Toggle id="weeklyReport" checked={notifs.weeklyReport} onChange={e => setNotifs(p => ({...p, weeklyReport:e.target.checked}))}
                      label={t("settings.notifications.weeklyReport")} desc={t("settings.notifications.weeklyReportDesc")} />
                    <div className="flex justify-end mt-6">
                      <button className="sp-save" onClick={() => showToast("success", t("common.saveChanges") + " ✓")}>
                        {t("common.saveSettings")}
                      </button>
                    </div>
                  </Section>
                )}

                {/* ── DISPLAY ── */}
                {activeTab === "display" && (
                  <Section titleKey="settings.display.title" descKey="settings.display.description">
                    {/* Theme */}
                    <div className="mb-7">
                      <label className="block text-sm font-medium mb-3" style={{ color:isDark?"rgba(255,255,255,.65)":"rgba(20,55,20,.7)" }}>
                        {t("settings.display.theme")}
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {[
                          { id:"dark",  icon:Moon, label:t("settings.display.dark") },
                          { id:"light", icon:Sun,  label:t("settings.display.light") },
                        ].map(({ id, icon:Icon, label }) => (
                          <button key={id} onClick={() => id !== theme && toggleTheme()}
                            className={`sp-theme-opt-${isDark?"dark":"light"} ${theme===id?"sel":""}`}>
                            <Icon className="w-5 h-5 mx-auto mb-1.5" style={{ color:isDark?"rgba(255,255,255,.7)":"rgba(20,55,20,.7)" }} />
                            <div className="text-sm font-medium" style={{ color:isDark?"rgba(255,255,255,.8)":"rgba(20,55,20,.8)" }}>{label}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Language */}
                    <div className="mb-6">
                      <label className="block text-sm font-medium mb-3" style={{ color:isDark?"rgba(255,255,255,.65)":"rgba(20,55,20,.7)" }}>
                        {t("settings.display.language")}
                      </label>
                      <div className="flex gap-2 flex-wrap">
                        {LANGS.map(({ code, label }) => (
                          <button key={code} onClick={() => i18n.changeLanguage(code)}
                            className="px-4 py-2 rounded-full text-sm font-semibold transition-all"
                            style={{
                              background: i18n.language===code
                                ? (isDark?"rgba(74,222,128,.18)":"rgba(22,163,74,.12)")
                                : (isDark?"rgba(255,255,255,.06)":"rgba(255,255,255,.7)"),
                              border: i18n.language===code
                                ? `1.5px solid ${isDark?"rgba(74,222,128,.35)":"rgba(22,163,74,.3)"}`
                                : `1.5px solid ${isDark?"rgba(255,255,255,.1)":"rgba(34,197,94,.2)"}`,
                              color: i18n.language===code
                                ? (isDark?"#4ade80":"#15803d")
                                : (isDark?"rgba(255,255,255,.55)":"rgba(20,55,20,.55)"),
                            }}>
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <button className="sp-save" onClick={() => showToast("success", t("common.saveChanges") + " ✓")}>
                        {t("common.saveSettings")}
                      </button>
                    </div>
                  </Section>
                )}

                {/* ── SECURITY ── */}
                {activeTab === "security" && (
                  <Section titleKey="settings.security.title" descKey="settings.security.description">
                    <div className="p-5 rounded-2xl mb-6"
                      style={{ background:isDark?"rgba(255,255,255,.03)":"rgba(34,197,94,.04)", border:`1px solid ${isDark?"rgba(255,255,255,.07)":"rgba(34,197,94,.12)"}` }}>
                      <div className="flex items-center gap-3 mb-5">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                          style={{ background:"linear-gradient(135deg,#22c55e,#0d9488)" }}>
                          <Lock className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <div className="font-semibold text-sm" style={{ color:isDark?"#fff":"#1a3d20" }}>{t("settings.security.changePassword")}</div>
                          <div className="text-xs" style={{ color:isDark?"rgba(255,255,255,.4)":"rgba(20,55,20,.45)" }}>
                            {t("settings.security.lastChanged", { time: t("common.today") })}
                          </div>
                        </div>
                      </div>

                      <form onSubmit={handleSavePassword}>
                        {[
                          { name:"oldPassword", label:"Current Password", show:showPwd.old, toggleKey:"old" },
                          { name:"newPassword", label:t("reset.newPassword"), show:showPwd.new, toggleKey:"new" },
                          { name:"confirmPassword", label:t("reset.confirmPassword"), show:showPwd.confirm, toggleKey:"confirm" },
                        ].map(({ name, label, show, toggleKey }) => (
                          <div key={name} className="mb-4">
                            <label className="block text-sm font-medium mb-2" style={{ color:isDark?"rgba(255,255,255,.6)":"rgba(20,55,20,.65)" }}>{label}</label>
                            <div className="relative">
                              <input
                                type={show?"text":"password"} name={name}
                                value={pwdForm[name]}
                                onChange={e => { setPwdForm(p => ({...p, [name]: e.target.value.replace(/\0/g,"")})); setPwdErr(p => ({...p,[name]:""})); }}
                                className={`sp-input-${isDark?"dark":"light"}`}
                                style={{ paddingRight:44 }}
                                maxLength={128}
                                placeholder="••••••••"
                              />
                              <button type="button" onClick={() => setShowPwd(p => ({...p,[toggleKey]:!p[toggleKey]}))}
                                className="absolute right-3 top-1/2 -translate-y-1/2"
                                style={{ background:"none", border:"none", cursor:"pointer", color:isDark?"rgba(255,255,255,.35)":"rgba(20,55,20,.4)" }}>
                                {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>
                            </div>
                            {pwdErr[name] && <p className="text-red-400 text-xs mt-1">{pwdErr[name]}</p>}
                          </div>
                        ))}
                        <button type="submit" disabled={isSaving} className="sp-save">
                          {isSaving ? t("common.saving") : t("settings.security.change")}
                        </button>
                      </form>
                    </div>
                  </Section>
                )}

                {/* ── DATA ── */}
                {activeTab === "data" && (
                  <>
                    <Section titleKey="settings.data.title" descKey="settings.data.description">
                      {[
                        { icon:Download, titleKey:"settings.data.export", descKey:"settings.data.exportDesc", btnKey:"settings.data.exportBtn", accent:"#4ade80" },
                        { icon:Upload,   titleKey:"settings.data.import", descKey:"settings.data.importDesc", btnKey:"settings.data.importBtn", accent:"#22d3ee" },
                      ].map(({ icon:Icon, titleKey, descKey, btnKey, accent }) => (
                        <div key={titleKey} className="flex items-center justify-between gap-4 py-4"
                          style={{ borderBottom:`1px solid ${isDark?"rgba(255,255,255,.06)":"rgba(34,197,94,.1)"}` }}>
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                              style={{ background:`${accent}18`, border:`1px solid ${accent}30` }}>
                              <Icon className="w-5 h-5" style={{ color:accent }} />
                            </div>
                            <div>
                              <div className="text-sm font-semibold" style={{ color:isDark?"rgba(255,255,255,.82)":"#1a3d20" }}>{t(titleKey)}</div>
                              <div className="text-xs" style={{ color:isDark?"rgba(255,255,255,.38)":"rgba(20,55,20,.5)" }}>{t(descKey)}</div>
                            </div>
                          </div>
                          <button className="sp-save text-xs px-4 py-2 rounded-xl" onClick={() => showToast("success", "Done!")}>
                            {t(btnKey)}
                          </button>
                        </div>
                      ))}
                    </Section>

                    {/* Danger zone */}
                    <div className="rounded-2xl p-6" style={{ border:"1.5px solid rgba(239,68,68,.25)", background:"rgba(239,68,68,.04)" }}>
                      <h2 className="font-bold text-base mb-1" style={{ fontFamily:"Syne,sans-serif", color:"#f87171" }}>
                        {t("settings.dangerZone.title")}
                      </h2>
                      <p className="text-sm mb-4" style={{ color:isDark?"rgba(255,255,255,.45)":"rgba(20,55,20,.5)" }}>
                        {t("settings.dangerZone.description")}
                      </p>
                      <div className="flex items-center justify-between flex-wrap gap-3 py-3"
                        style={{ borderTop:"1px solid rgba(239,68,68,.15)" }}>
                        <div>
                          <div className="text-sm font-medium text-red-400">{t("settings.dangerZone.deleteAccount")}</div>
                          <div className="text-xs mt-0.5" style={{ color:isDark?"rgba(255,255,255,.38)":"rgba(20,55,20,.45)" }}>{t("settings.dangerZone.deleteWarning")}</div>
                        </div>
                        <button className="sp-danger" onClick={() => showToast("error", t("settings.dangerZone.deleteWarning"))}>
                          <Trash2 className="w-3.5 h-3.5 inline mr-1.5" />{t("settings.dangerZone.deleteBtn")}
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