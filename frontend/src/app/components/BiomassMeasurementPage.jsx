// src/app/components/BiomassMeasurementPage.jsx
// KokMaisa 2025 — Biomass: fixed agronomic formulas, result announcement modal
// i18n: all strings via t(). Dark/light. Responsive. Secure.

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/app/components/Header";
import { deriveMetrics as deriveBiomassMetrics } from "@/app/utils/biomassMetrics";
import { apiErrorMessage } from "@/app/utils/apiErrors";
import {
  Upload, X, Check, Loader2, Camera,
  TrendingUp, TrendingDown, Minus, Leaf,
  BarChart3, Clock, CheckCircle2, XCircle,
  AlertCircle, Trash2, RefreshCw, Wheat,
  Sun, Wind, ArrowRight,
  Activity, Zap, Shield, Eye, Calculator,
  ChevronDown, ChevronUp, Minus as MinusIcon, Plus,
  Sparkles, Star, FileText, ClipboardCheck, Download,
} from "lucide-react";

/* ─── Styles ──────────────────────────────────────────────────────────────── */
const S = `
  @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Cabinet+Grotesk:wght@400;500;700;800;900&family=DM+Sans:wght@300;400;500;600&display=swap');

  *, *::before, *::after { box-sizing: border-box; }

  .bm { font-family: 'DM Sans', sans-serif; min-height: 100vh; transition: background .4s, color .4s; }
  .bm-d { background: #070e09; color: #e8f5ea; }
  .bm-l { background: #f7faf4; color: #111a12; }

  /* ── HERO ── */
  .bm-hero {
    position: relative; overflow: hidden;
    padding: 110px 0 72px;
    display: flex; align-items: flex-end;
  }
  .bm-hero::before {
    content: '';
    position: absolute; inset: 0;
    background: linear-gradient(160deg, #0b2211 0%, #0d3318 40%, #071a0c 70%, #050d07 100%);
  }
  .bm-l .bm-hero::before {
    background:
      radial-gradient(circle at top left, rgba(34,197,94,.16), transparent 34%),
      radial-gradient(circle at bottom right, rgba(34,211,238,.12), transparent 28%),
      linear-gradient(160deg, #f3fbf2 0%, #e4f6e6 48%, #f9fcf7 100%);
  }
  .bm-hero::after {
    content: '';
    position: absolute; inset: 0;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.055'/%3E%3C/svg%3E");
    pointer-events: none;
  }

  .bm-hero-inner { position: relative; z-index: 1; width: 100%; max-width: 1200px; margin: 0 auto; padding: 0 24px; }

  .bm-hero-badge {
    display: inline-flex; align-items: center; gap: 7px;
    padding: 5px 14px; border-radius: 999px; margin-bottom: 22px;
    background: rgba(74,222,128,.12); border: 1px solid rgba(74,222,128,.28);
    font-size: 11px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; color: #4ade80;
  }
  .bm-l .bm-hero-badge {
    background: rgba(22,163,74,.08);
    border-color: rgba(22,163,74,.2);
    color: #15803d;
  }

  .bm-hero-title {
    font-family: 'Cabinet Grotesk', sans-serif;
    font-size: clamp(2.4rem, 6vw, 5.5rem);
    font-weight: 900; line-height: 1.14; letter-spacing: 0;
    color: #fff; margin: 0 0 10px;
    overflow: visible;
  }
  .bm-l .bm-hero-title { color: #102316; }
  .bm-hero-title em {
    font-family: 'Instrument Serif', serif;
    font-style: italic; font-weight: 400;
    display: inline-block;
    line-height: 1.18;
    padding-bottom: .08em;
    background: linear-gradient(90deg,#4ade80,#22d3ee);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  .bm-hero-sub {
    font-size: 15px; color: rgba(255,255,255,.52); max-width: 480px; line-height: 1.65; margin-bottom: 32px;
  }
  .bm-l .bm-hero-sub { color: rgba(17,26,18,.62); }

  /* ── Pasture selector pills ── */
  .bm-pills { display: flex; flex-wrap: wrap; gap: 8px; }
  .bm-pill {
    padding: 8px 18px; border-radius: 999px; font-size: 13px; font-weight: 600; cursor: pointer;
    border: 1.5px solid rgba(255,255,255,.15); background: rgba(255,255,255,.06);
    color: rgba(255,255,255,.65); transition: all .2s;
  }
  .bm-pill:hover { border-color: rgba(74,222,128,.4); color: #fff; background: rgba(74,222,128,.1); }
  .bm-pill.sel { border-color: #4ade80; background: rgba(74,222,128,.16); color: #fff; }
  .bm-l .bm-pill {
    border-color: rgba(22,163,74,.14);
    background: rgba(255,255,255,.82);
    color: rgba(17,26,18,.74);
  }
  .bm-l .bm-pill:hover {
    border-color: rgba(34,197,94,.34);
    color: #14532d;
    background: rgba(34,197,94,.08);
  }
  .bm-l .bm-pill.sel {
    border-color: #22c55e;
    background: linear-gradient(135deg, #22c55e, #14b8a6);
    color: #fff;
  }

  /* ── MAIN LAYOUT ── */
  .bm-body { max-width: 1200px; margin: 0 auto; padding: 36px 24px 80px; }

  /* ── CARD ── */
  .bm-card { border-radius: 24px; overflow: hidden; }
  .bm-card-d { background: rgba(255,255,255,.03); border: 1px solid rgba(255,255,255,.08); }
  .bm-card-l { background: #fff; border: 1px solid rgba(34,197,94,.14); box-shadow: 0 2px 24px rgba(34,197,94,.07); }

  /* ── UPLOAD ZONE ── */
  .bm-dropzone {
    border-radius: 18px; border: 2px dashed; cursor: pointer;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    gap: 12px; text-align: center; min-height: 200px; padding: 32px;
    transition: all .25s; position: relative;
  }
  .bm-dropzone-d { border-color: rgba(255,255,255,.15); background: rgba(255,255,255,.02); }
  .bm-dropzone-d:hover { border-color: #4ade80; background: rgba(74,222,128,.06); }
  .bm-dropzone-l { border-color: rgba(34,197,94,.3); background: rgba(34,197,94,.03); }
  .bm-dropzone-l:hover { border-color: #22c55e; background: rgba(34,197,94,.07); }
  .bm-dropzone.active-drop { border-color: #4ade80 !important; background: rgba(74,222,128,.1) !important; }

  /* ── SECTION LABEL ── */
  .bm-label {
    font-size: 10px; font-weight: 800; letter-spacing: .18em; text-transform: uppercase;
    margin-bottom: 14px; display: flex; align-items: center; gap: 7px;
  }
  .bm-label-d { color: rgba(255,255,255,.3); }
  .bm-label-l { color: rgba(17,26,18,.4); }
  .bm-label-dot { width: 5px; height: 5px; border-radius: 50%; background: #4ade80; flex-shrink: 0; }

  /* ── TOTAL BIOMASS BANNER ── */
  .bm-total-banner {
    border-radius: 18px; padding: 18px 22px;
    display: flex; align-items: center; gap: 16px; flex-wrap: wrap;
    margin-bottom: 12px;
  }
  .bm-total-banner-d { background: linear-gradient(135deg,rgba(34,197,94,.12) 0%,rgba(34,211,238,.08) 100%); border: 1px solid rgba(74,222,128,.22); }
  .bm-total-banner-l { background: linear-gradient(135deg,rgba(34,197,94,.08) 0%,rgba(34,211,238,.05) 100%); border: 1px solid rgba(34,197,94,.2); box-shadow: 0 2px 14px rgba(34,197,94,.06); }

  /* ── RESULT HERO CARD ── */
  .bm-result-hero {
    border-radius: 24px; padding: 32px;
    position: relative; overflow: hidden;
  }
  .bm-result-hero-d { background: linear-gradient(135deg,#0b2211 0%,#0a1e2a 100%); border: 1px solid rgba(74,222,128,.18); }
  .bm-result-hero-l { background: linear-gradient(135deg,#e8f5ea 0%,#e0f4f9 100%); border: 1px solid rgba(34,197,94,.2); }

  /* ── BIG NUMBER ── */
  .bm-big-num {
    font-family: 'Cabinet Grotesk', sans-serif;
    font-size: clamp(3.5rem, 8vw, 6rem);
    font-weight: 900; line-height: 1; letter-spacing: -.04em;
    background: linear-gradient(135deg,#4ade80,#22d3ee);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  /* ── INSIGHT CARD ── */
  .bm-insight {
    border-radius: 18px; padding: 20px 22px;
    display: flex; gap: 14px; align-items: flex-start;
    transition: transform .2s;
  }
  .bm-insight:hover { transform: translateY(-2px); }
  .bm-insight-d { background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.07); }
  .bm-insight-l { background: #fff; border: 1px solid rgba(34,197,94,.12); box-shadow: 0 2px 14px rgba(34,197,94,.06); }

  .bm-insight-icon {
    width: 42px; height: 42px; border-radius: 13px; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
  }

  /* ── PROGRESS ── */
  .bm-track { height: 6px; border-radius: 999px; overflow: hidden; margin: 8px 0; }
  .bm-track-d { background: rgba(255,255,255,.08); }
  .bm-track-l { background: rgba(34,197,94,.12); }
  .bm-fill { height: 100%; border-radius: 999px; transition: width 1.2s cubic-bezier(.22,1,.36,1); }

  /* ── STAT CHIP ── */
  .bm-chip {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 4px 10px; border-radius: 999px; font-size: 11px; font-weight: 700;
  }

  /* ── WINTER CALCULATOR ── */
  .bm-calc {
    border-radius: 24px; overflow: hidden; margin-bottom: 20px;
  }
  .bm-calc-d { background: rgba(255,255,255,.03); border: 1px solid rgba(255,255,255,.08); }
  .bm-calc-l { background: #fff; border: 1px solid rgba(34,197,94,.14); box-shadow: 0 2px 24px rgba(34,197,94,.07); }

  .bm-calc-header {
    padding: 22px 24px 18px;
    display: flex; align-items: center; justify-content: space-between; gap: 12px;
    flex-wrap: wrap;
  }
  .bm-calc-header-d { border-bottom: 1px solid rgba(255,255,255,.06); }
  .bm-calc-header-l { border-bottom: 1px solid rgba(34,197,94,.1); }

  .bm-calc-body { padding: 20px 24px; }

  /* Animal row */
  .bm-animal-row {
    display: grid; grid-template-columns: 36px 1fr auto auto; align-items: center;
    gap: 12px; padding: 12px 0; border-bottom: 1px solid;
  }
  .bm-animal-row:last-of-type { border-bottom: none; }
  .bm-animal-row-d { border-color: rgba(255,255,255,.05); }
  .bm-animal-row-l { border-color: rgba(34,197,94,.08); }

  /* Stepper */
  .bm-stepper {
    display: flex; align-items: center; gap: 4px;
    background: rgba(74,222,128,.08); border-radius: 10px;
    padding: 3px; border: 1px solid rgba(74,222,128,.18);
  }
  .bm-stepper-btn {
    width: 26px; height: 26px; border-radius: 7px; border: none; cursor: pointer;
    display: flex; align-items: center; justify-content: center; transition: background .15s;
    background: transparent;
  }
  .bm-stepper-btn-d { color: rgba(255,255,255,.7); }
  .bm-stepper-btn-d:hover { background: rgba(255,255,255,.12); }
  .bm-stepper-btn-l { color: rgba(17,26,18,.7); }
  .bm-stepper-btn-l:hover { background: rgba(34,197,94,.12); }
  .bm-stepper-val {
    min-width: 38px; text-align: center; font-family: 'Cabinet Grotesk', sans-serif;
    font-size: 15px; font-weight: 800; outline: none; border: none; background: transparent;
    cursor: text;
  }
  .bm-stepper-val-d { color: #fff; }
  .bm-stepper-val-l { color: #111a12; }

  /* Result strip */
  .bm-calc-result {
    border-radius: 18px; padding: 20px 22px; margin-top: 18px;
    display: grid; grid-template-columns: repeat(auto-fit,minmax(160px,1fr)); gap: 12px;
  }
  .bm-calc-result-ok-d { background: rgba(34,197,94,.08); border: 1px solid rgba(34,197,94,.2); }
  .bm-calc-result-ok-l { background: rgba(34,197,94,.06); border: 1px solid rgba(34,197,94,.18); }
  .bm-calc-result-err-d { background: rgba(239,68,68,.08); border: 1px solid rgba(239,68,68,.2); }
  .bm-calc-result-err-l { background: rgba(239,68,68,.06); border: 1px solid rgba(239,68,68,.18); }

  /* AI agronomist report */
  .bm-report {
    border-radius: 24px; overflow: hidden; margin-bottom: 20px;
    font-family: Arial, "Segoe UI", "Noto Sans", sans-serif;
  }
  .bm-report * { font-family: Arial, "Segoe UI", "Noto Sans", sans-serif !important; }
  .bm-report-d { background: rgba(255,255,255,.035); border: 1px solid rgba(255,255,255,.08); }
  .bm-report-l { background: #fff; border: 1px solid rgba(34,197,94,.14); box-shadow: 0 2px 24px rgba(34,197,94,.07); }
  .bm-report-head {
    padding: 22px 24px; display: flex; align-items: flex-start; justify-content: space-between;
    gap: 16px; border-bottom: 1px solid;
  }
  .bm-report-head-d { border-bottom-color: rgba(255,255,255,.07); }
  .bm-report-head-l { border-bottom-color: rgba(34,197,94,.1); }
  .bm-report-body { padding: 22px 24px 24px; }
  .bm-report-grid { display: grid; grid-template-columns: repeat(auto-fit,minmax(160px,1fr)); gap: 10px; margin-bottom: 18px; }
  .bm-report-stat { border-radius: 16px; padding: 14px 15px; }
  .bm-report-stat-d { background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.07); }
  .bm-report-stat-l { background: #f5fbf6; border: 1px solid rgba(34,197,94,.1); }
  .bm-report-box { border-radius: 18px; padding: 16px 18px; margin-bottom: 12px; }
  .bm-report-box-d { background: rgba(255,255,255,.035); border: 1px solid rgba(255,255,255,.07); }
  .bm-report-box-l { background: #f8fdf8; border: 1px solid rgba(34,197,94,.1); }
  .bm-report-list { display: grid; gap: 8px; margin-top: 10px; }
  .bm-report-row {
    display: grid; grid-template-columns: minmax(105px,.8fr) repeat(4,minmax(74px,1fr));
    gap: 8px; align-items: center; padding: 10px 0; border-bottom: 1px solid;
    font-size: 12px;
  }
  .bm-report-row:last-child { border-bottom: none; }
  .bm-report-row-d { border-bottom-color: rgba(255,255,255,.06); }
  .bm-report-row-l { border-bottom-color: rgba(34,197,94,.08); }
  .bm-download-btn {
    border: none; border-radius: 13px; padding: 10px 14px; cursor: pointer;
    display: inline-flex; align-items: center; justify-content: center; gap: 7px;
    font-family: 'DM Sans',sans-serif; font-size: 13px; font-weight: 700;
    background: linear-gradient(135deg,#22c55e,#0d9488); color: #fff;
  }
  .bm-download-btn:disabled { opacity: .65; cursor: wait; }
  .bm-report-table { overflow-x: auto; -webkit-overflow-scrolling: touch; }
  .bm-pdf-export .bm-report,
  .bm-pdf-export .bm-report-d,
  .bm-pdf-export .bm-report-l {
    background: #ffffff !important;
    border: 1px solid #d9eadc !important;
    box-shadow: none !important;
    color: #111827 !important;
  }
  .bm-pdf-export .bm-report-head,
  .bm-pdf-export .bm-report-head-d,
  .bm-pdf-export .bm-report-head-l {
    background: #ffffff !important;
    border-bottom-color: #d9eadc !important;
  }
  .bm-pdf-export .bm-report-box,
  .bm-pdf-export .bm-report-box-d,
  .bm-pdf-export .bm-report-box-l,
  .bm-pdf-export .bm-report-stat,
  .bm-pdf-export .bm-report-stat-d,
  .bm-pdf-export .bm-report-stat-l {
    background: #f8fdf8 !important;
    border-color: #d9eadc !important;
  }
  .bm-pdf-export .bm-report *,
  .bm-pdf-export .bm-report h2,
  .bm-pdf-export .bm-report p,
  .bm-pdf-export .bm-report span,
  .bm-pdf-export .bm-report strong,
  .bm-pdf-export .bm-report div {
    color: #111827 !important;
    text-shadow: none !important;
    box-shadow: none !important;
  }
  .bm-pdf-export .bm-report svg { color: #16a34a !important; }
  .bm-pdf-export .bm-download-btn { display: none !important; }
  @media(max-width:640px) {
    .bm-report-head { padding: 18px; flex-direction: column; }
    .bm-report-body { padding: 18px; }
    .bm-report-row { grid-template-columns: 1fr; gap: 6px; padding: 12px 0; }
    .bm-report-row-head { display: none; }
    .bm-report-row > span,
    .bm-report-row > strong {
      display: flex; justify-content: space-between; gap: 12px; align-items: baseline;
      min-width: 0; overflow-wrap: anywhere;
    }
    .bm-report-row > span::before,
    .bm-report-row > strong::before {
      content: attr(data-label); color: rgba(17,26,18,.48); font-weight: 700; flex-shrink: 0;
    }
    .bm-report-d .bm-report-row > span::before,
    .bm-report-d .bm-report-row > strong::before { color: rgba(232,245,234,.48); }
  }
  @media print {
    .bm-hero, .bm-dropzone, .bm-calc, .bm-hrow button, .bm-download-btn, header { display: none !important; }
    .bm, .bm-d, .bm-l { background: #fff !important; color: #111 !important; }
    .bm-report { box-shadow: none !important; border: 1px solid #d9eadc !important; break-inside: avoid; }
  }

  .bm-calc-metric { text-align: center; }
  .bm-calc-metric-val {
    font-family: 'Cabinet Grotesk', sans-serif;
    font-size: clamp(1.4rem, 3vw, 2rem); font-weight: 900; line-height: 1.1;
    margin-bottom: 3px;
  }
  .bm-calc-metric-lbl { font-size: 11px; font-weight: 600; letter-spacing: .05em; opacity: .65; }

  /* Calc input */
  .bm-cinp {
    padding: 10px 14px; border-radius: 11px; font-size: 14px; outline: none;
    font-family: 'DM Sans', sans-serif; width: 100%; transition: all .2s;
  }
  .bm-cinp-d { background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.12); color: #fff; }
  .bm-cinp-d:focus { border-color: rgba(74,222,128,.5); background: rgba(255,255,255,.09); }
  .bm-cinp-l { background: #f4faf5; border: 1px solid rgba(34,197,94,.22); color: #111a12; }
  .bm-cinp-l:focus { border-color: #22c55e; box-shadow: 0 0 0 3px rgba(34,197,94,.08); background: #fff; }

  /* ── HISTORY ROW ── */
  .bm-hrow {
    padding: 14px 0; border-bottom: 1px solid;
    display: flex; align-items: flex-start; gap: 12px;
  }
  .bm-hrow:last-child { border-bottom: none; }
  .bm-hrow-d { border-bottom-color: rgba(255,255,255,.06); }
  .bm-hrow-l { border-bottom-color: rgba(34,197,94,.08); }

  /* ── SUBMIT BTN ── */
  .bm-submit {
    background: linear-gradient(135deg,#22c55e,#0d9488);
    color: #fff; border: none; border-radius: 14px;
    padding: 13px 28px; font-size: 14px; font-weight: 700;
    font-family: 'DM Sans',sans-serif; cursor: pointer;
    display: flex; align-items: center; gap: 8px;
    transition: transform .2s, box-shadow .2s; width: 100%;
    justify-content: center;
  }
  .bm-submit:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 10px 28px rgba(34,197,94,.38); }
  .bm-submit:disabled { opacity: .55; cursor: not-allowed; }

  /* ── SELECT / TEXTAREA ── */
  .bm-select-d { background:rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.12); color:#e8f5ea; border-radius:12px; padding:11px 14px; font-size:14px; outline:none; width:100%; font-family:'DM Sans',sans-serif; }
  .bm-select-l { background:#fff; border:1px solid rgba(34,197,94,.22); color:#111a12; border-radius:12px; padding:11px 14px; font-size:14px; outline:none; width:100%; font-family:'DM Sans',sans-serif; }

  /* ── TOAST ── */
  @keyframes bmSlide { from{opacity:0;transform:translateX(24px)} to{opacity:1;transform:translateX(0)} }
  .bm-toast { position:fixed; bottom:24px; right:24px; z-index:300; padding:14px 18px; border-radius:16px; display:flex; align-items:center; gap:10px; font-size:13px; font-weight:600; animation:bmSlide .35s cubic-bezier(.22,1,.36,1) both; box-shadow:0 8px 32px rgba(0,0,0,.2); max-width:340px; }
  .bm-toast-ok { background:#022c0f; border:1px solid rgba(74,222,128,.3); color:#4ade80; }
  .bm-toast-err { background:#1f0707; border:1px solid rgba(239,68,68,.3); color:#f87171; }

  /* ── MODAL ── */
  .bm-ov { position:fixed; inset:0; background:rgba(0,0,0,.72); backdrop-filter:blur(6px); z-index:200; display:flex; align-items:center; justify-content:center; padding:20px; }
  .bm-modal-d { background:#0b1a0d; border:1px solid rgba(255,255,255,.1); }
  .bm-modal-l { background:#fff; border:1px solid rgba(34,197,94,.2); }
  .bm-modal { width:100%; max-width:480px; border-radius:24px; padding:28px; animation:bmSlide .3s cubic-bezier(.22,1,.36,1) both; max-height:90vh; overflow-y:auto; }

  /* ── RESULT ANNOUNCEMENT MODAL ── */
  @keyframes bmResultIn {
    from { opacity:0; transform:scale(.88) translateY(28px); }
    to   { opacity:1; transform:scale(1) translateY(0); }
  }
  @keyframes bmPulseGlow {
    0%,100% { opacity:.45; transform:scale(1); }
    50%      { opacity:.9; transform:scale(1.08); }
  }
  @keyframes bmRingPulse {
    0%   { transform:scale(1);   opacity:.6; }
    100% { transform:scale(1.8); opacity:0; }
  }
  @keyframes bmBadgeIn {
    from { opacity:0; transform:translateY(-10px) scale(.9); }
    to   { opacity:1; transform:translateY(0) scale(1); }
  }
  @keyframes bmNumIn {
    from { opacity:0; transform:translateY(20px); }
    to   { opacity:1; transform:translateY(0); }
  }
  @keyframes bmGridIn {
    from { opacity:0; transform:translateY(14px); }
    to   { opacity:1; transform:translateY(0); }
  }

  .bm-result-ov {
    position:fixed; inset:0;
    background:rgba(0,0,0,.92);
    backdrop-filter:blur(20px);
    z-index:500;
    display:flex; align-items:center; justify-content:center;
    padding:20px;
  }

  .bm-result-card {
    border-radius:32px;
    padding:52px 44px 40px;
    width:100%; max-width:500px;
    animation:bmResultIn .6s cubic-bezier(.22,1,.36,1) both;
    position:relative; overflow:hidden;
    text-align:center;
  }
  .bm-result-card-d {
    background:linear-gradient(150deg,#040f07 0%,#061610 50%,#040d08 100%);
    border:1px solid rgba(74,222,128,.28);
    box-shadow:0 0 100px rgba(34,197,94,.18), 0 0 40px rgba(34,211,238,.08), 0 40px 100px rgba(0,0,0,.9);
  }
  .bm-result-card-l {
    background:linear-gradient(150deg,#eafaed 0%,#d8f4de 50%,#e6faea 100%);
    border:1px solid rgba(34,197,94,.35);
    box-shadow:0 0 80px rgba(34,197,94,.18), 0 32px 80px rgba(0,0,0,.18);
  }

  .bm-result-glow-a {
    position:absolute; top:-80px; left:-80px;
    width:280px; height:280px; border-radius:50%;
    background:radial-gradient(circle, rgba(34,197,94,.22) 0%, transparent 70%);
    animation:bmPulseGlow 3.5s ease-in-out infinite;
    pointer-events:none;
  }
  .bm-result-glow-b {
    position:absolute; bottom:-60px; right:-60px;
    width:220px; height:220px; border-radius:50%;
    background:radial-gradient(circle, rgba(34,211,238,.18) 0%, transparent 70%);
    animation:bmPulseGlow 3.5s ease-in-out infinite 1.75s;
    pointer-events:none;
  }

  .bm-result-badge {
    display:inline-flex; align-items:center; gap:7px;
    padding:7px 18px; border-radius:999px;
    background:rgba(34,197,94,.14);
    border:1px solid rgba(74,222,128,.4);
    animation:bmBadgeIn .5s cubic-bezier(.22,1,.36,1) .1s both;
    margin-bottom:28px;
  }

  .bm-result-num-wrap {
    position:relative; display:inline-block;
    animation:bmNumIn .6s cubic-bezier(.22,1,.36,1) .22s both;
    margin-bottom:6px;
  }
  .bm-result-ring {
    position:absolute; inset:-14px; border-radius:50%;
    border:2px solid rgba(74,222,128,.5);
    animation:bmRingPulse 2.4s ease-out infinite;
    pointer-events:none;
  }
  .bm-result-ring-2 {
    position:absolute; inset:-14px; border-radius:50%;
    border:2px solid rgba(34,211,238,.3);
    animation:bmRingPulse 2.4s ease-out infinite .8s;
    pointer-events:none;
  }
  .bm-result-big {
    font-family:'Cabinet Grotesk',sans-serif;
    font-size:clamp(4.5rem,16vw,8rem);
    font-weight:900; line-height:1;
    letter-spacing:-.04em;
    background:linear-gradient(135deg,#4ade80 20%,#22d3ee 80%);
    -webkit-background-clip:text; -webkit-text-fill-color:transparent;
    background-clip:text;
  }

  .bm-result-rating {
    display:inline-flex; align-items:center; gap:9px;
    padding:11px 22px; border-radius:16px;
    animation:bmBadgeIn .5s cubic-bezier(.22,1,.36,1) .35s both;
    margin-bottom:32px;
  }

  .bm-result-grid {
    display:grid; grid-template-columns:1fr 1fr;
    gap:10px; margin-bottom:28px;
    animation:bmGridIn .5s cubic-bezier(.22,1,.36,1) .45s both;
  }
  .bm-result-metric {
    border-radius:18px; padding:14px 16px;
    text-align:left; backdrop-filter:blur(8px);
  }
  .bm-result-metric-d { background:rgba(255,255,255,.05); border:1px solid rgba(255,255,255,.08); }
  .bm-result-metric-l { background:rgba(255,255,255,.75); border:1px solid rgba(34,197,94,.15); }

  .bm-result-btns {
    display:flex; gap:10px;
    animation:bmGridIn .5s cubic-bezier(.22,1,.36,1) .55s both;
  }
  .bm-result-btn-secondary {
    flex:1; padding:13px 16px; border-radius:14px; border:none; cursor:pointer;
    font-family:'DM Sans',sans-serif; font-size:14px; font-weight:600;
    transition:background .15s;
    display:flex; align-items:center; justify-content:center; gap:7px;
  }
  .bm-result-btn-secondary-d { background:rgba(255,255,255,.08); color:rgba(232,245,234,.75); }
  .bm-result-btn-secondary-d:hover { background:rgba(255,255,255,.13); }
  .bm-result-btn-secondary-l { background:rgba(17,26,18,.07); color:rgba(17,26,18,.7); }
  .bm-result-btn-secondary-l:hover { background:rgba(17,26,18,.12); }

  @media(max-width:540px) {
    .bm-result-card { padding:36px 22px 28px; border-radius:24px; }
    .bm-result-big { font-size:4.5rem; }
    .bm-result-grid { grid-template-columns:1fr 1fr; gap:8px; }
  }

  /* ── SPIN ── */
  @keyframes bmSpin{to{transform:rotate(360deg)}}
  .bm-spin{animation:bmSpin 1s linear infinite;}

  /* ── ANIMATIONS ── */
  @keyframes bmFade{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
  .bm-a1{animation:bmFade .5s cubic-bezier(.22,1,.36,1) .05s both;}
  .bm-a2{animation:bmFade .5s cubic-bezier(.22,1,.36,1) .12s both;}
  .bm-a3{animation:bmFade .5s cubic-bezier(.22,1,.36,1) .20s both;}
  .bm-a4{animation:bmFade .5s cubic-bezier(.22,1,.36,1) .28s both;}
  .bm-a5{animation:bmFade .5s cubic-bezier(.22,1,.36,1) .36s both;}

  @media(max-width:768px){
    .bm-body{padding:24px 14px 60px;}
    .bm-hero{padding:90px 0 48px;}
    .bm-result-hero{padding:22px 18px;}
    .bm-big-num{font-size:3.5rem;}
    .bm-calc-body{padding:16px;}
    .bm-calc-header{padding:16px;}
    .bm-animal-row{grid-template-columns:30px 1fr auto auto;gap:8px;}
  }
  @media(max-width:480px){
    .bm-animal-row{grid-template-columns:28px 1fr auto;gap:6px;}
    .bm-animal-req{display:none;}
    .bm-calc-result{grid-template-columns:1fr 1fr;}
  }
`;

/* ─── ANIMAL DEFINITIONS ──────────────────────────────────────────────── */
const ANIMALS = [
  { key: "cow",   emoji: "🐄", dailyKg: 10.0, i18nKey: "biomass.calc.animals.cow"   },
  { key: "horse", emoji: "🐴", dailyKg: 12.0, i18nKey: "biomass.calc.animals.horse" },
  { key: "sheep", emoji: "🐑", dailyKg:  2.0, i18nKey: "biomass.calc.animals.sheep" },
  { key: "goat",  emoji: "🐐", dailyKg:  2.0, i18nKey: "biomass.calc.animals.goat"  },
  { key: "camel", emoji: "🐪", dailyKg: 15.0, i18nKey: "biomass.calc.animals.camel" },
];

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/* ─── FIXED AGRONOMIC FORMULAS ────────────────────────────────────────── */
/**
 * Derive all pasture metrics from biomass (c/ha).
 *
 * CALIBRATION for Kazakhstan steppes (FIXED):
 *   ≥ 5 c/ha   → moderate/positive (yellow-green)
 *   ≥ 7.5 c/ha → good (green, controlled grazing)
 *   ≥ 15 c/ha  → very high / excellent
 *
 *   Derived AI vegetation score (recalibrated):
 *     score = 0.12 + 0.04 × bm  (clamped 0.05–0.88)
 *     5 c/ha → 0.32  (grade C, moderate — acceptable)
 *     7.5 c/ha → 0.42  (grade B, good ✓)
 *     14 c/ha → 0.68  (grade A, excellent ✓)
 *
 *   Coverage formula (recalibrated):
 *     coverage = 55 + (bm - 5) × 6.5 for bm ≥ 5
 *     5 c/ha → 55%  (moderate — OK)
 *     7.5 c/ha → 71% (good ✓)
 *     12 c/ha → 97% (dense ✓)
 *
 *   Grazing threshold (relaxed):
 *     optimal  → bm ≥ 7.5 AND coverage ≥ 50%
 *     caution  → bm ≥  5 AND coverage ≥ 30%
 *     rest     → otherwise
 */
function deriveMetrics(biomass_c_ha, area_ha, t) {
  const bm = Math.max(0, biomass_c_ha);
  const ha = Math.max(0, area_ha || 1);

  // ── per-hectare figures ──
  const biomassKgHa = bm * 100; // kg/ha

  // Derived AI vegetation score — recalibrated for steppe conditions
  // 5 c/ha → 0.32 | 7.5 → 0.42 | 14 → 0.68 | 19 → 0.88 (capped)
  const ndvi = Math.min(0.88, Math.max(0.05, 0.12 + 0.04 * bm));

  // Vegetation coverage % — keep low biomass in the "bare/sparse" zone
  const coverage = bm >= 5
    ? Math.min(97, 55 + (bm - 5) * 6.5)
    : Math.max(5, bm * 10);

  // ── whole-pasture figures ──
  const totalBiomassKg   = biomassKgHa * ha;
  const usableBiomassKg  = totalBiomassKg;
  const usableForWinterKg = totalBiomassKg;

  // ── Vegetation score grade — thresholds recalibrated for steppe (lower than temperate) ──
  const ndviGrade =
    ndvi >= 0.65 ? { letter: "A", labelKey: "biomass.ndvi.excellent", color: "#22c55e", pct: 95 } :
    ndvi >= 0.42 ? { letter: "B", labelKey: "biomass.ndvi.good",      color: "#84cc16", pct: 72 } :
    ndvi >= 0.28 ? { letter: "C", labelKey: "biomass.ndvi.moderate",  color: "#fbbf24", pct: 50 } :
    ndvi >= 0.16 ? { letter: "D", labelKey: "biomass.ndvi.weak",      color: "#f97316", pct: 30 } :
                   { letter: "F", labelKey: "biomass.ndvi.critical",  color: "#ef4444", pct: 12 };

  // ── Biomass quality rating — recalibrated (5+ c/ha = positive) ──
  const biomassRating =
    bm >= 15 ? { labelKey: "biomass.rating.veryHigh", color: "#22c55e", tipKey: "biomass.rating.veryHighTip" } :
    bm >= 7.5 ? { labelKey: "biomass.rating.high",     color: "#4ade80", tipKey: "biomass.rating.highTip"     } :
    bm >=  5 ? { labelKey: "biomass.rating.moderate", color: "#84cc16", tipKey: "biomass.rating.moderateTip" } :
    bm >=  2 ? { labelKey: "biomass.rating.low",      color: "#f97316", tipKey: "biomass.rating.lowTip"      } :
               { labelKey: "biomass.rating.critical", color: "#ef4444", tipKey: "biomass.rating.criticalTip" };

  // ── Carrying capacity (cow equiv/ha for 30-day grazing) ──
  const grazingDays = 30;
  const cowsPerHa = Math.max(0, parseFloat(
    ((usableBiomassKg / ha) / (10 * grazingDays)).toFixed(1)
  ));

  // ── Days until rotation ──
  const benchmarkLoad = 5;
  const daysUntilRotation = usableBiomassKg > 0
    ? Math.max(0, Math.round((usableBiomassKg / ha) / (benchmarkLoad * 10)))
    : 0;

  // ── Grazing recommendation — relaxed thresholds ──
  const grazingRec =
    bm >= 7.5 && coverage >= 50
      ? { status: "optimal",  labelKey: "biomass.grazing.ready",   color: "#22c55e", icon: "✓" }
    : bm >=  5 && coverage >= 30
      ? { status: "caution",  labelKey: "biomass.grazing.caution", color: "#fbbf24", icon: "⚠" }
      : { status: "rest",     labelKey: "biomass.grazing.rest",    color: "#ef4444", icon: "✕" };

  // ── Coverage health label — recalibrated ──
  const coverageHealth =
    coverage >= 75 ? { labelKey: "biomass.cover.dense",  color: "#22c55e" } :
    coverage >= 50 ? { labelKey: "biomass.cover.good",   color: "#84cc16" } :
    coverage >= 30 ? { labelKey: "biomass.cover.sparse", color: "#fbbf24" } :
                     { labelKey: "biomass.cover.bare",   color: "#ef4444" };

  // ── Regrowth days ──
  const regrowthDays = ndvi >= 0.60 ? 18 : ndvi >= 0.42 ? 24 : ndvi >= 0.28 ? 32 : 45;

  return {
    biomassKgHa, totalBiomassKg, usableBiomassKg, usableForWinterKg,
    ndvi, coverage,
    ndviGrade, biomassRating,
    cowsPerHa, daysUntilRotation,
    grazingRec, coverageHealth,
    regrowthDays,
  };
}

/* ─── Winter fodder calculation ──────────────────────────────────────── */
function calcWinter(animalCounts, winterDays, availableKg) {
  let totalRequired = 0;
  const breakdown = ANIMALS.map((a) => {
    const count = animalCounts[a.key] || 0;
    const required = count * a.dailyKg * winterDays;
    totalRequired += required;
    return { ...a, count, required };
  });
  const surplus = availableKg - totalRequired;
  return { breakdown, totalRequired, surplus };
}

/* ─── Sub-components ──────────────────────────────────────────────────── */

function SectionLabel({ text, isDark }) {
  return (
    <div className={`bm-label ${isDark ? "bm-label-d" : "bm-label-l"}`}>
      <div className="bm-label-dot" />
      {text}
    </div>
  );
}

function InsightCard({ icon: Icon, iconBg, iconColor, title, value, sub, badge, badgeBg, badgeColor, progress, progressColor, isDark }) {
  return (
    <div className={`bm-insight ${isDark ? "bm-insight-d" : "bm-insight-l"}`}>
      <div className="bm-insight-icon" style={{ background: iconBg }}>
        <Icon style={{ width: 18, height: 18, color: iconColor || "#22c55e" }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11, color: isDark ? "rgba(255,255,255,.38)" : "rgba(17,26,18,.45)", marginBottom: 2 }}>{title}</div>
        <div style={{ fontFamily: "'Cabinet Grotesk',sans-serif", fontSize: "1.1rem", fontWeight: 800, color: isDark ? "#fff" : "#0d1f10", lineHeight: 1.2 }}>
          {value}
        </div>
        {sub && <div style={{ fontSize: 12, color: isDark ? "rgba(255,255,255,.4)" : "rgba(17,26,18,.5)", marginTop: 3 }}>{sub}</div>}
        {progress !== undefined && (
          <div className={`bm-track ${isDark ? "bm-track-d" : "bm-track-l"}`}>
            <div className="bm-fill" style={{ width: `${progress}%`, background: progressColor || "linear-gradient(90deg,#22c55e,#22d3ee)" }} />
          </div>
        )}
      </div>
      {badge && (
        <div className="bm-chip" style={{ background: badgeBg, color: badgeColor, flexShrink: 0 }}>
          {badge}
        </div>
      )}
    </div>
  );
}

function HistoryRow({ m, onDelete, isDark, t }) {
  const STATUS = {
    completed:  { icon: CheckCircle2, color: "#22c55e", label: t("biomass.history.done") },
    processing: { icon: Loader2,      color: "#60a5fa", label: t("biomass.history.processing"), spin: true },
    failed:     { icon: XCircle,      color: "#ef4444", label: t("biomass.history.failed") },
  };
  const s = STATUS[m.status] || STATUS.failed;
  const tc = isDark ? "rgba(232,245,234,.82)" : "#111a12";
  const sc = isDark ? "rgba(232,245,234,.38)" : "rgba(17,26,18,.45)";

  return (
    <div className={`bm-hrow ${isDark ? "bm-hrow-d" : "bm-hrow-l"}`}>
      <div style={{ width: 36, height: 36, borderRadius: 11, flexShrink: 0, background: `${s.color}14`, border: `1px solid ${s.color}25`, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <s.icon style={{ width: 15, height: 15, color: s.color }} className={s.spin ? "bm-spin" : ""} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: tc }}>
          {t("biomass.history.photoUpload")} #{m.id}
        </div>
        {m.status === "completed" && (
          <div style={{ fontSize: 12, color: sc, marginTop: 2, display: "flex", flexWrap: "wrap", gap: 10 }}>
            {m.biomass_value    != null && <span>🌱 {m.biomass_value.toFixed(1)} {t("biomass.unit")}</span>}
            {m.quality_score    != null && <span>🌿 {t("biomass.results.aiScoreLabel", "AI score")} {m.quality_score.toFixed(0)}%</span>}
            {m.coverage_percent != null && <span>🔲 {m.coverage_percent.toFixed(0)}%</span>}
          </div>
        )}
        <div style={{ fontSize: 11, color: sc, marginTop: 2 }}>
          {new Date(m.created_at).toLocaleString()}
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
        <div className="bm-chip" style={{ background: `${s.color}14`, color: s.color }}>{s.label}</div>
        <button onClick={() => onDelete(m.id)}
          style={{ width: 28, height: 28, border: "none", background: "rgba(239,68,68,.1)", borderRadius: 8, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
          aria-label={t("biomass.history.deleteAriaLabel")}>
          <Trash2 style={{ width: 12, height: 12, color: "#f87171" }} />
        </button>
      </div>
    </div>
  );
}

/* ─── RESULT ANNOUNCEMENT MODAL ──────────────────────────────────────── */
function ResultModal({ result, onClose, isDark, t }) {
  const D  = isDark;
  const bm = result?.biomass_value ?? 0;

  // Count-up animation
  const [displayVal, setDisplayVal] = useState(0);
  useEffect(() => {
    const duration = 1500;
    let startTime  = null;
    let rafId;

    function step(ts) {
      if (!startTime) startTime = ts;
      const progress = Math.min((ts - startTime) / duration, 1);
      // Ease-out quart
      const eased = 1 - Math.pow(1 - progress, 4);
      setDisplayVal(parseFloat((bm * eased).toFixed(1)));
      if (progress < 1) rafId = requestAnimationFrame(step);
    }
    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [bm]);

  const metrics = useMemo(() => deriveBiomassMetrics(bm, 1), [bm]);
  const ratingColor = metrics.biomassRating.color;

  const tc = D ? "rgba(232,245,234,.9)"  : "#0d1f10";
  const sc = D ? "rgba(232,245,234,.45)" : "rgba(17,26,18,.5)";

  const metricItems = [
    {
      emoji: "🌿",
      label: t("biomass.results.aiScoreLabel", "AI score"),
      value: `${metrics.ndviGrade.pct}%`,
      color: metrics.ndviGrade.color,
      badge: metrics.ndviGrade.letter,
    },
    {
      emoji: "🌿",
      label: t("biomass.results.coverLabel", "Покрытие"),
      value: `${metrics.coverage.toFixed(0)}%`,
      color: metrics.coverageHealth.color,
    },
    {
      emoji: metrics.grazingRec.icon,
      label: t("biomass.results.grazingLabel", "Выпас"),
      value: t(metrics.grazingRec.labelKey),
      color: metrics.grazingRec.color,
    },
  ];

  return (
    <div
      className="bm-result-ov"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-label={t("biomass.result.badge", "Измерение завершено")}
    >
      <div className={`bm-result-card ${D ? "bm-result-card-d" : "bm-result-card-l"}`}>
        {/* Background glows */}
        <div className="bm-result-glow-a" />
        <div className="bm-result-glow-b" />

        {/* Success badge */}
        <div className="bm-result-badge">
          <CheckCircle2 style={{ width: 13, height: 13, color: "#22c55e", flexShrink: 0 }} />
          <span style={{
            fontSize: 11, fontWeight: 800, letterSpacing: ".12em",
            textTransform: "uppercase", color: "#4ade80",
          }}>
            {t("biomass.result.badge", "Измерение завершено")}
          </span>
        </div>

        {/* Label */}
        <div style={{ fontSize: 13, color: sc, marginBottom: 14, position: "relative", zIndex: 1 }}>
          {t("biomass.result.subtitle", "Биомасса пастбища определена")}
        </div>

        {/* Giant animated number */}
        <div className="bm-result-num-wrap" style={{ position: "relative", zIndex: 1 }}>
          <div className="bm-result-ring" />
          <div className="bm-result-ring-2" />
          <div className="bm-result-big">{displayVal.toFixed(1)}</div>
        </div>
        <div style={{ fontSize: 15, fontWeight: 600, color: sc, marginBottom: 22, position: "relative", zIndex: 1 }}>
          {t("biomass.unit", "ц/га")} &nbsp;/&nbsp; {t("biomass.unitHa", "га")}
        </div>

        {/* Rating badge */}
        <div
          className="bm-result-rating"
          style={{
            background: `${ratingColor}18`,
            border: `1.5px solid ${ratingColor}45`,
            position: "relative", zIndex: 1,
          }}
        >
          <Zap style={{ width: 17, height: 17, color: ratingColor, flexShrink: 0 }} />
          <span style={{
            fontFamily: "'Cabinet Grotesk',sans-serif",
            fontSize: 16, fontWeight: 900, color: ratingColor,
          }}>
            {t(metrics.biomassRating.labelKey)}
          </span>
          <Star style={{ width: 13, height: 13, color: ratingColor, opacity: .7 }} />
        </div>

        {/* Metrics grid */}
        <div className="bm-result-grid" style={{ position: "relative", zIndex: 1 }}>
          {metricItems.map(({ emoji, label, value, color, badge }) => (
            <div
              key={label}
              className={`bm-result-metric ${D ? "bm-result-metric-d" : "bm-result-metric-l"}`}
              style={{ borderColor: `${color}22` }}
            >
              <div style={{ fontSize: 11, color: sc, marginBottom: 5, display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ fontSize: 13 }}>{emoji}</span>
                {label}
                {badge && (
                  <span style={{
                    fontSize: 9, fontWeight: 800, color, background: `${color}18`,
                    padding: "1px 5px", borderRadius: 4, letterSpacing: ".06em",
                  }}>
                    {badge}
                  </span>
                )}
              </div>
              <div style={{
                fontFamily: "'Cabinet Grotesk',sans-serif",
                fontSize: "1.2rem", fontWeight: 900, color, lineHeight: 1.1,
              }}>
                {value}
              </div>
            </div>
          ))}
        </div>

        {/* Tip from rating */}
        <div style={{
          fontSize: 12, color: sc, marginBottom: 24, lineHeight: 1.55,
          padding: "10px 14px", borderRadius: 12,
          background: D ? "rgba(255,255,255,.04)" : "rgba(17,26,18,.04)",
          border: `1px solid ${ratingColor}18`,
          position: "relative", zIndex: 1,
        }}>
          {t(metrics.biomassRating.tipKey, "")}
        </div>

        {/* Action buttons */}
        <div className="bm-result-btns" style={{ position: "relative", zIndex: 1 }}>
          <button
            className={`bm-result-btn-secondary ${D ? "bm-result-btn-secondary-d" : "bm-result-btn-secondary-l"}`}
            onClick={onClose}
          >
            <X style={{ width: 14, height: 14 }} />
            {t("biomass.result.close", "Закрыть")}
          </button>
          <button
            className="bm-submit"
            style={{ flex: 2 }}
            onClick={onClose}
          >
            <BarChart3 style={{ width: 15, height: 15 }} />
            {t("biomass.result.viewDetails", "Смотреть детали")}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Winter Fodder Calculator ────────────────────────────────────────── */
function WinterCalculator({ usableForWinterKg, defaultArea, isDark, t }) {
  const [winterDays, setWinterDays] = useState(180);
  const [customArea, setCustomArea] = useState(defaultArea || 1);
  const [animalCounts, setAnimalCounts] = useState({
    cow: 0, horse: 0, sheep: 0, goat: 0, camel: 0
  });

  useEffect(() => {
    setCustomArea(defaultArea || 1);
  }, [defaultArea]);

  const tc = isDark ? "rgba(232,245,234,.88)" : "#111a12";
  const sc = isDark ? "rgba(232,245,234,.42)" : "rgba(17,26,18,.48)";

  const effectiveAvailableKg = usableForWinterKg;

  const setCount = (key, val) => {
    const v = Math.max(0, Math.min(9999, parseInt(val) || 0));
    setAnimalCounts((prev) => ({ ...prev, [key]: v }));
  };

  const step = (key, delta) =>
    setCount(key, (animalCounts[key] || 0) + delta);

  const { breakdown, totalRequired, surplus } = calcWinter(animalCounts, winterDays, effectiveAvailableKg);
  const hasSurplus = surplus >= 0;
  const totalAnimals = Object.values(animalCounts).reduce((s, v) => s + v, 0);

  const fmtTons = (kg) => (kg / 1000).toFixed(2);
  const fmtKg   = (kg) => Math.round(kg).toLocaleString();

  return (
    <div className={`bm-calc ${isDark ? "bm-calc-d" : "bm-calc-l"} bm-a4`}>
      <div className={`bm-calc-header ${isDark ? "bm-calc-header-d" : "bm-calc-header-l"}`}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: "rgba(74,222,128,.12)", border: "1px solid rgba(74,222,128,.22)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Calculator style={{ width: 16, height: 16, color: "#22c55e" }} />
            </div>
            <span style={{ fontFamily: "'Cabinet Grotesk',sans-serif", fontWeight: 800, fontSize: "1.1rem", color: tc }}>
              {t("biomass.calc.title", "Калькулятор зимовки")}
            </span>
          </div>
          <p style={{ fontSize: 12, color: sc, margin: 0 }}>
            {t("biomass.calc.subtitle", "Введите количество животных и рассчитайте потребность в зимних кормах")}
          </p>
        </div>

        <div style={{ padding: "10px 16px", borderRadius: 14, background: isDark ? "rgba(74,222,128,.1)" : "rgba(34,197,94,.08)", border: "1px solid rgba(74,222,128,.22)", textAlign: "center", flexShrink: 0 }}>
          <div style={{ fontSize: 10, color: sc, marginBottom: 2 }}>{t("biomass.calc.availableHay", "Доступно сена")}</div>
          <div style={{ fontFamily: "'Cabinet Grotesk',sans-serif", fontSize: "1.2rem", fontWeight: 900, color: "#22c55e" }}>
            {fmtTons(effectiveAvailableKg)} {t("biomass.calc.tons", "тонн")}
          </div>
        </div>
      </div>

      <div className="bm-calc-body">
        <div style={{ display: "flex", gap: 12, marginBottom: 18, flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 160 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: sc, marginBottom: 6 }}>
              {t("biomass.calc.winterDays", "Дней зимовки")}
            </div>
            <input
              type="number"
              className={`bm-cinp ${isDark ? "bm-cinp-d" : "bm-cinp-l"}`}
              value={winterDays}
              min={60} max={365}
              onChange={(e) => setWinterDays(Math.max(60, Math.min(365, parseInt(e.target.value) || 180)))}
            />
          </div>
          <div style={{ flex: 1, minWidth: 160 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: sc, marginBottom: 6 }}>
              {t("biomass.calc.infoLabel", "Суточные нормы (кг сена)")}
            </div>
            <div style={{ padding: "10px 14px", borderRadius: 11, background: isDark ? "rgba(255,255,255,.04)" : "#f4faf5", border: `1px solid ${isDark ? "rgba(255,255,255,.08)" : "rgba(34,197,94,.12)"}`, fontSize: 12, color: sc, display: "flex", flexWrap: "wrap", gap: "4px 14px" }}>
              {ANIMALS.map((a) => (
                <span key={a.key}>{a.emoji} {a.dailyKg} кг</span>
              ))}
            </div>
          </div>
        </div>

        <div style={{ marginBottom: 4 }}>
          <div style={{ display: "grid", gridTemplateColumns: "36px 1fr auto auto", gap: 12, paddingBottom: 8, borderBottom: `1px solid ${isDark ? "rgba(255,255,255,.06)" : "rgba(34,197,94,.1)"}`, marginBottom: 4 }}>
            <div />
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: sc }}>
              {t("biomass.calc.animal", "Животное")}
            </div>
            <div className="bm-animal-req" style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: sc, textAlign: "right", minWidth: 120 }}>
              {t("biomass.calc.required", "Потребность")}
            </div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: sc }}>
              {t("biomass.calc.count", "Кол-во")}
            </div>
          </div>

          {breakdown.map((a) => {
            const reqKg = a.required;
            return (
              <div key={a.key} className={`bm-animal-row ${isDark ? "bm-animal-row-d" : "bm-animal-row-l"}`}>
                <div style={{ fontSize: 22, textAlign: "center", lineHeight: 1 }}>{a.emoji}</div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: tc }}>
                    {t(a.i18nKey, a.key)}
                  </div>
                  <div style={{ fontSize: 11, color: sc }}>
                    {a.dailyKg} {t("biomass.calc.kgPerDay", "кг/день")}
                  </div>
                </div>
                <div className="bm-animal-req" style={{ textAlign: "right", minWidth: 120 }}>
                  {a.count > 0 ? (
                    <>
                      <div style={{ fontFamily: "'Cabinet Grotesk',sans-serif", fontWeight: 700, fontSize: 14, color: tc }}>
                        {fmtTons(reqKg)} {t("biomass.calc.tonsShort", "т")}
                      </div>
                      <div style={{ fontSize: 11, color: sc }}>{fmtKg(reqKg)} кг</div>
                    </>
                  ) : (
                    <div style={{ fontSize: 12, color: sc }}>—</div>
                  )}
                </div>
                <div className="bm-stepper">
                  <button className={`bm-stepper-btn ${isDark ? "bm-stepper-btn-d" : "bm-stepper-btn-l"}`} onClick={() => step(a.key, -1)}>
                    <MinusIcon style={{ width: 11, height: 11 }} />
                  </button>
                  <input
                    type="number"
                    inputMode="numeric"
                    className={`bm-stepper-val ${isDark ? "bm-stepper-val-d" : "bm-stepper-val-l"}`}
                    value={animalCounts[a.key] || ""}
                    placeholder="0"
                    min={0} max={9999}
                    onChange={(e) => setCount(a.key, e.target.value)}
                  />
                  <button className={`bm-stepper-btn ${isDark ? "bm-stepper-btn-d" : "bm-stepper-btn-l"}`} onClick={() => step(a.key, 1)}>
                    <Plus style={{ width: 11, height: 11 }} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {totalAnimals > 0 && (
          <div className={`bm-calc-result ${isDark
            ? (hasSurplus ? "bm-calc-result-ok-d" : "bm-calc-result-err-d")
            : (hasSurplus ? "bm-calc-result-ok-l" : "bm-calc-result-err-l")
          }`}>
            <div className="bm-calc-metric">
              <div className="bm-calc-metric-val" style={{ color: "#22c55e" }}>{fmtTons(effectiveAvailableKg)}</div>
              <div className="bm-calc-metric-lbl" style={{ color: isDark ? "rgba(255,255,255,.55)" : "rgba(17,26,18,.55)" }}>
                {t("biomass.calc.availableLabel", "Доступно (тонн)")}
              </div>
            </div>
            <div className="bm-calc-metric">
              <div className="bm-calc-metric-val" style={{ color: "#f59e0b" }}>{fmtTons(totalRequired)}</div>
              <div className="bm-calc-metric-lbl" style={{ color: isDark ? "rgba(255,255,255,.55)" : "rgba(17,26,18,.55)" }}>
                {t("biomass.calc.requiredLabel", "Требуется (тонн)")}
              </div>
            </div>
            <div className="bm-calc-metric">
              <div className="bm-calc-metric-val" style={{ color: hasSurplus ? "#22c55e" : "#ef4444" }}>
                {hasSurplus ? "+" : ""}{fmtTons(Math.abs(surplus))}
              </div>
              <div className="bm-calc-metric-lbl" style={{ color: isDark ? "rgba(255,255,255,.55)" : "rgba(17,26,18,.55)" }}>
                {hasSurplus
                  ? t("biomass.calc.surplusLabel", "Остаток (тонн)")
                  : t("biomass.calc.deficitLabel", "Дефицит (тонн)")}
              </div>
            </div>
            <div className="bm-calc-metric">
              <div className="bm-calc-metric-val" style={{ color: isDark ? "#e8f5ea" : "#111a12" }}>{totalAnimals}</div>
              <div className="bm-calc-metric-lbl" style={{ color: isDark ? "rgba(255,255,255,.55)" : "rgba(17,26,18,.55)" }}>
                {t("biomass.calc.totalAnimals", "Всего животных")}
              </div>
            </div>
          </div>
        )}

        {totalAnimals > 0 && (
          <div style={{ marginTop: 12, padding: "12px 16px", borderRadius: 12, background: isDark ? "rgba(255,255,255,.03)" : "#f8fdf8", border: `1px solid ${isDark ? "rgba(255,255,255,.06)" : "rgba(34,197,94,.1)"}`, fontSize: 13 }}>
            {hasSurplus ? (
              <span style={{ color: "#22c55e" }}>
                ✅ {t("biomass.calc.surplusMsg", {
                  defaultValue: `Корма хватит на {{days}} дней. Остаток {{kg}} кг можно использовать для дополнительного поголовья.`,
                  days: winterDays,
                  kg: fmtKg(Math.abs(surplus))
                })}
              </span>
            ) : (
              <span style={{ color: "#f87171" }}>
                ⚠️ {t("biomass.calc.deficitMsg", {
                  defaultValue: `Дефицит {{kg}} кг сена. Рекомендуется заготовить дополнительно {{tons}} тонн или сократить поголовье.`,
                  kg: fmtKg(Math.abs(surplus)),
                  tons: fmtTons(Math.abs(surplus))
                })}
              </span>
            )}
          </div>
        )}

        {totalAnimals === 0 && (
          <div style={{ textAlign: "center", padding: "20px 0", color: sc, fontSize: 13 }}>
            {t("biomass.calc.addAnimals", "Добавьте животных чтобы рассчитать потребность в кормах")}
          </div>
        )}
      </div>
    </div>
  );
}

function buildAgronomistReport(measurements, pasture, areaHa, t) {
  const completed = (measurements || [])
    .filter((m) => m.status === "completed" && m.biomass_value != null)
    .slice()
    .sort((a, b) => new Date(b.created_at || b.measured_at || 0) - new Date(a.created_at || a.measured_at || 0));

  if (!completed.length) return null;

  const values = completed.map((m) => Number(m.biomass_value) || 0);
  const latest = completed[0];
  const previous = completed[1] || null;
  const latestMetrics = deriveBiomassMetrics(latest.biomass_value, areaHa);
  const avgBiomass = values.reduce((sum, v) => sum + v, 0) / values.length;
  const maxBiomass = Math.max(...values);
  const minBiomass = Math.min(...values);
  const trendValue = previous ? latest.biomass_value - previous.biomass_value : 0;
  const trendPct = previous?.biomass_value ? (trendValue / previous.biomass_value) * 100 : 0;

  const condition =
    latest.biomass_value >= 7.5 && latestMetrics.coverage >= 50
      ? {
          label: t("biomass.report.condition.ready.label", "Готово к контролируемому выпасу"),
          color: "#22c55e",
          summary: t("biomass.report.condition.ready.summary", "Пастбище выглядит рабочим: запас травостоя достаточный, можно планировать выпас с ограничением нагрузки."),
        }
      : latest.biomass_value >= 5
        ? {
            label: t("biomass.report.condition.caution.label", "Нужен осторожный режим"),
            color: "#f59e0b",
            summary: t("biomass.report.condition.caution.summary", "Запас есть, но пастбищу лучше дать мягкую нагрузку и чаще проверять восстановление травостоя."),
          }
        : {
            label: t("biomass.report.condition.rest.label", "Рекомендуется отдых"),
            color: "#ef4444",
            summary: t("biomass.report.condition.rest.summary", "Биомасса низкая: выпас сейчас может ускорить деградацию и снизить восстановление растений."),
          };

  const trendText =
    !previous
      ? t("biomass.report.trend.single", "Пока есть только один завершенный замер, поэтому тренд будет точнее после следующего измерения.")
      : trendValue > 1
        ? t("biomass.report.trend.up", "Биомасса выросла на {{value}} ц/га ({{pct}}%). Это хороший сигнал восстановления.", {
            value: trendValue.toFixed(1),
            pct: trendPct.toFixed(0),
          })
        : trendValue < -1
          ? t("biomass.report.trend.down", "Биомасса снизилась на {{value}} ц/га ({{pct}}%). Нагрузка или погодный стресс могли быть выше нормы.", {
              value: Math.abs(trendValue).toFixed(1),
              pct: Math.abs(trendPct).toFixed(0),
            })
          : t("biomass.report.trend.flat", "Динамика почти ровная: состояние пастбища стабильное, резких изменений по последним замерам нет.");

  const recommendations = [
    latest.biomass_value >= 7.5
      ? t("biomass.report.recommendations.grazingReady", "Разрешить выпас небольшими загонами и оставлять не менее 40-50% травостоя после прохода.")
      : t("biomass.report.recommendations.grazingRest", "Отложить интенсивный выпас и использовать участок только короткими заходами либо оставить на восстановление."),
    latestMetrics.coverage < 50
      ? t("biomass.report.recommendations.coverLow", "Усилить контроль оголенных пятен: после дождей стоит проверить всходы и при необходимости провести подсев устойчивых трав.")
      : t("biomass.report.recommendations.coverGood", "Покров выглядит достаточным, но после выпаса лучше повторить фотоанализ через 7-14 дней."),
    trendValue < -1
      ? t("biomass.report.recommendations.trendDown", "Если снижение повторится, уменьшить плотность поголовья или сократить время нахождения на этом участке.")
      : t("biomass.report.recommendations.monitor", "Сохранять регулярный мониторинг, чтобы поймать момент, когда рост замедлится или начнется просадка биомассы."),
    t("biomass.report.recommendations.disclaimer", "Для отчета используйте эти значения как оперативную оценку; финальное решение лучше сверять с погодой, фазой роста трав и фактической нагрузкой на пастбище."),
  ];

  return {
    completed,
    latest,
    latestMetrics,
    avgBiomass,
    maxBiomass,
    minBiomass,
    trendText,
    condition,
    recommendations,
    pastureName: pasture?.name || t("biomass.report.fallbackPasture", "Пастбище"),
  };
}

function AgronomistReport({ measurements, pasture, areaHa, isDark, locale, t, onToast }) {
  const reportRef = useRef(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const report = useMemo(
    () => buildAgronomistReport(measurements, pasture, areaHa, t),
    [measurements, pasture, areaHa, t]
  );

  if (!report) return null;

  const tc = isDark ? "rgba(232,245,234,.9)" : "#111a12";
  const sc = isDark ? "rgba(232,245,234,.48)" : "rgba(17,26,18,.52)";
  const dateLocale = locale === "kk" ? "kk-KZ" : locale === "en" ? "en-US" : "ru-RU";
  const fmtDate = (m) => new Date(m.created_at || m.measured_at || Date.now()).toLocaleDateString(dateLocale);
  const fmtNum = (v, digits = 1) => Number(v || 0).toFixed(digits);
  const unit = t("biomass.unit", "ц/га");

  const handleDownloadPdf = async () => {
    if (pdfLoading) return;
    setPdfLoading(true);
    try {
      const date = new Date().toLocaleString(dateLocale);
      const rowsHtml = report.completed.map((m, i) => {
        const rowMetrics = deriveBiomassMetrics(m.biomass_value, areaHa);
        const rowStatus = rowMetrics.grazingRec.status === "optimal"
          ? t("biomass.report.status.ready", "Можно пасти")
          : rowMetrics.grazingRec.status === "caution"
            ? t("biomass.report.status.caution", "Осторожно")
            : t("biomass.report.status.rest", "Отдых");

        return `
          <tr style="background:${i % 2 === 0 ? "#f8fdf8" : "#ffffff"};">
            <td style="padding:8px 10px;border-bottom:1px solid #e5e7eb;color:#374151;font-size:11px;">${escapeHtml(fmtDate(m))}</td>
            <td style="padding:8px 10px;border-bottom:1px solid #e5e7eb;color:${rowMetrics.biomassRating.color};font-weight:700;font-size:11px;">${escapeHtml(`${fmtNum(m.biomass_value)} ${unit}`)}</td>
            <td style="padding:8px 10px;border-bottom:1px solid #e5e7eb;color:#374151;font-size:11px;">${escapeHtml(`${fmtNum(m.coverage_percent ?? rowMetrics.coverage, 0)}%`)}</td>
            <td style="padding:8px 10px;border-bottom:1px solid #e5e7eb;color:#374151;font-size:11px;">${escapeHtml(`${fmtNum(m.quality_score ?? rowMetrics.ndviGrade.pct, 0)}%`)}</td>
            <td style="padding:8px 10px;border-bottom:1px solid #e5e7eb;color:${rowMetrics.grazingRec.color};font-weight:700;font-size:11px;">${escapeHtml(rowStatus)}</td>
          </tr>`;
      }).join("");

      const statCardsHtml = statItems.map((item) => `
        <div style="border:1px solid #bbf7d0;border-radius:12px;background:#f0fdf4;padding:12px 14px;">
          <div style="font-size:10px;color:#6b7280;margin-bottom:5px;">${escapeHtml(item.label)}</div>
          <div style="font-size:18px;font-weight:800;color:${item.color};">${escapeHtml(item.value)}</div>
        </div>
      `).join("");

      const recommendationsHtml = report.recommendations.map((rec) => `
        <div style="display:flex;gap:8px;margin-bottom:8px;font-size:12px;line-height:1.55;color:#111827;">
          <span style="color:#16a34a;font-weight:800;">›</span>
          <span>${escapeHtml(rec)}</span>
        </div>
      `).join("");

      const container = document.createElement("div");
      container.style.cssText = `
        position:fixed; left:-9999px; top:0;
        width:794px; background:#ffffff;
        font-family:Arial,"Segoe UI",sans-serif; color:#111827;
      `;
      container.innerHTML = `
        <div style="background:linear-gradient(135deg,#166534,#0d9488);color:white;padding:26px 38px;display:flex;justify-content:space-between;align-items:flex-start;gap:24px;">
          <div>
            <div style="font-size:26px;font-weight:800;">KokMaisa</div>
            <div style="font-size:12px;opacity:.9;margin-top:4px;">${escapeHtml(t("biomass.report.kicker", "Отчет ИИ-агронома"))}</div>
          </div>
          <div style="font-size:11px;opacity:.85;text-align:right;line-height:1.5;">${escapeHtml(date)}</div>
        </div>

        <div style="padding:30px 38px 34px;">
          <div style="font-size:22px;font-weight:800;color:#14532d;margin-bottom:6px;">
            ${escapeHtml(t("biomass.report.title", "{{pasture}}: анализ всех измерений", { pasture: report.pastureName }))}
          </div>
          <div style="font-size:12px;color:#6b7280;line-height:1.55;margin-bottom:20px;">
            ${escapeHtml(t("biomass.report.subtitle", "Сформировано по завершенным измерениям пастбища. Последний замер: {{date}}.", { date: fmtDate(report.latest) }))}
          </div>

          <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:20px;">
            ${statCardsHtml}
          </div>

          <div style="border:1px solid #bbf7d0;border-radius:14px;background:#f8fdf8;padding:16px 18px;margin-bottom:14px;">
            <div style="font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#6b7280;margin-bottom:10px;">
              ${escapeHtml(t("biomass.report.aiTextTitle", "Текст ИИ-агронома"))}
            </div>
            <div style="font-size:15px;font-weight:800;color:${report.condition.color};margin-bottom:8px;">
              ${escapeHtml(report.condition.label)}
            </div>
            <div style="font-size:13px;line-height:1.65;color:#111827;margin-bottom:8px;">
              ${escapeHtml(report.condition.summary)}
            </div>
            <div style="font-size:12px;line-height:1.6;color:#4b5563;">
              ${escapeHtml(report.trendText)}
            </div>
          </div>

          <div style="border:1px solid #bbf7d0;border-radius:14px;background:#f8fdf8;padding:16px 18px;margin-bottom:14px;">
            <div style="font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#6b7280;margin-bottom:10px;">
              ${escapeHtml(t("biomass.report.adviceTitle", "Мысли и советы ИИ-агронома"))}
            </div>
            ${recommendationsHtml}
          </div>

          <div style="border:1px solid #bbf7d0;border-radius:14px;background:#ffffff;padding:16px 18px;">
            <div style="font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#6b7280;margin-bottom:10px;">
              ${escapeHtml(t("biomass.report.evidenceTitle", "Таблица измерений, подтверждающая вывод"))}
            </div>
            <table style="width:100%;border-collapse:collapse;">
              <thead>
                <tr style="background:#ecfdf5;">
                  <th style="text-align:left;padding:8px 10px;border-bottom:1px solid #bbf7d0;color:#166534;font-size:10px;">${escapeHtml(t("biomass.report.table.date", "Дата"))}</th>
                  <th style="text-align:left;padding:8px 10px;border-bottom:1px solid #bbf7d0;color:#166534;font-size:10px;">${escapeHtml(t("biomass.report.table.biomass", "Биомасса"))}</th>
                  <th style="text-align:left;padding:8px 10px;border-bottom:1px solid #bbf7d0;color:#166534;font-size:10px;">${escapeHtml(t("biomass.report.table.coverage", "Покров"))}</th>
                  <th style="text-align:left;padding:8px 10px;border-bottom:1px solid #bbf7d0;color:#166534;font-size:10px;">${escapeHtml(t("biomass.report.table.aiScore", "AI-оценка"))}</th>
                  <th style="text-align:left;padding:8px 10px;border-bottom:1px solid #bbf7d0;color:#166534;font-size:10px;">${escapeHtml(t("biomass.report.table.status", "Статус"))}</th>
                </tr>
              </thead>
              <tbody>${rowsHtml}</tbody>
            </table>
          </div>

          <div style="margin-top:28px;padding-top:12px;border-top:1px solid #e5e7eb;text-align:center;font-size:10px;color:#9ca3af;">
            KokMaisa · ${escapeHtml(date)}
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
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const safeName = report.pastureName.replace(/[^\p{L}\p{N}]+/gu, "_").replace(/^_+|_+$/g, "") || "pasture";
      pdf.save(`kokmaisa_${safeName}_report.pdf`);
    } catch (error) {
      console.error(error);
      onToast?.("err", t("biomass.report.pdfError", "Не удалось скачать PDF"));
    } finally {
      setPdfLoading(false);
    }
  };

  const statItems = [
    { label: t("biomass.report.stats.count", "Замеров в отчете"), value: report.completed.length, color: "#22c55e" },
    { label: t("biomass.report.stats.avg", "Средняя биомасса"), value: `${fmtNum(report.avgBiomass)} ${unit}`, color: "#22d3ee" },
    { label: t("biomass.report.stats.range", "Диапазон"), value: `${fmtNum(report.minBiomass)}-${fmtNum(report.maxBiomass)} ${unit}`, color: "#a78bfa" },
    { label: t("biomass.report.stats.reserve", "Запас по площади"), value: `${fmtNum(report.latestMetrics.totalBiomassKg / 1000, 2)} ${t("biomass.totalYield.tons", "т")}`, color: "#f59e0b" },
  ];

  return (
    <div ref={reportRef} className={`bm-report ${isDark ? "bm-report-d" : "bm-report-l"} bm-a3`}>
      <div className={`bm-report-head ${isDark ? "bm-report-head-d" : "bm-report-head-l"}`}>
        <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
          <div style={{ width: 42, height: 42, borderRadius: 14, background: "rgba(34,197,94,.13)", border: "1px solid rgba(74,222,128,.25)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <FileText style={{ width: 19, height: 19, color: "#22c55e" }} />
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: ".12em", textTransform: "uppercase", color: "#22c55e", marginBottom: 5 }}>
              {t("biomass.report.kicker", "Отчет ИИ-агронома")}
            </div>
            <h2 style={{ fontFamily: "'Cabinet Grotesk',sans-serif", fontSize: "1.35rem", fontWeight: 900, color: tc, margin: 0 }}>
              {t("biomass.report.title", "{{pasture}}: анализ всех измерений", { pasture: report.pastureName })}
            </h2>
            <p style={{ fontSize: 13, color: sc, margin: "6px 0 0", lineHeight: 1.55 }}>
              {t("biomass.report.subtitle", "Сформировано по завершенным измерениям пастбища. Последний замер: {{date}}.", { date: fmtDate(report.latest) })}
            </p>
          </div>
        </div>
        <button className="bm-download-btn" onClick={handleDownloadPdf} disabled={pdfLoading} data-html2canvas-ignore="true">
          {pdfLoading ? <Loader2 className="bm-spin" style={{ width: 14, height: 14 }} /> : <Download style={{ width: 14, height: 14 }} />}
          {pdfLoading ? t("biomass.report.downloading", "Готовим PDF...") : t("biomass.report.downloadPdf", "Скачать PDF")}
        </button>
      </div>

      <div className="bm-report-body">
        <div className="bm-report-grid">
          {statItems.map((item) => (
            <div key={item.label} className={`bm-report-stat ${isDark ? "bm-report-stat-d" : "bm-report-stat-l"}`}>
              <div style={{ fontSize: 11, color: sc, marginBottom: 5 }}>{item.label}</div>
              <div style={{ fontFamily: "'Cabinet Grotesk',sans-serif", fontWeight: 900, fontSize: "1.2rem", color: item.color }}>{item.value}</div>
            </div>
          ))}
        </div>

        <div className={`bm-report-box ${isDark ? "bm-report-box-d" : "bm-report-box-l"}`}>
          <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: ".08em", textTransform: "uppercase", color: sc, marginBottom: 10 }}>
            {t("biomass.report.aiTextTitle", "Текст ИИ-агронома")}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <ClipboardCheck style={{ width: 16, height: 16, color: report.condition.color }} />
            <strong style={{ color: report.condition.color, fontSize: 15 }}>{report.condition.label}</strong>
          </div>
          <p style={{ margin: 0, color: tc, fontSize: 14, lineHeight: 1.65 }}>{report.condition.summary}</p>
          <p style={{ margin: "8px 0 0", color: sc, fontSize: 13, lineHeight: 1.6 }}>{report.trendText}</p>
        </div>

        <div className={`bm-report-box ${isDark ? "bm-report-box-d" : "bm-report-box-l"}`}>
          <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: ".08em", textTransform: "uppercase", color: sc, marginBottom: 10 }}>
            {t("biomass.report.adviceTitle", "Мысли и советы ИИ-агронома")}
          </div>
          <div style={{ display: "grid", gap: 9 }}>
            {report.recommendations.map((rec) => (
              <div key={rec} style={{ display: "flex", gap: 9, alignItems: "flex-start", color: tc, fontSize: 13, lineHeight: 1.55 }}>
                <ArrowRight style={{ width: 14, height: 14, color: "#22c55e", flexShrink: 0, marginTop: 2 }} />
                <span>{rec}</span>
              </div>
            ))}
          </div>
        </div>

        <div className={`bm-report-box ${isDark ? "bm-report-box-d" : "bm-report-box-l"}`} style={{ marginBottom: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: ".08em", textTransform: "uppercase", color: sc, marginBottom: 4 }}>
            {t("biomass.report.evidenceTitle", "Таблица измерений, подтверждающая вывод")}
          </div>
          <div className="bm-report-table">
            <div className="bm-report-list">
            <div className={`bm-report-row bm-report-row-head ${isDark ? "bm-report-row-d" : "bm-report-row-l"}`} style={{ color: sc, fontWeight: 700 }}>
              <span>{t("biomass.report.table.date", "Дата")}</span>
              <span>{t("biomass.report.table.biomass", "Биомасса")}</span>
              <span>{t("biomass.report.table.coverage", "Покров")}</span>
              <span>{t("biomass.report.table.aiScore", "AI-оценка")}</span>
              <span>{t("biomass.report.table.status", "Статус")}</span>
            </div>
            {report.completed.map((m) => {
              const rowMetrics = deriveBiomassMetrics(m.biomass_value, areaHa);
              const rowStatus = rowMetrics.grazingRec.status === "optimal"
                ? t("biomass.report.status.ready", "Можно пасти")
                : rowMetrics.grazingRec.status === "caution"
                  ? t("biomass.report.status.caution", "Осторожно")
                  : t("biomass.report.status.rest", "Отдых");
              return (
                <div key={m.id} className={`bm-report-row ${isDark ? "bm-report-row-d" : "bm-report-row-l"}`} style={{ color: tc }}>
                  <span data-label={t("biomass.report.table.date", "Дата")}>{fmtDate(m)}</span>
                  <strong data-label={t("biomass.report.table.biomass", "Биомасса")} style={{ color: rowMetrics.biomassRating.color }}>{fmtNum(m.biomass_value)} {unit}</strong>
                  <span data-label={t("biomass.report.table.coverage", "Покров")}>{fmtNum(m.coverage_percent ?? rowMetrics.coverage, 0)}%</span>
                  <span data-label={t("biomass.report.table.aiScore", "AI-оценка")}>{fmtNum(m.quality_score ?? rowMetrics.ndviGrade.pct, 0)}%</span>
                  <span data-label={t("biomass.report.table.status", "Статус")} style={{ color: rowMetrics.grazingRec.color }}>
                    {rowStatus}
                  </span>
                </div>
              );
            })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Component ──────────────────────────────────────────────────────── */
export default function BiomassMeasurementPage() {
  const { t, i18n } = useTranslation();
  const { theme } = useTheme();
  const D = theme === "dark";
  const {
    user, isAuthenticated, loading: authLoading,
    getPastures,
    uploadBiomassPhoto,
    getPastureMeasurements, getPastureStats,
    deleteMeasurement,
  } = useAuth();
  const navigate = useNavigate();

  const [pastures,     setPastures]     = useState([]);
  const [selPasture,   setSelPasture]   = useState(null);
  const [measurements, setMeasurements] = useState([]);
  const [stats,        setStats]        = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [statsLoading, setStatsLoading] = useState(false);
  const [submitting,   setSubmitting]   = useState(false);
  const [toast,        setToast]        = useState(null);
  const [modalOpen,    setModalOpen]    = useState(false);
  // ── NEW: result announcement modal ──
  const [resultModal,  setResultModal]  = useState(null);

  // Upload state
  const [file,     setFile]     = useState(null);
  const [preview,  setPreview]  = useState(null);
  const [desc,     setDesc]     = useState("");
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef();

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  };

  // ── Boot ──
  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) { navigate("/login"); return; }
    (async () => {
      setLoading(true);
      try {
        const p = await getPastures();
        setPastures(p || []);
        if (p?.length) setSelPasture(p[0]);
      } catch (e) { showToast("err", apiErrorMessage(e, i18n)); }
      setLoading(false);
    })();
  }, [authLoading, isAuthenticated]);

  // ── Load pasture data ──
  useEffect(() => {
    if (!selPasture) return;
    (async () => {
      setStatsLoading(true);
      setMeasurements([]); setStats(null);
      try {
        const [m, s] = await Promise.all([
          getPastureMeasurements(selPasture.id),
          getPastureStats(selPasture.id),
        ]);
        setMeasurements(m || []);
        setStats(s || null);
      } catch {}
      setStatsLoading(false);
    })();
  }, [selPasture]);

  // ── File select ──
  const onFileChange = (f) => {
    if (!f || !f.type.startsWith("image/")) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const onDrop = (e) => {
    e.preventDefault(); setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) onFileChange(f);
  };

  // ── Photo upload — shows ResultModal on success ──
  const handlePhoto = async (e) => {
    e.preventDefault();
    if (!file || !selPasture) return;
    setSubmitting(true);
    try {
      const result = await uploadBiomassPhoto(file, selPasture.id, desc);
      setMeasurements(prev => [result, ...prev]);
      const s = await getPastureStats(selPasture.id);
      setStats(s);
      setFile(null); setPreview(null); setDesc(""); setModalOpen(false);

      // Show large result announcement if biomass value is available
      if (result?.biomass_value != null) {
        setResultModal(result);
      } else {
        showToast("ok", `✅ ${t("biomass.toast.success", { value: result.biomass_value?.toFixed(1), unit: t("biomass.unit") })}`);
      }
    } catch (e) {
      showToast("err", apiErrorMessage(e, i18n));
    }
    setSubmitting(false);
  };

  // ── Delete ──
  const handleDelete = async (id) => {
    if (!window.confirm(t("biomass.history.confirmDelete"))) return;
    try {
      await deleteMeasurement(id);
      setMeasurements(prev => prev.filter(m => m.id !== id));
      const s = await getPastureStats(selPasture.id);
      setStats(s);
      showToast("ok", t("biomass.toast.deleted"));
    } catch (e) { showToast("err", apiErrorMessage(e, i18n)); }
  };

  const closeModal = () => { setModalOpen(false); setFile(null); setPreview(null); setDesc(""); };

  // ── Derive metrics from REAL biomass value ──
  const latestDone = measurements.find(m => m.status === "completed");
  const rawBiomass = latestDone?.biomass_value ?? stats?.latest_biomass ?? null;

  const pastureAreaHa = selPasture
    ? (selPasture.area_ha ?? selPasture.area ?? 1)
    : 1;

  const metrics = rawBiomass != null
    ? deriveBiomassMetrics(rawBiomass, pastureAreaHa)
    : null;

  /* ── colour helpers ── */
  const tc   = D ? "rgba(232,245,234,.88)" : "#111a12";
  const sc   = D ? "rgba(232,245,234,.40)" : "rgba(17,26,18,.48)";
  const card = `bm-card ${D ? "bm-card-d" : "bm-card-l"}`;

  if (authLoading || loading) return (
    <>
      <style>{S}</style>
      <div className={`bm ${D ? "bm-d" : "bm-l"}`} style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Loader2 style={{ width: 32, height: 32, color: "#22c55e" }} className="bm-spin" />
      </div>
    </>
  );

  return (
    <>
      <style>{S}</style>

      <div className={`bm ${D ? "bm-d" : "bm-l"}`}>
        <Header />

        {/* ═══ HERO ═══ */}
        <div className="bm-hero">
          <div className="bm-hero-inner">
            <div className="bm-hero-badge bm-a1">
              <Activity style={{ width: 10, height: 10 }} />
              {t("biomass.hero.badge")}
            </div>
            <h1 className="bm-hero-title bm-a2">
              {t("biomass.hero.titleLine1")}<br />
              <em>{t("biomass.hero.titleLine2")}</em>
            </h1>
            <p className="bm-hero-sub bm-a3">
              {t("biomass.hero.subtitle")}
            </p>

            {pastures.length > 0 && (
              <div className="bm-a4">
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: D ? "rgba(255,255,255,.32)" : "rgba(17,26,18,.42)", marginBottom: 10 }}>
                  {t("biomass.hero.selectPasture")}
                </div>
                <div className="bm-pills">
                  {pastures.map(p => (
                    <button key={p.id} className={`bm-pill ${selPasture?.id === p.id ? "sel" : ""}`}
                      onClick={() => setSelPasture(p)}>
                      {p.name} · {p.area_ha ?? p.area ?? 0} {t("biomass.unitHa")}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ═══ BODY ═══ */}
        <div className="bm-body">

          {!selPasture ? (
            <div className={`${card} bm-a1`} style={{ padding: 48, textAlign: "center" }}>
              <Leaf style={{ width: 36, height: 36, color: "#22c55e", margin: "0 auto 12px" }} />
              <p style={{ color: sc, fontSize: 15 }}>{t("biomass.selectPasturePrompt")}</p>
            </div>
          ) : (
            <>
              {/* ── UPLOAD CARD ── */}
              <div className={`${card} bm-a1`} style={{ padding: 24, marginBottom: 20 }}>
                <SectionLabel text={t("biomass.upload.sectionLabel")} isDark={D} />
                <div
                  className={`bm-dropzone ${D ? "bm-dropzone-d" : "bm-dropzone-l"} ${dragging ? "active-drop" : ""}`}
                  onClick={() => setModalOpen(true)}
                  onDragOver={e => { e.preventDefault(); setDragging(true); }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={onDrop}
                  role="button" tabIndex={0}
                  onKeyDown={e => e.key === "Enter" && setModalOpen(true)}
                  aria-label={t("biomass.upload.ariaLabel")}
                >
                  <div style={{ width: 52, height: 52, borderRadius: 16, background: "rgba(34,197,94,.12)", border: "1px solid rgba(34,197,94,.22)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Camera style={{ width: 22, height: 22, color: "#22c55e" }} />
                  </div>
                  <div>
                    <div style={{ fontFamily: "'Cabinet Grotesk',sans-serif", fontWeight: 800, fontSize: 16, color: tc, marginBottom: 4 }}>
                      {t("biomass.upload.title")}
                    </div>
                    <div style={{ fontSize: 13, color: sc }}>{t("biomass.upload.hint")}</div>
                  </div>
                  <div className="bm-chip" style={{ background: "rgba(34,197,94,.12)", color: "#22c55e" }}>
                    {t("biomass.upload.formats")}
                  </div>
                </div>
              </div>

              {/* ── RESULT SECTION ── */}
              {statsLoading ? (
                <div className={`${card} bm-a2`} style={{ padding: 40, display: "flex", justifyContent: "center" }}>
                  <Loader2 style={{ width: 24, height: 24, color: "#22c55e" }} className="bm-spin" />
                </div>
              ) : metrics ? (
                <div className="bm-a2" style={{ marginBottom: 20 }}>
                  <SectionLabel text={`${t("biomass.results.sectionLabel")} — ${selPasture.name}`} isDark={D} />

                  {/* ── Total Pasture Yield Banner ── */}
                  <div className={`bm-total-banner ${D ? "bm-total-banner-d" : "bm-total-banner-l"}`}>
                    <div style={{ width: 44, height: 44, borderRadius: 14, background: "rgba(34,197,94,.15)", border: "1px solid rgba(74,222,128,.3)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Wheat style={{ width: 20, height: 20, color: "#22c55e" }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: sc, marginBottom: 3 }}>
                        {t("biomass.totalYield.title", "Валовый урожай пастбища")}
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "center" }}>
                        <div>
                          <span style={{ fontFamily: "'Cabinet Grotesk',sans-serif", fontWeight: 900, fontSize: "1.6rem", color: "#22c55e" }}>
                            {(metrics.totalBiomassKg / 1000).toFixed(2)}
                          </span>
                          <span style={{ fontSize: 14, color: sc, marginLeft: 5 }}>
                            {t("biomass.totalYield.tons", "тонн")}
                          </span>
                        </div>
                        <div style={{ fontSize: 13, color: sc }}>
                          = <strong style={{ color: tc }}>{rawBiomass.toFixed(1)} {t("biomass.unit")}</strong>
                          {" × "}
                          <strong style={{ color: tc }}>{pastureAreaHa} {t("biomass.unitHa")}</strong>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Big result hero */}
                  <div className={`bm-result-hero ${D ? "bm-result-hero-d" : "bm-result-hero-l"}`} style={{ marginBottom: 16 }}>
                    <div style={{ position: "absolute", top: -40, right: -40, width: 180, height: 180, borderRadius: "50%", background: "radial-gradient(circle,rgba(34,197,94,.2) 0%,transparent 70%)", pointerEvents: "none" }} />
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 32, alignItems: "flex-end", position: "relative", zIndex: 1 }}>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: sc, marginBottom: 4 }}>
                          {t("biomass.results.biomassLabel")}
                        </div>
                        <div className="bm-big-num">{rawBiomass.toFixed(1)}</div>
                        <div style={{ fontSize: 14, color: sc, marginTop: 4, fontWeight: 600 }}>{t("biomass.unit")} / {t("biomass.unitHa")}</div>
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, paddingBottom: 6 }}>
                        <div style={{ padding: "10px 16px", borderRadius: 14, background: `${metrics.ndviGrade.color}14`, border: `1px solid ${metrics.ndviGrade.color}28` }}>
                          <div style={{ fontSize: 10, color: sc, marginBottom: 2 }}>{t("biomass.results.aiScoreLabel", "AI score")}</div>
                          <div style={{ fontFamily: "'Cabinet Grotesk',sans-serif", fontWeight: 900, fontSize: "1.15rem", color: metrics.ndviGrade.color }}>
                            {metrics.ndviGrade.pct}%
                          </div>
                        </div>
                        <div style={{ padding: "10px 16px", borderRadius: 14, background: `${metrics.grazingRec.color}14`, border: `1px solid ${metrics.grazingRec.color}28` }}>
                          <div style={{ fontSize: 10, color: sc, marginBottom: 2 }}>{t("biomass.results.grazingLabel")}</div>
                          <div style={{ fontFamily: "'Cabinet Grotesk',sans-serif", fontWeight: 900, fontSize: "1rem", color: metrics.grazingRec.color }}>
                            {metrics.grazingRec.icon} {t(metrics.grazingRec.labelKey)}
                          </div>
                        </div>
                        <div style={{ padding: "10px 16px", borderRadius: 14, background: `${metrics.coverageHealth.color}14`, border: `1px solid ${metrics.coverageHealth.color}28` }}>
                          <div style={{ fontSize: 10, color: sc, marginBottom: 2 }}>{t("biomass.results.coverLabel")}</div>
                          <div style={{ fontFamily: "'Cabinet Grotesk',sans-serif", fontWeight: 900, fontSize: "1rem", color: metrics.coverageHealth.color }}>
                            {metrics.coverage.toFixed(0)}%
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Insight grid */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 10, marginBottom: 20 }}>
                    <InsightCard
                      icon={Sun} isDark={D}
                      iconBg="rgba(34,197,94,.14)" iconColor="#22c55e"
                      title={t("biomass.insights.carrying.title")}
                      value={t("biomass.insights.carrying.value", { count: metrics.cowsPerHa })}
                      sub={t("biomass.insights.carrying.sub")}
                      badge={t(metrics.biomassRating.labelKey)}
                      badgeBg={`${metrics.biomassRating.color}14`}
                      badgeColor={metrics.biomassRating.color}
                      progress={Math.min(100, (metrics.cowsPerHa / 8) * 100)}
                      progressColor={metrics.biomassRating.color}
                    />
                    <InsightCard
                      icon={Clock} isDark={D}
                      iconBg="rgba(34,211,238,.12)" iconColor="#22d3ee"
                      title={t("biomass.insights.rotation.title")}
                      value={t("biomass.insights.rotation.value", { days: metrics.daysUntilRotation })}
                      sub={t("biomass.insights.rotation.sub")}
                      progress={Math.min(100, (metrics.daysUntilRotation / 45) * 100)}
                      progressColor="#22d3ee"
                    />
                    <InsightCard
                      icon={Leaf} isDark={D}
                      iconBg={`${metrics.ndviGrade.color}14`} iconColor={metrics.ndviGrade.color}
                      title={t("biomass.insights.ndvi.title")}
                      value={`${t("biomass.insights.ndvi.grade")} ${metrics.ndviGrade.letter} — ${t(metrics.ndviGrade.labelKey)}`}
                      sub={t("biomass.insights.ndvi.sub", { pct: metrics.ndviGrade.pct })}
                      progress={metrics.ndviGrade.pct}
                      progressColor={metrics.ndviGrade.color}
                    />
                    <InsightCard
                      icon={RefreshCw} isDark={D}
                      iconBg="rgba(167,139,250,.14)" iconColor="#a78bfa"
                      title={t("biomass.insights.regrowth.title")}
                      value={t("biomass.insights.regrowth.value", { days: metrics.regrowthDays })}
                      sub={t("biomass.insights.regrowth.sub")}
                      progress={Math.max(10, 100 - (metrics.regrowthDays / 60) * 100)}
                      progressColor="#a78bfa"
                    />
                    <InsightCard
                      icon={Shield} isDark={D}
                      iconBg={`${metrics.grazingRec.color}14`} iconColor={metrics.grazingRec.color}
                      title={t("biomass.insights.recommendation.title")}
                      value={t(metrics.grazingRec.labelKey)}
                      sub={t(metrics.biomassRating.tipKey)}
                    />
                  </div>

                  <AgronomistReport
                    measurements={measurements}
                    pasture={selPasture}
                    areaHa={pastureAreaHa}
                    isDark={D}
                    locale={i18n.language}
                    t={t}
                    onToast={showToast}
                  />

                  {/* ── WINTER FODDER CALCULATOR ── */}
                  <SectionLabel text={t("biomass.calc.sectionLabel", "Калькулятор зимнего кормления")} isDark={D} />
                  <WinterCalculator
                    usableForWinterKg={metrics.usableForWinterKg}
                    defaultArea={pastureAreaHa}
                    isDark={D}
                    t={t}
                  />
                </div>
              ) : (
                <div className={`${card} bm-a2`} style={{ padding: 36, textAlign: "center", marginBottom: 20 }}>
                  <BarChart3 style={{ width: 32, height: 32, color: sc, margin: "0 auto 10px" }} />
                  <p style={{ color: sc, fontSize: 14 }}>{t("biomass.results.empty")}</p>
                </div>
              )}

              {/* ── HISTORY ── */}
              <div className={`${card} bm-a5`} style={{ padding: 24 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
                  <SectionLabel text={t("biomass.history.sectionLabel")} isDark={D} />
                  <button onClick={() => selPasture && (async () => {
                    setStatsLoading(true);
                    try { const m = await getPastureMeasurements(selPasture.id); setMeasurements(m || []); } catch {}
                    setStatsLoading(false);
                  })()}
                    style={{ background: "none", border: "none", cursor: "pointer", color: sc, display: "flex", alignItems: "center", gap: 5, fontSize: 12 }}
                    aria-label={t("biomass.history.refreshAriaLabel")}>
                    <RefreshCw style={{ width: 14, height: 14 }} /> {t("biomass.history.refresh")}
                  </button>
                </div>

                {statsLoading ? (
                  <div style={{ display: "flex", justifyContent: "center", padding: 24 }}>
                    <Loader2 style={{ width: 20, height: 20, color: "#22c55e" }} className="bm-spin" />
                  </div>
                ) : measurements.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "24px 0", color: sc, fontSize: 13 }}>
                    {t("biomass.history.empty")}
                  </div>
                ) : measurements.map(m => (
                  <HistoryRow key={m.id} m={m} onDelete={handleDelete} isDark={D} t={t} />
                ))}
              </div>
            </>
          )}
        </div>

        {/* ═══ PHOTO MODAL ═══ */}
        {modalOpen && selPasture && (
          <div className="bm-ov" onClick={e => e.target === e.currentTarget && closeModal()}>
            <div className={`bm-modal ${D ? "bm-modal-d" : "bm-modal-l"}`}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
                <div style={{ fontFamily: "'Cabinet Grotesk',sans-serif", fontWeight: 800, fontSize: "1.15rem", color: tc }}>
                  {t("biomass.modal.title")} — {selPasture.name}
                </div>
                <button onClick={closeModal} style={{ background: "none", border: "none", cursor: "pointer", color: sc }}
                  aria-label={t("biomass.modal.closeAriaLabel")}>
                  <X style={{ width: 18, height: 18 }} />
                </button>
              </div>

              <form onSubmit={handlePhoto}>
                <input ref={fileRef} type="file" accept="image/*" onChange={e => onFileChange(e.target.files[0])} style={{ display: "none" }} />
                <div
                  className={`bm-dropzone ${D ? "bm-dropzone-d" : "bm-dropzone-l"}`}
                  onClick={() => fileRef.current?.click()}
                  style={{ minHeight: 140, marginBottom: 14 }}
                >
                  {preview ? (
                    <img src={preview} alt={t("biomass.modal.previewAlt")} style={{ width: "100%", maxHeight: 180, objectFit: "cover", borderRadius: 12 }} />
                  ) : (
                    <>
                      <Upload style={{ width: 24, height: 24, color: sc }} />
                      <span style={{ fontSize: 13, color: sc }}>{t("biomass.modal.chooseFile")}</span>
                    </>
                  )}
                </div>

                <div style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: sc, marginBottom: 6, display: "block" }}>
                    {t("biomass.modal.noteLabel")}
                  </label>
                  <textarea
                    value={desc} onChange={e => setDesc(e.target.value.replace(/\0/g, ""))}
                    rows={2} placeholder={t("biomass.modal.notePlaceholder")}
                    className={D ? "bm-select-d" : "bm-select-l"}
                    style={{ resize: "none", fontFamily: "'DM Sans',sans-serif" }}
                  />
                </div>

                <button type="submit" className="bm-submit" disabled={submitting || !file}>
                  {submitting
                    ? <><Loader2 className="bm-spin" style={{ width: 16, height: 16 }} />{t("biomass.modal.analyzing")}</>
                    : <><Check style={{ width: 16, height: 16 }} />{t("biomass.modal.submit")}</>
                  }
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ═══ RESULT ANNOUNCEMENT MODAL ═══ */}
        {resultModal && (
          <ResultModal
            result={resultModal}
            onClose={() => setResultModal(null)}
            isDark={D}
            t={t}
          />
        )}

        {/* ═══ TOAST ═══ */}
        {toast && (
          <div className={`bm-toast ${toast.type === "ok" ? "bm-toast-ok" : "bm-toast-err"}`}>
            {toast.type === "ok"
              ? <CheckCircle2 style={{ width: 16, height: 16, flexShrink: 0 }} />
              : <AlertCircle  style={{ width: 16, height: 16, flexShrink: 0 }} />
            }
            {toast.msg}
          </div>
        )}
      </div>
    </>
  );
}
