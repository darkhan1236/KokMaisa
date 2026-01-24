// src/app/components/PasturesAnalysisPage.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from 'react-i18next';
import Header from "@/app/components/Header";
import LeafletMap from "@/app/features/map/LeafletMap";
import {
  Wheat,
  BarChart3,
  TrendingUp,
  TrendingDown,
  MapPin,
  Eye,
  Leaf,
  Droplets,
  Sun,
  Wind,
} from "lucide-react";

export default function PasturesAnalysisPage() {
  const { t } = useTranslation();
  const { user, navigate } = useAuth();
  const [selectedPasture, setSelectedPasture] = useState(null);

  if (!user || user.account_type !== "agronomist") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-2xl shadow-lg max-w-md mx-4">
          <p className="text-gray-600 mb-6 text-lg">
            {t('common.accessDenied')}
          </p>
          <button
            onClick={() => navigate("/")}
            className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-full font-medium hover:from-green-600 hover:to-emerald-700 transition-all shadow-md hover:shadow-xl"
          >
            {t('common.home')}
          </button>
        </div>
      </div>
    );
  }

  // Собираем все пастбища из назначенных ферм
  const assignedFarms = user?.profile?.assignedFarms || [];
  const allPastures = assignedFarms.flatMap(farm => 
    (farm.pastures || []).map(pasture => ({
      ...pasture,
      farmName: farm.name,
      farmId: farm.id,
    }))
  );

  const totalArea = allPastures.reduce((acc, p) => acc + parseFloat(p.area || 0), 0);
  const avgBiomass = allPastures.length > 0
    ? Math.round(allPastures.reduce((acc, p) => acc + (p.biomassEstimate || 0), 0) / allPastures.length)
    : 0;

  const pastureMarkers = allPastures
    .filter(p => p.coordinates?.lat && p.coordinates?.lng)
    .map(p => ({
      lat: parseFloat(p.coordinates.lat),
      lng: parseFloat(p.coordinates.lng),
      title: p.name,
      description: `${p.area} га | ${p.biomassEstimate || '?'} кг/га | ${p.farmName}`,
      type: "pasture",
    }));

  const getBiomassRating = (biomass) => {
    if (biomass >= 2500) return { label: t('pastures.rating.excellent'), color: "text-green-600" };
    if (biomass >= 2000) return { label: t('pastures.rating.good'),     color: "text-amber-600" };
    if (biomass >= 1500) return { label: t('pastures.rating.average'),  color: "text-orange-600" };
    return { label: t('pastures.rating.low'), color: "text-red-600" };
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Hero */}
      <div className="relative pt-20 pb-16 bg-gradient-to-br from-blue-500 via-indigo-600 to-blue-700">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M54.627 0l.83.828-1.415 1.415L51.8 0h2.827zM5.373 0l-.83.828L5.96 2.243 8.2 0H5.374zM48.97 0l3.657 3.657-1.414 1.414L46.143 0h2.828zM11.03 0L7.372 3.657 8.787 5.07 13.857 0H11.03zm32.284 0L49.8 6.485 48.384 7.9l-7.9-7.9h2.83zM16.686 0L10.2 6.485 11.616 7.9l7.9-7.9h-2.83zM22.344 0L13.858 8.485 15.272 9.9l9.9-9.9h-2.828zM32 0l-3.486 3.485 1.415 1.415L34.343 0H32z' fill='%23ffffff' fill-opacity='0.05' fill-rule='evenodd'/%3E%3C/svg%3E")`,
            opacity: 0.3,
          }}
        />
        <div className="relative max-w-7xl mx-auto mb-10 px-6 pt-12">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
              {t('pasturesAnalysis.title')}
            </h1>
            <p className="text-white/90 text-xl">
              {t('pasturesAnalysis.subtitle')}
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-7xl mx-auto px-6 -mt-20 relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-2xl p-6 shadow-xl border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center">
                <Wheat className="w-7 h-7 text-blue-600" />
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-900">{allPastures.length}</p>
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
              <div className="w-14 h-14 bg-amber-100 rounded-xl flex items-center justify-center">
                <Leaf className="w-7 h-7 text-amber-600" />
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
                  {allPastures.filter(p => p.lastAnalysis).length}
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
          {/* Карта и список */}
          <div className="lg:col-span-2 space-y-8">
            {/* Карта */}
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
                height="450px"
              />
            </div>

            {/* Список пастбищ */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {t('pastures.listTitle')}
              </h3>

              {allPastures.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Wheat className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-600 mb-2">
                    {t('pasturesAnalysis.noAssignedPastures')}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {allPastures.map((pasture) => {
                    const rating = getBiomassRating(pasture.biomassEstimate || 0);
                    return (
                      <div
                        key={pasture.id}
                        className={`p-6 rounded-2xl border cursor-pointer transition-all ${
                          selectedPasture?.id === pasture.id
                            ? "border-blue-400 bg-blue-50"
                            : "border-gray-200 hover:border-blue-300 bg-gray-50"
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
                              <span>{pasture.farmName}</span>
                              {pasture.lastAnalysis && (
                                <span>
                                  {new Date(pasture.lastAnalysis).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedPasture(pasture);
                            }}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title={t('common.view')}
                          >
                            <Eye className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Правая панель — детали выбранного пастбища */}
          <div className="space-y-6">
            {selectedPasture ? (
              <>
                {/* Детали */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    {selectedPasture.name} ({selectedPasture.farmName})
                  </h3>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">{t('pastures.area')}</span>
                      <span className="font-medium text-gray-900">
                        {selectedPasture.area} га
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">{t('pastures.biomass')}</span>
                      <span className="font-medium text-gray-900">
                        {selectedPasture.biomassEstimate || 0} кг/га
                      </span>
                    </div>
                    {selectedPasture.grassType && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">{t('pastures.grassType')}</span>
                        <span className="font-medium text-gray-900">
                          {selectedPasture.grassType}
                        </span>
                      </div>
                    )}
                    {selectedPasture.lastAnalysis && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">{t('pastures.lastAnalysis')}</span>
                        <span className="font-medium text-gray-900">
                          {new Date(selectedPasture.lastAnalysis).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Кнопка анализа (заглушка — можно подключить реальный анализ) */}
                  <button
                    type="button"
                    className="w-full mt-6 flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors"
                    onClick={() => alert(t('pasturesAnalysis.startAnalysis'))}
                  >
                    <BarChart3 className="w-5 h-5" />
                    {t('pasturesAnalysis.analyze')}
                  </button>
                </div>

                {/* Условия роста (примерные данные) */}
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
                      <p className="font-medium text-gray-900">62%</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-xl text-center">
                      <Leaf className="w-6 h-6 text-green-600 mx-auto mb-1" />
                      <p className="text-xs text-gray-600">NDVI</p>
                      <p className="font-medium text-gray-900">0.68</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-xl text-center">
                      <Wind className="w-6 h-6 text-gray-500 mx-auto mb-1" />
                      <p className="text-xs text-gray-600">{t('pastures.wind')}</p>
                      <p className="font-medium text-gray-900">8 км/ч</p>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Eye className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-600">{t('pasturesAnalysis.selectPasture')}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}