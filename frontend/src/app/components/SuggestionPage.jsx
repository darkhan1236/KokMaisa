import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, CheckCircle2, Lightbulb, Send } from "lucide-react";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { useTheme } from "@/contexts/ThemeContext";

const API = "/api";

const STYLE = `
.sg-root{min-height:100vh;padding:22px 16px 52px;font-family:'DM Sans',sans-serif;}
.sg-d{background:#061309;color:#fff;}
.sg-l{background:#f5fcf2;color:#1a3d20;}
.sg-wrap{max-width:860px;margin:0 auto;}
.sg-top{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:36px;}
.sg-card{border-radius:18px;padding:28px;}
.sg-card-d{background:rgba(255,255,255,.045);border:1px solid rgba(255,255,255,.09);}
.sg-card-l{background:#fff;border:1px solid rgba(34,197,94,.14);box-shadow:0 12px 36px rgba(34,197,94,.09);}
.sg-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;}
.sg-field-full{grid-column:1/-1;}
.sg-label{display:block;font-size:12px;font-weight:700;margin-bottom:7px;}
.sg-input{width:100%;border-radius:12px;padding:11px 13px;font-size:14px;outline:none;}
.sg-input-d{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.13);color:#fff;color-scheme:dark;}
.sg-input-l{background:#f8fdf8;border:1px solid rgba(34,197,94,.22);color:#1a3d20;color-scheme:light;}
.sg-input-d option{background:#0b1d10;color:#f4fff6;}
.sg-input-l option{background:#ffffff;color:#1a3d20;}
.sg-input:focus{border-color:#22c55e;box-shadow:0 0 0 3px rgba(34,197,94,.12);}
.sg-btn{border:none;border-radius:12px;padding:12px 18px;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:8px;background:linear-gradient(135deg,#22c55e,#0d9488);color:#fff;}
.sg-btn:disabled{opacity:.65;cursor:not-allowed;}
.sg-link{display:inline-flex;align-items:center;gap:8px;text-decoration:none;font-size:14px;font-weight:600;}
.sg-link-d{color:rgba(255,255,255,.7);}
.sg-link-l{color:#166534;}
.sg-note{border-radius:12px;padding:12px 14px;font-size:14px;margin-top:14px;}
.sg-ok{background:rgba(34,197,94,.12);border:1px solid rgba(34,197,94,.25);color:#22c55e;}
.sg-err{background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.2);color:#ef4444;}
@media(max-width:640px){
  .sg-card{padding:20px;}
  .sg-grid{grid-template-columns:1fr;}
  .sg-top{margin-bottom:24px;}
}
`;

export default function SuggestionPage() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const d = theme === "dark";
  const [form, setForm] = useState({ name: "", email: "", category: "general", message: "" });
  const [busy, setBusy] = useState(false);
  const [ok, setOk] = useState(false);
  const [err, setErr] = useState("");

  const inputCls = `sg-input ${d ? "sg-input-d" : "sg-input-l"}`;
  const textColor = d ? "rgba(255,255,255,.58)" : "rgba(20,55,20,.62)";
  const labelColor = d ? "rgba(255,255,255,.72)" : "rgba(20,55,20,.72)";

  const update = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
    setOk(false);
    setErr("");
  };

  async function submit(e) {
    e.preventDefault();
    setErr("");
    setOk(false);
    const message = form.message.trim();
    if (message.length < 10) {
      setErr(t("suggestions.errorShort"));
      return;
    }
    setBusy(true);
    try {
      const payload = {
        name: form.name.trim() || null,
        email: form.email.trim() || null,
        category: form.category,
        message,
      };
      const res = await fetch(`${API}/suggestions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("submit failed");
      setForm({ name: "", email: "", category: "general", message: "" });
      setOk(true);
    } catch {
      setErr(t("suggestions.errorSubmit"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <style>{STYLE}</style>
      <div className={`sg-root ${d ? "sg-d" : "sg-l"}`}>
        <div className="sg-wrap">
          <div className="sg-top">
            <Link to="/" className={`sg-link ${d ? "sg-link-d" : "sg-link-l"}`}>
              <ArrowLeft className="w-4 h-4" />
              {t("nav.backToHome")}
            </Link>
            <LanguageSwitcher />
          </div>

          <div className={`sg-card ${d ? "sg-card-d" : "sg-card-l"}`}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
              <div style={{ width: 44, height: 44, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg,#22c55e,#0d9488)" }}>
                <Lightbulb className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 style={{ fontFamily: "Syne,sans-serif", fontWeight: 800, fontSize: "clamp(26px,5vw,42px)", lineHeight: 1.05 }}>
                  {t("suggestions.title")}
                </h1>
                <p style={{ color: textColor, marginTop: 6, lineHeight: 1.55 }}>{t("suggestions.subtitle")}</p>
              </div>
            </div>

            <form onSubmit={submit} className="sg-grid">
              <div>
                <label className="sg-label" style={{ color: labelColor }}>{t("suggestions.name")}</label>
                <input className={inputCls} value={form.name} maxLength={120} onChange={e => update("name", e.target.value)} placeholder={t("suggestions.namePlaceholder")} />
              </div>
              <div>
                <label className="sg-label" style={{ color: labelColor }}>{t("suggestions.email")}</label>
                <input className={inputCls} type="email" value={form.email} maxLength={255} onChange={e => update("email", e.target.value)} placeholder={t("suggestions.emailPlaceholder")} />
              </div>
              <div className="sg-field-full">
                <label className="sg-label" style={{ color: labelColor }}>{t("suggestions.category")}</label>
                <select className={inputCls} value={form.category} onChange={e => update("category", e.target.value)}>
                  {["general", "usability", "feature", "bug", "content"].map(category => (
                    <option key={category} value={category}>{t(`suggestions.categories.${category}`)}</option>
                  ))}
                </select>
              </div>
              <div className="sg-field-full">
                <label className="sg-label" style={{ color: labelColor }}>{t("suggestions.message")}</label>
                <textarea className={inputCls} rows={8} minLength={10} maxLength={2000} required value={form.message} onChange={e => update("message", e.target.value)} placeholder={t("suggestions.messagePlaceholder")} style={{ resize: "vertical", lineHeight: 1.55 }} />
                <div style={{ textAlign: "right", color: textColor, fontSize: 12, marginTop: 6 }}>{form.message.length}/2000</div>
              </div>
              <div className="sg-field-full" style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12 }}>
                <button className="sg-btn" disabled={busy}>
                  {ok ? <CheckCircle2 className="w-4 h-4" /> : <Send className="w-4 h-4" />}
                  {busy ? t("common.loading") : t("suggestions.submit")}
                </button>
                <span style={{ color: textColor, fontSize: 13 }}>{t("suggestions.privacy")}</span>
              </div>
            </form>

            {ok && <div className="sg-note sg-ok">{t("suggestions.success")}</div>}
            {err && <div className="sg-note sg-err">{err}</div>}
          </div>
        </div>
      </div>
    </>
  );
}
