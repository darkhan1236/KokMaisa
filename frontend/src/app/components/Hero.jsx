// src/app/components/Hero.jsx
// KokMaisa 2025 — 3D grass-textured globe, light/dark theme, responsive, XSS-safe

import { useEffect, useRef, useState } from "react";
import { ArrowRight, ChevronDown, Brain, Database, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/contexts/ThemeContext";

/* ─── Styles ─────────────────────────────────────────────────────────────────── */
const STYLE = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=DM+Sans:wght@300;400;500&display=swap');

  .hero-root    { font-family: 'DM Sans', sans-serif; min-height:100svh; }
  .hero-display { font-family: 'Syne', sans-serif; }

  @keyframes heroFadeUp {
    from { opacity:0; transform:translateY(40px); }
    to   { opacity:1; transform:translateY(0); }
  }
  @keyframes heroMetricFadeUp {
    from { opacity:0; transform:translateX(-50%) translateY(24px) scale(var(--metric-scale)); }
    to   { opacity:1; transform:translateX(-50%) translateY(0) scale(var(--metric-scale)); }
  }
  @keyframes heroPulse {
    0%,100% { opacity:.6; transform:scale(1); }
    50%     { opacity:1;  transform:scale(1.08); }
  }
  @keyframes gradShift {
    0%   { background-position:0% 50%; }
    50%  { background-position:100% 50%; }
    100% { background-position:0% 50%; }
  }
  @keyframes scrollBounce {
    0%,100% { transform:translateY(0); }
    50%     { transform:translateY(8px); }
  }
  @keyframes spinSlow {
    from { transform:rotate(0deg); }
    to   { transform:rotate(360deg); }
  }

  .anim-fade-up-1 { animation:heroFadeUp .9s cubic-bezier(.22,1,.36,1) .10s both; }
  .anim-fade-up-2 { animation:heroFadeUp .9s cubic-bezier(.22,1,.36,1) .30s both; }
  .anim-fade-up-3 { animation:heroFadeUp .9s cubic-bezier(.22,1,.36,1) .50s both; }
  .anim-fade-up-4 { animation:heroFadeUp .9s cubic-bezier(.22,1,.36,1) .70s both; }
  .anim-fade-up-5 { animation:heroFadeUp .9s cubic-bezier(.22,1,.36,1) .90s both; }
  .scroll-bounce  { animation:scrollBounce 1.8s ease-in-out infinite; }

  .grad-shift {
    background:linear-gradient(270deg,#4ade80,#22d3ee,#34d399,#6ee7b7,#22d3ee);
    background-size:400% 400%;
    animation:gradShift 8s ease infinite;
    -webkit-background-clip:text;
    -webkit-text-fill-color:transparent;
    background-clip:text;
  }

  /* Glass pill */
  .gpill-dark  { background:rgba(255,255,255,.08); backdrop-filter:blur(12px); -webkit-backdrop-filter:blur(12px); border:1px solid rgba(255,255,255,.17); border-radius:999px; }
  .gpill-light { background:rgba(255,255,255,.82); backdrop-filter:blur(12px); -webkit-backdrop-filter:blur(12px); border:1px solid rgba(34,197,94,.3);   border-radius:999px; }

  /* Overlay cards on globe */
  .gcard { background:rgba(4,14,6,.78); backdrop-filter:blur(18px); -webkit-backdrop-filter:blur(18px); border:1px solid rgba(255,255,255,.18); border-radius:18px; }

  /* Noise */
  .noise-overlay { position:absolute;inset:0;pointer-events:none;z-index:1;
    background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.04'/%3E%3C/svg%3E");
    opacity:.4; }

  /* CTA */
  .cta-primary { background:linear-gradient(135deg,#22c55e 0%,#16a34a 50%,#0d9488 100%); transition:transform .25s,box-shadow .25s; white-space:nowrap; }
  .cta-primary:hover { transform:scale(1.04) translateY(-2px); box-shadow:0 12px 40px rgba(34,197,94,.45); }

  /* CSS fallback globe spin */
  .css-globe-spin { animation:spinSlow 18s linear infinite; }

  /* ══════════════════════════════
     RESPONSIVE — mobile-first
  ══════════════════════════════ */
  .hero-inner {
    display:flex; flex-direction:column; align-items:center;
    gap:40px; padding-top:96px; padding-bottom:80px;
  }
  .hero-copy  { width:100%; text-align:center; position:relative; z-index:30; }
  .hero-vis   {
    --globe-size:clamp(226px,66vw,292px);
    width:var(--globe-size);
    height:var(--globe-size);
    flex:0 0 auto;
    margin:0 auto;
    position:relative;
    z-index:10;
  }
  .hero-globe-frame {
    width:100%;
    height:100%;
    aspect-ratio:1/1;
  }
  .hero-metric-card {
    --metric-scale:.88;
    padding:8px 12px;
    min-width:138px;
    transform:translateX(-50%) scale(var(--metric-scale));
    transform-origin:bottom center;
  }
  .hero-metric-label { font-size:10px; }
  .hero-metric-value { font-size:1rem; }
  .hero-ndvi-card {
    top:12px;
    right:12px;
    padding:6px 10px;
    transform:scale(.9);
    transform-origin:top right;
  }
  .hero-float-pill {
    display:flex;
    z-index:25;
    max-width:156px;
    white-space:nowrap;
  }
  .hero-float-left {
    left:8px;
    top:30%;
  }
  .hero-float-right {
    right:8px;
    top:66%;
  }

  .htitle { font-size:clamp(2.8rem,13vw,4.5rem); }
  .hh1    { font-size:clamp(1.05rem,4.5vw,1.45rem); }
  .hsub   { font-size:clamp(.875rem,3.5vw,1rem); }
  .hcta   { flex-direction:column; align-items:center; }
  .hcta > a,
  .hcta > button { min-height:48px; }
  .hstats { max-width:260px; margin-left:auto; margin-right:auto; }

  @media (min-width:480px) {
    .hero-vis { --globe-size:clamp(292px,56vw,350px); }
    .hero-metric-card { --metric-scale:.94; min-width:164px; }
    .hero-metric-label { font-size:11px; }
    .hero-metric-value { font-size:1.15rem; }
    .hcta     { flex-direction:row; justify-content:center; }
  }
  @media (min-width:640px) {
    .hero-vis { --globe-size:clamp(336px,48vw,396px); }
    .hero-metric-card { --metric-scale:1; padding:10px 18px; min-width:180px; }
    .hero-metric-value { font-size:1.25rem; }
    .htitle   { font-size:clamp(3.5rem,9vw,5rem); }
  }
  @media (min-width:1024px) {
    .hero-inner { flex-direction:row; align-items:center; gap:56px; padding-top:112px; }
    .hero-copy  { flex:1 1 auto; min-width:0; text-align:left; }
    .hero-vis   { --globe-size:clamp(296px,27vw,340px); flex-basis:var(--globe-size); margin-left:auto; margin-right:0; transform:translateX(18px); }
    .htitle     { font-size:clamp(3.6rem,7.1vw,4.45rem); }
    .hcta       { justify-content:flex-start; }
    .hstats     { margin-left:0; margin-right:0; max-width:none; }
    .hero-float-pill { padding:7px 12px; }
    .hero-float-pill span { font-size:11px; }
  }
  @media (min-width:1280px) {
    .hero-inner {
      display:grid;
      grid-template-columns:minmax(0, 1fr) 400px;
      gap:32px;
    }
    .hero-copy {
      width:auto;
      min-width:0;
    }
    .hero-vis {
      --globe-size:400px;
      width:var(--globe-size);
      height:var(--globe-size);
      justify-self:end;
      margin:0;
      transform:translateX(92px);
    }
    .hero-float-left { left:-8px; top:33%; }
    .hero-float-right { right:-8px; top:66%; }
    .hero-float-pill { padding:8px 16px; }
    .hero-float-pill span { font-size:12px; }
    .htitle   { font-size:clamp(4.65rem,5.5vw,5rem); }
  }
  @media (min-width:1536px) {
    .hero-inner {
      grid-template-columns:minmax(0, 1fr) 520px;
      gap:44px;
    }
    .hero-vis {
      --globe-size:clamp(500px,32vw,580px);
      width:var(--globe-size);
      height:var(--globe-size);
      transform:translateX(96px);
    }
    .htitle { font-size:5.25rem; }
  }
  @media (max-width:360px) {
    .hero-inner { gap:22px; padding-top:78px; padding-bottom:76px; }
    .hero-metric-card { bottom:6px !important; }
    .hero-float-pill {
      max-width:128px;
      padding:5px 8px;
      gap:5px;
    }
    .hero-float-pill span { font-size:9px; }
  }
  @media (max-width:430px) {
    .hero-root { min-height:auto; }
    .hero-inner { gap:24px; padding-top:82px; padding-bottom:88px; }
    .hero-copy .anim-fade-up-1 {
      gap:6px;
      margin-bottom:16px;
    }
    .hero-copy .gpill-dark,
    .hero-copy .gpill-light {
      padding:5px 9px;
    }
    .hero-copy .gpill-dark span,
    .hero-copy .gpill-light span {
      font-size:10px;
      letter-spacing:0;
    }
    .htitle { font-size:clamp(2.2rem,12vw,3rem); }
    .hh1 { font-size:clamp(1rem,4.2vw,1.18rem); margin-bottom:12px; }
    .hsub { font-size:.86rem; line-height:1.55; margin-bottom:20px !important; }
    .hcta {
      width:100%;
      max-width:280px;
      margin-left:auto;
      margin-right:auto;
      gap:10px;
    }
    .hcta > a,
    .hcta > button {
      width:100%;
      min-height:44px;
      padding:11px 16px !important;
    }
    .hstats {
      margin-top:22px !important;
      gap:8px;
      max-width:300px;
    }
    .hstats .hero-display { font-size:1.05rem !important; }
    .hstats .uppercase {
      font-size:9px !important;
      line-height:1.15;
      letter-spacing:.04em;
    }
    .hero-ndvi-card {
      top:8px;
      right:8px;
      padding:5px 8px;
      transform:scale(.78);
    }
    .hero-metric-card {
      --metric-scale:.78;
      min-width:142px;
      padding:8px 11px;
      bottom:-12px !important;
      border-radius:14px;
    }
    .hero-metric-value span { font-size:.7rem; }
    .hero-metric-card .text-xs { font-size:9px; }
    .hero-float-left {
      left:2px;
      top:24%;
    }
    .hero-float-right {
      right:2px;
      top:61%;
    }
    .hero-float-pill {
      padding:5px 9px;
      max-width:138px;
    }
    .hero-float-pill span { font-size:10px; }
  }
  @media (max-width:390px) {
    .hero-metric-card { --metric-scale:.75; }
    .hero-copy .anim-fade-up-1 {
      gap:5px;
    }
    .hero-copy .gpill-dark,
    .hero-copy .gpill-light {
      padding:4px 7px;
      gap:5px;
    }
    .hero-copy .gpill-dark svg,
    .hero-copy .gpill-light svg {
      width:12px;
      height:12px;
    }
    .hero-copy .gpill-dark span,
    .hero-copy .gpill-light span {
      font-size:9px;
    }
  }
  @media (max-height:720px) and (max-width:430px) {
    .hero-inner { gap:14px; padding-top:66px; padding-bottom:70px; }
    .hero-copy .anim-fade-up-1 { margin-bottom:10px; }
    .hsub { margin-bottom:14px !important; }
    .hstats { margin-top:14px !important; }
    .hero-vis { --globe-size:clamp(214px,62vw,262px); }
    .hero-metric-card {
      --metric-scale:.68;
      bottom:-16px !important;
    }
    .hero-ndvi-card { transform:scale(.7); }
    .hero-float-pill {
      transform:scale(.88);
      transform-origin:center;
    }
    .scroll-bounce { display:none; }
  }
`;

/* ─── Badge ─────────────────────────────────────────────────────────────────── */
function Badge({ icon: Icon, text, isDark }) {
  return (
    <div className={`${isDark ? "gpill-dark" : "gpill-light"} inline-flex items-center gap-2 px-4 py-1.5`}>
      <Icon className="w-3.5 h-3.5 text-emerald-500" aria-hidden="true" />
      <span className="text-xs font-medium tracking-wide"
        style={{ color: isDark ? "rgba(255,255,255,.8)" : "rgba(20,55,20,.82)" }}>
        {text}
      </span>
    </div>
  );
}

/* ─── Three.js Grass Globe ───────────────────────────────────────────────────── */
function GrassGlobe({ mouseRef }) {
  const canvasRef   = useRef(null);
  const rafRef      = useRef(null);
  const rendererRef = useRef(null);

  useEffect(() => {
    let animId;

    const init = async () => {
      let THREE;
      try {
        THREE = await import("three");
        if (THREE.default) THREE = THREE.default;
      } catch {
        return; // three.js not installed — fallback renders instead
      }

      const canvas = canvasRef.current;
      if (!canvas) return;

      /* ── Scene setup ── */
      const scene  = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(52, 1, 0.1, 100);
      camera.position.set(0, 0, window.innerWidth < 520 ? 4.05 : 3.6);

      const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(canvas.clientWidth, canvas.clientHeight);
      renderer.setClearColor(0x000000, 0);
      rendererRef.current = renderer;

      // Procedural hay and pasture texture, no external image request.
      const makePastureTexture = () => {
        const textureCanvas = document.createElement("canvas");
        textureCanvas.width = 1024;
        textureCanvas.height = 512;
        const ctx = textureCanvas.getContext("2d");
        if (!ctx) return null;

        const base = ctx.createLinearGradient(0, 0, textureCanvas.width, textureCanvas.height);
        base.addColorStop(0, "#1f6b35");
        base.addColorStop(0.2, "#2f8a43");
        base.addColorStop(0.46, "#66a93f");
        base.addColorStop(0.68, "#3b8d3c");
        base.addColorStop(0.86, "#8ebf4f");
        base.addColorStop(1, "#1d5a2e");
        ctx.fillStyle = base;
        ctx.fillRect(0, 0, textureCanvas.width, textureCanvas.height);

        const sun = ctx.createRadialGradient(300, 120, 20, 300, 120, 520);
        sun.addColorStop(0, "rgba(255,235,155,.34)");
        sun.addColorStop(0.45, "rgba(255,213,103,.12)");
        sun.addColorStop(1, "rgba(62,92,31,.16)");
        ctx.fillStyle = sun;
        ctx.fillRect(0, 0, textureCanvas.width, textureCanvas.height);

        for (let y = -90; y < textureCanvas.height + 110; y += 28) {
          ctx.save();
          ctx.translate(textureCanvas.width / 2, y);
          ctx.rotate(-0.28 + Math.sin(y * 0.025) * 0.16);
          ctx.fillStyle = y % 56 === 0 ? "rgba(143,190,78,.24)" : "rgba(29,103,49,.22)";
          ctx.fillRect(-textureCanvas.width, -9, textureCanvas.width * 2, 18);
          ctx.restore();
        }

        const bladeColors = ["#c7e86a", "#93c94d", "#63a943", "#2e7d37", "#185f2d", "#d4e982"];
        for (let i = 0; i < 8600; i++) {
          const x = Math.random() * textureCanvas.width;
          const y = Math.random() * textureCanvas.height;
          const len = 34 + Math.random() * 118;
          const angle = -1.55 + Math.random() * 0.62;
          const bend = (Math.random() - 0.5) * 30;
          ctx.strokeStyle = bladeColors[(Math.random() * bladeColors.length) | 0];
          ctx.globalAlpha = 0.22 + Math.random() * 0.5;
          ctx.lineWidth = 0.8 + Math.random() * 2.4;
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.quadraticCurveTo(
            x + Math.cos(angle) * len * 0.48 + bend,
            y + Math.sin(angle) * len * 0.45,
            x + Math.cos(angle) * len,
            y + Math.sin(angle) * len
          );
          ctx.stroke();
        }

        for (let i = 0; i < 780; i++) {
          const x = Math.random() * textureCanvas.width;
          const y = Math.random() * textureCanvas.height;
          const len = 58 + Math.random() * 122;
          const angle = -1.42 + Math.random() * 0.42;
          const tipX = x + Math.cos(angle) * len;
          const tipY = y + Math.sin(angle) * len;
          ctx.globalAlpha = 0.42 + Math.random() * 0.42;
          ctx.lineWidth = 1.4 + Math.random() * 2.3;
          ctx.strokeStyle = Math.random() > 0.28 ? "#9fd45a" : "#3f883b";
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.quadraticCurveTo((x + tipX) / 2 + (Math.random() - 0.5) * 34, (y + tipY) / 2, tipX, tipY);
          ctx.stroke();

          ctx.fillStyle = Math.random() > 0.38 ? "#d8ec7a" : "#6aaa3e";
          ctx.beginPath();
          ctx.ellipse(tipX, tipY, 2.8, 10 + Math.random() * 12, angle, 0, Math.PI * 2);
          ctx.fill();
        }

        for (let i = 0; i < 170; i++) {
          const rootX = Math.random() * textureCanvas.width;
          const rootY = textureCanvas.height * (0.35 + Math.random() * 0.65);
          const clumpSize = 7 + Math.floor(Math.random() * 10);
          for (let j = 0; j < clumpSize; j++) {
            const angle = -1.66 + Math.random() * 0.74;
            const len = 90 + Math.random() * 170;
            const startX = rootX + (Math.random() - 0.5) * 22;
            const startY = rootY + (Math.random() - 0.5) * 16;
            const endX = startX + Math.cos(angle) * len;
            const endY = startY + Math.sin(angle) * len;
            ctx.globalAlpha = 0.5 + Math.random() * 0.32;
            ctx.lineWidth = 1.6 + Math.random() * 2.2;
            ctx.strokeStyle = Math.random() > 0.42 ? "#a8d65f" : "#347c36";
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.quadraticCurveTo(
              (startX + endX) / 2 + (Math.random() - 0.5) * 42,
              (startY + endY) / 2,
              endX,
              endY
            );
            ctx.stroke();
          }
        }
        ctx.globalAlpha = 1;

        const image = ctx.getImageData(0, 0, textureCanvas.width, textureCanvas.height);
        for (let i = 0; i < image.data.length; i += 4) {
          const noise = (Math.random() - 0.5) * 18;
          image.data[i] = Math.max(0, Math.min(255, image.data[i] + noise));
          image.data[i + 1] = Math.max(0, Math.min(255, image.data[i + 1] + noise));
          image.data[i + 2] = Math.max(0, Math.min(255, image.data[i + 2] + noise));
        }
        ctx.putImageData(image, 0, 0);

        const texture = new THREE.CanvasTexture(textureCanvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(1.12, 0.92);
        texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
        if (THREE.SRGBColorSpace) texture.colorSpace = THREE.SRGBColorSpace;
        return texture;
      };

      const loadTexture = (url) =>
        new Promise((resolve, reject) => {
          new THREE.TextureLoader().load(url, resolve, undefined, reject);
        });

      let grassTex = null;
      try {
        grassTex = await loadTexture("/textures/aerial-field-texture.jpg");
        grassTex.wrapS = THREE.RepeatWrapping;
        grassTex.wrapT = THREE.RepeatWrapping;
        grassTex.repeat.set(1.18, 1.0);
        grassTex.offset.set(0.02, 0);
        grassTex.anisotropy = renderer.capabilities.getMaxAnisotropy();
        if (THREE.SRGBColorSpace) grassTex.colorSpace = THREE.SRGBColorSpace;
      } catch {
        grassTex = makePastureTexture();
      }

      /* ── Globe geometry ── */
      const geoSphere = new THREE.SphereGeometry(1, 128, 128);

      // Displace vertices slightly for terrain feel
      const pos = geoSphere.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
        const n =
          Math.sin(x * 4.5 + y * 3.2) * Math.cos(z * 5.1 + x * 2.8) * 0.018 +
          Math.sin(y * 7.3 + z * 4.1) * 0.01;
        pos.setXYZ(i, x + x * n, y + y * n, z + z * n);
      }
      geoSphere.computeVertexNormals();

      const globeMat = new THREE.MeshStandardMaterial({
        map: grassTex,
        bumpMap: grassTex,
        bumpScale: 0.075,
        roughness: 0.92,
        metalness: 0,
        color: new THREE.Color(0.95, 1.05, 0.82),
      });

      const globe = new THREE.Mesh(geoSphere, globeMat);
      scene.add(globe);

      /* ── Lights ── */
      scene.add(new THREE.AmbientLight(0xffffff, 0.55));
      const sun = new THREE.DirectionalLight(0xffd4a0, 1.4);
      sun.position.set(3, 4, 4);
      scene.add(sun);
      const rim = new THREE.DirectionalLight(0x22d3ee, 0.5);
      rim.position.set(-4, -2, -3);
      scene.add(rim);
      const fill = new THREE.PointLight(0x4ade80, 0.6, 8);
      fill.position.set(0, 2, 2);
      scene.add(fill);

      /* ── Resize handler ── */
      let resizeFrame = null;
      let lastW = 0;
      let lastH = 0;
      let lastDpr = 0;
      const getCanvasSize = () => {
        const parent = canvas.parentElement;
        const box = parent?.getBoundingClientRect() || canvas.getBoundingClientRect();
        return {
          w: Math.max(1, Math.round(box.width)),
          h: Math.max(1, Math.round(box.height)),
        };
      };
      const resizeNow = () => {
        if (!canvas) return;
        const { w, h } = getCanvasSize();
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        if (w === lastW && h === lastH && dpr === lastDpr) return;

        lastW = w;
        lastH = h;
        lastDpr = dpr;

        camera.aspect = w / h;
        const sizeT = Math.max(0, Math.min(1, (w - 226) / 394));
        camera.position.z = 4.28 - sizeT * 0.78;
        camera.updateProjectionMatrix();
        renderer.setPixelRatio(dpr);
        renderer.setSize(w, h, false);
      };
      const onResize = () => {
        if (resizeFrame) cancelAnimationFrame(resizeFrame);
        resizeFrame = requestAnimationFrame(() => {
          resizeFrame = null;
          resizeNow();
        });
      };
      window.addEventListener("resize", onResize, { passive: true });
      window.visualViewport?.addEventListener("resize", onResize, { passive: true });
      const resizeObserver = new ResizeObserver(onResize);
      if (canvas.parentElement) resizeObserver.observe(canvas.parentElement);
      resizeObserver.observe(canvas);
      resizeNow();

      /* ── Animation loop ── */
      let t = 0;
      const animate = () => {
        animId = requestAnimationFrame(animate);
        t += 0.004;

        const mx = mouseRef.current?.x || 0;
        const my = mouseRef.current?.y || 0;

        globe.rotation.y    = t + mx * 0.28;
        globe.rotation.x    = my * 0.22;

        camera.position.x = mx * 0.22;
        camera.position.y = -my * 0.16;
        camera.lookAt(0, 0, 0);

        renderer.render(scene, camera);
      };
      animate();

      rafRef.current = { animId, onResize, resizeObserver, get resizeFrame() { return resizeFrame; } };
    };

    init();

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current.animId);
        if (rafRef.current.resizeFrame) cancelAnimationFrame(rafRef.current.resizeFrame);
        window.removeEventListener("resize", rafRef.current.onResize);
        window.visualViewport?.removeEventListener("resize", rafRef.current.onResize);
        rafRef.current.resizeObserver?.disconnect();
      }
      rendererRef.current?.dispose();
    };
  }, [mouseRef]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full"
      style={{ display: "block" }}
      aria-hidden="true"
    />
  );
}

/* ─── CSS Fallback Globe (if three.js missing) ──────────────────────────────── */
function FallbackGlobe() {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="relative css-globe-spin" style={{ width: "85%", aspectRatio: "1" }}>
        <div className="w-full h-full rounded-full overflow-hidden" style={{
          boxShadow: "0 0 60px rgba(34,197,94,.35), inset 0 0 40px rgba(0,0,0,.4)",
        }}>
          <div
            className="w-full h-full"
            style={{
              background: `
                radial-gradient(circle at 35% 24%, rgba(187,238,126,.5), transparent 22%),
                repeating-linear-gradient(96deg, rgba(128,196,73,.95) 0 2px, rgba(47,126,55,.78) 2px 4px, rgba(111,174,64,.86) 4px 7px, rgba(205,232,120,.62) 7px 9px),
                repeating-linear-gradient(78deg, transparent 0 7px, rgba(161,215,91,.52) 7px 10px, transparent 10px 15px),
                repeating-linear-gradient(112deg, rgba(27,95,45,.42) 0 1px, transparent 1px 13px),
                linear-gradient(135deg,#1f6b35,#62a941 34%,#2f8a43 58%,#94bf4f)
              `,
              filter: "brightness(.95) saturate(1.28)",
            }}
          />
        </div>
        {/* Grid overlay */}
        <svg viewBox="0 0 200 200" className="absolute inset-0 w-full h-full opacity-15 pointer-events-none" aria-hidden="true">
          {[25,50,75,100,125,150,175].map(v => (
            <line key={`v${v}`} x1={v} y1={0} x2={v} y2={200} stroke="#4ade80" strokeWidth="0.6" />
          ))}
          {[25,50,75,100,125,150,175].map(v => (
            <line key={`h${v}`} x1={0} y1={v} x2={200} y2={v} stroke="#4ade80" strokeWidth="0.6" />
          ))}
        </svg>
      </div>
    </div>
  );
}

/* ─── Globe wrapper ──────────────────────────────────────────────────────────── */
function GlobeSection({ mouseRef }) {
  const [threeOk, setThreeOk] = useState(null);

  useEffect(() => {
    import("three")
      .then(() => setThreeOk(true))
      .catch(() => setThreeOk(false));
  }, []);

  if (threeOk === null) return null;

  return threeOk ? <GrassGlobe mouseRef={mouseRef} /> : <FallbackGlobe />;
}

/* ─── Main Hero ─────────────────────────────────────────────────────────────── */
export default function Hero() {
  const { t }         = useTranslation();
  const { theme }     = useTheme();
  const isDark        = theme === "dark";
  const mouseRef      = useRef({ x: 0, y: 0 });
  const [globeKey, setGlobeKey] = useState(0);

  useEffect(() => {
    const getViewportBucket = () => {
      const width = window.innerWidth;
      if (width < 480) return "xs";
      if (width < 640) return "sm";
      if (width < 1024) return "md";
      if (width < 1280) return "lg";
      return "xl";
    };

    let lastWidth = window.innerWidth;
    let lastBucket = getViewportBucket();
    let resizeTimer = null;

    const refreshGlobeAfterResize = () => {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        const nextBucket = getViewportBucket();
        const widthChangedEnough = Math.abs(window.innerWidth - lastWidth) > 48;
        const bucketChanged = nextBucket !== lastBucket;

        if (widthChangedEnough || bucketChanged) {
          setGlobeKey((key) => key + 1);
          lastWidth = window.innerWidth;
          lastBucket = nextBucket;
        }
      }, 350);
    };

    window.addEventListener("resize", refreshGlobeAfterResize, { passive: true });
    window.visualViewport?.addEventListener("resize", refreshGlobeAfterResize, { passive: true });

    return () => {
      if (resizeTimer) clearTimeout(resizeTimer);
      window.removeEventListener("resize", refreshGlobeAfterResize);
      window.visualViewport?.removeEventListener("resize", refreshGlobeAfterResize);
    };
  }, []);

  /* Mouse tracking */
  useEffect(() => {
    const fn = (e) => {
      mouseRef.current = {
        x: (e.clientX / window.innerWidth  - 0.5) * 2,
        y: (e.clientY / window.innerHeight - 0.5) * 2,
      };
    };
    window.addEventListener("mousemove", fn, { passive: true });
    return () => window.removeEventListener("mousemove", fn);
  }, []);

  const scrollToNext = () =>
    document.getElementById("about")?.scrollIntoView({ behavior: "smooth" });

  /* ── Theme colours ── */
  const heroBg = isDark
    ? "radial-gradient(ellipse 80% 70% at 60% 40%,#0f2d1a 0%,#061309 55%,#030b05 100%)"
    : "radial-gradient(ellipse 80% 70% at 60% 40%,#c8edcc 0%,#e0f5e4 55%,#f5fcf2 100%)";

  const titleClr   = isDark ? "rgba(255,255,255,.92)" : "rgba(15,50,15,.9)";
  const subClr     = isDark ? "rgba(255,255,255,.55)" : "rgba(20,55,20,.65)";
  const scrollClr  = isDark ? "rgba(255,255,255,.3)"  : "rgba(20,55,20,.38)";
  const scrollHov  = isDark ? "rgba(255,255,255,.65)" : "rgba(20,55,20,.72)";
  const statVal    = isDark ? "#fff"                  : "#1a3d20";
  const statLbl    = isDark ? "rgba(255,255,255,.4)"  : "rgba(20,55,20,.45)";
  const bottomFade = isDark
    ? "linear-gradient(to top,#061309 0%,transparent 100%)"
    : "linear-gradient(to top,#f5fcf2 0%,transparent 100%)";
  const blob1 = isDark
    ? "radial-gradient(circle,rgba(34,197,94,.13) 0%,transparent 70%)"
    : "radial-gradient(circle,rgba(34,197,94,.22) 0%,transparent 70%)";
  const blob2 = isDark
    ? "radial-gradient(circle,rgba(34,211,238,.1) 0%,transparent 70%)"
    : "radial-gradient(circle,rgba(34,211,238,.14) 0%,transparent 70%)";

  const secBtn = isDark
    ? { background:"rgba(255,255,255,.1)",  border:"1.5px solid rgba(255,255,255,.22)", backdropFilter:"blur(12px)", color:"#fff" }
    : { background:"rgba(255,255,255,.85)", border:"1.5px solid rgba(34,197,94,.35)",   backdropFilter:"blur(12px)", color:"#166534" };

  const floatPill = isDark
    ? { background:"rgba(255,255,255,.08)", border:"1px solid rgba(255,255,255,.16)", backdropFilter:"blur(12px)" }
    : { background:"rgba(255,255,255,.85)", border:"1px solid rgba(34,197,94,.28)",  backdropFilter:"blur(12px)" };

  return (
    <>
      <style>{STYLE}</style>

      <section
        className="hero-root relative min-h-screen flex items-center justify-center overflow-hidden"
        aria-label="KokMaisa hero"
        style={{ background: heroBg, transition: "background .5s ease" }}
      >
        <div className="noise-overlay" aria-hidden="true" />

        {/* Ambient blobs */}
        <div className="absolute rounded-full pointer-events-none" aria-hidden="true"
          style={{ width:700,height:700,top:"-15%",right:"-10%",background:blob1,filter:"blur(40px)" }} />
        <div className="absolute rounded-full pointer-events-none" aria-hidden="true"
          style={{ width:500,height:500,bottom:"-10%",left:"-8%",background:blob2,filter:"blur(50px)" }} />

        {/* ── Layout ── */}
        <div className="hero-inner relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* COPY */}
          <div className="hero-copy">

            <div className="anim-fade-up-1 flex flex-wrap gap-2 justify-center lg:justify-start mb-6 sm:mb-8">
              <Badge icon={Database}      text="RAG System"      isDark={isDark} />
              <Badge icon={Brain}         text="Deep Learning AI" isDark={isDark} />
              <Badge icon={MessageCircle} text="AI Consultant"   isDark={isDark} />
            </div>

            <div className="anim-fade-up-2 mb-3">
              <span className="hero-display grad-shift htitle font-extrabold tracking-tight leading-none block">
                KokMaisa
              </span>
            </div>

            <h1 className="anim-fade-up-3 hero-display font-bold leading-tight mb-4 sm:mb-5 hh1 max-w-xl mx-auto lg:mx-0"
              style={{ color: titleClr }}>
              {t("hero.title")}
            </h1>

            <p className="anim-fade-up-4 leading-relaxed mb-8 sm:mb-10 max-w-lg mx-auto lg:mx-0 hsub"
              style={{ color: subClr }}>
              {t("hero.subtitle")}
            </p>

            <div className="anim-fade-up-5 flex gap-3 sm:gap-4 flex-wrap hcta">
              <Link
                to="/register"
                className="cta-primary inline-flex items-center justify-center gap-3 px-6 sm:px-8 py-3.5 sm:py-4 rounded-full text-white font-semibold"
                style={{ fontSize:"clamp(.875rem,2vw,1rem)" }}
              >
                {t("hero.cta")}
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" aria-hidden="true" />
              </Link>

              <button
                onClick={scrollToNext}
                className="inline-flex items-center justify-center gap-3 px-6 sm:px-8 py-3.5 sm:py-4 rounded-full font-medium transition-all"
                style={{ fontSize:"clamp(.875rem,2vw,1rem)", whiteSpace:"nowrap", ...secBtn }}
                aria-label="Scroll to How It Works"
              >
                {t("nav.howItWorks")}
                <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5" aria-hidden="true" />
              </button>
            </div>

            <div className="anim-fade-up-5 mt-10 sm:mt-12 grid grid-cols-3 gap-3 sm:gap-4 hstats">
              {[
                { value:"1000+", label:"Pasture Images" },
                { value:"RMSE",  label:"Optimized" },
                { value:"3",     label:"Seasons" },
              ].map(({ value, label }) => (
                <div key={label} className="text-center lg:text-left">
                  <div className="text-xl sm:text-2xl font-bold hero-display" style={{ color:statVal }}>{value}</div>
                  <div className="text-xs mt-0.5 tracking-wide uppercase" style={{ color:statLbl }}>{label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* GLOBE */}
          <div className="hero-vis relative flex items-center justify-center">

            {/* Glow behind globe */}
            <div className="absolute pointer-events-none" aria-hidden="true"
              style={{ width:"115%",height:"115%",background:"radial-gradient(circle,rgba(34,197,94,.2) 0%,transparent 65%)",filter:"blur(30px)" }} />

            {/* Globe canvas wrapper — square */}
            <div className="hero-globe-frame relative rounded-full overflow-visible">
              <GlobeSection key={globeKey} mouseRef={mouseRef} />

              {/* Biomass overlay card */}
              <div className="gcard hero-metric-card absolute bottom-5 left-1/2"
                style={{ animation:"heroMetricFadeUp 1s cubic-bezier(.22,1,.36,1) 1.2s both",
                  zIndex:20, whiteSpace:"nowrap" }}>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 rounded-full bg-emerald-400"
                    style={{ animation:"heroPulse 1.5s ease-in-out infinite" }} aria-hidden="true" />
                  <span className="hero-metric-label text-white/65 font-medium tracking-wide uppercase">Live Biomass</span>
                </div>
                <div className="hero-metric-value font-bold text-white hero-display">
                  28.47 <span className="text-sm font-normal text-emerald-400">ц/га</span>
                </div>
                <div className="text-xs text-emerald-400 mt-0.5">↑ 12% vs last week</div>
              </div>

              {/* Confidence badge */}
              <div className="gcard hero-ndvi-card absolute"
                style={{ animation:"heroFadeUp 1s cubic-bezier(.22,1,.36,1) 1.4s both", zIndex:20 }}>
                <div className="text-xs text-white/45 uppercase tracking-wide">Confidence</div>
                <div className="text-lg font-bold text-cyan-400 hero-display">92%</div>
              </div>
            </div>

            {/* Floating pills — desktop */}
            <div className="hero-float-pill hero-float-left hidden lg:flex items-center gap-2 absolute rounded-full"
              style={{ ...floatPill, animation:"heroFadeUp 1s cubic-bezier(.22,1,.36,1) 1.6s both" }}>
              <div className="w-2 h-2 rounded-full bg-emerald-400" aria-hidden="true" />
              <span className="text-xs font-medium"
                style={{ color: isDark ? "rgba(255,255,255,.75)" : "rgba(20,55,20,.8)" }}>
                Pasture Analysis
              </span>
            </div>

            <div className="hero-float-pill hero-float-right hidden lg:flex items-center gap-2 absolute rounded-full"
              style={{ ...floatPill, animation:"heroFadeUp 1s cubic-bezier(.22,1,.36,1) 1.8s both" }}>
              <div className="w-2 h-2 rounded-full bg-cyan-400" aria-hidden="true" />
              <span className="text-xs font-medium"
                style={{ color: isDark ? "rgba(255,255,255,.75)" : "rgba(20,55,20,.8)" }}>
                AI Predictions
              </span>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <button
          onClick={scrollToNext}
          className="scroll-bounce absolute bottom-6 sm:bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-1 transition-colors"
          style={{ color: scrollClr }}
          onMouseEnter={e => (e.currentTarget.style.color = scrollHov)}
          onMouseLeave={e => (e.currentTarget.style.color = scrollClr)}
          aria-label="Scroll down"
        >
          <span className="text-xs tracking-widest uppercase font-medium" style={{ letterSpacing:".2em" }}>Scroll</span>
          <ChevronDown className="w-5 h-5" aria-hidden="true" />
        </button>

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-28 sm:h-32 pointer-events-none" aria-hidden="true"
          style={{ background: bottomFade, transition:"background .5s ease" }} />
      </section>
    </>
  );
}
