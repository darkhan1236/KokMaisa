// src/app/components/DronesPage.jsx
import { useState, useEffect } from "react";
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
  Loader2,
  Edit3,
} from "lucide-react";

export default function DronesPage() {
  const { t } = useTranslation();
  const { 
    user, 
    isAuthenticated, 
    loading: authLoading,
    getFarms,
    getDrones,
    createDrone,
    updateDrone,
    deleteDrone,
    updateDroneStatus,
  } = useAuth();
  
  const navigate = useNavigate();

  const [drones, setDrones] = useState([]);
  const [farms, setFarms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const [showAddDrone, setShowAddDrone] = useState(false);
  const [editingDrone, setEditingDrone] = useState(null);
  const [selectedDrone, setSelectedDrone] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const [droneData, setDroneData] = useState({
    model: "",
    serial_number: "",
    description: "",
    farm_id: "",
  });

  // Загрузка данных
  useEffect(() => {
    if (authLoading) return;
    
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    loadData();
  }, [authLoading, isAuthenticated]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [dronesData, farmsData] = await Promise.all([
        getDrones(),
        getFarms()
      ]);
      
      setDrones(dronesData || []);
      setFarms(farmsData || []);
    } catch (err) {
      setError(err.message || "Не удалось загрузить данные");
      console.error(err);
      
      if (err.message.includes("Сессия истекла")) {
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setDroneData({
      model: "",
      serial_number: "",
      description: "",
      farm_id: "",
    });
    setEditingDrone(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      if (!droneData.model.trim()) throw new Error("Модель обязательна");
      if (!droneData.serial_number.trim()) throw new Error("Серийный номер обязателен");
      if (!droneData.farm_id) throw new Error("Выберите ферму");

      const payload = {
        model: droneData.model.trim(),
        serial_number: droneData.serial_number.trim(),
        description: droneData.description?.trim() || null,
        farm_id: parseInt(droneData.farm_id),
      };

      if (editingDrone) {
        await updateDrone(editingDrone.id, payload);
      } else {
        await createDrone(payload);
      }

      resetForm();
      setShowAddDrone(false);
      await loadData();
    } catch (err) {
      setError(err.message || "Ошибка при сохранении");
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditDrone = (drone) => {
    setEditingDrone(drone);
    setDroneData({
      model: drone.model || "",
      serial_number: drone.serial_number || "",
      description: drone.description || "",
      farm_id: drone.farm_id?.toString() || "",
    });
    setShowAddDrone(true);
  };

  const handleDeleteDrone = async (droneId) => {
    if (!window.confirm(t('drones.confirmDelete') || "Вы уверены, что хотите удалить дрон?")) {
      return;
    }

    setDeletingId(droneId);
    
    try {
      // Оптимистичное обновление
      setDrones(prev => prev.filter(d => d.id !== droneId));
      
      if (selectedDrone?.id === droneId) {
        setSelectedDrone(null);
      }
      
      await deleteDrone(droneId);
      setError(null);
      
    } catch (err) {
      setError(err.message || "Ошибка удаления");
      // Восстанавливаем данные при ошибке
      await loadData();
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleStatus = async (droneId) => {
    try {
      const drone = drones.find(d => d.id === droneId);
      if (!drone) return;

      const newStatus = drone.status === "active" ? "inactive" : "active";
      
      // Оптимистичное обновление
      setDrones(prev => prev.map(d => 
        d.id === droneId ? { ...d, status: newStatus } : d
      ));
      
      await updateDroneStatus(droneId, newStatus);
      
    } catch (err) {
      setError(err.message || "Ошибка изменения статуса");
      await loadData();
    }
  };

  const droneModels = [
    "DJI Mavic 3 Enterprise",
    "DJI Phantom 4 RTK",
    "DJI Matrice 300 RTK",
    "DJI Agras T40",
    "Autel EVO II Pro",
    t('drones.otherModel'),
  ];

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Загрузка дронов...</p>
        </div>
      </div>
    );
  }

  const activeDrones = drones.filter(d => d.status === "active").length;
  const totalDrones = drones.length;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mx-6 mt-4 rounded-r">
          <p>{error}</p>
        </div>
      )}

      {/* Hero Section */}
      <div className="relative pt-20 pb-16 bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-700">
        <div className="relative max-w-7xl mb-10 mx-auto px-6 pt-12">
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
              onClick={() => { resetForm(); setShowAddDrone(true); }}
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
                <p className="text-3xl font-bold text-gray-900">{totalDrones}</p>
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
                <p className="text-3xl font-bold text-gray-900">{activeDrones}</p>
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
              onClick={() => { resetForm(); setShowAddDrone(true); }}
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
                        {drone.model}
                      </h4>
                      <p className="text-sm text-gray-600">
                        Серийный: {drone.serial_number}
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

                {/* Принадлежность ферме */}
                <div className="mb-4">
                  <p className="text-sm text-gray-600">Ферма:</p>
                  <p className="font-medium text-gray-900">
                    {farms.find(f => f.id === drone.farm_id)?.name || "Неизвестно"}
                  </p>
                </div>

                {/* Дата создания */}
                {drone.created_at && (
                  <div className="mb-4">
                    <p className="text-sm text-gray-600">Добавлен:</p>
                    <p className="text-gray-900">
                      {new Date(drone.created_at).toLocaleDateString('ru-RU')}
                    </p>
                  </div>
                )}

                {/* Описание */}
                {drone.description && (
                  <div className="mb-4">
                    <p className="text-sm text-gray-600">Описание:</p>
                    <p className="text-gray-900 text-sm">{drone.description}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleStatus(drone.id);
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
                      handleEditDrone(drone);
                    }}
                    className="p-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
                    title="Редактировать"
                  >
                    <Edit3 className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteDrone(drone.id);
                    }}
                    disabled={deletingId === drone.id}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors disabled:opacity-50"
                    title="Удалить"
                  >
                    {deletingId === drone.id ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Trash2 className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Детали выбранного дрона */}
        {selectedDrone && (
          <div className="mt-8 bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900">
                Детали дрона: {selectedDrone.model}
              </h3>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  selectedDrone.status === "active" ? "bg-green-500 animate-pulse" : "bg-gray-400"
                }`} />
                <span className="text-sm text-gray-600">
                  {selectedDrone.status === "active" ? "ОНЛАЙН" : "ОФФЛАЙН"}
                </span>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Информация</h4>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600">Модель</p>
                    <p className="font-medium">{selectedDrone.model}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Серийный номер</p>
                    <p className="font-mono font-medium">{selectedDrone.serial_number}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Статус</p>
                    <p className={`font-medium ${
                      selectedDrone.status === "active" ? "text-green-600" : "text-gray-600"
                    }`}>
                      {selectedDrone.status === "active" ? "Активен" : "Неактивен"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Дата добавления</p>
                    <p className="font-medium">
                      {new Date(selectedDrone.created_at).toLocaleDateString('ru-RU')}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2">Принадлежность</h4>
                {(() => {
                  const farm = farms.find(f => f.id === selectedDrone.farm_id);
                  return farm ? (
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-600">Ферма</p>
                        <p className="font-medium">{farm.name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Регион</p>
                        <p className="font-medium">{farm.region}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Площадь фермы</p>
                        <p className="font-medium">{farm.area} га</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-500">Информация о ферме не найдена</p>
                  );
                })()}
              </div>
            </div>

            {selectedDrone.description && (
              <div className="mt-6 pt-6 border-t">
                <h4 className="font-medium text-gray-900 mb-2">Описание</h4>
                <p className="text-gray-700">{selectedDrone.description}</p>
              </div>
            )}

            {/* Кнопки управления */}
            {selectedDrone.status === "active" && (
              <div className="mt-6 pt-6 border-t">
                <h4 className="font-medium text-gray-900 mb-4">Управление</h4>
                <div className="flex gap-3">
                  <button
                    type="button"
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    <Camera className="w-5 h-5 inline mr-2" />
                    Запустить камеру
                  </button>
                  <button
                    type="button"
                    className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
                  >
                    <Video className="w-5 h-5 inline mr-2" />
                    Начать запись
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Модальное окно добавления/редактирования дрона */}
      {showAddDrone && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-gray-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6 sticky top-0 bg-white z-10 pb-4 border-b">
              <h3 className="text-xl font-semibold text-gray-900">
                {editingDrone ? "Редактировать дрон" : t('drones.addDrone')}
              </h3>
              <button
                type="button"
                onClick={() => { setShowAddDrone(false); resetForm(); }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  {t('drones.model')} *
                </label>
                <select
                  value={droneData.model}
                  onChange={(e) => setDroneData({ ...droneData, model: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  {t('drones.serialNumber')} *
                </label>
                <input
                  type="text"
                  value={droneData.serial_number}
                  onChange={(e) => setDroneData({ ...droneData, serial_number: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  placeholder="SN-1234567890"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Ферма *
                </label>
                <select
                  value={droneData.farm_id}
                  onChange={(e) => setDroneData({ ...droneData, farm_id: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Выберите ферму</option>
                  {farms.map((farm) => (
                    <option key={farm.id} value={farm.id}>
                      {farm.name} ({farm.region})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Описание (необязательно)
                </label>
                <textarea
                  value={droneData.description}
                  onChange={(e) => setDroneData({ ...droneData, description: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Дополнительная информация о дроне..."
                  rows={3}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Сохранение...
                    </>
                  ) : (
                    <>
                      <Check className="w-5 h-5" />
                      {editingDrone ? "Сохранить изменения" : t('common.save')}
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowAddDrone(false); resetForm(); }}
                  disabled={submitting}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors disabled:opacity-50"
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