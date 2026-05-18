// src/app/components/PasturesPage.jsx
// KokMaisa 2025 — Пастбища: полигоны, реальная погода, травы Казахстана
// FIXED: sidebar click→flyTo, StyledSelect isolation, grass type display,
//        i18n completeness, edit polygon, MapSearch z-index

import {
  useState, useEffect, useRef, useCallback, useMemo,
  forwardRef, useImperativeHandle,
} from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useTranslation } from "react-i18next";
import Header from "@/app/components/Header";
import { apiErrorMessage } from "@/app/utils/apiErrors";
import {
  Plus, X, MapPin, Trash2, Edit3, Search, Leaf,
  AlertCircle, Loader2, Save, Eye, MousePointer,
  Undo2, Redo2, CheckCircle2, Map, RotateCcw,
  Wind, Droplets, Thermometer, Cloud, ChevronDown,
  Wheat, BarChart3, Home, Info,
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════
   SECURITY HELPERS
═══════════════════════════════════════════════════════════ */
const sanitize = (str) =>
  typeof str === "string"
    ? str.replace(/[<>"'`]/g, (c) =>
        ({ "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;", "`": "&#96;" }[c])
      )
    : str;

const sanitizeForm = (obj) =>
  Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [
      k,
      typeof v === "string" ? sanitize(v.trim()) : v,
    ])
  );

const validateForm = (form, t, coords) => {
  const errors = {};

  if (!form.name?.trim()) {
    errors.name = t("pastures.err.nameRequired", "Name is required");
  }

  if (!form.farm_id) {
    errors.farm_id = t("pastures.err.farmRequired", "Select a farm");
  }

  if (!coords || coords.length < 3) {
    errors.coordinates = t("pastures.err.boundariesRequired", "Draw pasture boundaries on the map");
  } else if (calcHectares(coords) <= 0) {
    errors.coordinates = t("pastures.err.boundariesInvalid", "Draw a valid pasture area");
  }

  return errors;
};

const firstError = (errors) => Object.values(errors).find(Boolean) || null;

/* ═══════════════════════════════════════════════════════════
   GEO HELPERS
═══════════════════════════════════════════════════════════ */
function calcHectares(coords) {
  if (!coords || coords.length < 3) return 0;
  const R = 6371000;
  const n = coords.length;
  let area = 0;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const lat1 = (coords[i].lat * Math.PI) / 180;
    const lat2 = (coords[j].lat * Math.PI) / 180;
    const dLng = ((coords[j].lng - coords[i].lng) * Math.PI) / 180;
    area += dLng * (2 + Math.sin(lat1) + Math.sin(lat2));
  }
  return parseFloat((Math.abs((area * R * R) / 2) / 10000).toFixed(2));
}

function centroid(coords) {
  if (!coords?.length) return null;
  const lat = coords.reduce((s, c) => s + c.lat, 0) / coords.length;
  const lng = coords.reduce((s, c) => s + c.lng, 0) / coords.length;
  return { lat, lng };
}

function toNumber(v) {
  const n = typeof v === "string" ? parseFloat(v) : v;
  return Number.isFinite(n) ? n : null;
}

function normalizeCoords(raw) {
  if (!raw) return null;

  let data = raw;
  if (typeof raw === "string") {
    try {
      data = JSON.parse(raw);
    } catch {
      return null;
    }
  }

  if (!Array.isArray(data)) return null;

  const coords = data
    .map((point) => {
      if (Array.isArray(point) && point.length >= 2) {
        const lat = toNumber(point[0]);
        const lng = toNumber(point[1]);
        return lat != null && lng != null ? { lat, lng } : null;
      }

      if (point && typeof point === "object") {
        const lat = toNumber(point.lat ?? point.latitude);
        const lng = toNumber(point.lng ?? point.lon ?? point.longitude);
        return lat != null && lng != null ? { lat, lng } : null;
      }

      return null;
    })
    .filter(Boolean);

  return coords.length ? coords : null;
}

/* ═══════════════════════════════════════════════════════════
   WEATHER HELPER
═══════════════════════════════════════════════════════════ */
function getWeatherInfo(code, t) {
  if (code == null) return { label: t("pastures.weather.states.unknown", "—"), emoji: "🌡️" };
  if (code === 0) return { label: t("pastures.weather.states.clear", "Clear"), emoji: "☀️" };
  if (code <= 2) return { label: t("pastures.weather.states.partlyCloudy", "Partly cloudy"), emoji: "🌤️" };
  if (code === 3) return { label: t("pastures.weather.states.overcast", "Overcast"), emoji: "☁️" };
  if (code <= 48) return { label: t("pastures.weather.states.fog", "Fog"), emoji: "🌫️" };
  if (code <= 67) return { label: t("pastures.weather.states.rain", "Rain"), emoji: "🌧️" };
  if (code <= 77) return { label: t("pastures.weather.states.snow", "Snow"), emoji: "❄️" };
  if (code <= 82) return { label: t("pastures.weather.states.shower", "Shower"), emoji: "🌦️" };
  return { label: t("pastures.weather.states.thunder", "Thunderstorm"), emoji: "⛈️" };
}

/* ═══════════════════════════════════════════════════════════
   CONSTANTS
═══════════════════════════════════════════════════════════ */
const GRASS_TYPES = [
  { value: "kovyl_peristy",   labelKey: "pastures.grassOptions.kovyl_peristy",   groupKey: "pastures.grassGroups.steppe" },
  { value: "kovyl_lessing",   labelKey: "pastures.grassOptions.kovyl_lessing",   groupKey: "pastures.grassGroups.steppe" },
  { value: "tipchak",         labelKey: "pastures.grassOptions.tipchak",         groupKey: "pastures.grassGroups.steppe" },
  { value: "tonkonog",        labelKey: "pastures.grassOptions.tonkonog",        groupKey: "pastures.grassGroups.steppe" },
  { value: "zhityak",         labelKey: "pastures.grassOptions.zhityak",         groupKey: "pastures.grassGroups.steppe" },
  { value: "polyyn_belaya",   labelKey: "pastures.grassOptions.polyyn_belaya",   groupKey: "pastures.grassGroups.semiDesert" },
  { value: "polyyn_chernaya", labelKey: "pastures.grassOptions.polyyn_chernaya", groupKey: "pastures.grassGroups.semiDesert" },
  { value: "boyalych",        labelKey: "pastures.grassOptions.boyalych",        groupKey: "pastures.grassGroups.semiDesert" },
  { value: "biyurgun",        labelKey: "pastures.grassOptions.biyurgun",        groupKey: "pastures.grassGroups.semiDesert" },
  { value: "kokpek",          labelKey: "pastures.grassOptions.kokpek",          groupKey: "pastures.grassGroups.semiDesert" },
  { value: "pyrey",           labelKey: "pastures.grassOptions.pyrey",           groupKey: "pastures.grassGroups.meadow" },
  { value: "kostrec",         labelKey: "pastures.grassOptions.kostrec",         groupKey: "pastures.grassGroups.meadow" },
  { value: "myatlik",         labelKey: "pastures.grassOptions.myatlik",         groupKey: "pastures.grassGroups.meadow" },
  { value: "lisohvost",       labelKey: "pastures.grassOptions.lisohvost",       groupKey: "pastures.grassGroups.meadow" },
  { value: "timofeevka",      labelKey: "pastures.grassOptions.timofeevka",      groupKey: "pastures.grassGroups.meadow" },
  { value: "chiy",            labelKey: "pastures.grassOptions.chiy",            groupKey: "pastures.grassGroups.saline" },
  { value: "trostnik",        labelKey: "pastures.grassOptions.trostnik",        groupKey: "pastures.grassGroups.saline" },
  { value: "kamysh",          labelKey: "pastures.grassOptions.kamysh",          groupKey: "pastures.grassGroups.saline" },
  { value: "lyucerna",        labelKey: "pastures.grassOptions.lyucerna",        groupKey: "pastures.grassGroups.cultivated" },
  { value: "donnik",          labelKey: "pastures.grassOptions.donnik",          groupKey: "pastures.grassGroups.cultivated" },
  { value: "klever",          labelKey: "pastures.grassOptions.klever",          groupKey: "pastures.grassGroups.cultivated" },
  { value: "smeshanny",       labelKey: "pastures.grassOptions.smeshanny",       groupKey: "pastures.grassGroups.other" },
];

const PASTURE_COLORS = [
  "#22c55e", "#16a34a", "#65a30d", "#f59e0b",
  "#84cc16", "#10b981", "#0d9488", "#eab308",
];

const STATUSES = [
  { value: "active",   label: "pastures.status.active",   fallback: "Активно" },
  { value: "resting",  label: "pastures.status.resting",  fallback: "На отдыхе" },
  { value: "seasonal", label: "pastures.status.seasonal", fallback: "Сезонное" },
  { value: "degraded", label: "pastures.status.degraded", fallback: "Деградированное" },
];

/* ═══════════════════════════════════════════════════════════
   WEATHER WIDGET
═══════════════════════════════════════════════════════════ */
function WeatherWidget({ lat, lng, isDark }) {
  const { t } = useTranslation();
  const [data,    setData   ] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err,     setErr    ] = useState(false);

  useEffect(() => {
    if (!lat || !lng) return;
    setLoading(true); setErr(false); setData(null);
    const ac = new AbortController();
    const url =
      `https://api.open-meteo.com/v1/forecast` +
      `?latitude=${encodeURIComponent(lat)}&longitude=${encodeURIComponent(lng)}` +
      `&current=temperature_2m,relative_humidity_2m,wind_speed_10m,precipitation,weather_code` +
      `&wind_speed_unit=ms&timezone=auto`;

    fetch(url, { signal: ac.signal })
      .then((r) => { if (!r.ok) throw new Error("weather"); return r.json(); })
      .then((j) => { setData(j.current); setLoading(false); })
      .catch((e) => {
        if (e.name !== "AbortError") { setErr(true); setLoading(false); }
      });

    return () => ac.abort();
  }, [lat, lng]);

  if (!lat || !lng) return null;

  const d  = isDark;
  const tc = d ? "#fff" : "#1a3d20";
  const sc = d ? "rgba(255,255,255,.42)" : "rgba(20,55,20,.5)";
  const bg = d ? "rgba(255,255,255,.04)" : "#f4faf5";
  const br = d ? "rgba(255,255,255,.08)" : "rgba(34,197,94,.12)";

  if (loading) return (
    <div style={{ display:"flex", alignItems:"center", gap:8, padding:"12px 0", color:sc, fontSize:13 }}>
      <Loader2 style={{ width:13, height:13, animation:"spin 1s linear infinite" }} />
      {t("pastures.weather.loading", "Loading weather...")}
    </div>
  );

  if (err || !data) return null;

  const info = getWeatherInfo(data.weather_code, t);
  const items = [
    { icon: <span style={{ fontSize:16 }}>{info.emoji}</span>, val: info.label, lbl: t("pastures.weather.labels.state", "Condition") },
    { icon: <Thermometer style={{ width:13,height:13,color:"#f59e0b" }}/>, val: `${data.temperature_2m}°C`, lbl: t("pastures.weather.labels.temperature", "Temperature") },
    { icon: <Droplets style={{ width:13,height:13,color:"#3b82f6" }}/>, val: `${data.relative_humidity_2m}%`, lbl: t("pastures.weather.labels.humidity", "Humidity") },
    { icon: <Wind style={{ width:13,height:13,color:"#94a3b8" }}/>, val: `${data.wind_speed_10m} ${t("pastures.weather.units.windSpeed", "m/s")}`, lbl: t("pastures.weather.labels.wind", "Wind") },
  ];

  return (
    <div style={{ marginTop:16 }}>
      <div style={{ fontSize:10, fontWeight:700, letterSpacing:".1em", textTransform:"uppercase", color:sc, marginBottom:10, display:"flex", alignItems:"center", gap:6 }}>
        <Cloud style={{ width:11,height:11 }} /> {t("pastures.weather.title", "Weather now")}
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:7 }}>
        {items.map(({ icon, val, lbl }) => (
          <div key={lbl} style={{ padding:"9px 11px", borderRadius:11, background:bg, border:`1px solid ${br}` }}>
            <div style={{ display:"flex", alignItems:"center", gap:5, marginBottom:3 }}>
              {icon}
              <span style={{ fontSize:10, color:sc }}>{lbl}</span>
            </div>
            <div style={{ fontSize:13, fontWeight:600, color:tc, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{val}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   READ-ONLY MAP — полигоны пастбищ (как FarmsPage)
═══════════════════════════════════════════════════════════ */
function PastureMap({ pastures, active, onSelect, height = "100%" }) {
  const { t } = useTranslation();
  const mapRef  = useRef(null);
  const mapInst = useRef(null);
  const layers  = useRef({});
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    if (mapInst.current || !mapRef.current) return;
    import("leaflet").then((L) => {
      const Lf = L.default || L;
      delete Lf.Icon.Default.prototype._getIconUrl;
      Lf.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl:        "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl:      "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });
      const map = Lf.map(mapRef.current, { center:[48.0,68.0], zoom:5, zoomControl:false });
      Lf.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", { attribution:"Tiles © Esri", maxZoom:19 }).addTo(map);
      Lf.tileLayer("https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png", { attribution:"", maxZoom:19, opacity:0.7 }).addTo(map);
      Lf.control.zoom({ position:"bottomright" }).addTo(map);
      mapInst.current = map;
      mapInst.current._Lf = Lf;
      setMapReady(true);

      setTimeout(() => mapInst.current?.invalidateSize({ animate:false }), 100);
      setTimeout(() => mapInst.current?.invalidateSize({ animate:false }), 400);

      if (typeof ResizeObserver !== "undefined" && mapRef.current) {
        const ro = new ResizeObserver(() => requestAnimationFrame(() => mapInst.current?.invalidateSize({ animate:false })));
        ro.observe(mapRef.current);
        mapInst.current._ro = ro;
      }
    });
    return () => {
      if (mapInst.current) {
        mapInst.current._ro?.disconnect();
        mapInst.current.remove();
        mapInst.current = null;
      }
      setMapReady(false);
    };
  }, []);

  // Перерисовка полигонов при изменении списка или активного
  useEffect(() => {
    const map = mapInst.current;
    if (!map || !mapReady) return;
    const Lf = map._Lf;
    if (!Lf) return;

    Object.values(layers.current).forEach((l) => { try { map.removeLayer(l); } catch(_) {} });
    layers.current = {};

    pastures.forEach((p) => {
      const col = p.color || "#22c55e";
      const isActive = active?.id === p.id;

      if (p.coordinates?.length >= 3) {
        const ll = p.coordinates.map((c) => [c.lat, c.lng]);
        const poly = Lf.polygon(ll, {
          color: col, fillColor: col,
          fillOpacity: isActive ? 0.45 : 0.22,
          weight: isActive ? 3 : 2,
        }).addTo(map);

        poly.on("click", () => onSelect?.(p));
        layers.current[p.id] = poly;
      }

      const c = p.coordinates?.length ? centroid(p.coordinates) : (
        p.coordinates_lat != null && p.coordinates_lng != null
          ? { lat: p.coordinates_lat, lng: p.coordinates_lng }
          : null
      );

      if (c) {
        const icon = Lf.divIcon({
          html:`<div style="background:rgba(0,0,0,.75);color:#fff;padding:3px 8px;border-radius:6px;font-size:11px;font-weight:600;white-space:nowrap;border:1px solid ${col}60;font-family:'DM Sans',sans-serif">${sanitize(p.name)}<br><span style="color:${col};font-size:10px">${p.area_ha||0} ${t("pastures.units.hectaresShort", "ha")}</span></div>`,
          className:"", iconAnchor:[40,12],
        });
        const lbl = Lf.marker([c.lat,c.lng], { icon, interactive:false }).addTo(map);
        layers.current[`${p.id}_lbl`] = lbl;

        if (!p.coordinates?.length) {
          const marker = Lf.circleMarker([c.lat, c.lng], {
            radius: isActive ? 8 : 6,
            color: "#ffffff",
            weight: 2,
            fillColor: col,
            fillOpacity: 0.95,
          }).addTo(map);
          marker.on("click", () => onSelect?.(p));
          layers.current[p.id] = marker;
        }
      }
    });

    if (!active) {
      const validCoords = pastures.flatMap((p) => {
        if (p.coordinates?.length >= 3) {
          return p.coordinates.map((c) => [c.lat, c.lng]);
        }
        if (p.coordinates_lat != null && p.coordinates_lng != null) {
          return [[p.coordinates_lat, p.coordinates_lng]];
        }
        return [];
      });

      if (validCoords.length) {
        map.fitBounds(validCoords, {
          padding: [42, 42],
          maxZoom: 11,
        });
      }
    }
  }, [pastures, active, onSelect, mapReady]);

  // Плавный переход к активному пастбищу
  useEffect(() => {
    const map = mapInst.current;
    if (!map || !mapReady || !active?.coordinates?.length) return;
    const bounds = active.coordinates.map((point) => [point.lat, point.lng]);
    map.fitBounds(bounds, {
      padding: [56, 56],
      maxZoom: 12,
      animate: true,
      duration: 1.0,
    });
  }, [active, mapReady]);

  return (
    <>
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <div ref={mapRef} style={{ width:"100%", height, borderRadius:"inherit" }} />
    </>
  );
}

/* ═══════════════════════════════════════════════════════════
   MODAL DRAW MAP — рисование полигона с undo/redo
═══════════════════════════════════════════════════════════ */
const ModalDrawMap = forwardRef(function ModalDrawMap(
  { coords, onCoordsChange, onPointCountChange, existingPastures=[], editingId=null, flyTo },
  ref
) {
  const mapRef  = useRef(null);
  const mapInst = useRef(null);
  const stateRef = useRef({ pts:[], future:[], markers:[], numLabels:[], line:null, poly:null });
  const onCoordsRef     = useRef(onCoordsChange);
  const onCountRef      = useRef(onPointCountChange);
  onCoordsRef.current   = onCoordsChange;
  onCountRef.current    = onPointCountChange;

  const rebuildOverlays = useCallback((Lf, map) => {
    const s = stateRef.current;
    [...s.markers, ...s.numLabels].forEach((m) => { try { map.removeLayer(m); } catch(_) {} });
    if (s.line) { try { map.removeLayer(s.line); } catch(_) {} }
    if (s.poly) { try { map.removeLayer(s.poly); } catch(_) {} }
    s.markers=[]; s.numLabels=[]; s.line=null; s.poly=null;

    s.pts.forEach((p, i) => {
      const dot = Lf.circleMarker([p.lat,p.lng], { radius:6, color:"#fff", fillColor:"#22c55e", fillOpacity:1, weight:2 }).addTo(map);
      const num = Lf.divIcon({ html:`<div style="color:#fff;font-size:9px;font-weight:700;font-family:'DM Sans',sans-serif;text-align:center;line-height:14px">${i+1}</div>`, className:"", iconSize:[14,14], iconAnchor:[7,7] });
      const lbl = Lf.marker([p.lat,p.lng], { icon:num, interactive:false }).addTo(map);
      s.markers.push(dot); s.numLabels.push(lbl);
    });

    if (s.pts.length > 1)
      s.line = Lf.polyline(s.pts.map((p)=>[p.lat,p.lng]), { color:"#22c55e", weight:2.5, dashArray:"8 5" }).addTo(map);
    if (s.pts.length >= 3)
      s.poly = Lf.polygon(s.pts.map((p)=>[p.lat,p.lng]), { color:"#22c55e", fillColor:"#22c55e", fillOpacity:0.2, weight:2 }).addTo(map);

    onCoordsRef.current(s.pts.length >= 3 ? [...s.pts] : null);
    onCountRef.current?.(s.pts.length);
  }, []);

  useImperativeHandle(ref, () => ({
    undo:      () => { const s=stateRef.current; if(!s.pts.length) return; s.future.push(s.pts.pop()); rebuildOverlays(mapInst.current._Lf, mapInst.current); },
    redo:      () => { const s=stateRef.current; if(!s.future.length) return; s.pts.push(s.future.pop()); rebuildOverlays(mapInst.current._Lf, mapInst.current); },
    reset:     () => { const s=stateRef.current; s.future=[...s.pts,...s.future]; s.pts=[]; rebuildOverlays(mapInst.current._Lf, mapInst.current); },
    hasPoints: () => stateRef.current.pts.length > 0,
    flyTo:     (latlng, zoom=8) => mapInst.current?.flyTo(latlng, zoom, { duration:1.1 }),
  }));

  useEffect(() => {
    if (mapInst.current || !mapRef.current) return;
    import("leaflet").then((L) => {
      const Lf = L.default || L;
      delete Lf.Icon.Default.prototype._getIconUrl;
      Lf.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl:        "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl:      "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });
      const map = Lf.map(mapRef.current, { center:[48.0,68.0], zoom:5, zoomControl:false });
      Lf.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", { attribution:"Tiles © Esri", maxZoom:19 }).addTo(map);
      Lf.tileLayer("https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png", { attribution:"", maxZoom:19, opacity:0.65 }).addTo(map);
      Lf.control.zoom({ position:"bottomright" }).addTo(map);
      map.getContainer().style.cursor = "crosshair";
      mapInst.current = map;
      mapInst.current._Lf = Lf;

      if (typeof ResizeObserver !== "undefined" && mapRef.current) {
        const ro = new ResizeObserver(() => requestAnimationFrame(() => mapInst.current?.invalidateSize({ animate:false })));
        ro.observe(mapRef.current);
        mapInst.current._ro = ro;
      }

      // Показываем другие пастбища приглушённо
      existingPastures.forEach((p) => {
        if (!p.coordinates?.length || p.id === editingId) return;
        Lf.polygon(p.coordinates.map((c)=>[c.lat,c.lng]), { color:p.color||"#22c55e", fillColor:p.color||"#22c55e", fillOpacity:0.1, weight:1.5, opacity:0.4 }).addTo(map);
      });

      const onClick = (e) => {
        const { lat, lng } = e.latlng;
        const s = stateRef.current;
        s.future = [];
        s.pts.push({ lat, lng });
        rebuildOverlays(Lf, map);
      };
      map.on("click", onClick);
      mapInst.current._onClick = onClick;

      // FIX: При редактировании — загружаем существующий полигон
      if (coords?.length) {
        const s = stateRef.current;
        if (!s.pts.length) {
          s.pts = coords.map((c) => ({ lat:c.lat, lng:c.lng }));
          rebuildOverlays(Lf, map);
          const c = centroid(coords);
          if (c) map.flyTo([c.lat, c.lng], 12, { duration:0.8 });
        }
      }
    });
    return () => {
      if (mapInst.current) {
        mapInst.current._ro?.disconnect();
        mapInst.current.off("click", mapInst.current._onClick);
        mapInst.current.remove();
        mapInst.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!flyTo || !mapInst.current) return;
    mapInst.current.flyTo(flyTo.latlng, flyTo.zoom ?? 8, { duration:1.1 });
  }, [flyTo]);

  return <div ref={mapRef} style={{ width:"100%", height:"100%", borderRadius:"inherit" }} />;
});

/* ═══════════════════════════════════════════════════════════
   MAP SEARCH — Nominatim геокодер (как на странице фермы)
═══════════════════════════════════════════════════════════ */
function MapSearch({ onSelect, isDark, placeholder }) {
  const { t } = useTranslation();
  const [query,   setQuery  ] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open,    setOpen   ] = useState(false);
  const [focused, setFocused] = useState(false);
  const debRef   = useRef(null);
  const contRef  = useRef(null);
  const abortRef = useRef(null);

  useEffect(() => {
    const fn = (e) => { if (contRef.current && !contRef.current.contains(e.target)) { setOpen(false); setFocused(false); } };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  const search = useCallback((q) => {
    const trimmed = q.trim();
    if (trimmed.length < 2) { setResults([]); setOpen(false); return; }
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();
    setLoading(true);
    fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=6&countrycodes=kz&q=${encodeURIComponent(trimmed)}&accept-language=ru`,
      { signal:abortRef.current.signal, headers:{ "Accept-Language":"ru" } }
    )
      .then((r) => r.json())
      .then((data) => {
        const safe = (data||[]).filter((r)=>r.lat&&r.lon&&r.display_name).map((r)=>({
          id:r.place_id,
          label:r.display_name.replace(/,\s*Казахстан$/i,"").slice(0,80),
          lat:parseFloat(r.lat), lng:parseFloat(r.lon), type:r.type,
        }));
        setResults(safe); setOpen(safe.length>0); setLoading(false);
      })
      .catch((e) => { if (e.name!=="AbortError") setLoading(false); });
  }, []);

  const handleChange = (e) => {
    const v = e.target.value.slice(0,120);
    setQuery(v);
    clearTimeout(debRef.current);
    if (!v.trim()) { setResults([]); setOpen(false); setLoading(false); return; }
    setLoading(true);
    debRef.current = setTimeout(() => search(v), 380);
  };

  const handleSelect = (item) => { setQuery(item.label); setResults([]); setOpen(false); onSelect?.(item); };
  const handleClear  = () => { setQuery(""); setResults([]); setOpen(false); setLoading(false); abortRef.current?.abort(); };

  const bg     = isDark ? "rgba(4,13,6,.92)" : "rgba(255,255,255,.95)";
  const border = focused ? "rgba(74,222,128,.55)" : (isDark ? "rgba(255,255,255,.14)" : "rgba(34,197,94,.25)");
  const tc     = isDark ? "#fff" : "#1a3d20";
  const sc     = isDark ? "rgba(255,255,255,.38)" : "rgba(20,55,20,.45)";
  const dropBg = isDark ? "rgba(4,13,6,.97)" : "#fff";
  const hoverBg= isDark ? "rgba(74,222,128,.1)"  : "rgba(34,197,94,.07)";

  return (
    <div ref={contRef} style={{ position:"absolute", top:12, left:12, right:12, zIndex:500 }}>
      <div style={{ display:"flex", alignItems:"center", background:bg, border:`1px solid ${border}`, borderRadius: open&&results.length?"12px 12px 0 0":12, backdropFilter:"blur(16px)", boxShadow: focused?"0 4px 24px rgba(0,0,0,.35), 0 0 0 3px rgba(74,222,128,.12)":"0 2px 16px rgba(0,0,0,.25)", transition:"border-color .2s,box-shadow .2s,border-radius .15s", overflow:"hidden" }}>
        <div style={{ padding:"0 12px", display:"flex", alignItems:"center", flexShrink:0 }}>
          {loading
            ? <Loader2 style={{ width:14,height:14,color:"#4ade80",animation:"spin 1s linear infinite" }} />
            : <Search  style={{ width:14,height:14,color:sc }} />
          }
        </div>
        <input value={query} onChange={handleChange}
          onFocus={() => { setFocused(true); if (results.length>0) setOpen(true); }}
          onBlur={() => setFocused(false)}
          onKeyDown={(e) => { if (e.key==="Escape") handleClear(); if (e.key==="Enter"&&results.length>0) handleSelect(results[0]); }}
          placeholder={placeholder} maxLength={120}
          style={{ flex:1, padding:"11px 0", background:"transparent", border:"none", outline:"none", fontSize:13, fontFamily:"'DM Sans',sans-serif", fontWeight:500, color:tc }}
        />
        {query && (
          <button onClick={handleClear} style={{ padding:"0 12px", background:"none", border:"none", cursor:"pointer", display:"flex", alignItems:"center", color:sc }}
            onMouseEnter={(e) => e.currentTarget.style.color="#f87171"}
            onMouseLeave={(e) => e.currentTarget.style.color=sc}>
            <X style={{ width:13,height:13 }} />
          </button>
        )}
      </div>

      {open && results.length > 0 && (
        <div style={{ background:dropBg, border:`1px solid ${isDark?"rgba(74,222,128,.2)":"rgba(34,197,94,.2)"}`, borderTop:"none", borderRadius:"0 0 12px 12px", overflow:"hidden", backdropFilter:"blur(16px)", boxShadow:"0 12px 32px rgba(0,0,0,.35)", maxHeight:240, overflowY:"auto" }}>
          {results.map((item, i) => (
            <div key={item.id??i} onClick={() => handleSelect(item)}
              style={{ padding:"9px 13px", display:"flex", alignItems:"flex-start", gap:9, cursor:"pointer", borderBottom: i<results.length-1?`1px solid ${isDark?"rgba(255,255,255,.05)":"rgba(34,197,94,.07)"}`:undefined, transition:"background .12s" }}
              onMouseEnter={(e) => e.currentTarget.style.background=hoverBg}
              onMouseLeave={(e) => e.currentTarget.style.background="transparent"}>
              <MapPin style={{ width:12,height:12,color:"#4ade80",flexShrink:0,marginTop:2 }} />
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:13, fontWeight:600, color:tc, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{item.label.split(",")[0]}</div>
                <div style={{ fontSize:11, color:sc, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{item.label.split(",").slice(1).join(",").trim()}</div>
              </div>
            </div>
          ))}
          <div style={{ padding:"6px 13px", fontSize:10, color:sc, borderTop:`1px solid ${isDark?"rgba(255,255,255,.05)":"rgba(34,197,94,.07)"}` }}>© OpenStreetMap / Nominatim</div>
        </div>
      )}

      {open && !loading && query.trim().length>=2 && results.length===0 && (
        <div style={{ background:dropBg, border:`1px solid ${isDark?"rgba(255,255,255,.1)":"rgba(34,197,94,.15)"}`, borderTop:"none", borderRadius:"0 0 12px 12px", padding:"12px 13px", fontSize:13, color:sc, backdropFilter:"blur(16px)" }}>
          {t("pastures.map.nothingFound", "Nothing found")}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   STYLED SELECT — кастомный дропдаун
   FIX: используется isolation:isolate на родителе чтобы
        z-index:9999 не вылезал на карту
═══════════════════════════════════════════════════════════ */
function StyledSelect({ value, onChange, options, placeholder, isDark }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const fn = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  const selected = options.find((o) => (o.value ?? o) === value);
  const label    = selected ? (selected.label ?? selected) : placeholder;

  const tc       = isDark ? "#fff" : "#1a3d20";
  const sc       = isDark ? "rgba(255,255,255,.4)" : "rgba(20,55,20,.45)";
  const bg       = isDark ? "rgba(255,255,255,.06)" : "#f4faf5";
  const border   = isDark ? "rgba(255,255,255,.12)" : "rgba(34,197,94,.22)";
  const dropBg   = isDark ? "#061309" : "#fff";
  const hoverBg  = isDark ? "rgba(74,222,128,.1)"  : "rgba(34,197,94,.07)";

  return (
    <div ref={ref} style={{ position:"relative", width:"100%" }}>
      <button type="button" onClick={() => setOpen((v)=>!v)}
        style={{ width:"100%", padding:"11px 36px 11px 14px", borderRadius:11, background:bg, border:`1px solid ${open?"#22c55e":border}`, color:value?tc:sc, fontSize:14, textAlign:"left", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"space-between", fontFamily:"'DM Sans',sans-serif", transition:"border-color .2s", boxShadow:open?"0 0 0 3px rgba(34,197,94,.1)":"none" }}>
        <span style={{ flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{label}</span>
        <ChevronDown style={{ width:15,height:15,color:sc,flexShrink:0,transition:"transform .2s",transform:open?"rotate(180deg)":"none",marginLeft:8 }} />
      </button>
      {open && (
        <div style={{ position:"absolute", top:"calc(100% + 6px)", left:0, right:0, zIndex:9999, background:dropBg, border:`1px solid ${isDark?"rgba(74,222,128,.2)":"rgba(34,197,94,.2)"}`, borderRadius:12, overflow:"hidden", boxShadow:isDark?"0 16px 40px rgba(0,0,0,.6)":"0 8px 32px rgba(34,197,94,.15)", maxHeight:220, overflowY:"auto" }}>
          {placeholder && (
            <div onClick={() => { onChange(""); setOpen(false); }} style={{ padding:"10px 14px", fontSize:13, color:sc, cursor:"pointer" }}>{placeholder}</div>
          )}
          {options.map((opt) => {
            const val  = opt.value !== undefined ? opt.value : opt;
            const lbl  = opt.label ?? opt;
            const isSel= val === value;
            return (
              <div key={val} onClick={() => { onChange(val); setOpen(false); }}
                style={{ padding:"10px 14px", fontSize:14, cursor:"pointer", color:isSel?(isDark?"#4ade80":"#16a34a"):tc, background:isSel?(isDark?"rgba(74,222,128,.12)":"rgba(34,197,94,.08)"):"transparent", fontWeight:isSel?600:400, transition:"background .1s" }}
                onMouseEnter={(e) => { if(!isSel) e.currentTarget.style.background=hoverBg; }}
                onMouseLeave={(e) => { if(!isSel) e.currentTarget.style.background="transparent"; }}>
                {lbl}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   STYLES
═══════════════════════════════════════════════════════════ */
const STYLE = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');
*,*::before,*::after{box-sizing:border-box;}

.pp{font-family:'DM Sans',sans-serif;min-height:100vh;isolation:isolate;}
.pp-d{background:#040d06;color:#fff;}
.pp-l{background:#f4faf5;color:#1a3d20;}

.pp-hero{padding:96px 0 32px;position:relative;overflow:hidden;}
.pp-hero-d{background:linear-gradient(160deg,#061309 0%,#071a0c 100%);border-bottom:1px solid rgba(74,222,128,.1);}
.pp-hero-l{background:linear-gradient(160deg,#e8f7ea 0%,#f0faf2 100%);border-bottom:1px solid rgba(34,197,94,.15);}
.pp-hero::before{content:'';position:absolute;inset:0;background:radial-gradient(circle at 70% 50%,rgba(34,197,94,.06) 0%,transparent 60%);pointer-events:none;}

.pp-body{display:flex;height:calc(100vh - 196px);min-height:580px;max-width:1300px;margin:0 auto;}
.pp-sidebar{width:330px;flex-shrink:0;display:flex;flex-direction:column;overflow:hidden;border-right:1px solid;}
.pp-sidebar-d{border-color:rgba(255,255,255,.07);background:rgba(5,16,8,.95);}
.pp-sidebar-l{border-color:rgba(34,197,94,.12);background:#fff;}
.pp-map-area{flex:1;position:relative;overflow:hidden;min-height:0;isolation:isolate;}

.pp-mob-tabs{display:none;}

@media(max-width:1024px){
  .pp-mob-tabs{display:flex;align-items:center;gap:8px;padding:0 16px 12px;max-width:1300px;margin:0 auto;}
  .pp-mob-tab{flex:1;padding:11px 0;border-radius:13px;border:none;cursor:pointer;font-family:'DM Sans',sans-serif;font-size:13px;font-weight:600;display:flex;align-items:center;justify-content:center;gap:7px;transition:all .22s;}
  .pp-body{position:relative;height:calc(100svh - 278px);min-height:400px;max-width:100%;overflow:hidden;}
  .pp-sidebar{position:absolute;inset:0;width:100%;border-right:none;z-index:2;transition:opacity .22s,visibility .22s;}
  .pp-map-area{position:absolute;inset:0;z-index:2;transition:opacity .22s,visibility .22s;}
  .pp-panel-hidden{opacity:0!important;visibility:hidden!important;pointer-events:none!important;z-index:1!important;}
}
@media(max-width:600px){
  .pp-hero{padding:72px 0 16px;}
  .pp-body{height:calc(100svh - 253px);min-height:350px;}
  .pp-mob-tabs{padding:0 10px 10px;}
}
@media(max-width:380px){
  .pp-body{height:calc(100svh - 243px);min-height:320px;}
  .pp-mob-tab{font-size:12px;padding:9px 0;}
}

.pp-sh{padding:18px 16px 14px;border-bottom:1px solid;flex-shrink:0;}
.pp-sh-d{border-color:rgba(255,255,255,.06);}
.pp-sh-l{border-color:rgba(34,197,94,.1);}

.pp-sw{position:relative;}
.pp-sw svg{position:absolute;left:12px;top:50%;transform:translateY(-50%);pointer-events:none;}
.pp-search{width:100%;padding:9px 12px 9px 34px;border-radius:10px;font-size:13px;outline:none;font-family:'DM Sans',sans-serif;transition:border-color .2s;}
.pp-search-d{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);color:#fff;}
.pp-search-d::placeholder{color:rgba(255,255,255,.3);}
.pp-search-d:focus{border-color:rgba(74,222,128,.45);}
.pp-search-l{background:#f4faf5;border:1px solid rgba(34,197,94,.2);color:#1a3d20;}
.pp-search-l::placeholder{color:rgba(20,55,20,.35);}
.pp-search-l:focus{border-color:#22c55e;box-shadow:0 0 0 3px rgba(34,197,94,.08);}

.pp-list{flex:1;overflow-y:auto;padding:10px;}
.pp-list::-webkit-scrollbar{width:4px;}
.pp-list::-webkit-scrollbar-thumb{background:rgba(74,222,128,.2);border-radius:4px;}

.pp-card{border-radius:14px;padding:13px;cursor:pointer;transition:all .18s;margin-bottom:5px;border:1px solid transparent;}
.pp-card-d{background:rgba(255,255,255,.04);}
.pp-card-d:hover{background:rgba(255,255,255,.07);border-color:rgba(74,222,128,.2);}
.pp-card-d.active{background:rgba(74,222,128,.08);border-color:rgba(74,222,128,.3);}
.pp-card-l{background:#f8fdf8;}
.pp-card-l:hover{background:#fff;border-color:rgba(34,197,94,.25);box-shadow:0 4px 14px rgba(34,197,94,.08);}
.pp-card-l.active{background:#fff;border-color:rgba(34,197,94,.4);box-shadow:0 4px 18px rgba(34,197,94,.12);}

.pp-btn-create{width:100%;padding:12px 16px;border-radius:13px;border:none;cursor:pointer;font-family:'DM Sans',sans-serif;font-size:14px;font-weight:700;display:flex;align-items:center;justify-content:center;gap:9px;background:linear-gradient(135deg,#22c55e 0%,#16a34a 100%);color:#fff;transition:transform .2s,box-shadow .2s;margin-bottom:10px;position:relative;overflow:hidden;letter-spacing:.01em;}
.pp-btn-create::before{content:'';position:absolute;inset:0;background:linear-gradient(135deg,rgba(255,255,255,.18) 0%,transparent 60%);pointer-events:none;}
.pp-btn-create:hover{transform:translateY(-1px);box-shadow:0 10px 28px rgba(34,197,94,.4);}

.pp-iBtn{width:28px;height:28px;border-radius:7px;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:background .15s;background:transparent;}
.pp-iBtn-d:hover{background:rgba(255,255,255,.1);}
.pp-iBtn-l:hover{background:rgba(34,197,94,.1);}

.pp-stats-strip{display:flex;border-top:1px solid;flex-shrink:0;}
.pp-stat-item{flex:1;padding:13px 14px;}
.pp-stat-item+.pp-stat-item{border-left:1px solid;}

/* Overlay */
.pp-ov{position:fixed;inset:0;background:rgba(0,0,0,.75);backdrop-filter:blur(8px);z-index:500;display:flex;align-items:center;justify-content:center;padding:16px;overflow-y:auto;}

/* Create modal */
.pp-create-modal{border-radius:24px;width:100%;max-width:1040px;animation:mIn .35s cubic-bezier(.22,1,.36,1) both;display:flex;overflow:hidden;max-height:92vh;}
.pp-create-modal-d{background:#061309;border:1px solid rgba(255,255,255,.1);box-shadow:0 48px 96px rgba(0,0,0,.75);}
.pp-create-modal-l{background:#fff;border:1px solid rgba(34,197,94,.15);box-shadow:0 24px 64px rgba(0,0,0,.16);}

/* FIX: isolation:isolate на форм-панели чтобы z-index:9999 у StyledSelect
        не вылезал поверх правой панели карты */
.pp-form-panel{width:400px;flex-shrink:0;overflow-y:auto;padding:28px 24px;display:flex;flex-direction:column;isolation:isolate;}
.pp-form-panel::-webkit-scrollbar{width:4px;}
.pp-form-panel::-webkit-scrollbar-thumb{background:rgba(74,222,128,.2);border-radius:4px;}
.pp-form-panel-d{border-right:1px solid rgba(255,255,255,.07);}
.pp-form-panel-l{border-right:1px solid rgba(34,197,94,.1);}

.pp-map-panel{flex:1;position:relative;min-height:540px;display:flex;flex-direction:column;}
.pp-map-panel-d{background:#030a04;}
.pp-map-panel-l{background:#f0faf2;}

/* FIX: Обёртка для карты и поиска — поиск снаружи overflow:hidden */
.pp-map-search-wrap{position:relative;flex:1;display:flex;flex-direction:column;overflow:hidden;}
.pp-map-panel-inner{flex:1;position:relative;overflow:hidden;}

.pp-map-toolbar{padding:10px 12px;display:flex;align-items:center;gap:8px;border-bottom:1px solid;flex-shrink:0;flex-wrap:wrap;}
.pp-map-toolbar-d{border-color:rgba(255,255,255,.07);background:rgba(0,0,0,.3);}
.pp-map-toolbar-l{border-color:rgba(34,197,94,.1);background:rgba(240,250,242,.8);}

.pp-tb-btn{display:flex;align-items:center;justify-content:center;gap:5px;padding:5px 10px;border-radius:8px;border:none;cursor:pointer;font-family:'DM Sans',sans-serif;font-size:12px;font-weight:600;transition:background .15s,opacity .15s;white-space:nowrap;}
.pp-tb-btn:disabled{opacity:.35;cursor:not-allowed;}
.pp-tb-btn-d{background:rgba(255,255,255,.08);color:rgba(255,255,255,.7);}
.pp-tb-btn-d:not(:disabled):hover{background:rgba(255,255,255,.14);}
.pp-tb-btn-l{background:rgba(20,55,20,.06);color:rgba(20,55,20,.7);}
.pp-tb-btn-l:not(:disabled):hover{background:rgba(20,55,20,.12);}
.pp-tb-btn-danger{background:rgba(239,68,68,.12)!important;color:#f87171!important;}
.pp-tb-btn-danger:not(:disabled):hover{background:rgba(239,68,68,.2)!important;}

.pp-ha-badge{display:inline-flex;align-items:center;gap:7px;padding:6px 14px;border-radius:999px;font-size:13px;font-weight:700;background:rgba(74,222,128,.12);color:#4ade80;border:1px solid rgba(74,222,128,.25);font-family:'Syne',sans-serif;transition:all .3s;margin-left:auto;flex-shrink:0;}
.pp-ha-badge.has-poly{background:rgba(74,222,128,.18);border-color:rgba(74,222,128,.45);}

.pp-draw-hint{position:absolute;bottom:16px;left:50%;transform:translateX(-50%);padding:10px 18px;border-radius:999px;font-size:12px;font-weight:600;display:flex;align-items:center;gap:8px;z-index:100;white-space:nowrap;backdrop-filter:blur(14px);border:1px solid rgba(74,222,128,.3);background:rgba(4,13,6,.9);color:#4ade80;pointer-events:none;animation:hintIn .3s ease;}
@keyframes hintIn{from{opacity:0;transform:translateX(-50%) translateY(8px);}to{opacity:1;transform:translateX(-50%) translateY(0);}}

/* View modal */
.pp-modal{border-radius:22px;padding:28px;width:100%;max-width:540px;animation:mIn .3s cubic-bezier(.22,1,.36,1) both;max-height:92vh;overflow-y:auto;}
.pp-modal::-webkit-scrollbar{width:4px;}
.pp-modal::-webkit-scrollbar-thumb{background:rgba(74,222,128,.2);border-radius:4px;}
@keyframes mIn{from{opacity:0;transform:scale(.95) translateY(12px);}to{opacity:1;transform:scale(1) translateY(0);}}
.pp-modal-d{background:#061309;border:1px solid rgba(255,255,255,.1);box-shadow:0 40px 80px rgba(0,0,0,.7);}
.pp-modal-l{background:#fff;border:1px solid rgba(34,197,94,.15);box-shadow:0 20px 60px rgba(0,0,0,.14);}

/* Inputs */
.pp-inp{width:100%;padding:11px 14px;border-radius:11px;font-size:14px;outline:none;font-family:'DM Sans',sans-serif;transition:all .2s;box-sizing:border-box;}
.pp-inp-d{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);color:#fff;}
.pp-inp-d::placeholder{color:rgba(255,255,255,.3);}
.pp-inp-d:focus{border-color:rgba(74,222,128,.5);background:rgba(255,255,255,.09);}
.pp-inp-l{background:#f4faf5;border:1px solid rgba(34,197,94,.22);color:#1a3d20;}
.pp-inp-l::placeholder{color:rgba(20,55,20,.35);}
.pp-inp-l:focus{border-color:#22c55e;box-shadow:0 0 0 3px rgba(34,197,94,.08);background:#fff;}
.pp-inp-error{border-color:#ef4444!important;box-shadow:0 0 0 3px rgba(239,68,68,.12)!important;}
.pp-field-error{display:flex;align-items:center;gap:6px;margin-top:6px;font-size:12px;font-weight:600;color:#f87171;}
.pp-map-field-error{display:flex;align-items:flex-start;gap:8px;margin:10px 12px 0;padding:10px 12px;border-radius:10px;background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.24);font-size:12px;font-weight:600;color:#f87171;line-height:1.35;}
.pp-ha-badge.has-error{background:rgba(239,68,68,.12);border-color:rgba(239,68,68,.35);color:#f87171;}

.pp-lbl{font-size:11px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;margin-bottom:5px;display:flex;align-items:center;gap:5px;}
.pp-lbl-d{color:rgba(255,255,255,.38);}
.pp-lbl-l{color:rgba(20,55,20,.48);}

.pp-section{font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;margin-bottom:10px;display:flex;align-items:center;gap:6px;}
.pp-section-d{color:rgba(255,255,255,.35);}
.pp-section-l{color:rgba(20,55,20,.4);}

.pp-div{height:1px;margin:18px 0;}
.pp-div-d{background:rgba(255,255,255,.07);}
.pp-div-l{background:rgba(34,197,94,.1);}

.pp-swatch{width:26px;height:26px;border-radius:7px;cursor:pointer;transition:transform .15s;border:2px solid transparent;flex-shrink:0;}
.pp-swatch:hover{transform:scale(1.18);}
.pp-swatch.sel{border-color:#fff;box-shadow:0 0 0 2px rgba(255,255,255,.4);}

.pp-save{width:100%;padding:13px;border-radius:12px;border:none;cursor:pointer;font-family:'DM Sans',sans-serif;font-size:14px;font-weight:600;background:linear-gradient(135deg,#22c55e,#0d9488);color:#fff;transition:transform .2s,box-shadow .2s;display:flex;align-items:center;justify-content:center;gap:8px;}
.pp-save:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 8px 24px rgba(34,197,94,.4);}
.pp-save:disabled{opacity:.6;cursor:not-allowed;}
.pp-cancel{padding:12px 18px;border-radius:12px;border:none;cursor:pointer;font-family:'DM Sans',sans-serif;font-size:14px;font-weight:500;display:flex;align-items:center;justify-content:center;transition:background .15s;}
.pp-cancel-d{background:rgba(255,255,255,.07);color:rgba(255,255,255,.65);}
.pp-cancel-d:hover{background:rgba(255,255,255,.12);}
.pp-cancel-l{background:rgba(20,55,20,.06);color:rgba(20,55,20,.65);}
.pp-cancel-l:hover{background:rgba(20,55,20,.1);}

.pp-err{display:flex;align-items:center;gap:8px;padding:10px 12px;border-radius:10px;margin-bottom:14px;background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.2);font-size:13px;color:#f87171;}

.pp-2col{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px;}
@media(max-width:800px){
  .pp-create-modal{flex-direction:column;max-width:600px;max-height:96vh;overflow-y:auto;overflow-x:hidden;}
  .pp-form-panel{width:100%;max-height:none;overflow-y:visible;border-right:none!important;border-bottom:1px solid;}
  .pp-map-panel{height:340px!important;min-height:340px;flex-shrink:0;flex:none;}
  .pp-map-panel-inner{height:290px!important;min-height:290px;flex:none;}
}
@media(max-width:480px){
  .pp-create-modal{border-radius:18px;}
  .pp-form-panel{padding:16px 14px;}
  .pp-map-panel{height:300px!important;min-height:300px;}
  .pp-map-panel-inner{height:250px!important;min-height:250px;}
}
@media(max-width:400px){
  .pp-2col{grid-template-columns:1fr;}
  .pp-ov{padding:6px;}
  .pp-create-modal{border-radius:14px;}
}

.pp-px{padding-left:24px;padding-right:24px;}
@media(max-width:600px){.pp-px{padding-left:14px;padding-right:14px;}}

.pp-ha{font-size:22px;font-weight:800;font-family:'Syne',sans-serif;}

@keyframes spin{to{transform:rotate(360deg)}}
`;

/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════ */
export default function PasturesPage() {
  const {
    user, isAuthenticated,
    getFarms, getPastures,
    createPasture, updatePasture, deletePasture,
    getPastureMeasurements,
  } = useAuth();
  const { theme } = useTheme();
  const { t, i18n } = useTranslation();
  const navigate  = useNavigate();
  const isDark    = theme === "dark";
  const d         = isDark;

  /* ── State ──────────────────────────────────────────────── */
  const [pastures,      setPastures    ] = useState([]);
  const [farms,         setFarms       ] = useState([]);
  const [loading,       setLoading     ] = useState(true);
  const [search,        setSearch      ] = useState("");
  const [activePasture, setActivePasture] = useState(null);
  const [modal,         setModal       ] = useState(null);
  const [mobileTab,     setMobileTab   ] = useState("list");
  const [drawnCoords,   setDrawnCoords ] = useState(null);
  const [pointCount,    setPointCount  ] = useState(0);
  const [submitting,    setSubmitting  ] = useState(false);
  const [apiError,      setApiError    ] = useState("");
  const [formErrors,    setFormErrors  ] = useState({});
  const [editId,        setEditId      ] = useState(null);
  const [mapKey,        setMapKey      ] = useState(0);
  const [flyTo,         setFlyTo       ] = useState(null);
  const [searchFlyTo,   setSearchFlyTo ] = useState(null);
  const [measurements,  setMeasurements] = useState(undefined);
  const [measLoading,   setMeasLoading ] = useState(false);

  const drawMapRef = useRef(null);

  /* ── Form ───────────────────────────────────────────────── */
  const blankForm = useCallback(() => ({
    name:       "",
    farm_id:    "",
    grass_type: "",
    status:     "active",
    description:"",
    color:      PASTURE_COLORS[0],
  }), []);

  const [form, setForm] = useState(blankForm);
  const setF = (k, v) => {
    setForm((f) => ({ ...f, [k]:v }));
    setFormErrors((errs) => ({ ...errs, [k]: "" }));
    if (apiError) setApiError("");
  };

  /* ── Auth guard & load ──────────────────────────────────── */
  useEffect(() => {
    if (!isAuthenticated) { navigate("/login"); return; }
    load();
  }, [isAuthenticated]);

  const load = async () => {
    setLoading(true);
    try {
      const [pData, fData] = await Promise.all([getPastures?.(), getFarms?.()]);
      setPastures(
        (pData||[]).map((p) => {
          const coordinates = normalizeCoords(p.coordinates);
          return {
            ...p,
            grass_type: p.grass_type ?? p.pasture_type ?? "",
            coordinates,
            coordinates_lat: toNumber(p.coordinates_lat),
            coordinates_lng: toNumber(p.coordinates_lng),
            area_ha: coordinates?.length >= 3 ? calcHectares(coordinates) : (p.area || 0),
            color: p.color || PASTURE_COLORS[0],
          };
        })
      );
      setFarms(fData||[]);
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  };

  /* ── Fetch measurements on view open ────────────────────── */
  useEffect(() => {
    if (modal !== "view" || !activePasture) { setMeasurements(undefined); return; }
    if (!getPastureMeasurements) { setMeasurements(null); return; }
    setMeasLoading(true);
    getPastureMeasurements(activePasture.id)
      .then((rows) => {
        const sorted = [...(rows || [])].sort(
          (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
        );
        setMeasurements(sorted);
      })
      .catch(() => setMeasurements(null))
      .finally(() => setMeasLoading(false));
  }, [modal, activePasture?.id, getPastureMeasurements]);

  /* ── Derived ────────────────────────────────────────────── */
  const filtered = useMemo(() =>
    pastures.filter((p) => p.name.toLowerCase().includes(search.toLowerCase())),
    [pastures, search]
  );

  const totalHa = useMemo(() =>
    pastures.reduce((s, p) => s + (p.area_ha || 0), 0),
    [pastures]
  );

  // FIX: grassLabel — находит по value или возвращает как есть
  const grassLabel = useCallback((v) => {
    if (!v) return "—";
    const found = GRASS_TYPES.find((g) => g.value === v);
    return found ? t(found.labelKey, found.value) : v;
  }, [t]);

  // Короткое имя без латинского (для списка)
  const grassShortLabel = useCallback((v) => {
    const full = grassLabel(v);
    return full.includes("(") ? full.split("(")[0].trim() : full;
  }, [grassLabel]);

  const statusLabel = useCallback((v) => {
    const s = STATUSES.find((s) => s.value === v);
    return s ? t(s.label, s.fallback) : v || "—";
  }, [t]);

  const farmLabel = useCallback((id) =>
    farms.find((f) => String(f.id) === String(id))?.name || "—",
    [farms]
  );

  /* ── CRUD ───────────────────────────────────────────────── */
  const openCreate = () => {
    setEditId(null);
    setForm({ ...blankForm(), color: PASTURE_COLORS[pastures.length % PASTURE_COLORS.length] });
    setDrawnCoords(null); setPointCount(0); setFlyTo(null); setSearchFlyTo(null);
    setApiError(""); setFormErrors({});
    setMapKey((k) => k + 1);
    setModal("create");
  };

  // FIX: При редактировании загружаем существующий полигон
  const handleEdit = (p) => {
    setEditId(p.id);
    setForm({
      name:       p.name        || "",
      farm_id:    p.farm_id != null ? String(p.farm_id) : "",
      grass_type: p.grass_type  || "",
      status:     p.status      || "active",
      description:p.description || "",
      color:      p.color       || PASTURE_COLORS[0],
    });
    // Загружаем существующие координаты для отображения на карте
    setDrawnCoords(p.coordinates?.length ? p.coordinates : null);
    setPointCount(p.coordinates?.length || 0);
    setFlyTo(null); setSearchFlyTo(null); setApiError(""); setFormErrors({});
    setMapKey((k) => k + 1);
    setModal("create");
  };

  const handleCoordsChange = useCallback((c) => {
    setDrawnCoords(c);
    if (c?.length >= 3) {
      setFormErrors((errs) => ({ ...errs, coordinates: "" }));
      if (apiError) setApiError("");
    }
  }, [apiError]);
  const handlePointCount   = useCallback((n) => setPointCount(n),  []);

  const computedHa = useMemo(() =>
    drawnCoords?.length >= 3 ? calcHectares(drawnCoords) : null,
    [drawnCoords]
  );

  const handleSave = async () => {
    const errors = validateForm(form, t, drawnCoords);
    const err = firstError(errors);
    if (err) {
      setFormErrors(errors);
      setApiError(t("pastures.err.fixFields", "Check the highlighted fields"));
      if (errors.coordinates) setMobileTab("map");
      return;
    }
    setSubmitting(true); setApiError(""); setFormErrors({});
    try {
      const coords = drawnCoords;
      const ha     = coords?.length >= 3 ? calcHectares(coords) : 0;
      const c      = centroid(coords||[]);
      const clean  = sanitizeForm(form);
      const payload = {
        name:            clean.name,
        farm_id:         parseInt(clean.farm_id),
        grass_type:      clean.grass_type  || null,
        pasture_type:    clean.grass_type  || null,
        status:          clean.status      || "active",
        description:     clean.description || null,
        color:           clean.color,
        area:            ha,
        coordinates:     coords?.map((p)=>({ lat:p.lat, lng:p.lng })) || null,
        coordinates_lat: c ? c.lat : null,
        coordinates_lng: c ? c.lng : null,
      };

      if (editId) await updatePasture?.(editId, payload);
      else        await createPasture?.(payload);

      await load();
      setModal(null); setDrawnCoords(null); setEditId(null); setForm(blankForm());
    } catch(e) {
      setApiError(apiErrorMessage(e?.response?.data?.detail || e, i18n));
    } finally { setSubmitting(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t("pastures.confirmDelete","Удалить пастбище?"))) return;
    try {
      await deletePasture?.(id);
      if (activePasture?.id === id) setActivePasture(null);
      setModal(null);
      await load();
    } catch(e) { console.error(e); }
  };

  const closeCreateModal = () => {
    setModal(null); setDrawnCoords(null); setFormErrors({}); setApiError("");
    setFlyTo(null); setSearchFlyTo(null);
  };

  /* ── Style helpers ──────────────────────────────────────── */
  const tc = d ? "#fff" : "#1a3d20";
  const sc = d ? "rgba(255,255,255,.42)" : "rgba(20,55,20,.48)";

  const grassOptions  = GRASS_TYPES.map((g) => ({ value:g.value, label:t(g.labelKey, g.value) }));
  const farmOptions   = farms.map((f) => ({ value:String(f.id), label:f.name }));
  const statusOptions = STATUSES.map((s) => ({ value:s.value, label:t(s.label, s.fallback) }));

  if (!isAuthenticated) return null;

  /* ── Render ─────────────────────────────────────────────── */
  return (
    <>
      <style>{STYLE}</style>
      <div className={`pp ${d?"pp-d":"pp-l"}`}>
        <Header />

        {/* ── Hero ── */}
        <div className={`pp-hero ${d?"pp-hero-d":"pp-hero-l"}`}>
          <div className="pp-px" style={{ maxWidth:1300, margin:"0 auto" }}>
            <div style={{ display:"flex", alignItems:"flex-end", justifyContent:"space-between", gap:16, flexWrap:"wrap" }}>
              <div>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
                  <div style={{ width:24, height:24, borderRadius:6, display:"flex", alignItems:"center", justifyContent:"center", background:"rgba(74,222,128,.15)", border:"1px solid rgba(74,222,128,.25)" }}>
                    <Wheat style={{ width:14, height:14, color:"#4ade80" }} />
                  </div>
                  <span style={{ fontSize:11, fontWeight:700, letterSpacing:".15em", textTransform:"uppercase", color:d?"rgba(74,222,128,.7)":"#16a34a" }}>
                    {t("pastures.badge","Пастбища")}
                  </span>
                </div>
                <h1 style={{ fontFamily:"'Syne',sans-serif", fontSize:"clamp(1.6rem,4vw,2.2rem)", fontWeight:800, color:tc, margin:0 }}>
                  {t("pastures.title","Мои пастбища")}
                </h1>
                <p style={{ fontSize:13, marginTop:4, color:sc }}>
                  {t("pastures.subtitle","Обозначьте границы пастбища на карте — площадь и анализ автоматически")}
                </p>
              </div>
              <div style={{ display:"flex", gap:20 }}>
                {[
                  { val:pastures.length,       lbl:t("pastures.stat.pastures","пастбищ"),  col:d?"#4ade80":"#16a34a" },
                  { val:totalHa.toFixed(0),    lbl:t("pastures.stat.hectares","гектаров"), col:d?"#22d3ee":"#0891b2" },
                  { val:pastures.filter((p)=>p.status==="active").length, lbl:t("pastures.stat.active","активных"), col:d?"#f59e0b":"#b45309" },
                ].map((s) => (
                  <div key={s.lbl} style={{ textAlign:"right" }}>
                    <div style={{ fontSize:24, fontWeight:800, fontFamily:"'Syne',sans-serif", color:s.col }}>{s.val}</div>
                    <div style={{ fontSize:11, color:sc }}>{s.lbl}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Mobile Tab Bar ── */}
        <div className="pp-mob-tabs">
          {[
            { key:"list", icon:Home,  label:t("pastures.tab.list","Список") },
            { key:"map",  icon:Map,   label:t("pastures.tab.map","Карта")  },
          ].map(({ key, icon:Icon, label }) => {
            const active = mobileTab === key;
            return (
              <button key={key} className="pp-mob-tab" onClick={() => setMobileTab(key)} style={{
                background:active?(d?"rgba(74,222,128,.15)":"rgba(34,197,94,.12)"):(d?"rgba(255,255,255,.05)":"rgba(20,55,20,.05)"),
                color:active?(d?"#4ade80":"#16a34a"):sc,
                border:`1px solid ${active?(d?"rgba(74,222,128,.35)":"rgba(34,197,94,.3)"):(d?"rgba(255,255,255,.08)":"rgba(34,197,94,.12)")}`,
              }}>
                <Icon style={{ width:15, height:15 }} />
                {label}
                {key==="list" && pastures.length>0 && (
                  <span style={{ fontSize:10, fontWeight:700, padding:"1px 6px", borderRadius:999, background:active?(d?"rgba(74,222,128,.25)":"rgba(34,197,94,.2)"):(d?"rgba(255,255,255,.1)":"rgba(20,55,20,.08)"), color:active?(d?"#4ade80":"#16a34a"):sc }}>
                    {pastures.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ── Body ── */}
        <div className="pp-body" style={{ maxWidth:1300, margin:"0 auto", width:"100%" }}>

          {/* Sidebar */}
          <aside className={`pp-sidebar ${d?"pp-sidebar-d":"pp-sidebar-l"}${mobileTab!=="list"?" pp-panel-hidden":""}`}>
            <div className={`pp-sh ${d?"pp-sh-d":"pp-sh-l"}`}>
              <button className="pp-btn-create" onClick={openCreate}>
                <Plus style={{ width:16, height:16 }} />
                {t("pastures.createBtn","Создать пастбище")}
              </button>
              <div className="pp-sw">
                <Search style={{ width:14, height:14, color:sc }} />
                <input
                  className={`pp-search ${d?"pp-search-d":"pp-search-l"}`}
                  placeholder={t("pastures.search","Поиск...")}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  maxLength={100}
                />
              </div>
            </div>

            <div className="pp-list">
              {loading ? (
                <div style={{ textAlign:"center", padding:"32px 16px" }}>
                  <Loader2 style={{ width:24, height:24, color:sc, animation:"spin 1s linear infinite", margin:"0 auto 8px", display:"block" }} />
                  <span style={{ fontSize:12, color:sc }}>{t("common.loading","Загрузка...")}</span>
                </div>
              ) : filtered.length === 0 ? (
                <div style={{ textAlign:"center", padding:"28px 14px" }}>
                  <Wheat style={{ width:36, height:36, color:sc, margin:"0 auto 8px", display:"block" }} />
                  <p style={{ fontSize:13, fontWeight:600, color:tc, margin:"0 0 4px" }}>
                    {search ? t("pastures.notFound","Не найдено") : t("pastures.noPastures","Нет пастбищ")}
                  </p>
                  <p style={{ fontSize:12, color:sc, margin:0 }}>
                    {search ? t("pastures.tryOther","Попробуйте другой запрос") : t("pastures.createHint","Нажмите «Создать пастбище» и обозначьте границы на карте")}
                  </p>
                </div>
              ) : filtered.map((p) => (
                <div
                  key={p.id}
                  className={`pp-card ${d?"pp-card-d":"pp-card-l"}${activePasture?.id===p.id?" active":""}`}
                  // FIX: На мобиле переключаемся на вкладку Карта при клике
                  onClick={() => { setActivePasture(p); setMobileTab("map"); }}
                >
                  <div style={{ display:"flex", alignItems:"flex-start", gap:8 }}>
                    <div style={{ width:10, height:10, borderRadius:"50%", background:p.color, flexShrink:0, marginTop:4 }} />
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontWeight:600, fontSize:13, color:tc, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{p.name}</div>
                      {p.grass_type && (
                        <div style={{ fontSize:11, color:sc, marginTop:2, display:"flex", alignItems:"center", gap:3, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                          <Wheat style={{ width:10, height:10, flexShrink:0 }} />
                          {grassShortLabel(p.grass_type)}
                        </div>
                      )}
                      <div style={{ fontSize:10, color:sc, marginTop:1 }}>{farmLabel(p.farm_id)}</div>
                    </div>
                    <div style={{ textAlign:"right", flexShrink:0 }}>
                      <span className="pp-ha" style={{ color:p.color, fontSize:18 }}>{p.area_ha||p.area||0}</span>
                      <span style={{ fontSize:10, color:sc, marginLeft:2 }}>{t("pastures.units.hectaresShort", "ha")}</span>
                    </div>
                  </div>
                  <div style={{ display:"flex", gap:4, marginTop:8, justifyContent:"flex-end" }}>
                    {[
                      { icon:Eye,   fn:(e)=>{ e.stopPropagation(); setActivePasture(p); setModal("view"); setMobileTab("map"); }, title:t("pastures.action.view","Просмотр") },
                      { icon:Edit3, fn:(e)=>{ e.stopPropagation(); handleEdit(p); },             title:t("pastures.action.edit","Изменить") },
                      { icon:Trash2,fn:(e)=>{ e.stopPropagation(); handleDelete(p.id); },        title:t("pastures.action.delete","Удалить"), red:true },
                    ].map(({ icon:Icon, fn, title, red }) => (
                      <button key={title} className={`pp-iBtn ${d?"pp-iBtn-d":"pp-iBtn-l"}`} onClick={fn} title={title}>
                        <Icon style={{ width:13, height:13, color:red?"#f87171":sc }} />
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {pastures.length > 0 && (
              <div className="pp-stats-strip" style={{ borderTopColor:d?"rgba(255,255,255,.07)":"rgba(34,197,94,.1)", borderTopStyle:"solid" }}>
                {[
                  { v:pastures.length,                                   l:t("pastures.stat.totalShort","Всего")  },
                  { v:totalHa.toFixed(1),                                l:t("pastures.stat.haShort","Га")        },
                  { v:pastures.filter((p)=>p.status==="active").length,  l:t("pastures.stat.activeShort","Актив.")},
                ].map((s) => (
                  <div key={s.l} className="pp-stat-item" style={{ borderColor:d?"rgba(255,255,255,.07)":"rgba(34,197,94,.1)" }}>
                    <div style={{ fontSize:18, fontWeight:800, fontFamily:"'Syne',sans-serif", color:d?"#4ade80":"#16a34a" }}>{s.v}</div>
                    <div style={{ fontSize:10, color:sc }}>{s.l}</div>
                  </div>
                ))}
              </div>
            )}
          </aside>

          {/* Main map */}
          <div className={`pp-map-area${mobileTab!=="map"?" pp-panel-hidden":""}`}>
            <PastureMap
              pastures={pastures}
              active={activePasture}
              onSelect={(p) => { setActivePasture(p); setModal("view"); setMobileTab("map"); }}
              height="100%"
            />
          </div>
        </div>

        {/* ════════ CREATE / EDIT MODAL ════════ */}
        {modal === "create" && (
          <div className="pp-ov" onClick={(e) => e.target===e.currentTarget && closeCreateModal()}>
            <div className={`pp-create-modal ${d?"pp-create-modal-d":"pp-create-modal-l"}`}>

              {/* LEFT — FORM
                  FIX: isolation:isolate через CSS класс, чтобы StyledSelect
                       z-index:9999 не вылезал поверх правой панели карты */}
              <div className={`pp-form-panel ${d?"pp-form-panel-d":"pp-form-panel-l"}`}>
                <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:20 }}>
                  <div>
                    <h2 style={{ fontFamily:"'Syne',sans-serif", fontSize:20, fontWeight:800, color:tc, margin:"0 0 4px" }}>
                      {editId ? t("pastures.modal.editTitle","Редактировать пастбище") : t("pastures.modal.createTitle","Новое пастбище")}
                    </h2>
                    <p style={{ fontSize:12, color:sc, margin:0 }}>
                      {editId
                        ? t("pastures.modal.editHint","Измените данные и перерисуйте границы при необходимости")
                        : t("pastures.modal.createHint","Заполните данные и нарисуйте границы пастбища на карте →")}
                    </p>
                  </div>
                  <button onClick={closeCreateModal} style={{ background:d?"rgba(255,255,255,.08)":"rgba(20,55,20,.06)", border:"none", cursor:"pointer", width:30, height:30, borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                    <X style={{ width:14, height:14, color:sc }} />
                  </button>
                </div>

                {apiError && (
                  <div className="pp-err">
                    <AlertCircle style={{ width:14, height:14, flexShrink:0 }} />
                    {apiError}
                  </div>
                )}

                {/* Основное */}
                <div className={`pp-section ${d?"pp-section-d":"pp-section-l"}`}>
                  <Wheat style={{ width:13, height:13 }} />
                  {t("pastures.section.basic","Основное")}
                </div>

                <div style={{ marginBottom:12 }}>
                  <label className={`pp-lbl ${d?"pp-lbl-d":"pp-lbl-l"}`}>{t("pastures.field.name","Название")} *</label>
                  <input className={`pp-inp pp-inp-${d?"d":"l"}${formErrors.name?" pp-inp-error":""}`} placeholder={t("pastures.placeholder.name","Северный луг")} value={form.name} onChange={(e)=>setF("name",e.target.value)} maxLength={120} aria-invalid={!!formErrors.name} />
                  {formErrors.name && <div className="pp-field-error"><AlertCircle style={{ width:12, height:12 }} />{formErrors.name}</div>}
                </div>

                <div style={{ marginBottom:12 }}>
                  <label className={`pp-lbl ${d?"pp-lbl-d":"pp-lbl-l"}`}>{t("pastures.field.farm","Ферма")} *</label>
                  <div className={formErrors.farm_id ? "pp-inp-error" : ""} style={{ borderRadius:11 }}>
                    <StyledSelect isDark={d} value={form.farm_id} onChange={(v)=>setF("farm_id",v)} options={farmOptions} placeholder={t("pastures.placeholder.farm","Выберите ферму")} />
                  </div>
                  {formErrors.farm_id && <div className="pp-field-error"><AlertCircle style={{ width:12, height:12 }} />{formErrors.farm_id}</div>}
                </div>

                <div className="pp-2col">
                  <div>
                    <label className={`pp-lbl ${d?"pp-lbl-d":"pp-lbl-l"}`}>{t("pastures.field.status","Статус")}</label>
                    <StyledSelect isDark={d} value={form.status} onChange={(v)=>setF("status",v)} options={statusOptions} placeholder={t("pastures.field.status","Статус")} />
                  </div>
                  <div>
                    <label className={`pp-lbl ${d?"pp-lbl-d":"pp-lbl-l"}`}>{t("pastures.field.color","Цвет")}</label>
                    <div style={{ display:"flex", gap:6, flexWrap:"wrap", paddingTop:4 }}>
                      {PASTURE_COLORS.map((c) => (
                        <button key={c} type="button" className={`pp-swatch${form.color===c?" sel":""}`} style={{ background:c }} onClick={()=>setF("color",c)} />
                      ))}
                    </div>
                  </div>
                </div>

                <div className={`pp-div ${d?"pp-div-d":"pp-div-l"}`} />
                <div className={`pp-section ${d?"pp-section-d":"pp-section-l"}`}>
                  <Leaf style={{ width:13, height:13 }} />
                  {t("pastures.section.grass","Тип растительности")}
                </div>

                <div style={{ marginBottom:14 }}>
                  <label className={`pp-lbl ${d?"pp-lbl-d":"pp-lbl-l"}`}>{t("pastures.field.grassType","Вид трав")}</label>
                  <StyledSelect isDark={d} value={form.grass_type} onChange={(v)=>setF("grass_type",v)} options={grassOptions} placeholder={t("pastures.placeholder.grassType","Выберите вид")} />
                  {form.grass_type && (() => {
                    const found = GRASS_TYPES.find((g)=>g.value===form.grass_type);
                    return found ? (
                      <div style={{ marginTop:6, padding:"6px 10px", borderRadius:8, background:d?"rgba(74,222,128,.06)":"rgba(34,197,94,.06)", fontSize:11, color:sc, fontStyle:"italic" }}>
                        {t(found.groupKey, found.groupKey)} — {t(found.labelKey, found.value)}
                      </div>
                    ) : null;
                  })()}
                </div>

                <div style={{ marginBottom:14 }}>
                  <label className={`pp-lbl ${d?"pp-lbl-d":"pp-lbl-l"}`}>{t("pastures.field.description","Описание")}</label>
                  <textarea className={`pp-inp pp-inp-${d?"d":"l"}`} rows={3} placeholder={t("pastures.placeholder.description","Краткое описание пастбища...")} value={form.description} onChange={(e)=>setF("description",e.target.value)} style={{ resize:"vertical" }} maxLength={500} />
                </div>

                <div style={{ display:"flex", gap:10, marginTop:"auto" }}>
                  <button className={`pp-cancel pp-cancel-${d?"d":"l"}`} onClick={closeCreateModal}>
                    {t("common.cancel","Отмена")}
                  </button>
                  <button className="pp-save" style={{ flex:1 }} onClick={handleSave} disabled={submitting}>
                    {submitting
                      ? <><Loader2 style={{ width:14, height:14, animation:"spin 1s linear infinite" }} /> {t("common.saving","Сохранение...")}</>
                      : <><Save style={{ width:14, height:14 }} />{editId ? t("pastures.action.saveEdit","Сохранить изменения") : t("pastures.action.addPasture","Добавить пастбище")}</>
                    }
                  </button>
                </div>
              </div>

              {/* RIGHT — MAP
                  FIX: MapSearch вынесен из overflow:hidden контейнера
                       в отдельный relative wrapper чтобы dropdown не обрезался */}
              <div className={`pp-map-panel ${d?"pp-map-panel-d":"pp-map-panel-l"}`}>
                <div className={`pp-map-toolbar ${d?"pp-map-toolbar-d":"pp-map-toolbar-l"}`}>
                  <Map style={{ width:14, height:14, color:sc, flexShrink:0 }} />
                  <span style={{ fontSize:12, fontWeight:600, color:sc }}>{t("pastures.map.drawHint","Кликайте для обозначения границ")}</span>

                  <button className={`pp-tb-btn ${d?"pp-tb-btn-d":"pp-tb-btn-l"}`} onClick={()=>drawMapRef.current?.undo()} disabled={pointCount===0} title={t("pastures.map.undo","Отменить точку")}>
                    <Undo2 style={{ width:13, height:13 }} />
                  </button>
                  <button className={`pp-tb-btn ${d?"pp-tb-btn-d":"pp-tb-btn-l"}`} onClick={()=>drawMapRef.current?.redo()} title={t("pastures.map.redo","Вернуть точку")}>
                    <Redo2 style={{ width:13, height:13 }} />
                  </button>
                  <button className="pp-tb-btn pp-tb-btn-danger" onClick={()=>{ drawMapRef.current?.reset(); setDrawnCoords(null); setPointCount(0); }} disabled={pointCount===0} title={t("pastures.map.clear","Очистить контур")}>
                    <RotateCcw style={{ width:13, height:13 }} />
                  </button>

                  <div className={`pp-ha-badge${computedHa?" has-poly":""}${formErrors.coordinates?" has-error":""}`}>
                    {computedHa
                      ? <><CheckCircle2 style={{ width:13, height:13 }} />{computedHa} {t("pastures.units.hectaresShort", "ha")}</>
                      : <><MousePointer style={{ width:13, height:13, opacity:.6 }} /><span style={{ opacity:.65 }}>{t("pastures.map.noBounds","Нет границ")}</span></>
                    }
                  </div>
                </div>

                {formErrors.coordinates && (
                  <div className="pp-map-field-error">
                    <AlertCircle style={{ width:14, height:14, flexShrink:0, marginTop:1 }} />
                    <span>{formErrors.coordinates}</span>
                  </div>
                )}

                {/* FIX: Обёртка с position:relative но БЕЗ overflow:hidden
                         чтобы MapSearch dropdown не обрезался.
                         Leaflet сам управляет своим overflow. */}
                <div className="pp-map-search-wrap">
                  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />

                  {/* MapSearch: позиционирован absolute внутри pp-map-search-wrap */}
                  <MapSearch
                    isDark={d}
                    placeholder={t("pastures.map.searchPlace","Найти место на карте...")}
                    onSelect={(item)=>setSearchFlyTo({ latlng:[item.lat,item.lng], zoom:14, ts:Date.now() })}
                  />

                  {/* Карта занимает всё пространство */}
                  <div className="pp-map-panel-inner">
                    <ModalDrawMap
                      key={mapKey}
                      ref={drawMapRef}
                      coords={drawnCoords}
                      onCoordsChange={handleCoordsChange}
                      onPointCountChange={handlePointCount}
                      existingPastures={pastures}
                      editingId={editId}
                      flyTo={searchFlyTo || flyTo}
                    />
                  </div>

                  <div className="pp-draw-hint">
                    <MousePointer style={{ width:13, height:13 }} />
                    {t("pastures.map.clickHint","Клик — добавить точку")}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ════════ VIEW MODAL ════════ */}
        {modal === "view" && activePasture && (() => {
          const p  = activePasture;
          const c  = centroid(p.coordinates||[]);
          const statusCol = { active:"#22c55e", resting:"#f59e0b", seasonal:"#3b82f6", degraded:"#ef4444" }[p.status] || sc;
          // FIX: grassLabel показывает полное имя с латинским
          const fullGrass = grassLabel(p.grass_type);
          const shortGrass = grassShortLabel(p.grass_type);

          return (
            <div className="pp-ov" onClick={(e)=>e.target===e.currentTarget&&setModal(null)}>
              <div className={`pp-modal ${d?"pp-modal-d":"pp-modal-l"}`}>
                {/* Color stripe */}
                <div style={{ height:4, background:p.color, margin:"-28px -28px 22px", borderRadius:"22px 22px 0 0" }} />

                {/* Header */}
                <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:10, marginBottom:18 }}>
                  <div>
                    <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:4, flexWrap:"wrap" }}>
                      <div style={{ width:8, height:8, borderRadius:"50%", background:p.color }} />
                      <span style={{ fontSize:10, fontWeight:700, letterSpacing:".12em", textTransform:"uppercase", color:p.color }}>
                        {t("pastures.label.pasture","Пастбище")}
                      </span>
                      <span style={{ fontSize:11, fontWeight:600, color:statusCol, background:`${statusCol}18`, padding:"2px 8px", borderRadius:999, border:`1px solid ${statusCol}30` }}>
                        {statusLabel(p.status)}
                      </span>
                    </div>
                    <h2 style={{ fontFamily:"'Syne',sans-serif", fontSize:22, fontWeight:800, color:tc, margin:"0 0 4px" }}>{p.name}</h2>
                    <p style={{ margin:0, fontSize:13, color:sc }}>{farmLabel(p.farm_id)}</p>
                  </div>
                  <button onClick={()=>setModal(null)} style={{ background:d?"rgba(255,255,255,.08)":"rgba(20,55,20,.06)", border:"none", cursor:"pointer", width:30, height:30, borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                    <X style={{ width:14, height:14, color:sc }} />
                  </button>
                </div>

                {/* Info grid */}
                <div className="pp-2col">
                  {[
                    { val:`${p.area_ha||p.area||0} ${t("pastures.units.hectaresShort", "ha")}`, lbl:t("pastures.field.area","Площадь") },
                    { val: shortGrass !== "—" ? shortGrass : t("common.notSpecified","Не указано"), lbl:t("pastures.field.grassType","Тип трав") },
                  ].map(({ val, lbl }) => (
                    <div key={lbl} style={{ padding:"10px 12px", borderRadius:12, background:d?"rgba(255,255,255,.04)":"#f4faf5", border:`1px solid ${d?"rgba(255,255,255,.07)":"rgba(34,197,94,.1)"}` }}>
                      <div style={{ fontSize:10, color:sc, marginBottom:2 }}>{lbl}</div>
                      <div style={{ fontSize:13, fontWeight:600, color:tc, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{val}</div>
                    </div>
                  ))}
                </div>

                {/* FIX: Тип травы — полное название с латинским */}
                {p.grass_type && fullGrass !== "—" && (
                  <div style={{ padding:"8px 12px", borderRadius:10, marginBottom:12, background:d?"rgba(74,222,128,.06)":"rgba(34,197,94,.05)", border:`1px solid ${d?"rgba(74,222,128,.12)":"rgba(34,197,94,.12)"}`, fontSize:12, color:sc, fontStyle:"italic" }}>
                    <Leaf style={{ width:11, height:11, display:"inline", marginRight:5 }} />
                    {fullGrass}
                  </div>
                )}

                {p.description && (
                  <div style={{ padding:"10px 12px", borderRadius:12, marginBottom:12, background:d?"rgba(255,255,255,.03)":"#f0faf2", border:`1px solid ${d?"rgba(255,255,255,.06)":"rgba(34,197,94,.1)"}`, fontSize:13, color:sc, lineHeight:1.6 }}>
                    {p.description}
                  </div>
                )}

                {/* Measurements */}
                {(() => {
                  if (measLoading) return (
                    <div style={{ display:"flex", alignItems:"center", gap:8, padding:"12px 0", color:sc, fontSize:13 }}>
                      <Loader2 style={{ width:13, height:13, animation:"spin 1s linear infinite" }} />
                      {t("pastures.measurements.loading","Загрузка данных измерений...")}
                    </div>
                  );

                  if (measurements && measurements.length > 0) {
                    const latest = measurements.find((m) => m.status === "completed") || measurements[0];
                    return (
                      <div style={{ marginBottom:16 }}>
                        <div style={{ fontSize:10, fontWeight:700, letterSpacing:".1em", textTransform:"uppercase", color:sc, marginBottom:10, display:"flex", alignItems:"center", gap:6 }}>
                          <BarChart3 style={{ width:11, height:11 }} />
                          {t("pastures.measurements.title","Последнее измерение")}
                          {(latest.created_at || latest.measured_at) && (
                            <span style={{ fontWeight:400, textTransform:"none", letterSpacing:0, marginLeft:4 }}>
                              — {new Date(latest.created_at || latest.measured_at).toLocaleDateString(i18n.language === "kk" ? "kk-KZ" : i18n.language === "en" ? "en-US" : "ru-RU")}
                            </span>
                          )}
                        </div>
                        <div className="pp-2col">
                          {[
                            latest.ndvi_value != null && {
                              val: latest.ndvi_value.toFixed(3),
                              lbl: "NDVI",
                              col: latest.ndvi_value > 0.5 ? "#22c55e" : latest.ndvi_value > 0.3 ? "#f59e0b" : "#ef4444",
                            },
                            latest.biomass_value != null && { val:`${latest.biomass_value.toFixed(1)} ${t("pastures.units.biomass", "c/ha")}`, lbl:t("pastures.measurements.labels.biomass", "Biomass") },
                            latest.coverage_percent != null && { val:`${latest.coverage_percent.toFixed(0)}%`, lbl:t("pastures.measurements.labels.coverage", "Coverage") },
                            latest.quality_score != null && { val:`${latest.quality_score.toFixed(0)}%`, lbl:t("pastures.measurements.labels.quality", "Quality") },
                          ].filter(Boolean).map(({ val, lbl, col }) => (
                            <div key={lbl} style={{ padding:"9px 11px", borderRadius:11, background:d?"rgba(255,255,255,.04)":"#f4faf5", border:`1px solid ${d?"rgba(255,255,255,.07)":"rgba(34,197,94,.1)"}` }}>
                              <div style={{ fontSize:10, color:sc, marginBottom:2 }}>{lbl}</div>
                              <div style={{ fontSize:14, fontWeight:700, color:col||tc, fontFamily:"'Syne',sans-serif" }}>{val}</div>
                            </div>
                          ))}
                        </div>
                        <div style={{ marginTop:8, fontSize:11, color:sc }}>
                          {(latest.method === "photo_upload"
                            ? t("pastures.measurements.methods.photo_upload", "AI photo")
                            : latest.method === "drone_video"
                            ? t("pastures.measurements.methods.photo_upload", "AI photo")
                            : latest.method || t("pastures.measurements.methods.unknown", "Measurement"))
                          }
                          {latest.status ? ` • ${t(`pastures.measurements.statuses.${latest.status}`, latest.status)}` : ""}
                        </div>
                      </div>
                    );
                  }

                  if (measurements !== undefined && getPastureMeasurements) {
                    return (
                      <div style={{ padding:"10px 12px", borderRadius:10, marginBottom:14, background:d?"rgba(255,255,255,.03)":"#f8fdf8", border:`1px solid ${d?"rgba(255,255,255,.06)":"rgba(34,197,94,.08)"}`, display:"flex", alignItems:"center", gap:8, fontSize:12, color:sc }}>
                        <Info style={{ width:13, height:13, flexShrink:0 }} />
                        {t("pastures.measurements.noData","Измерения пока не проводились")}
                      </div>
                    );
                  }
                  return null;
                })()}

                {/* Real weather from Open-Meteo */}
                {c && <WeatherWidget lat={c.lat} lng={c.lng} isDark={d} />}

                {/* Actions */}
                <div style={{ display:"flex", gap:10, marginTop:18 }}>
                  <button onClick={()=>handleEdit(p)} className="pp-save" style={{ flex:1, background:`linear-gradient(135deg,${p.color},${p.color}bb)` }}>
                    <Edit3 style={{ width:14, height:14 }} /> {t("pastures.action.edit","Редактировать")}
                  </button>
                  <button onClick={()=>handleDelete(p.id)} style={{ padding:"12px 16px", borderRadius:12, border:"none", cursor:"pointer", background:"rgba(239,68,68,.1)", color:"#f87171", display:"flex", alignItems:"center", gap:6, fontSize:14, fontWeight:600, fontFamily:"'DM Sans',sans-serif" }}>
                    <Trash2 style={{ width:14, height:14 }} />
                  </button>
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </>
  );
}
