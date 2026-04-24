// src/app/components/Hero.jsx
// KokMaisa 2025 — 3D grass-textured globe, light/dark theme, responsive, XSS-safe

import { useEffect, useRef, useState } from "react";
import { ArrowRight, ChevronDown, Satellite, Brain, Smartphone } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/contexts/ThemeContext";

/* ─── Styles ─────────────────────────────────────────────────────────────────── */
const STYLE = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=DM+Sans:wght@300;400;500&display=swap');

  .hero-root    { font-family: 'DM Sans', sans-serif; }
  .hero-display { font-family: 'Syne', sans-serif; }

  @keyframes heroFadeUp {
    from { opacity:0; transform:translateY(40px); }
    to   { opacity:1; transform:translateY(0); }
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
  .hero-copy  { width:100%; text-align:center; }
  .hero-vis   { width:100%; max-width:300px; }

  .htitle { font-size:clamp(2.8rem,13vw,4.5rem); }
  .hh1    { font-size:clamp(1.05rem,4.5vw,1.45rem); }
  .hsub   { font-size:clamp(.875rem,3.5vw,1rem); }
  .hcta   { flex-direction:column; align-items:center; }
  .hstats { max-width:260px; margin-left:auto; margin-right:auto; }

  @media (min-width:480px) {
    .hero-vis { max-width:360px; }
    .hcta     { flex-direction:row; justify-content:center; }
  }
  @media (min-width:640px) {
    .hero-vis { max-width:400px; }
    .htitle   { font-size:clamp(3.5rem,9vw,5rem); }
  }
  @media (min-width:1024px) {
    .hero-inner { flex-direction:row; align-items:center; gap:0; padding-top:112px; }
    .hero-copy  { flex:1; text-align:left; }
    .hero-vis   { flex:1; max-width:460px; }
    .hcta       { justify-content:flex-start; }
    .hstats     { margin-left:0; margin-right:0; max-width:none; }
  }
  @media (min-width:1280px) {
    .hero-vis { max-width:500px; }
    .htitle   { font-size:5.25rem; }
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
      camera.position.set(0, 0, 3.6);

      const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(canvas.clientWidth, canvas.clientHeight);
      renderer.setClearColor(0x000000, 0);
      rendererRef.current = renderer;

      /* ── Load grass texture from Unsplash ── */
      // Using a reliable grass/hay close-up photo
      const GRASS_URL =
        "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1024&q=85";

      const textureLoader = new THREE.TextureLoader();
      textureLoader.crossOrigin = "anonymous";

      let grassTex = null;
      try {
        grassTex = await new Promise((res, rej) => {
          textureLoader.load(GRASS_URL, res, undefined, rej);
        });
        grassTex.wrapS = THREE.RepeatWrapping;
        grassTex.wrapT = THREE.RepeatWrapping;
        grassTex.repeat.set(3, 2); // repeat texture for realistic look
        grassTex.anisotropy = renderer.capabilities.getMaxAnisotropy();
      } catch {
        // texture failed — globe will use solid green material
      }

      /* ── Globe geometry ── */
      const geoSphere = new THREE.SphereGeometry(1, 80, 80);

      // Displace vertices slightly for terrain feel
      const pos = geoSphere.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
        const n =
          Math.sin(x * 4.5 + y * 3.2) * Math.cos(z * 5.1 + x * 2.8) * 0.045 +
          Math.sin(y * 7.3 + z * 4.1) * 0.025;
        pos.setXYZ(i, x + x * n, y + y * n, z + z * n);
      }
      geoSphere.computeVertexNormals();

      /* ── Globe material with grass texture ── */
      const globeMat = grassTex
        ? new THREE.MeshStandardMaterial({
            map:           grassTex,
            roughness:     0.85,
            metalness:     0.0,
            // Green tint overlay on the texture
            color:         new THREE.Color(0.75, 1.0, 0.72),
          })
        : new THREE.MeshPhongMaterial({
            color:    0x1a5c28,
            emissive: 0x061309,
            specular: 0x22c55e,
            shininess:12,
          });

      const globe = new THREE.Mesh(geoSphere, globeMat);
      scene.add(globe);

      /* ── Wireframe overlay ── */
      const wireMesh = new THREE.Mesh(
        new THREE.SphereGeometry(1.012, 36, 36),
        new THREE.MeshBasicMaterial({ color: 0x4ade80, wireframe: true, transparent: true, opacity: 0.07 })
      );
      scene.add(wireMesh);

      /* ── Glow rings ── */
      const addRing = (radius, tube, color, opacity, rx, ry = 0) => {
        const m = new THREE.Mesh(
          new THREE.TorusGeometry(radius, tube, 8, 120),
          new THREE.MeshBasicMaterial({ color, transparent: true, opacity })
        );
        m.rotation.x = rx;
        m.rotation.y = ry;
        scene.add(m);
        return m;
      };
      addRing(1.28, 0.004, 0x4ade80, 0.28, Math.PI / 2.3);
      addRing(1.52, 0.002, 0x22d3ee, 0.14, Math.PI / 2.7, Math.PI / 5);

      /* ── Particles ── */
      const COUNT = 1400;
      const pPos  = new Float32Array(COUNT * 3);
      for (let i = 0; i < COUNT; i++) {
        const theta = Math.random() * Math.PI * 2;
        const phi   = Math.acos(2 * Math.random() - 1);
        const r     = 1.55 + Math.random() * 1.3;
        pPos[i*3]   = r * Math.sin(phi) * Math.cos(theta);
        pPos[i*3+1] = r * Math.sin(phi) * Math.sin(theta);
        pPos[i*3+2] = r * Math.cos(phi);
      }
      const pGeo = new THREE.BufferGeometry();
      pGeo.setAttribute("position", new THREE.BufferAttribute(pPos, 3));
      const particles = new THREE.Points(pGeo,
        new THREE.PointsMaterial({ color: 0x86efac, size: 0.011, transparent: true, opacity: 0.55, sizeAttenuation: true })
      );
      scene.add(particles);

      /* ── Hotspot dots on surface ── */
      const dotGeo = new THREE.SphereGeometry(0.032, 8, 8);
      const dotMat = new THREE.MeshBasicMaterial({ color: 0x4ade80 });
      [
        [0.6, 0.8, 0.2], [-0.4, 0.6, 0.7], [0.1, -0.9, 0.4],
        [-0.7, 0.1, 0.7], [0.9, -0.1, 0.3],
      ].forEach(([x, y, z]) => {
        const len = Math.sqrt(x*x + y*y + z*z);
        const dot = new THREE.Mesh(dotGeo, dotMat.clone());
        dot.position.set(x/len*1.06, y/len*1.06, z/len*1.06);
        scene.add(dot);
      });

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
      const onResize = () => {
        if (!canvas) return;
        const w = canvas.clientWidth, h = canvas.clientHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      };
      window.addEventListener("resize", onResize, { passive: true });

      /* ── Animation loop ── */
      let t = 0;
      const animate = () => {
        animId = requestAnimationFrame(animate);
        t += 0.004;

        const mx = mouseRef.current?.x || 0;
        const my = mouseRef.current?.y || 0;

        globe.rotation.y    = t + mx * 0.28;
        globe.rotation.x    = my * 0.22;
        wireMesh.rotation.y = t * 0.65 + mx * 0.28;
        wireMesh.rotation.x = my * 0.22;
        particles.rotation.y = t * 0.1;
        particles.rotation.x = t * 0.05;

        camera.position.x = mx * 0.22;
        camera.position.y = -my * 0.16;
        camera.lookAt(0, 0, 0);

        renderer.render(scene, camera);
      };
      animate();

      rafRef.current = { animId, onResize };
    };

    init();

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current.animId);
        window.removeEventListener("resize", rafRef.current.onResize);
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
          <img
            src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=600&q=75"
            alt=""
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
            crossOrigin="anonymous"
            style={{ filter: "brightness(.8) saturate(1.3)" }}
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
  const [threeOk, setThreeOk] = useState(null); // null = loading

  useEffect(() => {
    import("three")
      .then(() => setThreeOk(true))
      .catch(() => setThreeOk(false));
  }, []);

  if (threeOk === null) return null; // brief loading

  return threeOk ? <GrassGlobe mouseRef={mouseRef} /> : <FallbackGlobe />;
}

/* ─── Main Hero ─────────────────────────────────────────────────────────────── */
export default function Hero() {
  const { t }         = useTranslation();
  const { theme }     = useTheme();
  const isDark        = theme === "dark";
  const mouseRef      = useRef({ x: 0, y: 0 });

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
              <Badge icon={Satellite}  text="Satellite NDVI"  isDark={isDark} />
              <Badge icon={Brain}      text="Deep Learning AI" isDark={isDark} />
              <Badge icon={Smartphone} text="Mobile AI"        isDark={isDark} />
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
                { value:"4+",    label:"Seasons" },
              ].map(({ value, label }) => (
                <div key={label} className="text-center lg:text-left">
                  <div className="text-xl sm:text-2xl font-bold hero-display" style={{ color:statVal }}>{value}</div>
                  <div className="text-xs mt-0.5 tracking-wide uppercase" style={{ color:statLbl }}>{label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* GLOBE */}
          <div className="hero-vis relative flex items-center justify-center" style={{ minHeight:280 }}>

            {/* Glow behind globe */}
            <div className="absolute pointer-events-none" aria-hidden="true"
              style={{ width:"115%",height:"115%",background:"radial-gradient(circle,rgba(34,197,94,.2) 0%,transparent 65%)",filter:"blur(30px)" }} />

            {/* Globe canvas wrapper — square */}
            <div className="relative rounded-full overflow-hidden w-full" style={{ aspectRatio:"1/1", maxWidth:"100%" }}>
              <GlobeSection mouseRef={mouseRef} />

              {/* Biomass overlay card */}
              <div className="gcard absolute bottom-5 left-1/2"
                style={{ transform:"translateX(-50%)",padding:"10px 18px",minWidth:180,
                  animation:"heroFadeUp 1s cubic-bezier(.22,1,.36,1) 1.2s both",
                  zIndex:20, whiteSpace:"nowrap" }}>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 rounded-full bg-emerald-400"
                    style={{ animation:"heroPulse 1.5s ease-in-out infinite" }} aria-hidden="true" />
                  <span className="text-xs text-white/65 font-medium tracking-wide uppercase">Live Biomass</span>
                </div>
                <div className="text-xl font-bold text-white hero-display">
                  2 847 <span className="text-sm font-normal text-emerald-400">kg/ha</span>
                </div>
                <div className="text-xs text-emerald-400 mt-0.5">↑ 12% vs last week</div>
              </div>

              {/* NDVI badge */}
              <div className="gcard absolute top-5 right-5"
                style={{ padding:"8px 13px",
                  animation:"heroFadeUp 1s cubic-bezier(.22,1,.36,1) 1.4s both", zIndex:20 }}>
                <div className="text-xs text-white/45 uppercase tracking-wide">NDVI</div>
                <div className="text-lg font-bold text-cyan-400 hero-display">0.74</div>
              </div>
            </div>

            {/* Floating pills — desktop */}
            <div className="hidden lg:flex items-center gap-2 px-4 py-2 absolute -left-4 top-1/3 rounded-full"
              style={{ ...floatPill, animation:"heroFadeUp 1s cubic-bezier(.22,1,.36,1) 1.6s both" }}>
              <div className="w-2 h-2 rounded-full bg-emerald-400" aria-hidden="true" />
              <span className="text-xs font-medium"
                style={{ color: isDark ? "rgba(255,255,255,.75)" : "rgba(20,55,20,.8)" }}>
                Pasture Analysis
              </span>
            </div>

            <div className="hidden lg:flex items-center gap-2 px-4 py-2 absolute -right-4 top-2/3 rounded-full"
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