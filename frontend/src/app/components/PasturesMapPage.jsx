// src/app/components/PasturesMapPage.jsx
// Карта с управлением фермами и пастбищами через полигоны

import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "react-i18next";
import Header from "@/app/components/Header";
import LeafletMap from "@/app/features/map/LeafletMap";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import {
  Map,
  Layers,
  Search,
  Wheat,
  LandPlot,
  Eye,
  Leaf,
  BarChart3,
  RefreshCw,
  Download,
  Maximize2,
  ChevronRight,
  ChevronDown,
  X,
  Plus,
  Trash2,
  Home,
  TreePine,
  PenLine,
  Info,
} from "lucide-react";

// ─── Утилита: случайный цвет ───────────────────────────────────────────────────
const FARM_COLORS = [
  "#16a34a", "#0891b2", "#7c3aed", "#db2777", "#ea580c",
  "#65a30d", "#0284c7", "#9333ea", "#e11d48", "#c2410c",
];
let colorIdx = 0;
const nextFarmColor = () => FARM_COLORS[colorIdx++ % FARM_COLORS.length];

// ─── Начальные демо-данные ─────────────────────────────────────────────────────
const DEMO_FARMS = [
  {
    id: "farm-1",
    name: "Ферма «Алтын»",
    color: "#16a34a",
    coordinates: [
      { lat: 51.175, lng: 71.44 },
      { lat: 51.185, lng: 71.50 },
      { lat: 51.165, lng: 71.52 },
      { lat: 51.155, lng: 71.46 },
    ],
  },
  {
    id: "farm-2",
    name: "Ферма «Степная»",
    color: "#0891b2",
    coordinates: [
      { lat: 51.14, lng: 71.38 },
      { lat: 51.148, lng: 71.43 },
      { lat: 51.132, lng: 71.44 },
      { lat: 51.124, lng: 71.39 },
    ],
  },
];

const DEMO_PASTURES = [
  {
    id: "pasture-1",
    name: "Северный луг",
    farmId: "farm-1",
    color: "#f59e0b",
    biomassEstimate: 2400,
    area: 45,
    grassType: "Люцерна",
    coordinates: [
      { lat: 51.178, lng: 71.45 },
      { lat: 51.183, lng: 71.48 },
      { lat: 51.174, lng: 71.49 },
      { lat: 51.169, lng: 71.46 },
    ],
  },
  {
    id: "pasture-2",
    name: "Восточный клин",
    farmId: "farm-1",
    color: "#d97706",
    biomassEstimate: 1850,
    area: 30,
    grassType: "Клевер",
    coordinates: [
      { lat: 51.168, lng: 71.49 },
      { lat: 51.174, lng: 71.51 },
      { lat: 51.163, lng: 71.515 },
      { lat: 51.158, lng: 71.495 },
    ],
  },
  {
    id: "pasture-3",
    name: "Южный участок",
    farmId: "farm-2",
    color: "#f59e0b",
    biomassEstimate: 2100,
    area: 55,
    grassType: "Тимофеевка",
    coordinates: [
      { lat: 51.138, lng: 71.40 },
      { lat: 51.144, lng: 71.42 },
      { lat: 51.132, lng: 71.43 },
      { lat: 51.126, lng: 71.41 },
    ],
  },
];

// ─── Компонент ─────────────────────────────────────────────────────────────────
export default function PasturesMapPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Farms & pastures state
  const [farms, setFarms] = useState(DEMO_FARMS);
  const [pastures, setPastures] = useState(DEMO_PASTURES);

  // UI state
  const [expandedFarms, setExpandedFarms] = useState({ "farm-1": true, "farm-2": true });
  const [selectedItem, setSelectedItem] = useState(null); // { type: 'farm'|'pasture', id }
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [drawMode, setDrawMode] = useState(null); // 'farm' | 'pasture' | null
  const [activeFarmId, setActiveFarmId] = useState(null); // при drawMode=pasture

  // ─── All polygons for map ──────────────────────────────────────────────────
  const allPolygons = useMemo(() => [
    ...farms.map((f) => ({ ...f, type: "farm" })),
    ...pastures.map((p) => ({ ...p, type: "pasture" })),
  ], [farms, pastures]);

  // ─── Filtered sidebar list ─────────────────────────────────────────────────
  const filteredFarms = useMemo(() =>
    farms.filter((f) => f.name.toLowerCase().includes(searchQuery.toLowerCase())),
    [farms, searchQuery]
  );

  // Pastures that match query or belong to matching farm
  const getPastures = useCallback((farmId) =>
    pastures.filter((p) =>
      p.farmId === farmId &&
      (searchQuery === "" || p.name.toLowerCase().includes(searchQuery.toLowerCase()))
    ),
    [pastures, searchQuery]
  );

  // ─── Polygon create callback ───────────────────────────────────────────────
  const handlePolygonCreate = useCallback((polygon) => {
    if (polygon.type === "farm") {
      const newFarm = { ...polygon, color: nextFarmColor() };
      setFarms((prev) => [...prev, newFarm]);
    } else {
      setPastures((prev) => [...prev, polygon]);
    }
    setDrawMode(null);
    setActiveFarmId(null);
  }, []);

  // ─── Polygon delete callback ───────────────────────────────────────────────
  const handlePolygonDelete = useCallback((id) => {
    setFarms((prev) => prev.filter((f) => f.id !== id));
    setPastures((prev) => prev.filter((p) => p.id !== id && p.farmId !== id));
    if (selectedItem?.id === id) setSelectedItem(null);
  }, [selectedItem]);

  // ─── Start draw pasture for a farm ────────────────────────────────────────
  const startDrawPasture = (farmId) => {
    setActiveFarmId(farmId);
    setDrawMode("pasture");
  };

  // ─── Map center: center of selected item or first farm ────────────────────
  const mapCenter = useMemo(() => {
    const target = selectedItem
      ? [...farms, ...pastures].find((x) => x.id === selectedItem.id)
      : farms[0];
    if (target?.coordinates?.length) {
      const lats = target.coordinates.map((c) => c.lat);
      const lngs = target.coordinates.map((c) => c.lng);
      return [
        lats.reduce((a, b) => a + b, 0) / lats.length,
        lngs.reduce((a, b) => a + b, 0) / lngs.length,
      ];
    }
    return [51.1605, 71.4704];
  }, [selectedItem, farms, pastures]);

  // ─── Stats ────────────────────────────────────────────────────────────────
  const stats = useMemo(() => ({
    farmsCount: farms.length,
    pasturesCount: pastures.length,
    totalArea: pastures.reduce((acc, p) => acc + (p.area || 0), 0),
    avgBiomass: pastures.length
      ? Math.round(pastures.reduce((acc, p) => acc + (p.biomassEstimate || 0), 0) / pastures.length)
      : 0,
  }), [farms, pastures]);

  const getSelectedDetail = () => {
    if (!selectedItem) return null;
    if (selectedItem.type === "farm") return farms.find((f) => f.id === selectedItem.id);
    return pastures.find((p) => p.id === selectedItem.id);
  };
  const detail = getSelectedDetail();

  // ─── Auth guard ────────────────────────────────────────────────────────────
  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">{t("common.pleaseLogin")}</p>
          <Button onClick={() => navigate("/login")}>{t("nav.login")}</Button>
        </div>
      </div>
    );
  }

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className={`min-h-screen bg-background ${isFullscreen ? "overflow-hidden" : ""}`}>
      {!isFullscreen && <Header />}

      {/* Hero */}
      {!isFullscreen && (
        <div className="relative pt-20 pb-14 bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700">
          <div className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
            }}
          />
          <div className="relative max-w-7xl mx-auto px-6 pt-10">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-emerald-200 text-sm mb-2">
                  <Map className="w-4 h-4" />
                  <span>Интерактивная карта</span>
                </div>
                <h1 className="text-3xl font-bold text-white mb-1">Фермы и пастбища</h1>
                <p className="text-emerald-100 text-sm">
                  Рисуйте полигоны ферм и пастбищ прямо на карте
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {/* Draw Farm */}
                <Button
                  onClick={() => { setDrawMode("farm"); setActiveFarmId(null); }}
                  disabled={!!drawMode}
                  className="bg-white text-emerald-700 hover:bg-emerald-50 font-medium"
                >
                  <Home className="w-4 h-4 mr-2" />
                  + Ферма
                </Button>
                <Button
                  variant="outline"
                  className="bg-white/20 text-white border-white/30 hover:bg-white/30"
                  onClick={() => setIsFullscreen(true)}
                >
                  <Maximize2 className="w-4 h-4 mr-2" />
                  На весь экран
                </Button>
              </div>
            </div>

            {/* Stats row */}
            <div className="flex flex-wrap gap-4 mt-6">
              {[
                { icon: Home, label: "Ферм", value: stats.farmsCount, color: "bg-white/20" },
                { icon: TreePine, label: "Пастбищ", value: stats.pasturesCount, color: "bg-white/20" },
                { icon: LandPlot, label: "Площадь", value: `${stats.totalArea} га`, color: "bg-white/20" },
                { icon: Leaf, label: "Ср. биомасса", value: `${stats.avgBiomass} кг/га`, color: "bg-white/20" },
              ].map((s) => (
                <div key={s.label} className={`flex items-center gap-3 ${s.color} rounded-xl px-4 py-2`}>
                  <s.icon className="w-5 h-5 text-white/80" />
                  <div>
                    <div className="text-white font-semibold text-base leading-tight">{s.value}</div>
                    <div className="text-white/70 text-xs">{s.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main */}
      <div className={isFullscreen ? "" : "max-w-7xl mx-auto px-6 py-6"}>
        <div className={isFullscreen ? "flex h-screen" : "flex gap-5"}>

          {/* ── Sidebar ────────────────────────────────────────────────────── */}
          {!isFullscreen && (
            <aside className="w-72 shrink-0 space-y-4">

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Поиск ферм и пастбищ…"
                  className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Draw Farm button */}
              <Button
                onClick={() => { setDrawMode("farm"); setActiveFarmId(null); }}
                disabled={!!drawMode}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Нарисовать ферму
              </Button>

              {/* Farm / Pasture tree */}
              <Card>
                <CardHeader className="pb-2 pt-4">
                  <CardTitle className="text-sm flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Home className="w-4 h-4 text-emerald-600" />
                      Структура ({filteredFarms.length} ферм)
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-0 max-h-[calc(100vh-420px)] overflow-y-auto">
                  {filteredFarms.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-4">Нет ферм</p>
                  )}
                  <div className="space-y-2">
                    {filteredFarms.map((farm) => {
                      const farmPastures = getPastures(farm.id);
                      const isExpanded = expandedFarms[farm.id];

                      return (
                        <div key={farm.id}>
                          {/* Farm row */}
                          <div
                            className={`flex items-center gap-2 p-2.5 rounded-xl cursor-pointer border transition-all ${
                              selectedItem?.id === farm.id
                                ? "bg-emerald-50 border-emerald-300 dark:bg-emerald-950"
                                : "hover:bg-secondary border-transparent"
                            }`}
                            onClick={() => setSelectedItem({ type: "farm", id: farm.id })}
                          >
                            {/* Expand toggle */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setExpandedFarms((prev) => ({ ...prev, [farm.id]: !prev[farm.id] }));
                              }}
                              className="shrink-0"
                            >
                              {isExpanded
                                ? <ChevronDown className="w-4 h-4 text-gray-400" />
                                : <ChevronRight className="w-4 h-4 text-gray-400" />
                              }
                            </button>

                            <div
                              className="w-3 h-3 rounded-sm shrink-0"
                              style={{ background: farm.color }}
                            />

                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold truncate">{farm.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {farmPastures.length} пастбищ{farmPastures.length === 1 ? "е" : ""}
                              </p>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-1">
                              <button
                                title="Добавить пастбище"
                                onClick={(e) => { e.stopPropagation(); startDrawPasture(farm.id); }}
                                className="p-1 rounded-lg hover:bg-amber-100 text-amber-600"
                                disabled={!!drawMode}
                              >
                                <TreePine className="w-3.5 h-3.5" />
                              </button>
                              <button
                                title="Удалить ферму"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (window.confirm(`Удалить ферму "${farm.name}" и все её пастбища?`)) {
                                    handlePolygonDelete(farm.id);
                                  }
                                }}
                                className="p-1 rounded-lg hover:bg-red-100 text-red-500"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Pastures list under farm */}
                          {isExpanded && (
                            <div className="ml-6 mt-1 space-y-1 border-l-2 pl-3" style={{ borderColor: farm.color + "40" }}>
                              {farmPastures.length === 0 && (
                                <p className="text-xs text-muted-foreground py-1 pl-1">
                                  Нет пастбищ —{" "}
                                  <button
                                    className="text-amber-600 underline"
                                    onClick={() => startDrawPasture(farm.id)}
                                    disabled={!!drawMode}
                                  >
                                    нарисуйте
                                  </button>
                                </p>
                              )}
                              {farmPastures.map((pasture) => (
                                <div
                                  key={pasture.id}
                                  className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer border transition-all ${
                                    selectedItem?.id === pasture.id
                                      ? "bg-amber-50 border-amber-300 dark:bg-amber-950"
                                      : "hover:bg-secondary border-transparent"
                                  }`}
                                  onClick={() => setSelectedItem({ type: "pasture", id: pasture.id })}
                                >
                                  <div
                                    className="w-2.5 h-2.5 rounded-full shrink-0"
                                    style={{ background: pasture.color || "#f59e0b" }}
                                  />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium truncate">{pasture.name}</p>
                                    <p className="text-xs text-muted-foreground">{pasture.area} га</p>
                                  </div>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (window.confirm(`Удалить пастбище "${pasture.name}"?`)) {
                                        handlePolygonDelete(pasture.id);
                                      }
                                    }}
                                    className="p-1 rounded-lg hover:bg-red-100 text-red-400"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              ))}

                              {/* Add pasture shortcut */}
                              <button
                                onClick={() => startDrawPasture(farm.id)}
                                disabled={!!drawMode}
                                className="flex items-center gap-1 text-xs text-amber-600 hover:text-amber-700 py-1 pl-1 disabled:opacity-40"
                              >
                                <Plus className="w-3 h-3" />
                                Добавить пастбище
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Legend */}
              <Card>
                <CardContent className="p-3">
                  <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Инструкция</p>
                  <div className="space-y-1.5 text-xs text-muted-foreground">
                    <div className="flex items-start gap-2">
                      <Home className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                      <span>Нажмите «Нарисовать ферму» и кликайте по карте для обозначения границ</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <TreePine className="w-3.5 h-3.5 text-amber-600 mt-0.5 shrink-0" />
                      <span>Нажмите иконку 🌿 рядом с фермой для добавления пастбища внутри</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Info className="w-3.5 h-3.5 text-blue-500 mt-0.5 shrink-0" />
                      <span>Правый клик по полигону на карте — удалить</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </aside>
          )}

          {/* ── Map area ───────────────────────────────────────────────────── */}
          <div className="flex-1 min-w-0 space-y-4">
            {/* Draw mode active banner */}
            {drawMode && (
              <div
                className="flex items-center gap-3 p-3 rounded-xl border text-sm font-medium"
                style={{
                  background: drawMode === "farm" ? "#f0fdf4" : "#fffbeb",
                  borderColor: drawMode === "farm" ? "#86efac" : "#fcd34d",
                  color: drawMode === "farm" ? "#15803d" : "#b45309",
                }}
              >
                <PenLine className="w-4 h-4" />
                <span>
                  {drawMode === "farm"
                    ? "🏠 Режим рисования ФЕРМЫ — кликайте по карте, затем нажмите «Готово»"
                    : `🌿 Режим рисования ПАСТБИЩА для "${farms.find(f => f.id === activeFarmId)?.name || "..."}" — кликайте по карте`}
                </span>
                <button
                  onClick={() => { setDrawMode(null); setActiveFarmId(null); }}
                  className="ml-auto p-1 rounded-lg hover:bg-black/10"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Map card */}
            <Card className={isFullscreen ? "fixed inset-0 rounded-none border-0 z-50" : ""}>
              {isFullscreen && (
                <button
                  className="absolute top-4 right-4 z-10 bg-white rounded-lg shadow px-3 py-1.5 text-sm font-medium"
                  onClick={() => setIsFullscreen(false)}
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              {!isFullscreen && (
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div>
                    <CardTitle>Карта территорий</CardTitle>
                    <CardDescription>
                      {allPolygons.length} объект{allPolygons.length !== 1 ? "ов" : ""} на карте
                    </CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setIsFullscreen(true)}>
                    <Maximize2 className="w-4 h-4" />
                  </Button>
                </CardHeader>
              )}
              <CardContent className={isFullscreen ? "p-0 h-screen" : "p-4"}>
                <LeafletMap
                  center={mapCenter}
                  zoom={12}
                  polygons={allPolygons}
                  onPolygonCreate={handlePolygonCreate}
                  onPolygonDelete={handlePolygonDelete}
                  drawMode={drawMode}
                  activeFarmId={activeFarmId}
                  height={isFullscreen ? "100vh" : "520px"}
                />
              </CardContent>
            </Card>

            {/* Selected item detail card */}
            {selectedItem && detail && !isFullscreen && (
              <Card className="border-2" style={{
                borderColor: selectedItem.type === "farm"
                  ? (detail.color + "80")
                  : "#fcd34d",
              }}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ background: detail.color + "20" }}
                      >
                        {selectedItem.type === "farm"
                          ? <Home className="w-5 h-5" style={{ color: detail.color }} />
                          : <TreePine className="w-5 h-5 text-amber-600" />
                        }
                      </div>
                      <div>
                        <CardTitle className="text-base">{detail.name}</CardTitle>
                        <CardDescription className="text-xs">
                          {selectedItem.type === "farm"
                            ? `Ферма · ${getPastures(detail.id).length} пастбищ`
                            : `Пастбище · ферма: ${farms.find((f) => f.id === detail.farmId)?.name || "—"}`
                          }
                        </CardDescription>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedItem(null)}
                      className="p-1.5 rounded-lg hover:bg-secondary"
                    >
                      <X className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </div>
                </CardHeader>

                {selectedItem.type === "farm" ? (
                  <CardContent>
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      <div className="p-3 bg-secondary/50 rounded-xl">
                        <p className="text-xs text-muted-foreground">Пастбищ</p>
                        <p className="text-xl font-bold">{getPastures(detail.id).length}</p>
                      </div>
                      <div className="p-3 bg-secondary/50 rounded-xl">
                        <p className="text-xs text-muted-foreground">Площадь</p>
                        <p className="text-xl font-bold">
                          {getPastures(detail.id).reduce((a, p) => a + (p.area || 0), 0)} га
                        </p>
                      </div>
                      <div className="p-3 bg-secondary/50 rounded-xl">
                        <p className="text-xs text-muted-foreground">Точек границы</p>
                        <p className="text-xl font-bold">{detail.coordinates?.length || 0}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <Button
                        size="sm"
                        className="bg-amber-500 hover:bg-amber-600 text-white"
                        onClick={() => startDrawPasture(detail.id)}
                        disabled={!!drawMode}
                      >
                        <TreePine className="w-4 h-4 mr-1.5" />
                        Добавить пастбище
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => navigate("/pastures")}>
                        <Eye className="w-4 h-4 mr-1.5" />
                        Подробнее
                      </Button>
                    </div>
                  </CardContent>
                ) : (
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                      <div className="p-3 bg-secondary/50 rounded-xl">
                        <p className="text-xs text-muted-foreground">Площадь</p>
                        <p className="text-lg font-bold">{detail.area} га</p>
                      </div>
                      <div className="p-3 bg-secondary/50 rounded-xl">
                        <p className="text-xs text-muted-foreground">Биомасса</p>
                        <p className="text-lg font-bold">{detail.biomassEstimate} кг/га</p>
                      </div>
                      <div className="p-3 bg-secondary/50 rounded-xl">
                        <p className="text-xs text-muted-foreground">Трава</p>
                        <p className="text-lg font-bold">{detail.grassType || "—"}</p>
                      </div>
                      <div className="p-3 bg-secondary/50 rounded-xl">
                        <p className="text-xs text-muted-foreground">Точек</p>
                        <p className="text-lg font-bold">{detail.coordinates?.length || 0}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => navigate("/pastures")}>
                        <Eye className="w-4 h-4 mr-1.5" />
                        Детали пастбища
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => navigate("/biomass-dashboard")}>
                        <BarChart3 className="w-4 h-4 mr-1.5" />
                        Биомасса
                      </Button>
                    </div>
                  </CardContent>
                )}
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}