// src/app/components/FarmsPage.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from 'react-i18next';
import Header from "@/app/components/Header";
import LeafletMap from "@/app/features/map/LeafletMap";
import {
  LandPlot,
  Plus,
  X,
  Check,
  MapPin,
  Trash2,
  Edit3,
  Eye,
  Building2,
  Home,
  Wheat,
  Calendar
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";

export default function FarmsPage() {
  const { t } = useTranslation();
  const { user, addFarm, updateProfile } = useAuth();
  const navigate = useNavigate();

  const [showAddFarm, setShowAddFarm] = useState(false);
  const [editingFarm, setEditingFarm] = useState(null);
  const [selectedFarm, setSelectedFarm] = useState(null);

  const [farmData, setFarmData] = useState({
    name: "",
    address: "",
    region: "",
    area: "",
    coordinates: { lat: "", lng: "" },
    phone: "",
    description: "",
  });

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">
            {t('common.pleaseLogin')}
          </p>
          <Button onClick={() => navigate("/login")}>
            {t('nav.login')}
          </Button>
        </div>
      </div>
    );
  }

  const farms = user?.profile?.farms || [];

  const handleLocationSelect = (location) => {
    setFarmData({
      ...farmData,
      coordinates: {
        lat: location.lat.toFixed(6),
        lng: location.lng.toFixed(6),
      },
    });
  };

  const resetForm = () => {
    setFarmData({
      name: "",
      address: "",
      region: "",
      area: "",
      coordinates: { lat: "", lng: "" },
      phone: "",
      description: "",
    });
    setEditingFarm(null);
  };

  const handleAddFarm = (e) => {
    e.preventDefault();
    if (editingFarm) {
      const updatedFarms = farms.map((f) =>
        f.id === editingFarm.id ? { ...f, ...farmData } : f
      );
      updateProfile({ farms: updatedFarms });
    } else {
      addFarm(farmData);
    }
    resetForm();
    setShowAddFarm(false);
  };

  const handleEditFarm = (farm) => {
    setEditingFarm(farm);
    setFarmData({
      name: farm.name || "",
      address: farm.address || "",
      region: farm.region || "",
      area: farm.area || "",
      coordinates: farm.coordinates || { lat: "", lng: "" },
      phone: farm.phone || "",
      description: farm.description || "",
    });
    setShowAddFarm(true);
  };

  const handleDeleteFarm = (farmId) => {
    if (window.confirm(t('farms.confirmDelete'))) {
      const updatedFarms = farms.filter((f) => f.id !== farmId);
      updateProfile({ farms: updatedFarms });
      if (selectedFarm?.id === farmId) {
        setSelectedFarm(null);
      }
    }
  };

  const totalArea = farms.reduce((acc, f) => acc + parseFloat(f.area || 0), 0);

  const farmMarkers = farms
    .filter((f) => f.coordinates?.lat && f.coordinates?.lng)
    .map((f) => ({
      lat: parseFloat(f.coordinates.lat),
      lng: parseFloat(f.coordinates.lng),
      title: f.name,
      description: `${f.area || '?'} ${t('units.ha')} | ${f.region || t('farms.regionNotSpecified')}`,
      type: "farm",
    }));

  // Список регионов — можно вынести в отдельный файл или переводить через i18n
  const regions = [
    t('regions.almaty'),
    t('regions.astana'),
    t('regions.akmola'),
    t('regions.aktobe'),
    t('regions.atyrau'),
    t('regions.westKazakhstan'),
    t('regions.zhambyl'),
    t('regions.karaganda'),
    t('regions.kostanay'),
    t('regions.kzylorda'),
    t('regions.mangystau'),
    t('regions.pavlodar'),
    t('regions.northKazakhstan'),
    t('regions.turkistan'),
    t('regions.eastKazakhstan'),
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero */}
      <div className="relative pt-20 pb-16 bg-gradient-to-br from-green-500 via-emerald-600 to-teal-600">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg ...')] opacity-30" />
        <div className="relative max-w-7xl mx-auto px-6 pt-12">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                {t('farms.title')}
              </h1>
              <p className="text-white/80">
                {t('farms.subtitle')}
              </p>
            </div>
            <Button
              onClick={() => {
                resetForm();
                setShowAddFarm(true);
              }}
              className="bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 border border-white/30"
            >
              <Plus className="w-5 h-5 mr-2" />
              {t('farms.addFarm')}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Статистика */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <LandPlot className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{farms.length}</p>
                  <p className="text-sm text-muted-foreground">{t('farms.stats.farms')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{totalArea}</p>
                  <p className="text-sm text-muted-foreground">{t('farms.stats.hectares')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                  <Wheat className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {farms.reduce((acc, f) => acc + (f.pastures?.length || 0), 0)}
                  </p>
                  <p className="text-sm text-muted-foreground">{t('farms.stats.pastures')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {new Set(farms.map((f) => f.region).filter(Boolean)).size}
                  </p>
                  <p className="text-sm text-muted-foreground">{t('farms.stats.regions')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Модальное окно добавления / редактирования */}
        {showAddFarm && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-2xl shadow-2xl border border-gray-200 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">
                  {editingFarm ? t('farms.editFarm') : t('farms.addFarm')}
                </h3>
                <button
                  onClick={() => {
                    setShowAddFarm(false);
                    resetForm();
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              <form onSubmit={handleAddFarm} className="space-y-5">
                <div className="grid md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('farms.name')} *
                    </label>
                    <input
                      type="text"
                      value={farmData.name}
                      onChange={(e) => setFarmData({ ...farmData, name: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder={t('farms.namePlaceholder')}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('farms.region')}
                    </label>
                    <select
                      value={farmData.region}
                      onChange={(e) => setFarmData({ ...farmData, region: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="">{t('farms.selectRegion')}</option>
                      {regions.map((region) => (
                        <option key={region} value={region}>
                          {region}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('farms.area')} (га) *
                    </label>
                    <input
                      type="number"
                      value={farmData.area}
                      onChange={(e) => setFarmData({ ...farmData, area: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('farms.phone')}
                    </label>
                    <input
                      type="tel"
                      value={farmData.phone}
                      onChange={(e) => setFarmData({ ...farmData, phone: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="+7 (777) 123-45-67"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('farms.address')}
                  </label>
                  <input
                    type="text"
                    value={farmData.address}
                    onChange={(e) => setFarmData({ ...farmData, address: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder={t('farms.addressPlaceholder')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('farms.description')}
                  </label>
                  <textarea
                    value={farmData.description}
                    onChange={(e) => setFarmData({ ...farmData, description: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                    rows={3}
                    placeholder={t('farms.descriptionPlaceholder')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('farms.gpsCoordinates')}
                  </label>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <input
                      type="text"
                      value={farmData.coordinates.lat}
                      onChange={(e) =>
                        setFarmData({
                          ...farmData,
                          coordinates: { ...farmData.coordinates, lat: e.target.value },
                        })
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 font-mono text-sm"
                      placeholder={t('farms.latitude')}
                    />
                    <input
                      type="text"
                      value={farmData.coordinates.lng}
                      onChange={(e) =>
                        setFarmData({
                          ...farmData,
                          coordinates: { ...farmData.coordinates, lng: e.target.value },
                        })
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 font-mono text-sm"
                      placeholder={t('farms.longitude')}
                    />
                  </div>

                  <LeafletMap
                    center={[43.238949, 76.945465]}
                    zoom={6}
                    selectable={true}
                    onLocationSelect={handleLocationSelect}
                    height="250px"
                    markers={farmMarkers}
                  />
                </div>

                <div className="flex gap-3 pt-4 border-t">
                  <Button type="submit" className="flex-1">
                    <Check className="w-5 h-5 mr-2" />
                    {editingFarm ? t('common.saveChanges') : t('farms.addFarm')}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowAddFarm(false);
                      resetForm();
                    }}
                  >
                    {t('common.cancel')}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Модальное окно просмотра фермы */}
        {selectedFarm && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl border border-gray-200 max-h-[90vh] overflow-y-auto">
              <div className="relative h-48 bg-gradient-to-br from-green-500 to-emerald-600 rounded-t-2xl">
                <button
                  type="button"
                  onClick={() => setSelectedFarm(null)}
                  className="absolute top-4 right-4 p-2 bg-white/20 backdrop-blur-sm rounded-lg hover:bg-white/30 transition-colors"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
                <div className="absolute bottom-4 left-6">
                  <h2 className="text-2xl font-bold text-white">
                    {selectedFarm.name}
                  </h2>
                  <p className="text-white/80">{selectedFarm.region || t('farms.regionNotSpecified')}</p>
                </div>
              </div>

              <div className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-green-50 rounded-xl p-4">
                    <p className="text-sm text-green-700">{t('farms.area')}</p>
                    <p className="text-xl font-bold text-green-900">
                      {selectedFarm.area} {t('units.ha')}
                    </p>
                  </div>
                  <div className="bg-blue-50 rounded-xl p-4">
                    <p className="text-sm text-blue-700">{t('farms.pasturesCount')}</p>
                    <p className="text-xl font-bold text-blue-900">
                      {selectedFarm.pastures?.length || 0}
                    </p>
                  </div>
                </div>

                {selectedFarm.address && (
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-gray-600 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">{t('farms.address')}</p>
                      <p className="text-gray-900">{selectedFarm.address}</p>
                    </div>
                  </div>
                )}

                {selectedFarm.phone && (
                  <div className="flex items-start gap-3">
                    <Phone className="w-5 h-5 text-gray-600 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">{t('farms.phone')}</p>
                      <p className="text-gray-900">{selectedFarm.phone}</p>
                    </div>
                  </div>
                )}

                {selectedFarm.description && (
                  <div>
                    <p className="text-sm text-gray-500 mb-2">{t('farms.description')}</p>
                    <p className="text-gray-900">{selectedFarm.description}</p>
                  </div>
                )}

                {selectedFarm.coordinates?.lat && (
                  <div>
                    <p className="text-sm text-gray-500 mb-2">{t('farms.location')}</p>
                    <LeafletMap
                      center={[
                        parseFloat(selectedFarm.coordinates.lat),
                        parseFloat(selectedFarm.coordinates.lng),
                      ]}
                      zoom={12}
                      markers={[
                        {
                          lat: parseFloat(selectedFarm.coordinates.lat),
                          lng: parseFloat(selectedFarm.coordinates.lng),
                          title: selectedFarm.name,
                        },
                      ]}
                      height="200px"
                    />
                  </div>
                )}

                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <Button
                    onClick={() => {
                      handleEditFarm(selectedFarm);
                      setSelectedFarm(null);
                    }}
                    className="flex-1"
                  >
                    <Edit3 className="w-4 h-4 mr-2" />
                    {t('common.edit')}
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => handleDeleteFarm(selectedFarm.id)}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    {t('common.delete')}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Список ферм + карта */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Карта и список */}
          <div className="lg:col-span-2">
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>{t('farms.mapTitle')}</CardTitle>
              </CardHeader>
              <CardContent>
                <LeafletMap
                  center={
                    farmMarkers.length > 0
                      ? [farmMarkers[0].lat, farmMarkers[0].lng]
                      : [48.0, 68.0]
                  }
                  zoom={5}
                  markers={farmMarkers}
                  height="450px"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('farms.listTitle')}</CardTitle>
              </CardHeader>
              <CardContent>
                {farms.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-secondary rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <LandPlot className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground mb-2">
                      {t('farms.empty.title')}
                    </p>
                    <Button
                      onClick={() => setShowAddFarm(true)}
                      className="mt-4"
                    >
                      {t('farms.addFirstFarm')}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {farms.map((farm) => (
                      <div
                        key={farm.id}
                        className="p-4 rounded-xl border border-border hover:border-primary/50 bg-secondary/30 transition-all cursor-pointer"
                        onClick={() => setSelectedFarm(farm)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-semibold text-foreground">
                                {farm.name}
                              </h4>
                              <Badge variant="secondary">
                                {farm.area} {t('units.ha')}
                              </Badge>
                            </div>
                            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <MapPin className="w-4 h-4" />
                                {farm.region || t('farms.regionNotSpecified')}
                              </span>
                              {farm.address && (
                                <span className="flex items-center gap-1">
                                  <Building2 className="w-4 h-4" />
                                  {farm.address}
                                </span>
                              )}
                              {farm.createdAt && (
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-4 h-4" />
                                  {new Date(farm.createdAt).toLocaleDateString(
                                    t('common.dateLocale') || 'ru-RU'
                                  )}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedFarm(farm);
                              }}
                              className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditFarm(farm);
                              }}
                              className="p-2 text-amber-600 hover:bg-amber-600/10 rounded-lg transition-colors"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteFarm(farm.id);
                              }}
                              className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Боковая панель */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t('common.quickActions')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  className="w-full justify-start"
                  onClick={() => {
                    resetForm();
                    setShowAddFarm(true);
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {t('farms.addFarm')}
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start bg-transparent"
                  onClick={() => navigate("/")}
                >
                  <Home className="w-4 h-4 mr-2" />
                  {t('common.home')}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t('common.statistics')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Array.from(
                    new Set(farms.map((f) => f.region).filter(Boolean))
                  ).map((region) => {
                    const regionFarms = farms.filter((f) => f.region === region);
                    const regionArea = regionFarms.reduce(
                      (acc, f) => acc + parseFloat(f.area || 0),
                      0
                    );
                    return (
                      <div
                        key={region}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="text-muted-foreground truncate flex-1">
                          {region}
                        </span>
                        <span className="font-medium text-foreground ml-2">
                          {regionFarms.length} {t('farms.farmsCount')}, {regionArea} {t('units.ha')}
                        </span>
                      </div>
                    );
                  })}
                  {farms.filter((f) => !f.region).length > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {t('farms.withoutRegion')}
                      </span>
                      <span className="font-medium text-foreground">
                        {farms.filter((f) => !f.region).length} {t('farms.farmsCount')}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}