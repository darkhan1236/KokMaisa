// src/app/components/DronesPage.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from 'react-i18next';
import Header from "@/app/components/Header";
import {
  Plane,
  Plus,
  X,
  Check,
  Wifi,
  WifiOff,
  Battery,
  Video,
  Settings,
  Trash2,
  Play,
  Pause,
  Camera,
  MapPin,
  Clock,
  Signal,
} from "lucide-react";

export default function DronesPage() {
  const { t } = useTranslation();
  const { user, addDrone, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [showAddDrone, setShowAddDrone] = useState(false);
  const [selectedDrone, setSelectedDrone] = useState(null);
  const [droneData, setDroneData] = useState({
    name: "",
    model: "",
    serialNumber: "",
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

  const drones = user?.profile?.drones || [];

  const handleAddDrone = (e) => {
    e.preventDefault();
    addDrone({
      ...droneData,
      id: Date.now().toString(),
      status: "inactive",
      battery: 100,
      signal: "good",
      lastFlight: null,
    });
    setDroneData({
      name: "",
      model: "",
      serialNumber: "",
    });
    setShowAddDrone(false);
  };

  const handleDeleteDrone = (droneId) => {
    if (window.confirm(t('drones.confirmDelete'))) {
      const updatedDrones = drones.filter((d) => d.id !== droneId);
      updateProfile({ drones: updatedDrones });
      if (selectedDrone?.id === droneId) {
        setSelectedDrone(null);
      }
    }
  };

  const toggleDroneStatus = (droneId) => {
    const updatedDrones = drones.map((d) =>
      d.id === droneId
        ? { ...d, status: d.status === "active" ? "inactive" : "active" }
        : d
    );
    updateProfile({ drones: updatedDrones });
  };

  const droneModels = [
    "DJI Mavic 3 Enterprise",
    "DJI Phantom 4 RTK",
    "DJI Matrice 300 RTK",
    "DJI Agras T40",
    "Autel EVO II Pro",
    t('drones.otherModel'),
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Hero Section */}
      <div className="relative pt-20 pb-16 bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-700">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M54.627 0l.83.828-1.415 1.415L51.8 0h2.827zM5.373 0l-.83.828L5.96 2.243 8.2 0H5.374zM48.97 0l3.657 3.657-1.414 1.414L46.143 0h2.828zM11.03 0L7.372 3.657 8.787 5.07 13.857 0H11.03zm32.284 0L49.8 6.485 48.384 7.9l-7.9-7.9h2.83zM16.686 0L10.2 6.485 11.616 7.9l7.9-7.9h-2.83zM22.344 0L13.858 8.485 15.272 9.9l9.9-9.9h-2.828zM32 0l-3.486 3.485 1.415 1.415L34.343 0H32z' fill='%23ffffff' fill-opacity='0.05' fill-rule='evenodd'/%3E%3C/svg%3E")`,
            opacity: 0.3,
          }}
        />
        <div className="relative max-w-7xl mx-auto px-6 pt-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
                {t('drones.title')}
              </h1>
              <p className="text-white/90 text-xl">
                {t('drones.subtitle')}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowAddDrone(true)}
              className="flex items-center gap-2 px-6 py-3 bg-white/20 backdrop-blur-sm text-white rounded-xl hover:bg-white/30 transition-colors border border-white/30 shrink-0"
            >
              <Plus className="w-5 h-5" />
              <span>{t('drones.addDrone')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto px-6 -mt-20 md:-mt-16 relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl p-6 shadow-xl border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center">
                <Plane className="w-7 h-7 text-blue-600" />
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-900">{drones.length}</p>
                <p className="text-sm text-gray-600">{t('drones.stats.total')}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-xl border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center">
                <Wifi className="w-7 h-7 text-green-600" />
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-900">
                  {drones.filter((d) => d.status === "active").length}
                </p>
                <p className="text-sm text-gray-600">{t('drones.stats.active')}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-xl border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-amber-100 rounded-xl flex items-center justify-center">
                <Video className="w-7 h-7 text-amber-600" />
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-900">0</p>
                <p className="text-sm text-gray-600">{t('drones.stats.streams')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Add Drone Modal */}
        {showAddDrone && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-gray-200">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">
                  {t('drones.addDrone')}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowAddDrone(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <form onSubmit={handleAddDrone} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    {t('drones.name')} *
                  </label>
                  <input
                    type="text"
                    value={droneData.name}
                    onChange={(e) => setDroneData({ ...droneData, name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder={t('drones.namePlaceholder')}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    {t('drones.model')} *
                  </label>
                  <select
                    value={droneData.model}
                    onChange={(e) => setDroneData({ ...droneData, model: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  >
                    <option value="">{t('drones.selectModel')}</option>
                    {droneModels.map((model) => (
                      <option key={model} value={model}>
                        {model}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    {t('drones.serialNumber')}
                  </label>
                  <input
                    type="text"
                    value={droneData.serialNumber}
                    onChange={(e) => setDroneData({ ...droneData, serialNumber: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 font-mono"
                    placeholder="XXXXXXXXXX"
                  />
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
                    onClick={() => setShowAddDrone(false)}
                    className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors"
                  >
                    {t('common.cancel')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Drones Grid */}
        {drones.length === 0 ? (
          <div className="bg-white rounded-2xl p-16 text-center border border-gray-200 shadow-sm">
            <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Plane className="w-10 h-10 text-gray-400" />
            </div>
            <p className="text-lg text-gray-600 mb-2">
              {t('drones.noDrones')}
            </p>
            <p className="text-gray-500 mb-6">
              {t('drones.addFirstDrone')}
            </p>
            <button
              type="button"
              onClick={() => setShowAddDrone(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors"
            >
              <Plus className="w-5 h-5" />
              {t('drones.addDrone')}
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {drones.map((drone) => (
              <div
                key={drone.id}
                className={`bg-white rounded-2xl p-6 shadow-sm border transition-all cursor-pointer ${
                  selectedDrone?.id === drone.id
                    ? "border-green-400 ring-2 ring-green-200/20 bg-green-50/50"
                    : "border-gray-200 hover:border-green-300"
                }`}
                onClick={() => setSelectedDrone(drone)}
              >
                {/* Drone Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        drone.status === "active"
                          ? "bg-green-100"
                          : "bg-gray-100"
                      }`}
                    >
                      <Plane
                        className={`w-6 h-6 ${
                          drone.status === "active"
                            ? "text-green-600"
                            : "text-gray-400"
                        }`}
                      />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">
                        {drone.name}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {drone.model}
                      </p>
                    </div>
                  </div>
                  <div
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      drone.status === "active"
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    {drone.status === "active" ? t('drones.active') : t('drones.inactive')}
                  </div>
                </div>

                {/* Drone Stats */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="text-center p-2 bg-gray-50 rounded-lg">
                    <Battery className="w-4 h-4 mx-auto text-green-600 mb-1" />
                    <p className="text-xs text-gray-600">{t('drones.battery')}</p>
                    <p className="text-sm font-medium text-gray-900">{drone.battery || 85}%</p>
                  </div>
                  <div className="text-center p-2 bg-gray-50 rounded-lg">
                    <Signal className="w-4 h-4 mx-auto text-green-600 mb-1" />
                    <p className="text-xs text-gray-600">{t('drones.signal')}</p>
                    <p className="text-sm font-medium text-gray-900">
                      {drone.status === "active" ? t('drones.good') : "-"}
                    </p>
                  </div>
                  <div className="text-center p-2 bg-gray-50 rounded-lg">
                    <Video className="w-4 h-4 mx-auto text-amber-600 mb-1" />
                    <p className="text-xs text-gray-600">{t('drones.video')}</p>
                    <p className="text-sm font-medium text-gray-900">
                      {drone.status === "active" ? "4K" : "-"}
                    </p>
                  </div>
                </div>

                {/* Last Flight */}
                {drone.lastFlight && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                    <Clock className="w-4 h-4" />
                    <span>
                      {t('drones.lastFlight')}:{" "}
                      {new Date(drone.lastFlight).toLocaleDateString()}
                    </span>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleDroneStatus(drone.id);
                    }}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl transition-colors ${
                      drone.status === "active"
                        ? "bg-amber-100 text-amber-700 hover:bg-amber-200"
                        : "bg-green-100 text-green-700 hover:bg-green-200"
                    }`}
                  >
                    {drone.status === "active" ? (
                      <>
                        <Pause className="w-4 h-4" />
                        <span>{t('drones.stop')}</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4" />
                        <span>{t('drones.start')}</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      // Здесь можно открыть видеопоток или модалку
                    }}
                    className="p-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
                    title={t('drones.videoStream')}
                  >
                    <Camera className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteDrone(drone.id);
                    }}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                    title={t('common.delete')}
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Video Stream Section */}
        {selectedDrone && selectedDrone.status === "active" && (
          <div className="mt-8 bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900">
                {t('drones.videoStream')}: {selectedDrone.name}
              </h3>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <span className="text-sm text-gray-600">LIVE</span>
              </div>
            </div>

            <div className="aspect-video bg-gray-100 rounded-xl flex items-center justify-center border border-gray-200">
              <div className="text-center">
                <Video className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">
                  {t('drones.connectingStream')}
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  {t('drones.ensureDroneConnected')}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  51.1605, 71.4704
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  00:00:00
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  {t('drones.record')}
                </button>
                <button
                  type="button"
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  {t('drones.screenshot')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}