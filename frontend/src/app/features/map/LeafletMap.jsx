// src/app/features/map/LeafletMap.jsx

// Enhanced with polygon drawing for Farms and Pastures

"use client";

import { useEffect, useRef, useState, useCallback } from "react";

import { MapPin, Crosshair, ZoomIn, ZoomOut, PenLine, Square, Trash2, Save, X, ChevronDown } from "lucide-react";

/**

 * LeafletMap — интерактивная карта с поддержкой рисования полигонов.

 *

 * Props:

 *  center           [lat, lng]          — начальный центр карты

 *  zoom             number              — начальный зум

 *  markers          Array               — точечные маркеры { lat, lng, title, description, type }

 *  polygons         Array               — полигоны для отображения { id, name, type, coordinates, color, farmId? }

 *  onLocationSelect function            — колбэк при клике на карту (selectable mode)

 *  onPolygonCreate  function(polygon)   — колбэк при создании нового полигона

 *  onPolygonDelete  function(id)        — колбэк при удалении полигона

 *  selectable       boolean             — режим выбора одной точки

 *  drawMode         'farm'|'pasture'|null — режим рисования полигона

 *  activeFarmId     string|null         — ID фермы, к которой привязывается пастбище

 *  className        string

 *  height           string

 */

export default function LeafletMap({

  center = [51.1605, 71.4704],

  zoom = 10,

  markers = [],

  polygons = [],

  onLocationSelect,

  onPolygonCreate,

  onPolygonDelete,

  selectable = false,

  drawMode = null,

  activeFarmId = null,

  className = "",

  height = "400px",

}) {

  const mapRef = useRef(null);

  const mapInstanceRef = useRef(null);

  const markersRef = useRef([]);

  const polygonsRef = useRef([]);

  const selectedMarkerRef = useRef(null);

  const drawnPointsRef = useRef([]);

  const drawnLineRef = useRef(null);

  const drawnPolygonRef = useRef(null);

  const tempMarkersRef = useRef([]);

  const [isLoaded, setIsLoaded] = useState(false);

  const [L, setL] = useState(null);

  const [isDrawing, setIsDrawing] = useState(false);

  const [drawPoints, setDrawPoints] = useState([]);

  const [hoveredPolygon, setHoveredPolygon] = useState(null);

  // ─── Load Leaflet ────────────────────────────────────────────────────────────

  useEffect(() => {

    const loadLeaflet = async () => {

      const leaflet = await import("leaflet");

      const lf = leaflet.default;

      setL(lf);

      if (!document.querySelector('link[href*="leaflet.css"]')) {

        const link = document.createElement("link");

        link.rel = "stylesheet";

        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";

        document.head.appendChild(link);

      }

      delete lf.Icon.Default.prototype._getIconUrl;

      lf.Icon.Default.mergeOptions({

        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",

        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",

        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",

      });

      setIsLoaded(true);

    };

    loadLeaflet();

  }, []);

  // ─── Init map ────────────────────────────────────────────────────────────────

  useEffect(() => {

    if (!isLoaded || !L || !mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current, {

      zoomControl: false,

      attributionControl: true,

    }).setView(center, zoom);

    // Satellite / Hybrid tile from Esri

    L.tileLayer(

      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",

      {

        attribution: "Tiles &copy; Esri",

        maxZoom: 19,

      }

    ).addTo(map);

    // Labels overlay (roads, names)

    L.tileLayer(

      "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",

      {

        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',

        maxZoom: 19,

        opacity: 0.35,

      }

    ).addTo(map);

    mapInstanceRef.current = map;

    return () => {

      if (mapInstanceRef.current) {

        mapInstanceRef.current.remove();

        mapInstanceRef.current = null;

      }

    };

    // eslint-disable-next-line react-hooks/exhaustive-deps

  }, [isLoaded, L]);

  // ─── Polygon drawing logic ───────────────────────────────────────────────────

  const POLYGON_COLORS = {

    farm: { fill: "#22c55e", stroke: "#15803d", fillOpacity: 0.18 },

    pasture: { fill: "#f59e0b", stroke: "#b45309", fillOpacity: 0.28 },

  };

  const startDrawing = useCallback(() => {

    if (!mapInstanceRef.current || !L || !drawMode) return;

    setIsDrawing(true);

    drawnPointsRef.current = [];

    setDrawPoints([]);

    mapInstanceRef.current.getContainer().style.cursor = "crosshair";

  }, [L, drawMode]);

  const cancelDrawing = useCallback(() => {

    setIsDrawing(false);

    drawnPointsRef.current = [];

    setDrawPoints([]);

    if (mapInstanceRef.current) {

      mapInstanceRef.current.getContainer().style.cursor = "";

    }

    // Remove temp visual

    if (drawnLineRef.current) {

      mapInstanceRef.current?.removeLayer(drawnLineRef.current);

      drawnLineRef.current = null;

    }

    if (drawnPolygonRef.current) {

      mapInstanceRef.current?.removeLayer(drawnPolygonRef.current);

      drawnPolygonRef.current = null;

    }

    tempMarkersRef.current.forEach((m) => mapInstanceRef.current?.removeLayer(m));

    tempMarkersRef.current = [];

  }, []);

  const finishDrawing = useCallback(() => {

    const pts = drawnPointsRef.current;

    if (pts.length < 3) {

      alert("Минимум 3 точки для полигона");

      return;

    }

    const name = prompt(

      drawMode === "farm"

        ? "Название фермы:"

        : "Название пастбища:"

    );

    if (!name) return;

    const newPolygon = {

      id: `${drawMode}-${Date.now()}`,

      name,

      type: drawMode,

      farmId: drawMode === "pasture" ? activeFarmId : null,

      coordinates: pts.map((p) => ({ lat: p.lat, lng: p.lng })),

      color: POLYGON_COLORS[drawMode]?.fill,

    };

    if (onPolygonCreate) onPolygonCreate(newPolygon);

    cancelDrawing();

  }, [drawMode, activeFarmId, onPolygonCreate, cancelDrawing]);

  // Map click handler for drawing

  useEffect(() => {

    const map = mapInstanceRef.current;

    if (!map || !L || !isDrawing) return;

    const onClick = (e) => {

      const { lat, lng } = e.latlng;

      drawnPointsRef.current = [...drawnPointsRef.current, { lat, lng }];

      setDrawPoints([...drawnPointsRef.current]);

      // Vertex dot

      const dotIcon = L.divIcon({

        className: "",

        html: `<div style="width:10px;height:10px;border-radius:50%;background:#fff;border:2px solid ${

          drawMode === "farm" ? "#22c55e" : "#f59e0b"

        };box-shadow:0 1px 4px rgba(0,0,0,.5)"></div>`,

        iconSize: [10, 10],

        iconAnchor: [5, 5],

      });

      const dot = L.marker([lat, lng], { icon: dotIcon }).addTo(map);

      tempMarkersRef.current.push(dot);

      // Update preview polyline / polygon

      const pts = drawnPointsRef.current.map((p) => [p.lat, p.lng]);

      const colors = POLYGON_COLORS[drawMode];

      if (drawnLineRef.current) map.removeLayer(drawnLineRef.current);

      if (drawnPolygonRef.current) map.removeLayer(drawnPolygonRef.current);

      if (pts.length >= 3) {

        drawnPolygonRef.current = L.polygon(pts, {

          color: colors.stroke,

          fillColor: colors.fill,

          fillOpacity: colors.fillOpacity,

          weight: 2,

          dashArray: "6 4",

        }).addTo(map);

      } else {

        drawnLineRef.current = L.polyline(pts, {

          color: colors.stroke,

          weight: 2,

          dashArray: "6 4",

        }).addTo(map);

      }

    };

    map.on("click", onClick);

    return () => map.off("click", onClick);

  }, [isDrawing, L, drawMode]);

  // Start drawing when drawMode becomes active

  useEffect(() => {

    if (drawMode && mapInstanceRef.current) {

      startDrawing();

    } else {

      cancelDrawing();

    }

    // eslint-disable-next-line react-hooks/exhaustive-deps

  }, [drawMode]);

  // ─── Render polygons from props ──────────────────────────────────────────────

  useEffect(() => {

    const map = mapInstanceRef.current;

    if (!map || !L) return;

    // Clear old

    polygonsRef.current.forEach((layer) => map.removeLayer(layer));

    polygonsRef.current = [];

    polygons.forEach((poly) => {

      if (!poly.coordinates || poly.coordinates.length < 3) return;

      const latlngs = poly.coordinates.map((c) => [c.lat, c.lng]);

      const colors = POLYGON_COLORS[poly.type] || POLYGON_COLORS.pasture;

      const layer = L.polygon(latlngs, {

        color: poly.color ? poly.color + "cc" : colors.stroke,

        fillColor: poly.color || colors.fill,

        fillOpacity: colors.fillOpacity,

        weight: poly.type === "farm" ? 3 : 2,

      }).addTo(map);

      // Tooltip

      layer.bindTooltip(

        `<div style="font-weight:600;font-size:13px">${poly.name}</div>

         <div style="font-size:11px;color:#6b7280">${poly.type === "farm" ? "🏠 Ферма" : "🌿 Пастбище"}</div>`,

        { sticky: true, direction: "top", className: "leaflet-tooltip-custom" }

      );

      layer.on("mouseover", () => setHoveredPolygon(poly));

      layer.on("mouseout", () => setHoveredPolygon(null));

      if (onPolygonDelete) {

        layer.on("contextmenu", (e) => {

          L.DomEvent.stopPropagation(e);

          if (window.confirm(`Удалить "${poly.name}"?`)) {

            onPolygonDelete(poly.id);

          }

        });

      }

      polygonsRef.current.push(layer);

    });

  }, [polygons, L, onPolygonDelete]);

  // ─── Render point markers ────────────────────────────────────────────────────

  useEffect(() => {

    const map = mapInstanceRef.current;

    if (!map || !L) return;

    markersRef.current.forEach((m) => map.removeLayer(m));

    markersRef.current = [];

    markers.forEach(({ lat, lng, title, description, type = "default" }) => {

      const colorMap = {

        farm: ["#22c55e", "#15803d"],

        pasture: ["#f59e0b", "#b45309"],

        drone: ["#3b82f6", "#1d4ed8"],

        biomass: ["#8b5cf6", "#6d28d9"],

        default: ["#22c55e", "#15803d"],

      };

      const [c1, c2] = colorMap[type] || colorMap.default;

      const icon = L.divIcon({

        className: "",

        html: `<div style="background:linear-gradient(135deg,${c1},${c2});width:28px;height:28px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,.3);display:flex;align-items:center;justify-content:center"><div style="width:10px;height:10px;background:white;border-radius:50%;transform:rotate(45deg)"></div></div>`,

        iconSize: [28, 28],

        iconAnchor: [14, 28],

      });

      const marker = L.marker([lat, lng], { icon }).addTo(map);

      if (title || description) {

        marker.bindPopup(

          `<div style="padding:4px 6px"><p style="font-weight:600;margin:0">${title || ""}</p>${

            description ? `<p style="font-size:12px;color:#6b7280;margin:2px 0 0">${description}</p>` : ""

          }</div>`

        );

      }

      markersRef.current.push(marker);

    });

  }, [markers, L]);

  // ─── Selectable click ────────────────────────────────────────────────────────

  useEffect(() => {

    const map = mapInstanceRef.current;

    if (!map || !L || !selectable || isDrawing) return;

    const onClick = (e) => {

      const { lat, lng } = e.latlng;

      if (selectedMarkerRef.current) map.removeLayer(selectedMarkerRef.current);

      const icon = L.divIcon({

        className: "",

        html: `<div style="background:linear-gradient(135deg,#22c55e,#16a34a);width:32px;height:32px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,.3)"><div style="width:12px;height:12px;background:white;border-radius:50%;transform:rotate(45deg);margin:7px auto 0"></div></div>`,

        iconSize: [32, 32],

        iconAnchor: [16, 32],

      });

      const marker = L.marker([lat, lng], { icon }).addTo(map);

      marker.bindPopup(

        `<div style="text-align:center;padding:4px"><b style="color:#15803d">Выбрана точка</b><br><span style="font-size:12px">${lat.toFixed(6)}, ${lng.toFixed(6)}</span></div>`

      ).openPopup();

      selectedMarkerRef.current = marker;

      onLocationSelect?.({ lat, lng });

    };

    map.on("click", onClick);

    return () => map.off("click", onClick);

  }, [selectable, isDrawing, L, onLocationSelect]);

  // ─── Map controls ────────────────────────────────────────────────────────────

  const handleZoomIn = () => mapInstanceRef.current?.zoomIn();

  const handleZoomOut = () => mapInstanceRef.current?.zoomOut();

  const handleLocate = () => {

    if (!mapInstanceRef.current || !navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(

      ({ coords }) => mapInstanceRef.current.setView([coords.latitude, coords.longitude], 14),

      (err) => console.error("Geolocation error:", err)

    );

  };

  // ─── UI ──────────────────────────────────────────────────────────────────────

  return (

    <div className={`relative ${className}`} style={{ height }}>

      {/* Map container */}

      <div ref={mapRef} className="w-full h-full rounded-xl" />

      {/* Loading overlay */}

      {!isLoaded && (

        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-xl z-10">

          <div className="flex flex-col items-center gap-3">

            <div className="w-8 h-8 border-3 border-green-500 border-t-transparent rounded-full animate-spin" />

            <span className="text-sm text-gray-500">Загрузка карты…</span>

          </div>

        </div>

      )}

      {/* Draw mode banner */}

      {isDrawing && (

        <div

          className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000] flex items-center gap-3 px-4 py-2 rounded-full shadow-lg text-sm font-medium text-white"

          style={{

            background: drawMode === "farm"

              ? "linear-gradient(90deg,#16a34a,#15803d)"

              : "linear-gradient(90deg,#d97706,#b45309)",

          }}

        >

          <PenLine className="w-4 h-4" />

          {drawMode === "farm" ? "🏠 Рисуем ферму" : "🌿 Рисуем пастбище"} — кликайте по карте

          <span className="opacity-70 mx-1">|</span>

          <button onClick={finishDrawing} className="flex items-center gap-1 bg-white/20 rounded-full px-2 py-0.5 hover:bg-white/30">

            <Save className="w-3 h-3" /> Готово

          </button>

          <button onClick={cancelDrawing} className="flex items-center gap-1 bg-white/20 rounded-full px-2 py-0.5 hover:bg-white/30">

            <X className="w-3 h-3" /> Отмена

          </button>

        </div>

      )}

      {/* Drawing status */}

      {isDrawing && drawPoints.length > 0 && (

        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-[1000] bg-black/70 text-white text-xs px-3 py-1.5 rounded-full">

          {drawPoints.length} точек{drawPoints.length < 3 ? ` (нужно ещё ${3 - drawPoints.length})` : " — нажмите «Готово»"}

        </div>

      )}

      {/* Hovered polygon tooltip */}

      {hoveredPolygon && !isDrawing && (

        <div className="absolute bottom-12 left-3 z-[999] bg-white/95 backdrop-blur-sm rounded-lg shadow-lg px-3 py-2 border border-gray-100 pointer-events-none">

          <div className="font-semibold text-sm text-gray-800">{hoveredPolygon.name}</div>

          <div className="text-xs text-gray-500">

            {hoveredPolygon.type === "farm" ? "🏠 Ферма" : "🌿 Пастбище"}

          </div>

        </div>

      )}

      {/* Custom zoom controls */}

      <div className="absolute right-3 bottom-12 z-[1000] flex flex-col gap-1">

        <button

          onClick={handleZoomIn}

          className="w-9 h-9 bg-white/90 backdrop-blur-sm rounded-lg shadow-md flex items-center justify-center hover:bg-white transition-colors border border-gray-200"

        >

          <ZoomIn className="w-4 h-4 text-gray-700" />

        </button>

        <button

          onClick={handleZoomOut}

          className="w-9 h-9 bg-white/90 backdrop-blur-sm rounded-lg shadow-md flex items-center justify-center hover:bg-white transition-colors border border-gray-200"

        >

          <ZoomOut className="w-4 h-4 text-gray-700" />

        </button>

        <button

          onClick={handleLocate}

          className="w-9 h-9 bg-white/90 backdrop-blur-sm rounded-lg shadow-md flex items-center justify-center hover:bg-white transition-colors border border-gray-200"

        >

          <Crosshair className="w-4 h-4 text-gray-700" />

        </button>

      </div>

    </div>

  );

}