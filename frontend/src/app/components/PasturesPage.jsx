// src/app/components/PasturesPage.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from 'react-i18next';
import Header from "@/app/components/Header";
import LeafletMap from "@/app/features/map/LeafletMap";
import "@/app/styles/leaflet-overrides.css";
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
  Loader2,
  Edit3,
} from "lucide-react";

export default function PasturesPage() {
  const { t } = useTranslation();
  const { 
    user, 
    isAuthenticated, 
    loading: authLoading,
    getFarms,
    getPastures, 
    createPasture, 
    updatePasture, 
    deletePasture 
  } = useAuth();
  
  const navigate = useNavigate();

  const [pastures, setPastures] = useState([]);
  const [farms, setFarms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const [showAddPasture, setShowAddPasture] = useState(false);
  const [editingPasture, setEditingPasture] = useState(null);
  const [selectedPasture, setSelectedPasture] = useState(null);

  const [pastureData, setPastureData] = useState({
    name: "",
    farm_id: "",
    area: "",
    pasture_type: "",
    coordinates_lat: "",
    coordinates_lng: "",
    description: "",
    status: "active",
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
      const [pasturesData, farmsData] = await Promise.all([
        getPastures(),
        getFarms()
      ]);
      
      setPastures(pasturesData || []);
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

  const handleLocationSelect = (location) => {
    setPastureData(prev => ({
      ...prev,
      coordinates_lat: location.lat.toFixed(6),
      coordinates_lng: location.lng.toFixed(6),
    }));
  };

  const resetForm = () => {
    setPastureData({
      name: "",
      farm_id: "",
      area: "",
      pasture_type: "",
      coordinates_lat: "",
      coordinates_lng: "",
      description: "",
      status: "active",
    });
    setEditingPasture(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      // Валидация
      if (!pastureData.name.trim()) throw new Error("Название обязательно");
      if (!pastureData.farm_id) throw new Error("Выберите ферму");
      if (!pastureData.area || isNaN(parseFloat(pastureData.area)) || parseFloat(pastureData.area) <= 0) {
        throw new Error("Площадь должна быть положительным числом");
      }

      const payload = {
        name: pastureData.name.trim(),
        farm_id: parseInt(pastureData.farm_id),
        area: parseFloat(pastureData.area),
        pasture_type: pastureData.pasture_type || null,
        coordinates_lat: pastureData.coordinates_lat ? parseFloat(pastureData.coordinates_lat) : null,
        coordinates_lng: pastureData.coordinates_lng ? parseFloat(pastureData.coordinates_lng) : null,
        description: pastureData.description?.trim() || null,
        status: pastureData.status,
      };

      if (editingPasture) {
        await updatePasture(editingPasture.id, payload);
      } else {
        await createPasture(payload);
      }

      resetForm();
      setShowAddPasture(false);
      await loadData();
    } catch (err) {
      setError(err.message || "Ошибка при сохранении");
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditPasture = (pasture) => {
    setEditingPasture(pasture);
    setPastureData({
      name: pasture.name || "",
      farm_id: pasture.farm_id?.toString() || "",
      area: pasture.area?.toString() || "",
      pasture_type: pasture.pasture_type || "",
      coordinates_lat: pasture.coordinates_lat?.toString() || "",
      coordinates_lng: pasture.coordinates_lng?.toString() || "",
      description: pasture.description || "",
      status: pasture.status || "active",
    });
    setShowAddPasture(true);
  };

  const handleDeletePasture = async (pastureId) => {
    if (!window.confirm(t('pastures.confirmDelete') || "Вы уверены, что хотите удалить пастбище?")) {
      return;
    }

    try {
      // Оптимистичное обновление UI - удаляем сразу
      setPastures(prev => {
        const updated = prev.filter(p => p.id !== pastureId);
        return updated;
      });
      
      // Снимаем выделение если удаляем выбранное пастбище
      if (selectedPasture?.id === pastureId) {
        setSelectedPasture(null);
      }
      
      // Выполняем запрос на удаление на сервере
      await deletePasture(pastureId);
      
      // Обновляем статистику
      // Можно также добавить уведомление об успехе
      console.log("Пастбище успешно удалено");
      
    } catch (err) {
      // Если ошибка - показываем сообщение и восстанавливаем данные
      setError(err.message || "Ошибка удаления");
      console.error("Ошибка удаления:", err);
      
      // Перезагружаем данные с сервера чтобы синхронизировать состояние
      await loadData();
    }
  };

  // Статистика
  const totalArea = pastures.reduce((acc, p) => acc + parseFloat(p.area || 0), 0);
  const avgBiomass = pastures.length > 0 ? 1850 : 0; // Заглушка

  const pastureMarkers = pastures
    .filter((p) => p.coordinates_lat && p.coordinates_lng)
    .map((p) => ({
      lat: parseFloat(p.coordinates_lat),
      lng: parseFloat(p.coordinates_lng),
      title: p.name,
      description: `${p.area} га | ${p.pasture_type || 'Без типа'}`,
      type: "pasture",
    }));

  const grassTypes = [
    "Люцерна",
    "Клевер",
    "Тимофеевка",
    "Овсяница",
    "Костер",
    "Пырей",
    "Смешанный",
  ];

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-green-600 mx-auto mb-4" />
          <p className="text-gray-600">Загрузка...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mx-6 mt-4 rounded-r">
          <p>{error}</p>
        </div>
      )}

      {/* Hero Section */}
      <div className="relative pt-20 pb-16 bg-gradient-to-br from-amber-500 via-amber-600 to-orange-600">
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
              onClick={() => { resetForm(); setShowAddPasture(true); }}
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
                  {farms.length}
                </p>
                <p className="text-sm text-gray-600">Фермы</p>
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
              <div className="rounded-xl overflow-hidden border border-gray-200">
                <LeafletMap
                  center={
                    pastureMarkers.length > 0
                      ? [pastureMarkers[0].lat, pastureMarkers[0].lng]
                      : [48.0, 68.0]
                  }
                  zoom={pastureMarkers.length > 0 ? 8 : 6}
                  markers={pastureMarkers}
                  height="400px"
                />
              </div>
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
                    onClick={() => { resetForm(); setShowAddPasture(true); }}
                    className="text-green-600 hover:underline font-medium"
                  >
                    {t('pastures.addFirstPasture')}
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {pastures.map((pasture) => (
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
                          <div className="flex items-center flex-wrap gap-3 mb-2">
                            <h4 className="font-semibold text-gray-900">{pasture.name}</h4>
                            <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                              {pasture.area} га
                            </span>
                            {pasture.status && (
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                pasture.status === 'active' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                              }`}>
                                {pasture.status === 'active' ? 'Активно' : pasture.status}
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-600">
                            {pasture.pasture_type && (
                              <span className="flex items-center gap-1.5">
                                <Wheat className="w-4 h-4" />
                                {pasture.pasture_type}
                              </span>
                            )}
                            {pasture.created_at && (
                              <span>
                                Создано: {new Date(pasture.created_at).toLocaleDateString('ru-RU')}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-2">
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
                              handleEditPasture(pasture);
                            }}
                            className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                            title="Редактировать"
                          >
                            <Edit3 className="w-5 h-5" />
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
                  ))}
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
                    {selectedPasture.pasture_type && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Тип травы</span>
                        <span className="font-medium text-gray-900">
                          {selectedPasture.pasture_type}
                        </span>
                      </div>
                    )}
                    {selectedPasture.description && (
                      <div className="pt-2">
                        <span className="text-gray-600 block mb-1">Описание</span>
                        <p className="text-gray-900 text-sm">
                          {selectedPasture.description}
                        </p>
                      </div>
                    )}
                    {selectedPasture.created_at && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Создано</span>
                        <span className="font-medium text-gray-900">
                          {new Date(selectedPasture.created_at).toLocaleDateString('ru-RU')}
                        </span>
                      </div>
                    )}
                  </div>

                  {selectedPasture.coordinates_lat && selectedPasture.coordinates_lng && (
                    <div className="mt-6">
                      <p className="text-sm text-gray-600 mb-2">Местоположение</p>
                      <div className="rounded-xl overflow-hidden border border-gray-200">
                        <LeafletMap
                          center={[
                            parseFloat(selectedPasture.coordinates_lat),
                            parseFloat(selectedPasture.coordinates_lng)
                          ]}
                          zoom={13}
                          markers={[{
                            lat: parseFloat(selectedPasture.coordinates_lat),
                            lng: parseFloat(selectedPasture.coordinates_lng),
                            title: selectedPasture.name,
                          }]}
                          height="200px"
                        />
                      </div>
                    </div>
                  )}
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

      {/* Модальное окно добавления/редактирования пастбища */}
      {showAddPasture && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl shadow-2xl border border-gray-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6 sticky top-0 bg-white z-10 pb-4 border-b">
              <h3 className="text-xl font-semibold text-gray-900">
                {editingPasture ? "Редактировать пастбище" : t('pastures.addPasture')}
              </h3>
              <button
                type="button"
                onClick={() => { setShowAddPasture(false); resetForm(); }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
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
                    {t('pastures.farm')} *
                  </label>
                  <select
                    value={pastureData.farm_id}
                    onChange={(e) => setPastureData({ ...pastureData, farm_id: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
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
                    step="0.01"
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
                    value={pastureData.pasture_type}
                    onChange={(e) => setPastureData({ ...pastureData, pasture_type: e.target.value })}
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

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Описание
                  </label>
                  <textarea
                    value={pastureData.description}
                    onChange={(e) => setPastureData({ ...pastureData, description: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Краткое описание пастбища..."
                    rows={3}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  {t('pastures.coordinates')}
                </label>
                <div className="flex gap-2 mb-4">
                  <input
                    type="text"
                    value={pastureData.coordinates_lat}
                    onChange={(e) =>
                      setPastureData({
                        ...pastureData,
                        coordinates_lat: e.target.value,
                      })
                    }
                    className="w-1/2 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 font-mono text-sm"
                    placeholder={t('pastures.latitude')}
                  />
                  <input
                    type="text"
                    value={pastureData.coordinates_lng}
                    onChange={(e) =>
                      setPastureData({
                        ...pastureData,
                        coordinates_lng: e.target.value,
                      })
                    }
                    className="w-1/2 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 font-mono text-sm"
                    placeholder={t('pastures.longitude')}
                  />
                </div>

                <div className="rounded-xl overflow-hidden border border-gray-200">
                  <LeafletMap
                    center={[48.0, 68.0]}
                    zoom={6}
                    selectable={true}
                    onLocationSelect={handleLocationSelect}
                    height="250px"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Сохранение...
                    </>
                  ) : (
                    <>
                      <Check className="w-5 h-5" />
                      {editingPasture ? "Сохранить изменения" : t('common.save')}
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowAddPasture(false); resetForm(); }}
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