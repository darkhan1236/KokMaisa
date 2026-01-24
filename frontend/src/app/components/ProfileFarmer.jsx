// src/app/components/ProfileFarmer.jsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from 'react-i18next';
import Header from "@/app/components/Header";
import LeafletMap from "@/app/features/map/LeafletMap";
import {
  User,
  MapPin,
  Phone,
  Mail,
  Plus,
  Trash2,
  Map as MapIcon,
  Wheat,
  Plane,
  BarChart3,
  ChevronRight,
  X,
  Check,
} from "lucide-react";

export default function ProfileFarmer() {
  const { t } = useTranslation();
  const { user, addFarm, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [showAddFarm, setShowAddFarm] = useState(false);
  const [farmData, setFarmData] = useState({
    name: "",
    location: "",
    area: "",
    coordinates: { lat: "", lng: "" },
  });

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-2xl shadow-lg max-w-md mx-4">
          <p className="text-gray-600 mb-6 text-lg">
            {t('profile.pleaseLogin')}
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

  const farms = user?.profile?.farms || [];
  const pastures = user?.profile?.pastures || [];
  const drones = user?.profile?.drones || [];

  const handleLocationSelect = (location) => {
    setFarmData({
      ...farmData,
      coordinates: {
        lat: location.lat.toFixed(6),
        lng: location.lng.toFixed(6),
      },
    });
  };

  const handleAddFarm = (e) => {
    e.preventDefault();
    addFarm(farmData);
    setFarmData({
      name: "",
      location: "",
      area: "",
      coordinates: { lat: "", lng: "" },
    });
    setShowAddFarm(false);
  };

  const handleDeleteFarm = (farmId) => {
    if (window.confirm(t('profile.farms.confirmDelete'))) {
      const updatedFarms = farms.filter((f) => f.id !== farmId);
      updateProfile({ farms: updatedFarms });
    }
  };

  const farmMarkers = farms
    .filter((f) => f.coordinates?.lat && f.coordinates?.lng)
    .map((f) => ({
      lat: parseFloat(f.coordinates.lat),
      lng: parseFloat(f.coordinates.lng),
      title: f.name,
      description: f.location,
      type: "farm",
    }));

  const totalArea = farms.reduce((acc, f) => acc + parseFloat(f.area || 0), 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Hero */}
      <div className="relative pt-20 pb-32 bg-gradient-to-br from-green-600 via-emerald-600 to-green-700">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M54.627 0l.83.828-1.415 1.415L51.8 0h2.827zM5.373 0l-.83.828L5.96 2.243 8.2 0H5.374zM48.97 0l3.657 3.657-1.414 1.414L46.143 0h2.828zM11.03 0L7.372 3.657 8.787 5.07 13.857 0H11.03zm32.284 0L49.8 6.485 48.384 7.9l-7.9-7.9h2.83zM16.686 0L10.2 6.485 11.616 7.9l7.9-7.9h-2.83zM22.344 0L13.858 8.485 15.272 9.9l9.9-9.9h-2.828zM32 0l-3.486 3.485 1.415 1.415L34.343 0H32z'/></g></g></svg>")`,
            opacity: 0.3,
          }}
        />
        <div className="relative max-w-7xl mx-auto px-6 pt-12">
          <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
            <div className="w-24 h-24 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/30 shadow-lg shrink-0">
              <User className="w-12 h-12 text-white" />
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
                {user.full_name || t('roles.farmer')}
              </h1>
              <p className="text-white/90 text-xl">{user.email}</p>
              <span className="inline-block mt-4 px-5 py-2 bg-white/25 text-white rounded-full text-lg font-medium backdrop-blur-sm">
                {t('roles.farmer')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-7xl mx-auto px-6 -mt-24 md:-mt-20 relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-2xl p-6 shadow-xl border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center">
                <MapIcon className="w-7 h-7 text-green-600" />
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-900">{farms.length}</p>
                <p className="text-sm text-gray-600">{t('profile.stats.farms')}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-xl border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-amber-100 rounded-xl flex items-center justify-center">
                <Wheat className="w-7 h-7 text-amber-600" />
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-900">{pastures.length}</p>
                <p className="text-sm text-gray-600">{t('profile.stats.pastures')}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-xl border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center">
                <Plane className="w-7 h-7 text-blue-600" />
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-900">{drones.length}</p>
                <p className="text-sm text-gray-600">{t('profile.stats.drones')}</p>
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
                  {totalArea.toLocaleString()}
                </p>
                <p className="text-sm text-gray-600">{t('profile.stats.hectares')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Контактная информация */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-5">
                {t('profile.contactInfo.title')}
              </h3>
              <div className="space-y-5">
                <div className="flex items-center gap-4">
                  <Mail className="w-6 h-6 text-gray-500" />
                  <span className="text-gray-900">{user.email}</span>
                </div>
                <div className="flex items-center gap-4">
                  <Phone className="w-6 h-6 text-gray-500" />
                  <span className="text-gray-900">{user.phone || t('common.notSpecified')}</span>
                </div>
                <div className="flex items-center gap-4">
                  <MapPin className="w-6 h-6 text-gray-500" />
                  <span className="text-gray-900">
                    {user.city || t('common.notSpecified')}, {user.country || t('countries.kazakhstan')}
                  </span>
                </div>
              </div>
            </div>

            {/* Карта ферм */}
            {farmMarkers.length > 0 && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {t('profile.farms.mapTitle')}
                </h3>
                <LeafletMap
                  center={[
                    parseFloat(farmMarkers[0]?.lat || 51.1605),
                    parseFloat(farmMarkers[0]?.lng || 71.4704),
                  ]}
                  zoom={8}
                  markers={farmMarkers}
                  height="300px"
                />
              </div>
            )}

            {/* Быстрые действия */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-5">
                {t('profile.quickActions.title')}
              </h3>
              <div className="space-y-2">
                <Link
                  to="/pastures"
                  className="flex items-center justify-between p-4 rounded-xl hover:bg-gray-50 transition-colors group"
                >
                  <div className="flex items-center gap-4">
                    <Wheat className="w-6 h-6 text-amber-600" />
                    <span className="text-gray-900 font-medium">
                      {t('profile.quickActions.managePastures')}
                    </span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-900 transition-colors" />
                </Link>

                <Link
                  to="/drones"
                  className="flex items-center justify-between p-4 rounded-xl hover:bg-gray-50 transition-colors group"
                >
                  <div className="flex items-center gap-4">
                    <Plane className="w-6 h-6 text-blue-600" />
                    <span className="text-gray-900 font-medium">
                      {t('profile.quickActions.myDrones')}
                    </span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-900 transition-colors" />
                </Link>

                <Link
                  to="/biomass-dashboard"
                  className="flex items-center justify-between p-4 rounded-xl hover:bg-gray-50 transition-colors group"
                >
                  <div className="flex items-center gap-4">
                    <BarChart3 className="w-6 h-6 text-purple-600" />
                    <span className="text-gray-900 font-medium">
                      {t('profile.quickActions.biomassAnalysis')}
                    </span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-900 transition-colors" />
                </Link>
              </div>
            </div>
          </div>

          {/* Right Column — Мои фермы */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">
                  {t('profile.farms.title')}
                </h3>
                <button
                  onClick={() => setShowAddFarm(!showAddFarm)}
                  className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors"
                >
                  {showAddFarm ? (
                    <>
                      <X className="w-5 h-5" />
                      <span>{t('common.cancel')}</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-5 h-5" />
                      <span>{t('profile.farms.addFarm')}</span>
                    </>
                  )}
                </button>
              </div>

              {/* Форма добавления */}
              {showAddFarm && (
                <form
                  onSubmit={handleAddFarm}
                  className="mb-8 p-6 bg-gray-50 rounded-2xl border border-gray-200"
                >
                  <h4 className="text-lg font-medium text-gray-900 mb-4">
                    {t('profile.farms.newFarm')}
                  </h4>

                  <div className="grid md:grid-cols-2 gap-4 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        {t('profile.farms.name')} *
                      </label>
                      <input
                        type="text"
                        value={farmData.name}
                        onChange={(e) => setFarmData({ ...farmData, name: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder={t('profile.farms.namePlaceholder')}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        {t('profile.farms.location')} *
                      </label>
                      <input
                        type="text"
                        value={farmData.location}
                        onChange={(e) => setFarmData({ ...farmData, location: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder={t('profile.farms.locationPlaceholder')}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        {t('profile.farms.area')} (га)
                      </label>
                      <input
                        type="number"
                        value={farmData.area}
                        onChange={(e) => setFarmData({ ...farmData, area: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="100"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        {t('profile.farms.gpsCoordinates')}
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={farmData.coordinates.lat}
                          onChange={(e) =>
                            setFarmData({
                              ...farmData,
                              coordinates: { ...farmData.coordinates, lat: e.target.value },
                            })
                          }
                          className="w-1/2 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 font-mono text-sm"
                          placeholder={t('profile.farms.latitude')}
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
                          className="w-1/2 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 font-mono text-sm"
                          placeholder={t('profile.farms.longitude')}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      {t('profile.farms.selectOnMap')}
                    </label>
                    <LeafletMap
                      center={[51.1605, 71.4704]}
                      zoom={6}
                      selectable={true}
                      onLocationSelect={handleLocationSelect}
                      height="300px"
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="submit"
                      className="flex items-center gap-2 px-6 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors"
                    >
                      <Check className="w-5 h-5" />
                      {t('common.save')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddFarm(false)}
                      className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors"
                    >
                      {t('common.cancel')}
                    </button>
                  </div>
                </form>
              )}

              {/* Список ферм */}
              {farms.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <MapIcon className="w-10 h-10 text-gray-400" />
                  </div>
                  <p className="text-lg text-gray-600 mb-2">
                    {t('profile.farms.empty.title')}
                  </p>
                  <p className="text-gray-500">
                    {t('profile.farms.empty.description')}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {farms.map((farm) => (
                    <div
                      key={farm.id}
                      className="p-6 bg-gray-50 rounded-2xl border border-gray-200 hover:border-green-300 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="text-lg font-semibold text-gray-900 mb-2">
                            {farm.name}
                          </h4>
                          <div className="space-y-1 text-sm text-gray-600">
                            <p className="flex items-center gap-2">
                              <MapPin className="w-4 h-4" />
                              {farm.location || t('common.notSpecified')}
                            </p>
                            {farm.area && (
                              <p>
                                {t('profile.farms.area')}:{' '}
                                <span className="text-gray-900 font-medium">
                                  {farm.area} {t('units.ha')}
                                </span>
                              </p>
                            )}
                            {farm.coordinates?.lat && farm.coordinates?.lng && (
                              <p className="font-mono text-xs">
                                GPS: {farm.coordinates.lat}, {farm.coordinates.lng}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Link
                            to={`/farms/${farm.id}`}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title={t('common.open')}
                          >
                            <ChevronRight className="w-5 h-5" />
                          </Link>
                          <button
                            onClick={() => handleDeleteFarm(farm.id)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title={t('common.delete')}
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}