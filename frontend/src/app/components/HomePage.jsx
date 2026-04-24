// src/app/components/HomePage.jsx
// KokMaisa 2025 — Theme-aware, scroll-reveal, fully responsive

import { useEffect } from "react";
import Header from "./Header";
import Hero from "./Hero";
import About from "./About";
import HowItWorks from "./HowItWorks";
import Features from "./Features";
import UseCases from "./UseCases";
import Metrics from "./Metrics";
import Footer from "./Footer";
import { useTheme } from "@/contexts/ThemeContext";

const PAGE_STYLES = `
  html { scroll-behavior: smooth; }

  /* ─── Scroll reveal ─── */
  .reveal {
    opacity: 0;
    transform: translateY(36px);
    transition: opacity .75s cubic-bezier(.22,1,.36,1), transform .75s cubic-bezier(.22,1,.36,1);
  }
  .reveal.visible { opacity: 1; transform: translateY(0); }
  .reveal-d1 { transition-delay: .1s; }

  .section-sep { height: 1px; max-width: 700px; margin: 0 auto; }

  /* ════════════════════════════════════
     DARK theme
  ════════════════════════════════════ */
  [data-theme="dark"] .page-bg       { background: #061309; }
  [data-theme="dark"] .section-sep   { background: linear-gradient(90deg,transparent,rgba(34,197,94,.2),transparent); }

  [data-theme="dark"] .about-root    { background: linear-gradient(180deg,#061309 0%,#071a0c 100%); }
  [data-theme="dark"] .about-root h2,[data-theme="dark"] .about-root h3 { color: #fff; }
  [data-theme="dark"] .about-root p  { color: rgba(255,255,255,.55); }
  [data-theme="dark"] .about-card    { background: rgba(255,255,255,.04); border-color: rgba(34,197,94,.12); }
  [data-theme="dark"] .about-card:hover { background: rgba(34,197,94,.07); border-color: rgba(34,197,94,.3); }
  [data-theme="dark"] .about-card p  { color: rgba(255,255,255,.45); }

  [data-theme="dark"] .feat-root     { background: linear-gradient(180deg,#071a0c 0%,#061309 100%); }
  [data-theme="dark"] .feat-root h2,[data-theme="dark"] .feat-root h3 { color: #fff; }
  [data-theme="dark"] .feat-root p   { color: rgba(255,255,255,.5); }
  [data-theme="dark"] .feat-card     { background: rgba(255,255,255,.035); border-color: rgba(255,255,255,.07); }
  [data-theme="dark"] .feat-card:hover { background: rgba(255,255,255,.065); border-color: rgba(34,197,94,.22); }

  [data-theme="dark"] .how-root      { background: #061309; }
  [data-theme="dark"] .how-root h2,[data-theme="dark"] .how-root h3 { color: #fff; }
  [data-theme="dark"] .how-root p    { color: rgba(255,255,255,.5); }
  [data-theme="dark"] .how-num       { color: rgba(74,222,128,.5); }

  [data-theme="dark"] .metrics-root  { background: linear-gradient(135deg,#071a0c 0%,#061309 60%,#071218 100%); }
  [data-theme="dark"] .metrics-root h2,[data-theme="dark"] .metrics-root h3 { color: #fff; }
  [data-theme="dark"] .metrics-root p { color: rgba(255,255,255,.5); }
  [data-theme="dark"] .metric-card   { background: rgba(255,255,255,.04); border-color: rgba(255,255,255,.08); }
  [data-theme="dark"] .metric-card:hover { background: rgba(255,255,255,.07); border-color: rgba(34,197,94,.25); }
  [data-theme="dark"] .metric-value  { background: linear-gradient(135deg,#4ade80,#22d3ee); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }

  [data-theme="dark"] .uc-root       { background: linear-gradient(180deg,#061309 0%,#071a0c 100%); }
  [data-theme="dark"] .uc-root h2    { color: #fff; }
  [data-theme="dark"] .uc-root > div > div > p { color: rgba(255,255,255,.5); }
  [data-theme="dark"] .uc-card       { background: rgba(255,255,255,.04); border-color: rgba(255,255,255,.07); }
  [data-theme="dark"] .uc-card:hover { background: rgba(255,255,255,.065); border-color: rgba(34,197,94,.25); }
  [data-theme="dark"] .uc-title      { color: #fff; }
  [data-theme="dark"] .uc-desc       { color: rgba(255,255,255,.45); }
  [data-theme="dark"] .uc-num        { color: rgba(74,222,128,.55); }

  /* ════════════════════════════════════
     LIGHT theme — complete color fixes
  ════════════════════════════════════ */
  [data-theme="light"] .page-bg      { background: #f5fcf2; }
  [data-theme="light"] .section-sep  { background: linear-gradient(90deg,transparent,rgba(22,163,74,.2),transparent); }

  /* About */
  [data-theme="light"] .about-root   { background: linear-gradient(180deg,#f0faf2 0%,#e8f7ea 100%); }
  [data-theme="light"] .about-root h2,
  [data-theme="light"] .about-root h3 { color: #1a3d20 !important; }
  [data-theme="light"] .about-root p  { color: rgba(20,55,20,.65) !important; }
  [data-theme="light"] .about-card   { background: rgba(255,255,255,.9) !important; border-color: rgba(34,197,94,.2) !important; box-shadow: 0 4px 16px rgba(34,197,94,.07); }
  [data-theme="light"] .about-card:hover { background: #fff !important; border-color: rgba(34,197,94,.35) !important; }
  [data-theme="light"] .about-hl     { background: linear-gradient(90deg,#16a34a,#0891b2); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }

  /* Features */
  [data-theme="light"] .feat-root    { background: linear-gradient(180deg,#e8f7ea 0%,#f0faf2 100%); }
  [data-theme="light"] .feat-root h2,
  [data-theme="light"] .feat-root h3 { color: #1a3d20 !important; }
  [data-theme="light"] .feat-root p  { color: rgba(20,55,20,.6) !important; }
  [data-theme="light"] .feat-card    { background: rgba(255,255,255,.9) !important; border-color: rgba(34,197,94,.15) !important; box-shadow: 0 4px 16px rgba(34,197,94,.06); }
  [data-theme="light"] .feat-card:hover { background: #fff !important; border-color: rgba(34,197,94,.3) !important; }

  /* How it works */
  [data-theme="light"] .how-root     { background: #f0faf2; }
  [data-theme="light"] .how-root h2,
  [data-theme="light"] .how-root h3  { color: #1a3d20 !important; }
  [data-theme="light"] .how-root p   { color: rgba(20,55,20,.6) !important; }
  [data-theme="light"] .how-num      { color: rgba(22,163,74,.65) !important; }

  /* Metrics */
  [data-theme="light"] .metrics-root { background: linear-gradient(135deg,#e8f7ea 0%,#f0faf2 60%,#e6f4f8 100%); }
  [data-theme="light"] .metrics-root h2,
  [data-theme="light"] .metrics-root h3 { color: #1a3d20 !important; }
  [data-theme="light"] .metrics-root p  { color: rgba(20,55,20,.6) !important; }
  [data-theme="light"] .metric-card  { background: rgba(255,255,255,.92) !important; border-color: rgba(34,197,94,.18) !important; box-shadow: 0 4px 20px rgba(34,197,94,.07); }
  [data-theme="light"] .metric-card:hover { background: #fff !important; border-color: rgba(34,197,94,.3) !important; }
  [data-theme="light"] .metric-value { background: linear-gradient(135deg,#16a34a,#0891b2) !important; -webkit-background-clip:text !important; -webkit-text-fill-color:transparent !important; background-clip:text !important; }
  [data-theme="light"] .metrics-cta  { background: linear-gradient(135deg,rgba(22,163,74,.09) 0%,rgba(8,145,178,.06) 100%) !important; border-color: rgba(22,163,74,.2) !important; }
  [data-theme="light"] .metrics-cta h3 { color: #1a3d20 !important; }
  [data-theme="light"] .metrics-cta p  { color: rgba(20,55,20,.6) !important; }

  /* Use Cases */
  [data-theme="light"] .uc-root      { background: linear-gradient(180deg,#f0faf2 0%,#e8f7ea 100%); }
  [data-theme="light"] .uc-root h2   { color: #1a3d20 !important; }
  [data-theme="light"] .uc-root > div > div > p { color: rgba(20,55,20,.6) !important; }
  [data-theme="light"] .uc-card      { background: rgba(255,255,255,.88) !important; border-color: rgba(34,197,94,.15) !important; box-shadow: 0 4px 20px rgba(34,197,94,.07); }
  [data-theme="light"] .uc-card:hover { background: #fff !important; border-color: rgba(34,197,94,.3) !important; box-shadow: 0 12px 40px rgba(34,197,94,.12); }
  [data-theme="light"] .uc-title     { color: #1a3d20 !important; }
  [data-theme="light"] .uc-desc      { color: rgba(20,55,20,.6) !important; }
  [data-theme="light"] .uc-num       { color: rgba(22,163,74,.65) !important; }
  [data-theme="light"] .uc-arrow     { background: rgba(22,163,74,.12) !important; color: #16a34a !important; }
  [data-theme="light"] .uc-img-overlay { background: linear-gradient(to bottom,transparent 30%,rgba(232,247,234,.8) 100%) !important; }

  /* Section badge pills — light mode */
  [data-theme="light"] span.section-badge {
    background: rgba(22,163,74,.1) !important;
    border-color: rgba(22,163,74,.28) !important;
    color: #15803d !important;
  }

  /* Global responsive fixes */
  @media (max-width: 640px) {
    .max-w-7xl { padding-left: 1rem; padding-right: 1rem; }
    section { padding-left: 1rem !important; padding-right: 1rem !important; }
  }
`;

function useScrollReveal() {
  useEffect(() => {
    const els = document.querySelectorAll(".reveal");
    if (!els.length) return;
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add("visible"); obs.unobserve(e.target); }
      }),
      { threshold: 0.1, rootMargin: "0px 0px -60px 0px" }
    );
    els.forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);
}

export default function HomePage() {
  useScrollReveal();
  const { theme } = useTheme();

  return (
    <>
      <style>{PAGE_STYLES}</style>
      <div className="page-bg min-h-screen" data-theme={theme}>
        <Header />
        <Hero />
        <div className="section-sep" />
        <div className="reveal reveal-d1"><About /></div>
        <div className="section-sep" />
        <div className="reveal reveal-d1"><HowItWorks /></div>
        <div className="section-sep" />
        <div className="reveal reveal-d1"><Features /></div>
        <div className="section-sep" />
        <div className="reveal reveal-d1"><UseCases /></div>
        <div className="section-sep" />
        <div className="reveal reveal-d1"><Metrics /></div>
        <Footer />
      </div>
    </>
  );
}