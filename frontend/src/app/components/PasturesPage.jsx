// src/app/components/PasturesPage.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from 'react-i18next';
import Header from "@/app/components/Header";
import LeafletMap from "@/app/features/map/LeafletMap";
import {
  Wheat,
  Plus,
  X,
  Check,
  BarChart3,
  TrendingUp,
  TrendingDown,
  MapPin,
  Trash2,
  Eye,
  Leaf,
  Droplets,
  Sun,
  Wind,
} from "lucide-react";

export default function PasturesPage() {
  const { t } = useTranslation();
  const { user, addPasture, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [showAddPasture, setShowAddPasture] = useState(false);
  const [selectedPasture, setSelectedPasture] = useState(null);
  const [pastureData, setPastureData] = useState({
    name: "",
    farmId: "",
    area: "",
    coordinates: { lat: "", lng: "" },
    grassType: "",
  });

  if (!user || user.account_type !== "farmer") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-2xl shadow-lg max-w-md mx-4">
          <p className="text-gray-600 mb-6 text-lg">
            {t('common.pleaseLogin')}
          </p>
          <button
            onClick={() => navigate("/login")}
            className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-full font-medium hover:from-green-600 hover:to-emerald-700 transition-all shadow-md hover:shadow-xl"
          >
            {t('nav.login')}
          </button>
        </div>
      </div>
    );
  }

  const pastures = user?.profile?.pastures || [];
  const farms = user?.profile?.farms || [];

  const handleLocationSelect = (location) => {
    setPastureData({
      ...pastureData,
      coordinates: {
        lat: location.lat.toFixed(6),
        lng: location.lng.toFixed(6),
      },
    });
  };

  const handleAddPasture = (e) => {
    e.preventDefault();
    addPasture({
      ...pastureData,
      id: Date.now().toString(),
      biomassEstimate: Math.floor(Math.random() * 2000) + 1500,
      lastAnalysis: new Date().toISOString(),
    });
    setPastureData({
      name: "",
      farmId: "",
      area: "",
      coordinates: { lat: "", lng: "" },
      grassType: "",
    });
    setShowAddPasture(false);
  };

  const handleDeletePasture = (pastureId) => {
    if (window.confirm(t('pastures.confirmDelete'))) {
      const updatedPastures = pastures.filter((p) => p.id !== pastureId);
      updateProfile({ pastures: updatedPastures });
      if (selectedPasture?.id === pastureId) {
        setSelectedPasture(null);
      }
    }
  };

  // Статистика
  const totalArea = pastures.reduce((acc, p) => acc + parseFloat(p.area || 0), 0);
  const avgBiomass =
    pastures.length > 0
      ? Math.round(
          pastures.reduce((acc, p) => acc + (p.biomassEstimate || 0), 0) / pastures.length
        )
      : 0;

  const pastureMarkers = pastures
    .filter((p) => p.coordinates?.lat && p.coordinates?.lng)
    .map((p) => ({
      lat: parseFloat(p.coordinates.lat),
      lng: parseFloat(p.coordinates.lng),
      title: p.name,
      description: `${p.area} га | ${p.biomassEstimate} кг/га`,
      type: "pasture",
    }));

  const grassTypes = [
    t('pastures.grassTypes.alfalfa'),
    t('pastures.grassTypes.clover'),
    t('pastures.grassTypes.timothy'),
    t('pastures.grassTypes.fescue'),
    t('pastures.grassTypes.brome'),
    t('pastures.grassTypes.wheatgrass'),
    t('pastures.grassTypes.mixed'),
  ];

  const getBiomassRating = (biomass) => {
    if (biomass >= 2500) return { label: t('pastures.rating.excellent'), color: "text-green-600" };
    if (biomass >= 2000) return { label: t('pastures.rating.good'), color: "text-amber-600" };
    if (biomass >= 1500) return { label: t('pastures.rating.average'), color: "text-orange-600" };
    return { label: t('pastures.rating.low'), color: "text-red-600" };
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Hero Section */}
      <div className="relative pt-20 pb-16 bg-gradient-to-br from-amber-500 via-amber-600 to-orange-600">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M54.627 0l.83.828-1.415 1.415L51.8 0h2.827zM5.373 0l-.83.828L5.96 2.243 8.2 0H5.374zM48.97 0l3.657 3.657-1.414 1.414L46.143 0h2.828zM11.03 0L7.372 3.657 8.787 5.07 13.857 0H11.03zm32.284 0L49.8 6.485 48.384 7.9l-7.9-7.9h2.83zM16.686 0L10.2 6.485 11.616 7.9l7.9-7.9h-2.83zM22.344 0L13.858 8.485 15.272 9.9l9.9-9.9h-2.828zM32 0l-3.486 3.485 1.415 1.415L34.343 0H32z' fill='%23ffffff' fill-opacity='0.05' fill-rule='evenodd'/%3E%3C/svg%3E")`,
            opacity: 0.3,
          }}
        />
        <div className="relative max-w-7xl mb-10 mx-auto px-6 pt-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
                {t('pastures.title')}
              </h1>
              <p className="text-white/90 text-xl">{t('pastures.subtitle')}</p>
            </div>
            <button
              type="button"
              onClick={() => setShowAddPasture(true)}
              className="flex items-center gap-2 px-6 py-3 bg-white/20 backdrop-blur-sm text-white rounded-xl hover:bg-white/30 transition-colors border border-white/30 shrink-0"
            >
              <Plus className="w-5 h-5" />
              <span>{t('pastures.addPasture')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto px-6 -mt-20 md:-mt-16 relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-2xl p-6 shadow-xl border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-amber-100 rounded-xl flex items-center justify-center">
                <Wheat className="w-7 h-7 text-amber-600" />
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-900">{pastures.length}</p>
                <p className="text-sm text-gray-600">{t('pastures.stats.pastures')}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-xl border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center">
                <MapPin className="w-7 h-7 text-green-600" />
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-900">{totalArea.toFixed(1)}</p>
                <p className="text-sm text-gray-600">{t('pastures.stats.hectares')}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-xl border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center">
                <Leaf className="w-7 h-7 text-blue-600" />
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-900">{avgBiomass}</p>
                <p className="text-sm text-gray-600">{t('pastures.stats.avgBiomass')}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-xl border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center">
                <BarChart3 className="w-7 h-7 text-purple-600" />
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-900">
                  {pastures.filter((p) => p.lastAnalysis).length}
                </p>
                <p className="text-sm text-gray-600">{t('pastures.stats.analyses')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Map & List */}
          <div className="lg:col-span-2 space-y-8">
            {/* Карта пастбищ */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {t('pastures.mapTitle')}
              </h3>
              <LeafletMap
                center={
                  pastureMarkers.length > 0
                    ? [pastureMarkers[0].lat, pastureMarkers[0].lng]
                    : [51.1605, 71.4704]
                }
                zoom={8}
                markers={pastureMarkers}
                height="400px"
              />
            </div>

            {/* Список пастбищ */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {t('pastures.listTitle')}
              </h3>

              {pastures.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Wheat className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-600 mb-2">{t('pastures.noPastures')}</p>
                  <button
                    type="button"
                    onClick={() => setShowAddPasture(true)}
                    className="text-green-600 hover:underline font-medium"
                  >
                    {t('pastures.addFirstPasture')}
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {pastures.map((pasture) => {
                    const rating = getBiomassRating(pasture.biomassEstimate || 0);
                    return (
                      <div
                        key={pasture.id}
                        className={`p-6 rounded-2xl border cursor-pointer transition-all ${
                          selectedPasture?.id === pasture.id
                            ? "border-green-400 bg-green-50"
                            : "border-gray-200 hover:border-green-300 bg-gray-50"
                        }`}
                        onClick={() => setSelectedPasture(pasture)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="font-semibold text-gray-900">{pasture.name}</h4>
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-medium ${rating.color} bg-current/10`}
                              >
                                {rating.label}
                              </span>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-gray-600">
                              <span>{pasture.area} га</span>
                              <span>{pasture.biomassEstimate || 0} кг/га</span>
                              {pasture.grassType && <span>{pasture.grassType}</span>}
                              {pasture.lastAnalysis && (
                                <span>
                                  {new Date(pasture.lastAnalysis).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedPasture(pasture);
                              }}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="Просмотр"
                            >
                              <Eye className="w-5 h-5" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeletePasture(pasture.id);
                              }}
                              className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              title="Удалить"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {selectedPasture ? (
              <>
                {/* Детали пастбища */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    {selectedPasture.name}
                  </h3>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Площадь</span>
                      <span className="font-medium text-gray-900">
                        {selectedPasture.area} га
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Биомасса</span>
                      <span className="font-medium text-gray-900">
                        {selectedPasture.biomassEstimate || 0} кг/га
                      </span>
                    </div>
                    {selectedPasture.grassType && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Тип травы</span>
                        <span className="font-medium text-gray-900">
                          {selectedPasture.grassType}
                        </span>
                      </div>
                    )}
                    {selectedPasture.lastAnalysis && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Последний анализ</span>
                        <span className="font-medium text-gray-900">
                          {new Date(selectedPasture.lastAnalysis).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    className="w-full mt-6 flex items-center justify-center gap-2 px-4 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors"
                  >
                    <BarChart3 className="w-5 h-5" />
                    {t('pastures.analyzeBiomass')}
                  </button>
                </div>

                {/* Условия роста */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    {t('pastures.growthConditions')}
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-gray-50 rounded-xl text-center">
                      <Sun className="w-6 h-6 text-amber-500 mx-auto mb-1" />
                      <p className="text-xs text-gray-600">{t('pastures.sunlight')}</p>
                      <p className="font-medium text-gray-900">{t('pastures.good')}</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-xl text-center">
                      <Droplets className="w-6 h-6 text-blue-500 mx-auto mb-1" />
                      <p className="text-xs text-gray-600">{t('pastures.humidity')}</p>
                      <p className="font-medium text-gray-900">65%</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-xl text-center">
                      <Leaf className="w-6 h-6 text-green-600 mx-auto mb-1" />
                      <p className="text-xs text-gray-600">NDVI</p>
                      <p className="font-medium text-gray-900">0.72</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-xl text-center">
                      <Wind className="w-6 h-6 text-gray-500 mx-auto mb-1" />
                      <p className="text-xs text-gray-600">{t('pastures.wind')}</p>
                      <p className="font-medium text-gray-900">12 км/ч</p>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Eye className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-600">{t('pastures.selectPasture')}</p>
              </div>
            )}

            {/* Тренд биомассы */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {t('pastures.biomassTrend')}
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">{t('pastures.thisMonth')}</span>
                  <span className="flex items-center gap-1 text-green-600">
                    <TrendingUp className="w-4 h-4" />
                    +12%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">{t('pastures.lastMonth')}</span>
                  <span className="flex items-center gap-1 text-amber-600">
                    <TrendingDown className="w-4 h-4" />
                    -3%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">{t('pastures.thisYear')}</span>
                  <span className="flex items-center gap-1 text-green-600">
                    <TrendingUp className="w-4 h-4" />
                    +24%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Модальное окно добавления пастбища */}
      {showAddPasture && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl shadow-2xl border border-gray-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">
                {t('pastures.addPasture')}
              </h3>
              <button
                type="button"
                onClick={() => setShowAddPasture(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleAddPasture} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    {t('pastures.name')} *
                  </label>
                  <input
                    type="text"
                    value={pastureData.name}
                    onChange={(e) => setPastureData({ ...pastureData, name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder={t('pastures.namePlaceholder')}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    {t('pastures.farm')}
                  </label>
                  <select
                    value={pastureData.farmId}
                    onChange={(e) => setPastureData({ ...pastureData, farmId: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">{t('pastures.selectFarm')}</option>
                    {farms.map((farm) => (
                      <option key={farm.id} value={farm.id}>
                        {farm.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    {t('pastures.area')} *
                  </label>
                  <input
                    type="number"
                    value={pastureData.area}
                    onChange={(e) => setPastureData({ ...pastureData, area: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="50"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    {t('pastures.grassType')}
                  </label>
                  <select
                    value={pastureData.grassType}
                    onChange={(e) => setPastureData({ ...pastureData, grassType: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">{t('pastures.selectGrassType')}</option>
                    {grassTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  {t('pastures.coordinates')}
                </label>
                <div className="flex gap-2 mb-4">
                  <input
                    type="text"
                    value={pastureData.coordinates.lat}
                    onChange={(e) =>
                      setPastureData({
                        ...pastureData,
                        coordinates: { ...pastureData.coordinates, lat: e.target.value },
                      })
                    }
                    className="w-1/2 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 font-mono text-sm"
                    placeholder={t('pastures.latitude')}
                  />
                  <input
                    type="text"
                    value={pastureData.coordinates.lng}
                    onChange={(e) =>
                      setPastureData({
                        ...pastureData,
                        coordinates: { ...pastureData.coordinates, lng: e.target.value },
                      })
                    }
                    className="w-1/2 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 font-mono text-sm"
                    placeholder={t('pastures.longitude')}
                  />
                </div>

                <div className="relative z-10">

                    <LeafletMap
                    center={[51.1605, 71.4704]}
                    zoom={6}
                    selectable={true}
                    onLocationSelect={handleLocationSelect}
                    height="250px"
                    />
                </div>
                
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors"
                >
                  <Check className="w-5 h-5" />
                  {t('common.save')}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddPasture(false)}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors"
                >
                  {t('common.cancel')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}