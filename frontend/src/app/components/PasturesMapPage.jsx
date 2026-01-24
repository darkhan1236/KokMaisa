// src/app/components/PasturesMapPage.jsx
import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from 'react-i18next';
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
  Filter,
  Search,
  Wheat,
  LandPlot,
  Eye,
  MapPin,
  Leaf,
  TrendingUp,
  TrendingDown,
  BarChart3,
  RefreshCw,
  Download,
  Maximize2,
  ChevronRight,
  X,
} from "lucide-react";

export default function PasturesMapPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation(); // ← ДОБАВИТЬ ЭТУ СТРОКУ
  
  const [selectedLayer, setSelectedLayer] = useState("biomass");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPasture, setSelectedPasture] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Все хуки ПЕРЕД проверкой авторизации
  const pastures = user?.profile?.pastures || [];
  const farms = user?.profile?.farms || [];

  // Demo pastures if empty
  const allPastures = pastures.length > 0 
    ? pastures 
    : [
        {
          id: "demo-1",
          name: t('pastures.noPastures') ? t('biomass.northField') : "North Field",
          area: 120,
          biomassEstimate: 2400,
          grassType: t('pastures.grassTypes.alfalfa'),
          coordinates: { lat: 43.35, lng: 77.05 },
          status: "good",
        },
        // ... остальные demo данные ...
      ];

  const getStatusInfo = (biomass) => {
    if (biomass >= 2500)
      return { label: t('pastures.rating.excellent'), color: "bg-green-500", textColor: "text-green-600" };
    if (biomass >= 2000)
      return { label: t('pastures.rating.good'), color: "bg-emerald-500", textColor: "text-emerald-600" };
    if (biomass >= 1500)
      return { label: t('pastures.rating.average'), color: "bg-amber-500", textColor: "text-amber-600" };
    return { label: t('pastures.rating.low'), color: "bg-red-500", textColor: "text-red-600" };
  };

  // Фильтрованные пастбища с memoization
  const filteredPastures = useMemo(() => {
    let result = allPastures;

    // Фильтр по поисковому запросу
    if (searchQuery) {
      result = result.filter((p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Фильтр по состоянию
    if (selectedFilter !== "all") {
      result = result.filter((p) => {
        const biomass = p.biomassEstimate || 0;
        if (selectedFilter === "excellent") return biomass >= 2500;
        if (selectedFilter === "good")
          return biomass >= 2000 && biomass < 2500;
        if (selectedFilter === "warning")
          return biomass >= 1500 && biomass < 2000;
        if (selectedFilter === "poor") return biomass < 1500;
        return true;
      });
    }

    return result;
  }, [allPastures, searchQuery, selectedFilter]);

  // Маркеры для карты
  const mapMarkers = useMemo(() => {
    return filteredPastures
      .filter((p) => p.coordinates?.lat && p.coordinates?.lng)
      .map((p) => {
        const status = getStatusInfo(p.biomassEstimate || 0);
        return {
          lat: parseFloat(p.coordinates.lat),
          lng: parseFloat(p.coordinates.lng),
          title: p.name,
          description: `${p.area} ${t('common.hectares')} | ${p.biomassEstimate} ${t('biomass.unit')} | ${status.label}`,
          type: selectedLayer === "biomass" ? "biomass" : "pasture",
          color: status.color,
        };
      });
  }, [filteredPastures, selectedLayer, t]);

  // Слои карты - ПЕРЕВЕСТИ ЗДЕСЬ
  const layers = [
    { value: "biomass", label: t('pastures.biomassDashboard'), icon: Leaf },
    { value: "satellite", label: t('common.satellite'), icon: Layers },
    { value: "terrain", label: t('common.terrain'), icon: Map },
  ];

  // Фильтры по состоянию - ПЕРЕВЕСТИ ЗДЕСЬ
  const filters = [
    { value: "all", label: t('common.all'), count: allPastures.length },
    {
      value: "excellent",
      label: t('pastures.rating.excellent'),
      count: allPastures.filter((p) => p.biomassEstimate >= 2500).length,
      color: "bg-green-500",
    },
    // ... остальные фильтры ...
  ];

  // Вычисляемые значения
  const totalArea = useMemo(
    () => allPastures.reduce((acc, p) => acc + (p.area || 0), 0),
    [allPastures]
  );

  const avgBiomass = useMemo(
    () =>
      Math.round(
        allPastures.reduce((acc, p) => acc + (p.biomassEstimate || 0), 0) /
          allPastures.length
      ),
    [allPastures]
  );

  const defaultCenter = useMemo(
    () => (mapMarkers.length > 0 ? [mapMarkers[0].lat, mapMarkers[0].lng] : [43.35, 77.05]),
    [mapMarkers]
  );

  // Проверка авторизации ПОСЛЕ всех хуков
  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">
            {t('common.pleaseLogin')}
          </p>
          <Button onClick={() => navigate("/login")}>{t('nav.login')}</Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-background ${isFullscreen ? "overflow-hidden" : ""}`}>
      {!isFullscreen && <Header />}

      {/* Hero Section */}
      {!isFullscreen && (
        <div className="relative pt-20 pb-16 bg-gradient-to-br from-blue-500 via-cyan-600 to-teal-600">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20...')] opacity-30" />
          <div className="relative max-w-7xl mx-auto px-6 pt-12">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">
                  {t('nav.pastureMap')}
                </h1>
                <p className="text-white/80">
                  {t('pastures.subtitle')}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="bg-white/20 text-white border-white/30 hover:bg-white/30"
                >
                  <Download className="w-4 h-4 mr-2" />
                  {t('common.export')}
                </Button>
                <Button
                  variant="outline"
                  className="bg-white/20 text-white border-white/30 hover:bg-white/30"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  {t('common.refresh')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className={isFullscreen ? "" : "max-w-7xl mx-auto px-6 py-8"}>
        {/* Stats - скрыть при fullscreen */}
        {!isFullscreen && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Wheat className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xl font-bold">{allPastures.length}</p>
                    <p className="text-xs text-muted-foreground">{t('pastures.title')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            {/* Остальные stats карточки с переводами ... */}
          </div>
        )}

        <div className={isFullscreen ? "grid grid-cols-4 gap-6 h-screen" : "grid lg:grid-cols-4 gap-6"}>
          {/* Sidebar - скрыть при fullscreen */}
          {!isFullscreen && (
            <div className="lg:col-span-1 space-y-6">
              {/* Search */}
              <Card>
                <CardContent className="p-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={t('pastures.selectPasture')}
                      className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Layers */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Layers className="w-4 h-4" />
                    {t('common.mapLayers')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="space-y-2">
                    {layers.map((layer) => (
                      <button
                        key={layer.value}
                        type="button"
                        onClick={() => setSelectedLayer(layer.value)}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                          selectedLayer === layer.value
                            ? "bg-primary text-primary-foreground"
                            : "hover:bg-secondary"
                        }`}
                      >
                        <layer.icon className="w-4 h-4" />
                        {layer.label}
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Filters */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Filter className="w-4 h-4" />
                    {t('common.filterByStatus')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="space-y-2">
                    {filters.map((filter) => (
                      <button
                        key={filter.value}
                        type="button"
                        onClick={() => setSelectedFilter(filter.value)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                          selectedFilter === filter.value
                            ? "bg-secondary border border-primary"
                            : "hover:bg-secondary"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {filter.color && (
                            <div className={`w-3 h-3 rounded-full ${filter.color}`} />
                          )}
                          <span>{filter.label}</span>
                        </div>
                        <Badge variant="secondary">{filter.count}</Badge>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Pastures List */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">
                    {t('pastures.title')} ({filteredPastures.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0 max-h-64 overflow-y-auto scrollbar-thin">
                  <div className="space-y-2">
                    {filteredPastures.map((pasture) => {
                      const status = getStatusInfo(pasture.biomassEstimate || 0);
                      return (
                        <button
                          key={pasture.id}
                          type="button"
                          onClick={() => setSelectedPasture(pasture)}
                          className={`w-full flex items-center justify-between p-3 rounded-lg text-sm transition-colors text-left ${
                            selectedPasture?.id === pasture.id
                              ? "bg-primary/10 border border-primary"
                              : "hover:bg-secondary border border-transparent"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${status.color}`} />
                            <div>
                              <p className="font-medium">{pasture.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {pasture.area} {t('common.hectares')}
                              </p>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Map */}
          <div className={isFullscreen ? "col-span-4" : "lg:col-span-3"}>
            <Card className={isFullscreen ? "fixed inset-0 rounded-none border-0 z-50" : ""}>
              {isFullscreen && (
                <div className="absolute top-4 right-4 z-10">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsFullscreen(false)}
                    className="bg-white"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}

              {!isFullscreen && (
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div>
                    <CardTitle>{t('pastures.mapTitle')}</CardTitle>
                    <CardDescription>
                      {selectedLayer === "biomass"
                        ? t('biomass.unit')
                        : selectedLayer === "satellite"
                          ? t('common.satellite')
                          : t('common.terrain')}
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsFullscreen(true)}
                  >
                    <Maximize2 className="w-4 h-4" />
                  </Button>
                </CardHeader>
              )}

              <CardContent className={isFullscreen ? "p-0 h-screen" : "p-4"}>
                <div className={isFullscreen ? "h-full" : "h-[500px]"}>
                  <LeafletMap
                    center={defaultCenter}
                    zoom={10}
                    markers={mapMarkers}
                    height="100%"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Selected Pasture Info */}
            {selectedPasture && !isFullscreen && (
              <Card className="mt-6">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle>{selectedPasture.name}</CardTitle>
                    <Badge
                      className={`${getStatusInfo(selectedPasture.biomassEstimate).color} text-white`}
                    >
                      {getStatusInfo(selectedPasture.biomassEstimate).label}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="p-3 bg-secondary/50 rounded-lg">
                      <p className="text-xs text-muted-foreground">{t('pastures.area')}</p>
                      <p className="text-lg font-bold">{selectedPasture.area} {t('common.hectares')}</p>
                    </div>
                    <div className="p-3 bg-secondary/50 rounded-lg">
                      <p className="text-xs text-muted-foreground">{t('biomass.unit')}</p>
                      <p className="text-lg font-bold">
                        {selectedPasture.biomassEstimate} {t('biomass.unit')}
                      </p>
                    </div>
                    <div className="p-3 bg-secondary/50 rounded-lg">
                      <p className="text-xs text-muted-foreground">{t('pastures.grassType')}</p>
                      <p className="text-lg font-bold">
                        {selectedPasture.grassType || t('common.notSpecified')}
                      </p>
                    </div>
                    <div className="p-3 bg-secondary/50 rounded-lg">
                      <p className="text-xs text-muted-foreground">{t('common.coordinates')}</p>
                      <p className="text-sm font-mono">
                        {selectedPasture.coordinates?.lat
                          ?.toString()
                          .substring(0, 7)}
                        , {selectedPasture.coordinates?.lng?.toString().substring(0, 7)}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Button onClick={() => navigate("/pastures")}>
                      <Eye className="w-4 h-4 mr-2" />
                      {t('common.moreDetails')}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => navigate("/biomass-dashboard")}
                    >
                      <BarChart3 className="w-4 h-4 mr-2" />
                      {t('nav.biomassDashboard')}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}