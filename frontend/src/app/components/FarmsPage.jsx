// src/app/components/FarmsPage.jsx
// KokMaisa 2025 — Updated UX: no dblclick, undo/redo polygon, no IIN,
//   region→map fly, user autofill, responsive, i18n, secure

import {
  useState, useEffect, useRef, useCallback, useMemo, forwardRef, useImperativeHandle,
} from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useTranslation } from "react-i18next";
import Header from "@/app/components/Header";
import {
  Plus, X, Check, MapPin, Trash2, Edit3, Layers, Home, Search,
  ArrowUpRight, Leaf, Info, AlertCircle, Loader2, Save, PenLine,
  Phone, User, CreditCard, Tractor, Calendar, ChevronDown, Wheat,
  Building2, Eye, MousePointer, Undo2, Redo2, CheckCircle2, Map,
  RotateCcw, Flag,
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════
   SECURITY HELPERS
═══════════════════════════════════════════════════════════ */
// Strip HTML tags to prevent XSS
const sanitize = (str) =>
  typeof str === "string" ? str.replace(/[<>"'`]/g, (c) => ({ "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;", "`": "&#96;" }[c])) : str;

const sanitizeForm = (obj) =>
  Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [k, typeof v === "string" ? sanitize(v.trim()) : v])
  );

// Basic phone validation
const validPhone = (p) => !p || /^[+\d\s\-()]{7,20}$/.test(p);
const FARM_TRANSLATABLE_FIELDS = ["name", "region", "address", "description", "farm_type", "crops", "equipment"];

const localizeRecord = (record, lang, fields) => {
  const translations = record?.translations;
  if (!translations || typeof translations !== "object") return record;
  return fields.reduce((next, field) => {
    const value = translations?.[field]?.[lang];
    if (value === undefined || value === null || value === "") return next;
    return { ...next, [field]: value };
  }, record);
};

/* ═══════════════════════════════════════════════════════════
   SERVER ERROR → i18n KEY MAPPER
═══════════════════════════════════════════════════════════ */
const resolveServerError = (e, t) => {
  const status  = e?.response?.status;
  const detail  = (e?.response?.data?.detail || "").toLowerCase();

  // Network / no response
  if (!e?.response) return t("farms.err.networkError", "Нет соединения с сервером");

  // 403 — permission errors
  if (status === 403) {
    if (detail.includes("farmer"))  return t("farms.err.noPermission", "Только фермеры могут создавать фермы");
    return t("farms.err.accessDenied", "У вас нет доступа к этой ферме");
  }

  // 404
  if (status === 404) return t("farms.err.notFound", "Ферма не найдена");

  // 409 / unique constraint — duplicate name
  if (status === 409 || detail.includes("exist") || detail.includes("unique") || detail.includes("duplicate"))
    return t("farms.err.nameExists", "Ферма с таким названием уже существует");

  // 422 — validation from server (shouldn't normally happen after frontend validation)
  if (status === 422) {
    const firstMsg = e?.response?.data?.detail?.[0]?.msg;
    return firstMsg || t("farms.err.serverError", "Ошибка сервера");
  }

  // 500 and everything else
  return t("farms.err.serverError", "Ошибка сервера. Попробуйте позже");
};

// Validate form — return per-field errors object (like PasturesPage)
const validateForm = (form, t, drawnCoords) => {
  const errors = {};
  if (!form.name?.trim())                    errors.name   = t("farms.err.nameRequired",    "Название обязательно");
  if (!form.region)                          errors.region = t("farms.err.regionRequired",   "Выберите регион");
  if (form.phone && !validPhone(form.phone)) errors.phone  = t("farms.err.phoneInvalid",     "Некорректный телефон");
  if (!drawnCoords || drawnCoords.length < 3)
    errors.coordinates = t("farms.err.boundariesRequired", "Обозначьте границы фермы (минимум 3 точки)");
  else if (drawnCoords.length < 3)
    errors.coordinates = t("farms.err.boundariesInvalid",  "Нарисуйте корректную область фермы");
  return Object.keys(errors).length ? errors : null;
};


/* ═══════════════════════════════════════════════════════════
   GEODESIC AREA — Shoelace + sphere
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
  if (!coords?.length) return [48.0, 68.0];
  const lat = coords.reduce((s, c) => s + c.lat, 0) / coords.length;
  const lng = coords.reduce((s, c) => s + c.lng, 0) / coords.length;
  return [lat, lng];
}

function normalizeAutoAddress(value) {
  if (!value || typeof value !== "string") return "";
  return value
    .replace(/\s*,\s*Казахстан\s*$/i, "")
    .replace(/\s*,\s*Kazakhstan\s*$/i, "")
    .trim();
}

/* ═══════════════════════════════════════════════════════════
   REGION → MAP COORDINATES
═══════════════════════════════════════════════════════════ */
const REGION_COORDS = {
  "Алматинская область":           { latlng: [43.5,   78.5],  zoom: 7 },
  "г. Астана":                      { latlng: [51.18,  71.45], zoom: 11 },
  "г. Алматы":                      { latlng: [43.24,  76.89], zoom: 11 },
  "г. Шымкент":                     { latlng: [42.32,  69.59], zoom: 11 },
  "Акмолинская область":           { latlng: [51.5,   69.5],  zoom: 7 },
  "Актюбинская область":           { latlng: [49.5,   57.5],  zoom: 7 },
  "Атырауская область":            { latlng: [47.1,   51.9],  zoom: 7 },
  "Западно-Казахстанская область": { latlng: [50.3,   51.3],  zoom: 7 },
  "Жамбылская область":            { latlng: [43.5,   72.0],  zoom: 7 },
  "Карагандинская область":        { latlng: [48.0,   71.5],  zoom: 7 },
  "Костанайская область":          { latlng: [53.2,   63.6],  zoom: 7 },
  "Кызылординская область":        { latlng: [44.85,  65.5],  zoom: 7 },
  "Мангистауская область":         { latlng: [43.7,   53.0],  zoom: 7 },
  "Павлодарская область":          { latlng: [52.3,   76.9],  zoom: 7 },
  "Северо-Казахстанская область":  { latlng: [54.0,   69.0],  zoom: 7 },
  "Туркестанская область":         { latlng: [41.3,   69.1],  zoom: 7 },
  "Восточно-Казахстанская область":{ latlng: [49.5,   82.6],  zoom: 7 },
};

/* ═══════════════════════════════════════════════════════════
   MAIN VIEW MAP (read-only polygons)
═══════════════════════════════════════════════════════════ */
function FarmMap({ farms, activeFarm, onFarmSelect, height = "100%" }) {
  const mapRef  = useRef(null);
  const mapInst = useRef(null);
  const layers  = useRef({});

  useEffect(() => {
    if (mapInst.current || !mapRef.current) return;
    let cancelled = false;
    import("leaflet").then((L) => {
      if (cancelled || mapInst.current || !mapRef.current) return;
      const Lf = L.default || L;
      delete Lf.Icon.Default.prototype._getIconUrl;
      Lf.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl:        "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl:      "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });
      const map = Lf.map(mapRef.current, { center: [48.0, 68.0], zoom: 5, zoomControl: false });
      Lf.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", { attribution: "Tiles © Esri", maxZoom: 19 }).addTo(map);
      Lf.tileLayer("https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png",          { attribution: "", maxZoom: 19, opacity: 0.7 }).addTo(map);
      Lf.control.zoom({ position: "bottomright" }).addTo(map);
      mapInst.current = map;
      mapInst.current._Lf = Lf;

      // ── Принудительная перерисовка после монтирования (фикс для мобил) ──
      setTimeout(() => {
        if (mapInst.current) {
          mapInst.current.invalidateSize({ animate: false });
        }
      }, 100);
      setTimeout(() => {
        if (mapInst.current) {
          mapInst.current.invalidateSize({ animate: false });
        }
      }, 400);

      // ── Ключевой фикс для мобилов: перерисовывать при смене размера контейнера ──
      // Без этого Leaflet рендерит в 0px высоту и тайлы не появляются
      if (typeof ResizeObserver !== "undefined" && mapRef.current) {
        const ro = new ResizeObserver(() => {
          requestAnimationFrame(() => {
            if (mapInst.current) mapInst.current.invalidateSize({ animate: false });
          });
        });
        ro.observe(mapRef.current);
        mapInst.current._ro = ro;
      }
    });
    return () => {
      cancelled = true;
      if (mapInst.current) {
        mapInst.current._ro?.disconnect();
        mapInst.current.remove();
        mapInst.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const map = mapInst.current;
    if (!map) return;
    const Lf = map._Lf;
    if (!Lf) return;
    Object.values(layers.current).forEach((l) => { try { map.removeLayer(l); } catch (_) {} });
    layers.current = {};
    farms.forEach((farm) => {
      if (!farm.coordinates?.length) return;
      const latlngs = farm.coordinates.map((c) => [c.lat, c.lng]);
      const isActive = activeFarm?.id === farm.id;
      const col = farm.color || "#22c55e";
      const poly = Lf.polygon(latlngs, {
        color: col, fillColor: col,
        fillOpacity: isActive ? 0.4 : 0.2,
        weight: isActive ? 3 : 2,
      }).addTo(map);
      const c = centroid(farm.coordinates);
      const icon = Lf.divIcon({
        html: `<div style="background:rgba(0,0,0,.75);color:#fff;padding:3px 8px;border-radius:6px;font-size:11px;font-weight:600;white-space:nowrap;border:1px solid ${col}60;font-family:DM Sans,sans-serif">${sanitize(farm.name)}<br><span style="color:${col};font-size:10px">${farm.area_ha || farm.area || 0} га</span></div>`,
        className: "", iconAnchor: [40, 12],
      });
      const lbl = Lf.marker(c, { icon, interactive: false }).addTo(map);
      poly.on("click", () => onFarmSelect?.(farm));
      layers.current[farm.id] = poly;
      layers.current[`${farm.id}_lbl`] = lbl;
    });
  }, [farms, activeFarm]);

  useEffect(() => {
    const map = mapInst.current;
    if (!map || !activeFarm?.coordinates?.length) return;
    map.flyTo(centroid(activeFarm.coordinates), 13, { duration: 1.2 });
  }, [activeFarm]);

  return (
    <>
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <div ref={mapRef} style={{ width: "100%", height, borderRadius: "inherit" }} />
    </>
  );
}

/* ═══════════════════════════════════════════════════════════
   MODAL DRAW MAP — forwardRef for undo/redo/reset/flyTo
═══════════════════════════════════════════════════════════ */
const ModalDrawMap = forwardRef(function ModalDrawMap(
  { coords, onCoordsChange, onPointCountChange, existingFarms = [], editingFarmId = null, flyTo },
  ref
) {
  const mapRef   = useRef(null);
  const mapInst  = useRef(null);
  const stateRef = useRef({ pts: [], future: [], markers: [], numLabels: [], line: null, poly: null });
  const onCoordsRef       = useRef(onCoordsChange);
  const onPointCountRef   = useRef(onPointCountChange);
  onCoordsRef.current     = onCoordsChange;
  onPointCountRef.current = onPointCountChange;

  /* ── helpers ── */
  const rebuildOverlays = useCallback((Lf, map) => {
    const s = stateRef.current;
    // Remove old overlays
    [...s.markers, ...s.numLabels].forEach((m) => { try { map.removeLayer(m); } catch (_) {} });
    if (s.line) { try { map.removeLayer(s.line); } catch (_) {} }
    if (s.poly) { try { map.removeLayer(s.poly); } catch (_) {} }
    s.markers   = [];
    s.numLabels = [];
    s.line = null;
    s.poly = null;

    s.pts.forEach((p, i) => {
      const dot = Lf.circleMarker([p.lat, p.lng], {
        radius: 6, color: "#fff", fillColor: "#22c55e", fillOpacity: 1, weight: 2,
      }).addTo(map);
      const num = Lf.divIcon({
        html: `<div style="color:#fff;font-size:9px;font-weight:700;font-family:'DM Sans',sans-serif;text-align:center;line-height:14px">${i + 1}</div>`,
        className: "", iconSize: [14, 14], iconAnchor: [7, 7],
      });
      const lbl = Lf.marker([p.lat, p.lng], { icon: num, interactive: false }).addTo(map);
      s.markers.push(dot);
      s.numLabels.push(lbl);
    });

    if (s.pts.length > 1) {
      s.line = Lf.polyline(s.pts.map((p) => [p.lat, p.lng]), {
        color: "#22c55e", weight: 2.5, dashArray: "8 5",
      }).addTo(map);
    }
    if (s.pts.length >= 3) {
      s.poly = Lf.polygon(s.pts.map((p) => [p.lat, p.lng]), {
        color: "#22c55e", fillColor: "#22c55e", fillOpacity: 0.2, weight: 2,
      }).addTo(map);
    }

    onCoordsRef.current(s.pts.length >= 3 ? [...s.pts] : null);
    onPointCountRef.current?.(s.pts.length);
  }, []);

  /* ── exposed API ── */
  useImperativeHandle(ref, () => ({
    undo: () => {
      const map = mapInst.current;
      if (!map) return;
      const Lf = map._Lf;
      const s  = stateRef.current;
      if (!s.pts.length) return;
      const removed = s.pts.pop();
      s.future.push(removed);
      rebuildOverlays(Lf, map);
    },
    redo: () => {
      const map = mapInst.current;
      if (!map) return;
      const Lf = map._Lf;
      const s  = stateRef.current;
      if (!s.future.length) return;
      const pt = s.future.pop();
      s.pts.push(pt);
      rebuildOverlays(Lf, map);
    },
    reset: () => {
      const map = mapInst.current;
      if (!map) return;
      const Lf = map._Lf;
      const s  = stateRef.current;
      s.future = [...s.pts, ...s.future];
      s.pts    = [];
      rebuildOverlays(Lf, map);
    },
    hasFuture: () => stateRef.current.future.length > 0,
    hasPoints: () => stateRef.current.pts.length > 0,
    flyTo:     (latlng, zoom = 8) => {
      if (mapInst.current) mapInst.current.flyTo(latlng, zoom, { duration: 1.1 });
    },
  }));

  /* ── init map ── */
  useEffect(() => {
    if (mapInst.current || !mapRef.current) return;
    let cancelled = false;
    import("leaflet").then((L) => {
      if (cancelled || mapInst.current || !mapRef.current) return;
      const Lf = L.default || L;
      delete Lf.Icon.Default.prototype._getIconUrl;
      Lf.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl:        "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl:      "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });
      const map = Lf.map(mapRef.current, { center: [48.0, 68.0], zoom: 5, zoomControl: false });
      Lf.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", { attribution: "Tiles © Esri", maxZoom: 19 }).addTo(map);
      Lf.tileLayer("https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png",          { attribution: "", maxZoom: 19, opacity: 0.65 }).addTo(map);
      Lf.control.zoom({ position: "bottomright" }).addTo(map);
      map.getContainer().style.cursor = "crosshair";
      mapInst.current     = map;
      mapInst.current._Lf = Lf;

      // ResizeObserver — перерисовка при смене размера (мобил, поворот экрана)
      if (typeof ResizeObserver !== "undefined" && mapRef.current) {
        const ro = new ResizeObserver(() => {
          requestAnimationFrame(() => {
            if (mapInst.current) mapInst.current.invalidateSize({ animate: false });
          });
        });
        ro.observe(mapRef.current);
        mapInst.current._ro = ro;
      }

      // Show other farms (dim)
      existingFarms.forEach((farm) => {
        if (!farm.coordinates?.length || farm.id === editingFarmId) return;
        Lf.polygon(farm.coordinates.map((c) => [c.lat, c.lng]), {
          color: farm.color || "#22c55e", fillColor: farm.color || "#22c55e",
          fillOpacity: 0.1, weight: 1.5, opacity: 0.4,
        }).addTo(map);
      });

      // Click to add point — NO double-click needed
      const onClick = (e) => {
        const { lat, lng } = e.latlng;
        const s = stateRef.current;
        s.future = []; // clear redo stack on new point
        s.pts.push({ lat, lng });
        rebuildOverlays(Lf, map);
      };

      map.on("click", onClick);
      mapInst.current._onClick = onClick;

      // Pre-fill coords for edit mode
      if (coords?.length) {
        const s = stateRef.current;
        if (!s.pts.length) {
          s.pts = coords.map((c) => ({ lat: c.lat, lng: c.lng }));
          rebuildOverlays(Lf, map);
          const c = centroid(coords);
          map.flyTo(c, 12, { duration: 0.8 });
        }
      }
    });
    return () => {
      cancelled = true;
      if (mapInst.current) {
        mapInst.current._ro?.disconnect();
        mapInst.current.off("click", mapInst.current._onClick);
        mapInst.current.remove();
        mapInst.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fly to region when parent signals
  useEffect(() => {
    if (!flyTo || !mapInst.current) return;
    mapInst.current.flyTo(flyTo.latlng, flyTo.zoom ?? 8, { duration: 1.1 });
  }, [flyTo]);

  return (
    <div ref={mapRef} style={{ width: "100%", height: "100%", borderRadius: "inherit" }} />
  );
});

/* ═══════════════════════════════════════════════════════════
   MAP SEARCH — Nominatim geocoder overlay (no API key needed)
═══════════════════════════════════════════════════════════ */
function MapSearch({ onSelect, isDark, placeholder = "Найти место..." }) {
  const { i18n } = useTranslation();
  const [query,   setQuery  ] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open,    setOpen   ] = useState(false);
  const [focused, setFocused] = useState(false);
  const debounceRef = useRef(null);
  const containerRef = useRef(null);
  const abortRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    const fn = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
        setFocused(false);
      }
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  const search = useCallback((q) => {
    const trimmed = q.trim();
    if (trimmed.length < 2) { setResults([]); setOpen(false); return; }

    // Cancel previous request
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    setLoading(true);
    const lang = i18n.language || "ru";
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=7&countrycodes=kz&q=${encodeURIComponent(trimmed)}&accept-language=${encodeURIComponent(lang)}`;

    fetch(url, {
      signal: abortRef.current.signal,
      headers: { "Accept-Language": lang },
    })
      .then((r) => r.json())
      .then((data) => {
        // Filter + sanitize results
        const safe = (data || [])
          .filter((r) => r.lat && r.lon && r.display_name)
          .map((r) => ({
            id:    r.place_id,
            label: r.display_name.replace(/,\s*Казахстан$/i, "").slice(0, 80),
            lat:   parseFloat(r.lat),
            lng:   parseFloat(r.lon),
            type:  r.type,
          }));
        setResults(safe);
        setOpen(safe.length > 0);
        setLoading(false);
      })
      .catch((e) => {
        if (e.name !== "AbortError") setLoading(false);
      });
  }, [i18n.language]);

  const handleChange = (e) => {
    const v = e.target.value.slice(0, 120); // max length guard
    setQuery(v);
    clearTimeout(debounceRef.current);
    if (!v.trim()) { setResults([]); setOpen(false); setLoading(false); return; }
    setLoading(true);
    debounceRef.current = setTimeout(() => search(v), 380);
  };

  const handleSelect = (item) => {
    setQuery(item.label);
    setResults([]);
    setOpen(false);
    onSelect?.(item);
  };

  const handleClear = () => {
    setQuery("");
    setResults([]);
    setOpen(false);
    setLoading(false);
    if (abortRef.current) abortRef.current.abort();
  };

  // Colors
  const bg     = isDark ? "rgba(4,13,6,.92)"    : "rgba(255,255,255,.95)";
  const border = focused
    ? "rgba(74,222,128,.55)"
    : (isDark ? "rgba(255,255,255,.14)" : "rgba(34,197,94,.25)");
  const tc     = isDark ? "#fff"  : "#1a3d20";
  const sc     = isDark ? "rgba(255,255,255,.38)" : "rgba(20,55,20,.45)";
  const dropBg = isDark ? "rgba(4,13,6,.97)"    : "#fff";
  const hoverBg= isDark ? "rgba(74,222,128,.1)" : "rgba(34,197,94,.07)";

  // Icon colour for type
  const typeIcon = (type) => {
    const icons = { village: "🏘", city: "🏙", town: "🏘", farm: "🌾", agricultural: "🌾", district: "📍" };
    return icons[type] || "📍";
  };

  return (
    <div
      ref={containerRef}
      style={{
        position: "absolute", top: 12, left: 12, right: 12,
        zIndex: 500, // above Leaflet tiles and modals
      }}
    >
      {/* Input row */}
      <div style={{
        display: "flex", alignItems: "center", gap: 0,
        background: bg,
        border: `1px solid ${border}`,
        borderRadius: open && results.length > 0 ? "12px 12px 0 0" : 12,
        backdropFilter: "blur(16px)",
        boxShadow: focused
          ? "0 4px 24px rgba(0,0,0,.35), 0 0 0 3px rgba(74,222,128,.12)"
          : "0 2px 16px rgba(0,0,0,.25)",
        transition: "border-color .2s, box-shadow .2s, border-radius .15s",
        overflow: "hidden",
      }}>
        {/* Search icon / spinner */}
        <div style={{ padding: "0 12px", display: "flex", alignItems: "center", flexShrink: 0 }}>
          {loading
            ? <Loader2 style={{ width: 15, height: 15, color: "#4ade80", animation: "spin 1s linear infinite" }} />
            : <Search style={{ width: 15, height: 15, color: sc }} />
          }
        </div>

        <input
          value={query}
          onChange={handleChange}
          onFocus={() => { setFocused(true); if (results.length > 0) setOpen(true); }}
          onBlur={() => setFocused(false)}
          onKeyDown={(e) => {
            if (e.key === "Escape") handleClear();
            if (e.key === "Enter" && results.length > 0) handleSelect(results[0]);
          }}
          placeholder={placeholder}
          maxLength={120}
          style={{
            flex: 1,
            padding: "11px 0",
            background: "transparent",
            border: "none",
            outline: "none",
            fontSize: 13,
            fontFamily: "'DM Sans', sans-serif",
            fontWeight: 500,
            color: tc,
          }}
        />

        {/* Clear button */}
        {query && (
          <button
            onClick={handleClear}
            style={{
              padding: "0 12px", background: "none", border: "none", cursor: "pointer",
              display: "flex", alignItems: "center", color: sc,
              transition: "color .15s",
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = "#f87171"}
            onMouseLeave={(e) => e.currentTarget.style.color = sc}
          >
            <X style={{ width: 14, height: 14 }} />
          </button>
        )}
      </div>

      {/* Results dropdown */}
      {open && results.length > 0 && (
        <div style={{
          background: dropBg,
          border: `1px solid ${isDark ? "rgba(74,222,128,.2)" : "rgba(34,197,94,.2)"}`,
          borderTop: "none",
          borderRadius: "0 0 12px 12px",
          overflow: "hidden",
          backdropFilter: "blur(16px)",
          boxShadow: "0 12px 32px rgba(0,0,0,.35)",
          maxHeight: 260,
          overflowY: "auto",
        }}>
          {results.map((item, i) => (
            <div
              key={item.id ?? i}
              onClick={() => handleSelect(item)}
              style={{
                padding: "10px 14px",
                display: "flex",
                alignItems: "flex-start",
                gap: 10,
                cursor: "pointer",
                borderBottom: i < results.length - 1
                  ? `1px solid ${isDark ? "rgba(255,255,255,.05)" : "rgba(34,197,94,.07)"}`
                  : "none",
                transition: "background .12s",
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = hoverBg}
              onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
            >
              <span style={{ fontSize: 14, lineHeight: 1, marginTop: 1, flexShrink: 0 }}>
                {typeIcon(item.type)}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 13, fontWeight: 600, color: tc,
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}>
                  {item.label.split(",")[0]}
                </div>
                <div style={{
                  fontSize: 11, color: sc, marginTop: 2,
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}>
                  {item.label.split(",").slice(1).join(",").trim()}
                </div>
              </div>
              <MapPin style={{ width: 12, height: 12, color: "#4ade80", flexShrink: 0, marginTop: 3 }} />
            </div>
          ))}

          {/* Footer */}
          <div style={{
            padding: "7px 14px",
            fontSize: 10,
            color: sc,
            borderTop: `1px solid ${isDark ? "rgba(255,255,255,.05)" : "rgba(34,197,94,.07)"}`,
            display: "flex",
            alignItems: "center",
            gap: 5,
          }}>
            <span>© OpenStreetMap / Nominatim</span>
          </div>
        </div>
      )}

      {/* No results */}
      {open && !loading && query.trim().length >= 2 && results.length === 0 && (
        <div style={{
          background: dropBg,
          border: `1px solid ${isDark ? "rgba(255,255,255,.1)" : "rgba(34,197,94,.15)"}`,
          borderTop: "none",
          borderRadius: "0 0 12px 12px",
          padding: "12px 14px",
          fontSize: 13,
          color: sc,
          backdropFilter: "blur(16px)",
          boxShadow: "0 12px 32px rgba(0,0,0,.3)",
        }}>
          Ничего не найдено
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   STYLED SELECT
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

  const tc         = isDark ? "#fff" : "#1a3d20";
  const sc         = isDark ? "rgba(255,255,255,.4)" : "rgba(20,55,20,.45)";
  const bg         = isDark ? "rgba(255,255,255,.06)" : "#f4faf5";
  const border     = isDark ? "rgba(255,255,255,.12)" : "rgba(34,197,94,.22)";
  const focusBdr   = "#22c55e";
  const dropBg     = isDark ? "#061309" : "#fff";
  const hoverBg    = isDark ? "rgba(74,222,128,.1)" : "rgba(34,197,94,.07)";

  return (
    <div ref={ref} style={{ position: "relative", width: "100%" }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          width: "100%", padding: "11px 36px 11px 14px", borderRadius: 11,
          background: bg, border: `1px solid ${open ? focusBdr : border}`,
          color: value ? tc : sc, fontSize: 14, textAlign: "left", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          fontFamily: "'DM Sans', sans-serif", transition: "border-color .2s",
          boxShadow: open ? "0 0 0 3px rgba(34,197,94,.1)" : "none",
        }}
      >
        <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</span>
        <ChevronDown style={{ width: 16, height: 16, color: sc, flexShrink: 0, transition: "transform .2s", transform: open ? "rotate(180deg)" : "none", marginLeft: 8 }} />
      </button>
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, zIndex: 9999,
          background: dropBg,
          border: `1px solid ${isDark ? "rgba(74,222,128,.2)" : "rgba(34,197,94,.2)"}`,
          borderRadius: 12, overflow: "hidden",
          boxShadow: isDark ? "0 16px 40px rgba(0,0,0,.6)" : "0 8px 32px rgba(34,197,94,.15)",
          maxHeight: 220, overflowY: "auto",
        }}>
          {placeholder && (
            <div
              onClick={() => { onChange(""); setOpen(false); }}
              style={{ padding: "10px 14px", fontSize: 13, color: sc, cursor: "pointer" }}
            >
              {placeholder}
            </div>
          )}
          {options.map((opt) => {
            const val = opt.value !== undefined ? opt.value : opt;
            const lbl = opt.label ?? opt;
            const isSel = val === value;
            return (
              <div
                key={val}
                onClick={() => { onChange(val); setOpen(false); }}
                style={{
                  padding: "10px 14px", fontSize: 14, cursor: "pointer",
                  color: isSel ? (isDark ? "#4ade80" : "#16a34a") : tc,
                  background: isSel ? (isDark ? "rgba(74,222,128,.12)" : "rgba(34,197,94,.08)") : "transparent",
                  fontWeight: isSel ? 600 : 400, transition: "background .1s",
                }}
                onMouseEnter={(e) => { if (!isSel) e.currentTarget.style.background = hoverBg; }}
                onMouseLeave={(e) => { if (!isSel) e.currentTarget.style.background = "transparent"; }}
              >
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
   CONSTANTS
═══════════════════════════════════════════════════════════ */
const FARM_COLORS = [
  "#22c55e","#0891b2","#f59e0b","#a78bfa",
  "#f472b6","#34d399","#60a5fa","#fb923c",
];

const REGIONS = Object.keys(REGION_COORDS);

const FARM_TYPES = [
  { value: "livestock", label: "farms.type.livestock" },
  { value: "crop",      label: "farms.type.crop"      },
  { value: "mixed",     label: "farms.type.mixed"     },
  { value: "organic",   label: "farms.type.organic"   },
  { value: "dairy",     label: "farms.type.dairy"     },
];

const STATUSES = [
  { value: "active",   label: "farms.status.active"   },
  { value: "inactive", label: "farms.status.inactive" },
  { value: "seasonal", label: "farms.status.seasonal" },
];

/* ═══════════════════════════════════════════════════════════
   STYLES
═══════════════════════════════════════════════════════════ */
const STYLE = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600&display=swap');

*,*::before,*::after{box-sizing:border-box;}

.fp{font-family:'DM Sans',sans-serif;min-height:100vh;}
.fp-d{background:#040d06;color:#fff;}
.fp-l{background:#f4faf5;color:#1a3d20;}

.fp-hero{padding:96px 0 36px;position:relative;overflow:hidden;}
.fp-hero-d{background:linear-gradient(160deg,#061309 0%,#071a0c 100%);border-bottom:1px solid rgba(74,222,128,.1);}
.fp-hero-l{background:linear-gradient(160deg,#e8f7ea 0%,#f0faf2 100%);border-bottom:1px solid rgba(34,197,94,.15);}
.fp-hero::before{content:'';position:absolute;inset:0;background:radial-gradient(circle at 70% 50%,rgba(34,197,94,.07) 0%,transparent 60%);pointer-events:none;}

/* ══ DESKTOP LAYOUT ══ */
.fp-body{display:flex;height:calc(100vh - 200px);min-height:580px;max-width:1300px;margin:0 auto;}
.fp-sidebar{width:330px;flex-shrink:0;display:flex;flex-direction:column;overflow:hidden;border-right:1px solid;}
.fp-sidebar-d{border-color:rgba(255,255,255,.07);background:rgba(5,16,8,.95);}
.fp-sidebar-l{border-color:rgba(34,197,94,.12);background:#fff;}
.fp-map-area{flex:1;position:relative;overflow:hidden;min-height:0;}

/* ══ MOBILE TAB BAR — скрыт на десктопе ══ */
.fp-mob-tabs{display:none;}

/* ══ MOBILE / TABLET ≤1024px ══ */
@media(max-width:1024px){

  /* Таб-панель */
  .fp-mob-tabs{
    display:flex;
    align-items:center;
    gap:8px;
    padding:0 16px 12px;
    max-width:1300px;
    margin:0 auto;
  }
  .fp-mob-tab{
    flex:1;
    padding:11px 0;
    border-radius:13px;
    border:none;
    cursor:pointer;
    font-family:'DM Sans',sans-serif;
    font-size:13px;
    font-weight:600;
    display:flex;
    align-items:center;
    justify-content:center;
    gap:7px;
    transition:all .22s;
  }

  /* Body — фиксированная высота, оба панели абсолютные внутри */
  .fp-body{
    position:relative;
    height:calc(100svh - 280px);
    min-height:400px;
    max-width:100%;
    overflow:hidden;
  }

  /* Sidebar и Map — оба занимают всю площадь body */
  .fp-sidebar{
    position:absolute;
    inset:0;
    width:100%;
    border-right:none;
    z-index:2;
    transition:opacity .22s,visibility .22s;
  }
  .fp-map-area{
    position:absolute;
    inset:0;
    z-index:2;
    transition:opacity .22s,visibility .22s;
  }

  /* Скрытая панель */
  .fp-panel-hidden{
    opacity:0 !important;
    visibility:hidden !important;
    pointer-events:none !important;
    z-index:1 !important;
  }
}

/* ══ SMALL PHONES ≤600px ══ */
@media(max-width:600px){
  .fp-hero{padding:72px 0 16px;}
  .fp-body{height:calc(100svh - 255px);min-height:350px;}
  .fp-mob-tabs{padding:0 10px 10px;}
}

/* ══ VERY SMALL ≤380px ══ */
@media(max-width:380px){
  .fp-body{height:calc(100svh - 245px);min-height:320px;}
  .fp-mob-tab{font-size:12px;padding:9px 0;}
}

.fp-sh{padding:18px 16px 14px;border-bottom:1px solid;flex-shrink:0;}
.fp-sh-d{border-color:rgba(255,255,255,.06);}
.fp-sh-l{border-color:rgba(34,197,94,.1);}

.fp-sw{position:relative;}
.fp-sw svg{position:absolute;left:12px;top:50%;transform:translateY(-50%);pointer-events:none;}
.fp-search{width:100%;padding:9px 12px 9px 34px;border-radius:10px;font-size:13px;outline:none;font-family:'DM Sans',sans-serif;transition:border-color .2s;}
.fp-search-d{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);color:#fff;}
.fp-search-d::placeholder{color:rgba(255,255,255,.3);}
.fp-search-d:focus{border-color:rgba(74,222,128,.45);}
.fp-search-l{background:#f4faf5;border:1px solid rgba(34,197,94,.2);color:#1a3d20;}
.fp-search-l::placeholder{color:rgba(20,55,20,.35);}
.fp-search-l:focus{border-color:#22c55e;box-shadow:0 0 0 3px rgba(34,197,94,.08);}

.fp-list{flex:1;overflow-y:auto;padding:10px;}
.fp-list::-webkit-scrollbar{width:4px;}
.fp-list::-webkit-scrollbar-thumb{background:rgba(74,222,128,.2);border-radius:4px;}

.fp-card{border-radius:14px;padding:13px;cursor:pointer;transition:all .18s;margin-bottom:5px;border:1px solid transparent;}
.fp-card-d{background:rgba(255,255,255,.04);}
.fp-card-d:hover{background:rgba(255,255,255,.07);border-color:rgba(74,222,128,.2);}
.fp-card-d.active{background:rgba(74,222,128,.08);border-color:rgba(74,222,128,.3);}
.fp-card-l{background:#f8fdf8;}
.fp-card-l:hover{background:#fff;border-color:rgba(34,197,94,.25);box-shadow:0 4px 14px rgba(34,197,94,.08);}
.fp-card-l.active{background:#fff;border-color:rgba(34,197,94,.4);box-shadow:0 4px 18px rgba(34,197,94,.12);}

.fp-btn-create{
  width:100%;padding:12px 16px;border-radius:13px;border:none;cursor:pointer;
  font-family:'DM Sans',sans-serif;font-size:14px;font-weight:700;
  display:flex;align-items:center;justify-content:center;gap:9px;
  background:linear-gradient(135deg,#22c55e 0%,#16a34a 100%);
  color:#fff;transition:transform .2s,box-shadow .2s;
  margin-bottom:10px;position:relative;overflow:hidden;letter-spacing:.01em;
}
.fp-btn-create::before{content:'';position:absolute;inset:0;background:linear-gradient(135deg,rgba(255,255,255,.18) 0%,transparent 60%);pointer-events:none;}
.fp-btn-create:hover{transform:translateY(-1px);box-shadow:0 10px 28px rgba(34,197,94,.4);}
.fp-btn-create:active{transform:translateY(0);}

.fp-iBtn{width:28px;height:28px;border-radius:7px;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:background .15s;background:transparent;}
.fp-iBtn-d:hover{background:rgba(255,255,255,.1);}
.fp-iBtn-l:hover{background:rgba(34,197,94,.1);}

/* Overlay */
.fp-ov{
  position:fixed;inset:0;background:rgba(0,0,0,.75);
  backdrop-filter:blur(8px);z-index:1400;
  display:flex;align-items:center;justify-content:center;
  padding:16px;overflow-y:auto;
}

/* Create modal */
.fp-create-modal{
  border-radius:24px;width:100%;max-width:1060px;
  animation:mIn .35s cubic-bezier(.22,1,.36,1) both;
  display:flex;overflow:hidden;max-height:92vh;   /* оставить для десктопа */
}
.fp-create-modal-d{background:#061309;border:1px solid rgba(255,255,255,.1);box-shadow:0 48px 96px rgba(0,0,0,.75);}
.fp-create-modal-l{background:#fff;border:1px solid rgba(34,197,94,.15);box-shadow:0 24px 64px rgba(0,0,0,.16);}

/* Form panel */
.fp-form-panel{width:420px;flex-shrink:0;overflow-y:auto;padding:28px 26px;display:flex;flex-direction:column;gap:0;}
.fp-form-panel::-webkit-scrollbar{width:4px;}
.fp-form-panel::-webkit-scrollbar-thumb{background:rgba(74,222,128,.2);border-radius:4px;}
.fp-form-panel-d{border-right:1px solid rgba(255,255,255,.07);}
.fp-form-panel-l{border-right:1px solid rgba(34,197,94,.1);}

/* Map panel */
.fp-map-panel{flex:1;position:relative;min-height:540px;display:flex;flex-direction:column;}
.fp-map-panel-d{background:#030a04;}
.fp-map-panel-l{background:#f0faf2;}

/* Map search wrap */
.fp-map-search-wrap{position:relative;flex:1;display:flex;flex-direction:column;overflow:hidden;}

.fp-map-panel-inner{flex:1;position:relative;overflow:hidden;}

/* Map toolbar */
.fp-map-toolbar{padding:10px 12px;display:flex;align-items:center;gap:8px;border-bottom:1px solid;flex-shrink:0;flex-wrap:wrap;}
.fp-map-toolbar-d{border-color:rgba(255,255,255,.07);background:rgba(0,0,0,.3);}
.fp-map-toolbar-l{border-color:rgba(34,197,94,.1);background:rgba(240,250,242,.8);}

/* Toolbar icon buttons */
.fp-tb-btn{
  display:flex;align-items:center;justify-content:center;gap:5px;
  padding:5px 10px;border-radius:8px;border:none;cursor:pointer;
  font-family:'DM Sans',sans-serif;font-size:12px;font-weight:600;
  transition:background .15s,opacity .15s;white-space:nowrap;
}
.fp-tb-btn:disabled{opacity:.35;cursor:not-allowed;}
.fp-tb-btn-d{background:rgba(255,255,255,.08);color:rgba(255,255,255,.7);}
.fp-tb-btn-d:not(:disabled):hover{background:rgba(255,255,255,.14);}
.fp-tb-btn-l{background:rgba(20,55,20,.06);color:rgba(20,55,20,.7);}
.fp-tb-btn-l:not(:disabled):hover{background:rgba(20,55,20,.12);}
.fp-tb-btn-danger{background:rgba(239,68,68,.12)!important;color:#f87171!important;}
.fp-tb-btn-danger:not(:disabled):hover{background:rgba(239,68,68,.2)!important;}

/* Ha badge */
.fp-ha-badge{
  display:inline-flex;align-items:center;gap:7px;
  padding:6px 14px;border-radius:999px;
  font-size:13px;font-weight:700;
  background:rgba(74,222,128,.12);color:#4ade80;
  border:1px solid rgba(74,222,128,.25);
  font-family:'Syne',sans-serif;transition:all .3s;
  margin-left:auto;flex-shrink:0;
}
.fp-ha-badge.has-poly{background:rgba(74,222,128,.18);border-color:rgba(74,222,128,.45);}
.fp-ha-badge.has-error{background:rgba(239,68,68,.12);border-color:rgba(239,68,68,.35);color:#f87171;}
.fp-map-field-error{display:flex;align-items:flex-start;gap:8px;margin:10px 12px 0;padding:10px 12px;border-radius:10px;background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.24);font-size:12px;font-weight:600;color:#f87171;line-height:1.35;}

/* Draw hint */
.fp-draw-hint{
  position:absolute;bottom:16px;left:50%;transform:translateX(-50%);
  padding:10px 18px;border-radius:999px;font-size:12px;font-weight:600;
  display:flex;align-items:center;gap:8px;z-index:100;white-space:nowrap;
  backdrop-filter:blur(14px);border:1px solid rgba(74,222,128,.3);
  background:rgba(4,13,6,.9);color:#4ade80;pointer-events:none;
  animation:hintIn .3s ease;
}
@keyframes hintIn{from{opacity:0;transform:translateX(-50%) translateY(8px);}to{opacity:1;transform:translateX(-50%) translateY(0);}}

/* Simple modal (view) */
.fp-modal{border-radius:22px;padding:28px;width:100%;max-width:560px;animation:mIn .3s cubic-bezier(.22,1,.36,1) both;max-height:92vh;overflow-y:auto;}
.fp-modal::-webkit-scrollbar{width:4px;}
.fp-modal::-webkit-scrollbar-thumb{background:rgba(74,222,128,.2);border-radius:4px;}
@keyframes mIn{from{opacity:0;transform:scale(.95) translateY(12px);}to{opacity:1;transform:scale(1) translateY(0);}}
.fp-modal-d{background:#061309;border:1px solid rgba(255,255,255,.1);box-shadow:0 40px 80px rgba(0,0,0,.7);}
.fp-modal-l{background:#fff;border:1px solid rgba(34,197,94,.15);box-shadow:0 20px 60px rgba(0,0,0,.14);}

/* Inputs */
.fp-inp{width:100%;padding:11px 14px;border-radius:11px;font-size:14px;outline:none;font-family:'DM Sans',sans-serif;transition:all .2s;box-sizing:border-box;}
.fp-inp-d{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);color:#fff;}
.fp-inp-d::placeholder{color:rgba(255,255,255,.3);}
.fp-inp-d:focus{border-color:rgba(74,222,128,.5);background:rgba(255,255,255,.09);}
.fp-inp-l{background:#f4faf5;border:1px solid rgba(34,197,94,.22);color:#1a3d20;}
.fp-inp-l::placeholder{color:rgba(20,55,20,.35);}
.fp-inp-l:focus{border-color:#22c55e;box-shadow:0 0 0 3px rgba(34,197,94,.08);background:#fff;}

.fp-lbl{font-size:11px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;margin-bottom:5px;display:flex;align-items:center;gap:5px;}
.fp-lbl-d{color:rgba(255,255,255,.38);}
.fp-lbl-l{color:rgba(20,55,20,.48);}

.fp-inp-error{border-color:#ef4444!important;box-shadow:0 0 0 3px rgba(239,68,68,.12)!important;}
.fp-field-error{display:flex;align-items:center;gap:6px;margin-top:6px;font-size:12px;font-weight:600;color:#f87171;}
.fp-select-error{border-radius:11px;border:1px solid #ef4444!important;box-shadow:0 0 0 3px rgba(239,68,68,.12)!important;}

.fp-reference{border-radius:14px;padding:12px;margin-bottom:16px;border:1px solid;}
.fp-reference-d{background:rgba(255,255,255,.035);border-color:rgba(255,255,255,.08);}
.fp-reference-l{background:#f4faf5;border-color:rgba(34,197,94,.12);}
.fp-reference-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:10px;}
.fp-reference-title{display:flex;align-items:center;gap:7px;font-size:12px;font-weight:800;letter-spacing:.04em;text-transform:uppercase;}
.fp-reference-list{display:flex;flex-direction:column;gap:7px;max-height:150px;overflow-y:auto;padding-right:2px;}
.fp-reference-item{border-radius:10px;padding:9px 10px;border:1px solid;display:flex;align-items:flex-start;gap:8px;}
.fp-reference-item-d{background:rgba(0,0,0,.16);border-color:rgba(255,255,255,.07);}
.fp-reference-item-l{background:#fff;border-color:rgba(34,197,94,.1);}
.fp-reference-dot{width:8px;height:8px;border-radius:50%;margin-top:5px;flex-shrink:0;}
.fp-reference-empty{font-size:12px;font-weight:600;font-style:italic;}

.fp-tag{display:inline-flex;align-items:center;gap:4px;padding:3px 8px;border-radius:6px;font-size:12px;font-weight:500;}
.fp-tag-d{background:rgba(74,222,128,.12);color:#4ade80;border:1px solid rgba(74,222,128,.2);}
.fp-tag-l{background:rgba(34,197,94,.1);color:#16a34a;border:1px solid rgba(34,197,94,.2);}

.fp-save{width:100%;padding:13px;border-radius:12px;border:none;cursor:pointer;font-family:'DM Sans',sans-serif;font-size:14px;font-weight:600;background:linear-gradient(135deg,#22c55e,#0d9488);color:#fff;transition:transform .2s,box-shadow .2s;display:flex;align-items:center;justify-content:center;gap:8px;}
.fp-save:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 8px 24px rgba(34,197,94,.4);}
.fp-save:disabled{opacity:.6;cursor:not-allowed;}
.fp-cancel{padding:12px 18px;border-radius:12px;border:none;cursor:pointer;font-family:'DM Sans',sans-serif;font-size:14px;font-weight:500;display:flex;align-items:center;justify-content:center;transition:background .15s;}
.fp-cancel-d{background:rgba(255,255,255,.07);color:rgba(255,255,255,.65);}
.fp-cancel-d:hover{background:rgba(255,255,255,.12);}
.fp-cancel-l{background:rgba(20,55,20,.06);color:rgba(20,55,20,.65);}
.fp-cancel-l:hover{background:rgba(20,55,20,.1);}

.fp-div{height:1px;margin:18px 0;}
.fp-div-d{background:rgba(255,255,255,.07);}
.fp-div-l{background:rgba(34,197,94,.1);}

.fp-section{font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;margin-bottom:10px;display:flex;align-items:center;gap:6px;}
.fp-section-d{color:rgba(255,255,255,.35);}
.fp-section-l{color:rgba(20,55,20,.4);}

.fp-ha{font-size:22px;font-weight:800;font-family:'Syne',sans-serif;}
.fp-stats-strip{display:flex;border-top:1px solid;flex-shrink:0;}
.fp-stat-item{flex:1;padding:13px 14px;}
.fp-stat-item+.fp-stat-item{border-left:1px solid;}

.fp-swatch{width:26px;height:26px;border-radius:7px;cursor:pointer;transition:transform .15s;border:2px solid transparent;flex-shrink:0;}
.fp-swatch:hover{transform:scale(1.18);}
.fp-swatch.sel{border-color:#fff;box-shadow:0 0 0 2px rgba(255,255,255,.4);}

.fp-px{padding-left:24px;padding-right:24px;}
@media(max-width:600px){.fp-px{padding-left:14px;padding-right:14px;}}

.fp-err{display:flex;align-items:center;gap:8px;padding:10px 12px;border-radius:10px;margin-bottom:14px;background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.2);font-size:13px;color:#f87171;}

/* Responsive create modal */
/* Responsive create modal */
@media(max-width:800px){
  .fp-create-modal{flex-direction:column;max-width:600px;max-height:96vh;overflow-y:auto;overflow-x:hidden;}
  .fp-form-panel{width:100%;max-height:none;overflow-y:visible;border-right:none!important;border-bottom:1px solid;flex-shrink:0;}
  .fp-map-panel{height:360px!important;min-height:360px;flex-shrink:0;flex:none;}
  .fp-map-panel-inner{height:310px!important;min-height:310px;flex:none;}
}
@media(max-width:480px){
  .fp-create-modal{border-radius:18px;}
  .fp-form-panel{padding:16px 14px;}
  .fp-map-panel{height:320px!important;min-height:320px;}
  .fp-map-panel-inner{height:270px!important;min-height:270px;}
  .fp-map-toolbar{gap:4px;padding:8px 10px;}
  .fp-tb-btn span{display:none;}
}

@keyframes spin{to{transform:rotate(360deg)}}
`;

/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════ */
export default function FarmsPage() {
  const { user, isAuthenticated, getFarms, createFarm, updateFarm, deleteFarm } = useAuth();
  const { theme } = useTheme();
  const { t, i18n } = useTranslation();
  const navigate  = useNavigate();
  const isDark    = theme === "dark";

  const [farms,      setFarms     ] = useState([]);
  const [loading,    setLoading   ] = useState(true);
  const [search,     setSearch    ] = useState("");
  const [activeFarm, setActiveFarm] = useState(null);
  const [modal,      setModal     ] = useState(null);   // null | 'create' | 'view'
  const [mobileTab,  setMobileTab ] = useState("list"); // 'list' | 'map'
  const [drawnCoords,setDrawnCoords] = useState(null);
  const [pointCount, setPointCount] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [apiError,   setApiError  ] = useState("");
  const [formErrors,  setFormErrors ] = useState({});
  const [editId,     setEditId    ] = useState(null);
  const [mapKey,     setMapKey    ] = useState(0);
  const [flyTo,      setFlyTo     ] = useState(null); // { latlng, zoom }
  const [searchFlyTo,setSearchFlyTo] = useState(null); // from map search
  const [cropInput,  setCropInput ] = useState("");
  const [equipInput, setEquipInput] = useState("");

  // Ref to draw map for undo/redo/reset
  const drawMapRef = useRef(null);
  const addressEditedRef = useRef(false);
  const autoAddressRef = useRef("");
  const addressAbortRef = useRef(null);

  const blankForm = useCallback(() => ({
    name:             "",
    region:           "",
    address:          "",
    phone:            user?.phone  || user?.phone_number || "",
    description:      "",
    owner_name:       user?.full_name || user?.name || "",
    farm_type:        "",
    established_date: "",
    status:           "active",
    color:            FARM_COLORS[0],
    crops:            [],
    equipment:        [],
  }), [user]);

  const [form, setForm] = useState(blankForm);
  const setF = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }));
    setFormErrors((errs) => ({ ...errs, [k]: "" }));
    if (apiError) setApiError("");
  };

  // Auth guard
  useEffect(() => {
    if (!isAuthenticated) { navigate("/login"); return; }
    load();
  }, [isAuthenticated]);

  useEffect(() => {
    setFarms((items) => items.map((item) => localizeRecord(item, i18n.language, FARM_TRANSLATABLE_FIELDS)));
  }, [i18n.language]);

  const load = async () => {
    setLoading(true);
    try {
      const data = await getFarms?.();
      setFarms(
        (data || []).map((f) => ({
          ...f,
          ...localizeRecord(f, i18n.language, FARM_TRANSLATABLE_FIELDS),
          area_ha: f.coordinates?.length >= 3 ? calcHectares(f.coordinates) : (f.area || 0),
          color:   f.color || FARM_COLORS[0],
        }))
      );
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const filtered  = useMemo(() => farms.filter((f) => f.name.toLowerCase().includes(search.toLowerCase())), [farms, search]);
  const totalHa   = useMemo(() => farms.reduce((s, f) => s + (f.area_ha || 0), 0), [farms]);

  // Region select → fly modal map
  const handleRegionChange = (v) => {
    setF("region", v);
    if (v && REGION_COORDS[v]) {
      setFlyTo({ latlng: REGION_COORDS[v].latlng, zoom: REGION_COORDS[v].zoom, ts: Date.now() });
    }
  };

  // Open create modal
  const openCreate = () => {
    setEditId(null);
    setForm({ ...blankForm(), color: FARM_COLORS[farms.length % FARM_COLORS.length] });
    setDrawnCoords(null);
    setPointCount(0);
    setFlyTo(null);
    setApiError("");
    addressEditedRef.current = false;
    autoAddressRef.current = "";
    addressAbortRef.current?.abort();
    setMapKey((k) => k + 1);
    setModal("create");
  };

  // Open edit modal
  const handleEdit = (farm) => {
    setEditId(farm.id);
    setForm({
      name:             farm.name             || "",
      region:           farm.region           || "",
      address:          farm.address          || "",
      phone:            farm.phone            || user?.phone || user?.phone_number || "",
      description:      farm.description      || "",
      owner_name:       farm.owner_name        || user?.full_name || user?.name || "",
      farm_type:        farm.farm_type         || "",
      established_date: farm.established_date?.split?.("T")?.[0] || "",
      status:           farm.status           || "active",
      color:            farm.color            || FARM_COLORS[0],
      crops:            farm.crops            || [],
      equipment:        farm.equipment        || [],
    });
    setDrawnCoords(farm.coordinates || null);
    setPointCount(farm.coordinates?.length || 0);
    setFlyTo(null);
    setApiError("");
    addressEditedRef.current = Boolean(farm.address);
    autoAddressRef.current = farm.address || "";
    addressAbortRef.current?.abort();
    setMapKey((k) => k + 1);
    setModal("create");
  };

  const handleCoordsChange = useCallback((coords) => {
    setDrawnCoords(coords);
    if (coords?.length >= 3) {
      setFormErrors((errs) => ({ ...errs, coordinates: "" }));
      setApiError("");
    }
  }, []);
  const handlePointCount   = useCallback((n)      => setPointCount(n), []);

  useEffect(() => {
    if (modal !== "create" || !drawnCoords?.length || drawnCoords.length < 3) return;

    const [lat, lng] = centroid(drawnCoords);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

    addressAbortRef.current?.abort();
    const ac = new AbortController();
    addressAbortRef.current = ac;

    fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}&zoom=16&accept-language=${encodeURIComponent(i18n.language || "ru")}`,
      { signal: ac.signal, headers: { "Accept-Language": i18n.language || "ru" } }
    )
      .then((r) => {
        if (!r.ok) throw new Error("reverse_geocode");
        return r.json();
      })
      .then((data) => {
        const nextAddress = normalizeAutoAddress(data?.display_name);
        if (!nextAddress) return;

        setForm((prev) => {
          const currentAddress = (prev.address || "").trim();
          const canAutofill =
            !addressEditedRef.current ||
            !currentAddress ||
            currentAddress === autoAddressRef.current;

          if (!canAutofill) return prev;

          autoAddressRef.current = nextAddress;
          return { ...prev, address: nextAddress };
        });
      })
      .catch((e) => {
        if (e.name !== "AbortError") console.error(e);
      });

    return () => ac.abort();
  }, [drawnCoords, i18n.language, modal]);

  const computedHa = useMemo(() => {
    if (drawnCoords?.length >= 3) return calcHectares(drawnCoords);
    return null;
  }, [drawnCoords]);

  // Save
  const handleSave = async () => {
    const errs = validateForm(form, t, drawnCoords);
    if (errs) {
      setFormErrors(errs);
      // Build list of field names for the banner
      const FIELD_LABELS = {
        name:        t("farms.field.name",   "Название"),
        region:      t("farms.field.region", "Регион"),
        phone:       t("farms.field.phone",  "Телефон"),
        coordinates: t("farms.field.boundaries", "Границы фермы"),
      };
      const fieldList = Object.keys(errs).map((k) => FIELD_LABELS[k] || k).join(", ");
      setApiError(t("farms.err.fillFields", "Заполните обязательные поля") + ": " + fieldList);
      return;
    }
    setFormErrors({}); setSubmitting(true); setApiError("");
    try {
      const coords = drawnCoords;
      const ha     = coords?.length >= 3 ? calcHectares(coords) : 0;
      const c      = centroid(coords || []);
      const clean  = sanitizeForm(form);
      const payload = {
        name:             clean.name,
        region:           clean.region,
        area:             ha,
        address:          clean.address  || null,
        description:      clean.description || null,
        phone:            clean.phone    || null,
        owner_name:       clean.owner_name || null,
        farm_type:        clean.farm_type  || null,
        established_date: clean.established_date || null,
        status:           clean.status   || "active",
        crops:            form.crops.length  ? form.crops.map(sanitize)  : null,
        equipment:        form.equipment.length ? form.equipment.map(sanitize) : null,
        color:            clean.color,
        coordinates:      coords?.map((p) => ({ lat: p.lat, lng: p.lng })) || null,
        coordinates_lat:  coords ? c[0] : null,
        coordinates_lng:  coords ? c[1] : null,
      };
      if (editId) await updateFarm?.(editId, payload);
      else        await createFarm?.(payload);
      await load();
      setModal(null); setDrawnCoords(null); setEditId(null); setForm(blankForm()); setFormErrors({}); setApiError("");
    } catch (e) {
      setApiError(resolveServerError(e, t));
    } finally { setSubmitting(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t("farms.confirmDelete", "Удалить ферму?"))) return;
    try {
      await deleteFarm?.(id);
      if (activeFarm?.id === id) setActiveFarm(null);
      setModal(null);
      await load();
    } catch (e) { console.error(e); }
  };

  const addTag = (field, val, setInput) => {
    const v = sanitize(val.trim());
    if (!v || form[field].includes(v)) { setInput(""); return; }
    setF(field, [...form[field], v]);
    setInput("");
  };
  const removeTag = (field, i) => setF(field, form[field].filter((_, idx) => idx !== i));

  const closeCreateModal = () => {
    setModal(null);
    setDrawnCoords(null);
    setFlyTo(null);
    setSearchFlyTo(null);
    setFormErrors({});
    setApiError("");
    addressAbortRef.current?.abort();
  };

  const d  = isDark;
  const tc = d ? "#fff" : "#1a3d20";
  const sc = d ? "rgba(255,255,255,.42)" : "rgba(20,55,20,.48)";

  // Translated options
  const farmTypeOptions = FARM_TYPES.map((ft) => ({ value: ft.value, label: t(ft.label, ft.label) }));
  const statusOptions   = STATUSES.map((s)   => ({ value: s.value,  label: t(s.label,  s.label)  }));

  if (!isAuthenticated) return null;

  return (
    <>
      <style>{STYLE}</style>
      <div className={`fp ${d ? "fp-d" : "fp-l"}`}>
        <Header />

        {/* ── Hero ── */}
        <div className={`fp-hero ${d ? "fp-hero-d" : "fp-hero-l"}`}>
          <div className="fp-px" style={{ maxWidth: 1300, margin: "0 auto" }}>
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <div style={{ width: 24, height: 24, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(74,222,128,.15)", border: "1px solid rgba(74,222,128,.25)" }}>
                    <Leaf style={{ width: 14, height: 14, color: "#4ade80" }} />
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".15em", textTransform: "uppercase", color: d ? "rgba(74,222,128,.7)" : "#16a34a" }}>KokMaisa</span>
                </div>
                <h1 style={{ fontFamily: "'Syne',sans-serif", fontSize: "clamp(1.6rem,4vw,2.2rem)", fontWeight: 800, color: tc, margin: 0 }}>
                  {t("farms.title", "Мои фермы")}
                </h1>
                <p style={{ fontSize: 13, marginTop: 4, color: sc }}>
                  {t("farms.subtitle", "Обозначьте границы фермы на карте — площадь считается автоматически")}
                </p>
              </div>
              <div style={{ display: "flex", gap: 20 }}>
                {[
                  { val: farms.length,     lbl: t("farms.stat.farms",    "ферм"),    col: d ? "#4ade80" : "#16a34a" },
                  { val: totalHa.toFixed(0), lbl: t("farms.stat.hectares","гектаров"), col: d ? "#22d3ee" : "#0891b2" },
                ].map((s) => (
                  <div key={s.lbl} style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 24, fontWeight: 800, fontFamily: "'Syne',sans-serif", color: s.col }}>{s.val}</div>
                    <div style={{ fontSize: 11, color: sc }}>{s.lbl}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Mobile Tab Bar (скрыт на десктопе через CSS) ── */}
        <div className={`fp-mob-tabs ${d ? "fp-mob-tabs-d" : ""}`}>
          {[
            { key: "list", icon: Home,  label: t("farms.tab.list", "Список") },
            { key: "map",  icon: Map,   label: t("farms.tab.map",  "Карта")  },
          ].map(({ key, icon: Icon, label }) => {
            const active = mobileTab === key;
            return (
              <button
                key={key}
                className="fp-mob-tab"
                onClick={() => setMobileTab(key)}
                style={{
                  background: active
                    ? (d ? "rgba(74,222,128,.15)" : "rgba(34,197,94,.12)")
                    : (d ? "rgba(255,255,255,.05)" : "rgba(20,55,20,.05)"),
                  color: active
                    ? (d ? "#4ade80" : "#16a34a")
                    : sc,
                  border: `1px solid ${active
                    ? (d ? "rgba(74,222,128,.35)" : "rgba(34,197,94,.3)")
                    : (d ? "rgba(255,255,255,.08)" : "rgba(34,197,94,.12)")}`,
                  boxShadow: active ? (d ? "0 2px 12px rgba(74,222,128,.15)" : "0 2px 12px rgba(34,197,94,.1)") : "none",
                }}
              >
                <Icon style={{ width: 15, height: 15 }} />
                {label}
                {key === "list" && farms.length > 0 && (
                  <span style={{
                    fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 999,
                    background: active ? (d ? "rgba(74,222,128,.25)" : "rgba(34,197,94,.2)") : (d ? "rgba(255,255,255,.1)" : "rgba(20,55,20,.08)"),
                    color: active ? (d ? "#4ade80" : "#16a34a") : sc,
                  }}>
                    {farms.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ── Body ── */}
        <div className="fp-body" style={{ maxWidth: 1300, margin: "0 auto", width: "100%" }}>

          {/* Sidebar */}
          <aside className={`fp-sidebar ${d ? "fp-sidebar-d" : "fp-sidebar-l"}${mobileTab !== "list" ? " fp-panel-hidden" : ""}`}>
            <div className={`fp-sh ${d ? "fp-sh-d" : "fp-sh-l"}`}>
              <button className="fp-btn-create" onClick={openCreate}>
                <Plus style={{ width: 16, height: 16 }} />
                {t("farms.createBtn", "Создать ферму")}
              </button>
              <div className="fp-sw">
                <Search style={{ width: 14, height: 14, color: sc }} />
                <input
                  className={`fp-search ${d ? "fp-search-d" : "fp-search-l"}`}
                  placeholder={t("farms.search", "Поиск...")}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  maxLength={100}
                />
              </div>
            </div>

            <div className="fp-list">
              {loading ? (
                <div style={{ textAlign: "center", padding: "32px 16px" }}>
                  <Loader2 style={{ width: 24, height: 24, color: sc, animation: "spin 1s linear infinite", margin: "0 auto 8px", display: "block" }} />
                  <span style={{ fontSize: 12, color: sc }}>{t("farms.loading", "Загрузка...")}</span>
                </div>
              ) : filtered.length === 0 ? (
                <div style={{ textAlign: "center", padding: "28px 14px" }}>
                  <Home style={{ width: 36, height: 36, color: sc, margin: "0 auto 8px", display: "block" }} />
                  <p style={{ fontSize: 13, fontWeight: 600, color: tc, margin: "0 0 4px" }}>
                    {search ? t("farms.notFound", "Не найдено") : t("farms.noFarms", "Нет ферм")}
                  </p>
                  <p style={{ fontSize: 12, color: sc, margin: 0 }}>
                    {search ? t("farms.tryOther", "Попробуйте другой запрос") : t("farms.createHint", "Нажмите «Создать ферму» и обозначьте границы на карте")}
                  </p>
                </div>
              ) : filtered.map((farm) => (
                <div
                  key={farm.id}
                  className={`fp-card ${d ? "fp-card-d" : "fp-card-l"}${activeFarm?.id === farm.id ? " active" : ""}`}
                  onClick={() => setActiveFarm(farm)}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: farm.color, flexShrink: 0, marginTop: 4 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 13, color: tc, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{farm.name}</div>
                      {farm.region && <div style={{ fontSize: 11, color: sc, marginTop: 2, display: "flex", alignItems: "center", gap: 3 }}><MapPin style={{ width: 10, height: 10 }} />{farm.region}</div>}
                      {farm.farm_type && <div style={{ fontSize: 11, color: sc, marginTop: 1 }}>{farmTypeOptions.find((ft) => ft.value === farm.farm_type)?.label || farm.farm_type}</div>}
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <span className="fp-ha" style={{ color: farm.color, fontSize: 18 }}>{farm.area_ha || farm.area || 0}</span>
                      <span style={{ fontSize: 10, color: sc, marginLeft: 2 }}>га</span>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 4, marginTop: 8, justifyContent: "flex-end" }}>
                    {[
                      { icon: Eye,   fn: (e) => { e.stopPropagation(); setActiveFarm(farm); setModal("view"); setMobileTab("map"); }, title: t("farms.action.view", "Просмотр") },
                      { icon: Edit3, fn: (e) => { e.stopPropagation(); handleEdit(farm); },                    title: t("farms.action.edit", "Изменить") },
                      { icon: Trash2,fn: (e) => { e.stopPropagation(); handleDelete(farm.id); },              title: t("farms.action.delete", "Удалить"), red: true },
                    ].map(({ icon: Icon, fn, title, red }) => (
                      <button key={title} className={`fp-iBtn ${d ? "fp-iBtn-d" : "fp-iBtn-l"}`} onClick={fn} title={title}>
                        <Icon style={{ width: 13, height: 13, color: red ? "#f87171" : sc }} />
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {farms.length > 0 && (
              <div className="fp-stats-strip" style={{ borderTopColor: d ? "rgba(255,255,255,.07)" : "rgba(34,197,94,.1)", borderTopStyle: "solid" }}>
                {[
                  { v: farms.length,                                  l: t("farms.stat.farmsShort", "Ферм")    },
                  { v: totalHa.toFixed(1),                            l: t("farms.stat.haShort",    "Га")      },
                  { v: farms.filter((f) => f.status === "active").length, l: t("farms.stat.active","Активных") },
                ].map((s) => (
                  <div key={s.l} className="fp-stat-item" style={{ borderColor: d ? "rgba(255,255,255,.07)" : "rgba(34,197,94,.1)" }}>
                    <div style={{ fontSize: 18, fontWeight: 800, fontFamily: "'Syne',sans-serif", color: d ? "#4ade80" : "#16a34a" }}>{s.v}</div>
                    <div style={{ fontSize: 10, color: sc }}>{s.l}</div>
                  </div>
                ))}
              </div>
            )}
          </aside>

          {/* Main map (read-only) */}
          <div className={`fp-map-area${mobileTab !== "map" ? " fp-panel-hidden" : ""}`}>
            <FarmMap
              farms={farms}
              activeFarm={activeFarm}
              onFarmSelect={(f) => { setActiveFarm(f); setModal("view"); setMobileTab("map"); }}
              height="100%"
            />
          </div>
        </div>

        {/* ════════ CREATE / EDIT MODAL ════════ */}
        {modal === "create" && (
          <div className="fp-ov" onClick={(e) => e.target === e.currentTarget && closeCreateModal()}>
            <div className={`fp-create-modal ${d ? "fp-create-modal-d" : "fp-create-modal-l"}`}>

              {/* LEFT — FORM */}
              <div className={`fp-form-panel ${d ? "fp-form-panel-d" : "fp-form-panel-l"}`}>
                {/* Header */}
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
                  <div>
                    <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: 20, fontWeight: 800, color: tc, margin: "0 0 4px" }}>
                      {editId ? t("farms.modal.editTitle", "Редактировать ферму") : t("farms.modal.createTitle", "Новая ферма")}
                    </h2>
                    <p style={{ fontSize: 12, color: sc, margin: 0 }}>
                      {editId
                        ? t("farms.modal.editHint", "Измените данные и перерисуйте границы при необходимости")
                        : t("farms.modal.createHint", "Заполните данные и нарисуйте границы на карте →")}
                    </p>
                  </div>
                  <button
                    onClick={closeCreateModal}
                    style={{ background: d ? "rgba(255,255,255,.08)" : "rgba(20,55,20,.06)", border: "none", cursor: "pointer", width: 30, height: 30, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
                  >
                    <X style={{ width: 14, height: 14, color: sc }} />
                  </button>
                </div>

                {apiError && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", borderRadius: 10, marginBottom: 14, background: "rgba(239,68,68,.1)", border: "1px solid rgba(239,68,68,.2)", color: "#f87171" }}>
                    <AlertCircle style={{ width: 14, height: 14, flexShrink: 0 }} />
                    <span style={{ fontWeight: 600, fontSize: 13 }}>{apiError}</span>
                  </div>
                )}

                {/* SECTION: Основное */}
                {!editId && (
                  <div className={`fp-reference ${d ? "fp-reference-d" : "fp-reference-l"}`}>
                    <div className="fp-reference-head">
                      <div className="fp-reference-title" style={{ color: tc }}>
                        <Building2 style={{ width: 14, height: 14, color: d ? "#4ade80" : "#16a34a" }} />
                        {t("farms.reference.currentTitle", "Уже созданные фермы")}
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 800, color: d ? "#4ade80" : "#16a34a" }}>
                        {farms.length}
                      </span>
                    </div>
                    {farms.length > 0 ? (
                      <div className="fp-reference-list">
                        {farms.slice(0, 6).map((farm) => {
                          const area = Number(farm.area_ha || farm.area || 0);
                          return (
                            <div key={farm.id} className={`fp-reference-item ${d ? "fp-reference-item-d" : "fp-reference-item-l"}`}>
                              <span className="fp-reference-dot" style={{ background: farm.color || "#22c55e" }} />
                              <div style={{ minWidth: 0, flex: 1 }}>
                                <div style={{ fontSize: 13, fontWeight: 700, color: tc, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                  {farm.name}
                                </div>
                                <div style={{ fontSize: 11, color: sc, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                  {farm.region || farm.address || t("farms.reference.noLocation", "Место не указано")} · {Number.isFinite(area) ? area.toFixed(1) : "0.0"} {t("farms.units.hectaresShort", "га")}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="fp-reference-empty" style={{ color: sc }}>
                        {t("farms.reference.empty", "Ферм пока нет. Эта ферма будет первой в списке.")}
                      </div>
                    )}
                  </div>
                )}

                <div className={`fp-section ${d ? "fp-section-d" : "fp-section-l"}`}>
                  <Home style={{ width: 13, height: 13 }} />
                  {t("farms.section.basic", "Основное")}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
                  <div style={{ gridColumn: "1/-1" }}>
                    <label className={`fp-lbl ${d ? "fp-lbl-d" : "fp-lbl-l"}`}>{t("farms.field.name", "Название")} *</label>
                    <input
                      className={`fp-inp fp-inp-${d ? "d" : "l"}${formErrors.name ? " fp-inp-error" : ""}`}
                      placeholder={t("farms.placeholder.name", "Ферма Жасыл Дала")}
                      value={form.name}
                      onChange={(e) => setF("name", e.target.value)}
                      maxLength={120}
                      aria-invalid={!!formErrors.name}
                    />
                    {formErrors.name && <div className="fp-field-error"><AlertCircle style={{ width: 12, height: 12 }} />{formErrors.name}</div>}
                  </div>
                  <div style={{ gridColumn: "1/-1" }}>
                    <label className={`fp-lbl ${d ? "fp-lbl-d" : "fp-lbl-l"}`}>
                      <MapPin style={{ width: 11, height: 11 }} />
                      {t("farms.field.region", "Регион")} *
                    </label>
                    <div className={formErrors.region ? "fp-select-error" : ""} style={{ borderRadius: 11 }}>
                    <StyledSelect
                      isDark={d}
                      value={form.region}
                      onChange={handleRegionChange}
                      options={REGIONS}
                      placeholder={t("farms.placeholder.region", "Выберите регион")}
                    />
                    </div>
                    {formErrors.region && <div className="fp-field-error"><AlertCircle style={{ width: 12, height: 12 }} />{formErrors.region}</div>}
                  </div>
                  <div>
                    <label className={`fp-lbl ${d ? "fp-lbl-d" : "fp-lbl-l"}`}>{t("farms.field.farmType", "Тип хозяйства")}</label>
                    <StyledSelect
                      isDark={d}
                      value={form.farm_type}
                      onChange={(v) => setF("farm_type", v)}
                      options={farmTypeOptions}
                      placeholder={t("farms.placeholder.farmType", "Выберите тип")}
                    />
                  </div>
                  <div>
                    <label className={`fp-lbl ${d ? "fp-lbl-d" : "fp-lbl-l"}`}>{t("farms.field.status", "Статус")}</label>
                    <StyledSelect
                      isDark={d}
                      value={form.status}
                      onChange={(v) => setF("status", v)}
                      options={statusOptions}
                      placeholder={t("farms.placeholder.status", "Статус")}
                    />
                  </div>
                  <div style={{ gridColumn: "1/-1" }}>
                    <label className={`fp-lbl ${d ? "fp-lbl-d" : "fp-lbl-l"}`}>
                      <Calendar style={{ width: 11, height: 11 }} />
                      {t("farms.field.established", "Дата основания")}
                    </label>
                    <input
                      className={`fp-inp fp-inp-${d ? "d" : "l"}`}
                      type="date"
                      value={form.established_date}
                      onChange={(e) => setF("established_date", e.target.value)}
                    />
                  </div>
                </div>

                {/* SECTION: Адрес */}
                <div className={`fp-div ${d ? "fp-div-d" : "fp-div-l"}`} />
                <div className={`fp-section ${d ? "fp-section-d" : "fp-section-l"}`}>
                  <MapPin style={{ width: 13, height: 13 }} />
                  {t("farms.section.address", "Адрес и описание")}
                </div>
                <div style={{ marginBottom: 10 }}>
                  <input
                    className={`fp-inp fp-inp-${d ? "d" : "l"}`}
                    placeholder={t("farms.placeholder.address", "Область, район, село...")}
                    value={form.address}
                    onChange={(e) => {
                      addressEditedRef.current = true;
                      setF("address", e.target.value);
                    }}
                    maxLength={200}
                  />
                </div>
                <div style={{ marginBottom: 14 }}>
                  <textarea
                    className={`fp-inp fp-inp-${d ? "d" : "l"}`}
                    rows={2}
                    placeholder={t("farms.placeholder.description", "Краткое описание...")}
                    value={form.description}
                    onChange={(e) => setF("description", e.target.value)}
                    style={{ resize: "vertical" }}
                    maxLength={500}
                  />
                </div>

                {/* SECTION: Владелец — auto-filled from user, editable */}
                <div className={`fp-div ${d ? "fp-div-d" : "fp-div-l"}`} />
                <div className={`fp-section ${d ? "fp-section-d" : "fp-section-l"}`}>
                  <User style={{ width: 13, height: 13 }} />
                  {t("farms.section.owner", "Владелец")}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
                  <div style={{ gridColumn: "1/-1" }}>
                    <label className={`fp-lbl ${d ? "fp-lbl-d" : "fp-lbl-l"}`}>{t("farms.field.ownerName", "ФИО")}</label>
                    <input
                      className={`fp-inp fp-inp-${d ? "d" : "l"}`}
                      placeholder={t("farms.placeholder.ownerName", "Иванов Иван Иванович")}
                      value={form.owner_name}
                      onChange={(e) => setF("owner_name", e.target.value)}
                      maxLength={120}
                    />
                  </div>
                  <div style={{ gridColumn: "1/-1" }}>
                    <label className={`fp-lbl ${d ? "fp-lbl-d" : "fp-lbl-l"}`}>
                      <Phone style={{ width: 11, height: 11 }} />
                      {t("farms.field.phone", "Телефон")}
                    </label>
                    <input
                      className={`fp-inp fp-inp-${d ? "d" : "l"}${formErrors.phone ? " fp-inp-error" : ""}`}
                      type="tel"
                      placeholder="+7 (777) 123-45-67"
                      value={form.phone}
                      onChange={(e) => setF("phone", e.target.value)}
                      maxLength={20}
                      aria-invalid={!!formErrors.phone}
                    />
                    {formErrors.phone && <div className="fp-field-error"><AlertCircle style={{ width: 12, height: 12 }} />{formErrors.phone}</div>}
                  </div>
                </div>

                {/* SECTION: Культуры / Техника */}
                <div className={`fp-div ${d ? "fp-div-d" : "fp-div-l"}`} />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
                  {/* Crops */}
                  <div>
                    <div className={`fp-section ${d ? "fp-section-d" : "fp-section-l"}`}>
                      <Wheat style={{ width: 13, height: 13 }} />
                      {t("farms.section.crops", "Культуры")}
                    </div>
                    <div style={{ display: "flex", gap: 4, marginBottom: 6, flexWrap: "wrap" }}>
                      {form.crops.map((c, i) => (
                        <span key={i} className={`fp-tag ${d ? "fp-tag-d" : "fp-tag-l"}`}>
                          {c}
                          <button onClick={() => removeTag("crops", i)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: "inherit", marginLeft: 2, display: "flex" }}>
                            <X style={{ width: 10, height: 10 }} />
                          </button>
                        </span>
                      ))}
                    </div>
                    <div style={{ display: "flex", gap: 4 }}>
                      <input
                        className={`fp-inp fp-inp-${d ? "d" : "l"}`}
                        style={{ flex: 1, padding: "8px 10px", fontSize: 12 }}
                        placeholder={t("farms.placeholder.addCrop", "Добавить...")}
                        value={cropInput}
                        onChange={(e) => setCropInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && addTag("crops", cropInput, setCropInput)}
                        maxLength={60}
                      />
                      <button onClick={() => addTag("crops", cropInput, setCropInput)} style={{ padding: "8px 12px", borderRadius: 10, border: "none", cursor: "pointer", background: "rgba(74,222,128,.15)", color: "#4ade80", fontSize: 12 }}>+</button>
                    </div>
                  </div>
                  {/* Equipment */}
                  <div>
                    <div className={`fp-section ${d ? "fp-section-d" : "fp-section-l"}`}>
                      <Tractor style={{ width: 13, height: 13 }} />
                      {t("farms.section.equipment", "Техника")}
                    </div>
                    <div style={{ display: "flex", gap: 4, marginBottom: 6, flexWrap: "wrap" }}>
                      {form.equipment.map((e, i) => (
                        <span key={i} className={`fp-tag ${d ? "fp-tag-d" : "fp-tag-l"}`} style={{ background: d ? "rgba(34,211,238,.1)" : "rgba(8,145,178,.08)", color: d ? "#22d3ee" : "#0891b2", borderColor: d ? "rgba(34,211,238,.2)" : "rgba(8,145,178,.2)" }}>
                          {e}
                          <button onClick={() => removeTag("equipment", i)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: "inherit", marginLeft: 2, display: "flex" }}>
                            <X style={{ width: 10, height: 10 }} />
                          </button>
                        </span>
                      ))}
                    </div>
                    <div style={{ display: "flex", gap: 4 }}>
                      <input
                        className={`fp-inp fp-inp-${d ? "d" : "l"}`}
                        style={{ flex: 1, padding: "8px 10px", fontSize: 12 }}
                        placeholder={t("farms.placeholder.addEquipment", "Добавить...")}
                        value={equipInput}
                        onChange={(e) => setEquipInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && addTag("equipment", equipInput, setEquipInput)}
                        maxLength={60}
                      />
                      <button onClick={() => addTag("equipment", equipInput, setEquipInput)} style={{ padding: "8px 12px", borderRadius: 10, border: "none", cursor: "pointer", background: "rgba(34,211,238,.12)", color: "#22d3ee", fontSize: 12 }}>+</button>
                    </div>
                  </div>
                </div>

                {/* Color */}
                <div className={`fp-div ${d ? "fp-div-d" : "fp-div-l"}`} />
                <label className={`fp-lbl ${d ? "fp-lbl-d" : "fp-lbl-l"}`} style={{ marginBottom: 8 }}>
                  {t("farms.field.color", "Цвет на карте")}
                </label>
                <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 20 }}>
                  {FARM_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      className={`fp-swatch${form.color === c ? " sel" : ""}`}
                      style={{ background: c }}
                      onClick={() => setF("color", c)}
                    />
                  ))}
                </div>

                {/* Actions */}
                <div style={{ display: "flex", gap: 10, marginTop: "auto" }}>
                  <button className={`fp-cancel fp-cancel-${d ? "d" : "l"}`} onClick={closeCreateModal}>
                    {t("common.cancel", "Отмена")}
                  </button>
                  <button className="fp-save" style={{ flex: 1 }} onClick={handleSave} disabled={submitting}>
                    {submitting
                      ? <><Loader2 style={{ width: 14, height: 14, animation: "spin 1s linear infinite" }} /> {t("common.saving", "Сохранение...")}</>
                      : <><Save style={{ width: 14, height: 14 }} />{editId ? t("farms.action.saveEdit", "Сохранить изменения") : t("farms.action.addFarm", "Добавить ферму")}</>
                    }
                  </button>
                </div>
              </div>

              {/* RIGHT — MAP */}
              <div className={`fp-map-panel ${d ? "fp-map-panel-d" : "fp-map-panel-l"}`}>
                {/* Toolbar */}
                <div className={`fp-map-toolbar ${d ? "fp-map-toolbar-d" : "fp-map-toolbar-l"}`}>
                  <Map style={{ width: 14, height: 14, color: sc, flexShrink: 0 }} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: sc }}>
                    {t("farms.map.drawHint", "Кликайте для обозначения границ")}
                  </span>

                  {/* Undo */}
                  <button
                    className={`fp-tb-btn ${d ? "fp-tb-btn-d" : "fp-tb-btn-l"}`}
                    onClick={() => drawMapRef.current?.undo()}
                    disabled={pointCount === 0}
                    title={t("farms.map.undo", "Отменить точку")}
                  >
                    <Undo2 style={{ width: 13, height: 13 }} />
                    <span className="fp-tb-hide-xs">{t("farms.map.undo", "Отменить")}</span>
                  </button>

                  {/* Redo */}
                  <button
                    className={`fp-tb-btn ${d ? "fp-tb-btn-d" : "fp-tb-btn-l"}`}
                    onClick={() => drawMapRef.current?.redo()}
                    title={t("farms.map.redo", "Вернуть точку")}
                  >
                    <Redo2 style={{ width: 13, height: 13 }} />
                    <span className="fp-tb-hide-xs">{t("farms.map.redo", "Вернуть")}</span>
                  </button>

                  {/* Reset */}
                  <button
                    className={`fp-tb-btn fp-tb-btn-danger`}
                    onClick={() => { drawMapRef.current?.reset(); setDrawnCoords(null); setPointCount(0); }}
                    disabled={pointCount === 0}
                    title={t("farms.map.clear", "Очистить контур")}
                  >
                    <RotateCcw style={{ width: 13, height: 13 }} />
                    <span className="fp-tb-hide-xs">{t("farms.map.clear", "Очистить")}</span>
                  </button>

                  {/* Ha badge */}
                  <div className={`fp-ha-badge${computedHa ? " has-poly" : ""}${formErrors.coordinates ? " has-error" : ""}`}>
                    {computedHa ? (
                      <><CheckCircle2 style={{ width: 13, height: 13 }} />{computedHa} га</>
                    ) : (
                      <><MousePointer style={{ width: 13, height: 13, opacity: .6 }} /><span style={{ opacity: .65 }}>{t("farms.map.noBounds", "Нет границ")}</span></>
                    )}
                  </div>
                </div>

                {formErrors.coordinates && (
                  <div className="fp-map-field-error">
                    <AlertCircle style={{ width: 14, height: 14, flexShrink: 0, marginTop: 1 }} />
                    <span>{formErrors.coordinates}</span>
                  </div>
                )}

                {/* Map */}
                <div className="fp-map-search-wrap">
                  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />

                  {/* MapSearch: позиционирован absolute внутри fp-map-search-wrap */}
                  <MapSearch
                    isDark={d}
                    placeholder={t("farms.map.searchPlace", "Найти место на карте...")}
                    onSelect={(item) => {
                      setSearchFlyTo({ latlng: [item.lat, item.lng], zoom: 14, ts: Date.now() });
                    }}
                  />

                  {/* Inner map container */}
                  <div className="fp-map-panel-inner">
                    <ModalDrawMap
                      key={mapKey}
                      ref={drawMapRef}
                      coords={drawnCoords}
                      onCoordsChange={handleCoordsChange}
                      onPointCountChange={handlePointCount}
                      existingFarms={farms}
                      editingFarmId={editId}
                      flyTo={searchFlyTo || flyTo}
                    />
                    {/* Hint overlay */}
                    <div className="fp-draw-hint">
                      <MousePointer style={{ width: 13, height: 13 }} />
                      {t("farms.map.clickHint", "Клик — добавить точку")}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ════════ VIEW MODAL ════════ */}
        {modal === "view" && activeFarm && (
          <div className="fp-ov" onClick={(e) => e.target === e.currentTarget && setModal(null)}>
            <div className={`fp-modal ${d ? "fp-modal-d" : "fp-modal-l"}`}>
              <div style={{ height: 4, background: activeFarm.color, margin: "-28px -28px 22px", borderRadius: "22px 22px 0 0" }} />
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, marginBottom: 18 }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: activeFarm.color }} />
                    <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: activeFarm.color }}>{t("farms.label.farm","Ферма")}</span>
                  </div>
                  <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: 22, fontWeight: 800, color: tc, margin: "0 0 4px" }}>{activeFarm.name}</h2>
                  {activeFarm.region && <p style={{ margin: 0, fontSize: 13, color: sc, display: "flex", alignItems: "center", gap: 4 }}><MapPin style={{ width: 12, height: 12 }} />{activeFarm.region}</p>}
                </div>
                <button onClick={() => setModal(null)} style={{ background: d ? "rgba(255,255,255,.08)" : "rgba(20,55,20,.06)", border: "none", cursor: "pointer", width: 30, height: 30, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <X style={{ width: 14, height: 14, color: sc }} />
                </button>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
                {[
                  { val: `${activeFarm.area_ha || activeFarm.area || 0} га`,                                                             lbl: t("farms.field.area",     "Площадь") },
                  { val: farmTypeOptions.find((ft) => ft.value === activeFarm.farm_type)?.label || activeFarm.farm_type || "—",          lbl: t("farms.field.farmType", "Тип")     },
                  { val: statusOptions.find((s) => s.value === activeFarm.status)?.label         || activeFarm.status   || "—",          lbl: t("farms.field.status",   "Статус")  },
                  { val: activeFarm.phone      || "—",                                                                                    lbl: t("farms.field.phone",    "Телефон") },
                  { val: activeFarm.owner_name || "—",                                                                                    lbl: t("farms.field.ownerName","Владелец")},
                ].map(({ val, lbl }) => (
                  <div key={lbl} style={{ padding: "10px 12px", borderRadius: 12, background: d ? "rgba(255,255,255,.04)" : "#f4faf5", border: `1px solid ${d ? "rgba(255,255,255,.07)" : "rgba(34,197,94,.1)"}` }}>
                    <div style={{ fontSize: 10, color: sc, marginBottom: 2 }}>{lbl}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: tc, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{val}</div>
                  </div>
                ))}
              </div>

              {activeFarm.address && (
                <div style={{ padding: "10px 12px", borderRadius: 12, marginBottom: 12, background: d ? "rgba(255,255,255,.03)" : "#f0faf2", border: `1px solid ${d ? "rgba(255,255,255,.06)" : "rgba(34,197,94,.1)"}`, fontSize: 13, color: sc }}>
                  <MapPin style={{ width: 12, height: 12, display: "inline", marginRight: 4 }} />{activeFarm.address}
                </div>
              )}
              {activeFarm.description && (
                <div style={{ padding: "10px 12px", borderRadius: 12, marginBottom: 12, background: d ? "rgba(255,255,255,.03)" : "#f0faf2", border: `1px solid ${d ? "rgba(255,255,255,.06)" : "rgba(34,197,94,.1)"}`, fontSize: 13, color: sc, lineHeight: 1.6 }}>
                  {activeFarm.description}
                </div>
              )}

              {(activeFarm.crops?.length > 0 || activeFarm.equipment?.length > 0) && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
                  {activeFarm.crops?.length > 0 && (
                    <div>
                      <div style={{ fontSize: 11, color: sc, marginBottom: 6 }}>{t("farms.section.crops","Культуры")}</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                        {activeFarm.crops.map((c, i) => <span key={i} className={`fp-tag ${d ? "fp-tag-d" : "fp-tag-l"}`}>{c}</span>)}
                      </div>
                    </div>
                  )}
                  {activeFarm.equipment?.length > 0 && (
                    <div>
                      <div style={{ fontSize: 11, color: sc, marginBottom: 6 }}>{t("farms.section.equipment","Техника")}</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                        {activeFarm.equipment.map((e, i) => <span key={i} className={`fp-tag ${d ? "fp-tag-d" : "fp-tag-l"}`} style={{ background: d ? "rgba(34,211,238,.1)" : "rgba(8,145,178,.08)", color: d ? "#22d3ee" : "#0891b2" }}>{e}</span>)}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                <button onClick={() => handleEdit(activeFarm)} className="fp-save" style={{ flex: 1, background: `linear-gradient(135deg,${activeFarm.color},${activeFarm.color}bb)` }}>
                  <Edit3 style={{ width: 14, height: 14 }} /> {t("farms.action.edit","Редактировать")}
                </button>
                <button onClick={() => handleDelete(activeFarm.id)} style={{ padding: "12px 16px", borderRadius: 12, border: "none", cursor: "pointer", background: "rgba(239,68,68,.1)", color: "#f87171", display: "flex", alignItems: "center", gap: 6, fontSize: 14, fontWeight: 600, fontFamily: "'DM Sans',sans-serif" }}>
                  <Trash2 style={{ width: 14, height: 14 }} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
