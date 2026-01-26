// src/app/components/FarmsPage.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from 'react-i18next';
import Header from "@/app/components/Header";
import LeafletMap from "@/app/features/map/LeafletMap";
import {
  LandPlot, Plus, X, Check, MapPin, Trash2, Edit3, Eye, Building2, Home, Wheat, Calendar,
  Phone, User, CreditCard, Tractor, Camera, Loader2
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Input } from "@/app/components/ui/input";
import { Textarea } from "@/app/components/ui/textarea";
import "@/app/styles/leaflet-overrides.css";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";

export default function FarmsPage() {
  const { t } = useTranslation();
  const { user, isAuthenticated, getFarms, createFarm, updateFarm, deleteFarm } = useAuth();
  const navigate = useNavigate();

  const [farms, setFarms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const [showAddFarm, setShowAddFarm] = useState(false);
  const [editingFarm, setEditingFarm] = useState(null);
  const [selectedFarm, setSelectedFarm] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    address: "",
    region: "",
    area: "",
    coordinates_lat: "",
    coordinates_lng: "",
    phone: "",
    description: "",
    owner_name: "",
    owner_iin: "",
    farm_type: "",
    established_date: "",
    crops: [],
    equipment: [],
    status: "active",
    photos: []
  });

  // Загрузка ферм
  useEffect(() => {
    if (isAuthenticated) {
      loadFarms();
    }
  }, [isAuthenticated]);

  const loadFarms = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getFarms();
      setFarms(data || []);
    } catch (err) {
      setError(err.message || "Не удалось загрузить фермы");
      console.error(err);
      if (err.message.includes("Сессия истекла")) {
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLocationSelect = (location) => {
    setFormData(prev => ({
      ...prev,
      coordinates_lat: location.lat.toFixed(6),
      coordinates_lng: location.lng.toFixed(6),
    }));
  };

  const resetForm = () => {
    setFormData({
      name: "",
      address: "",
      region: "",
      area: "",
      coordinates_lat: "",
      coordinates_lng: "",
      phone: "",
      description: "",
      owner_name: "",
      owner_iin: "",
      farm_type: "",
      established_date: "",
      crops: [],
      equipment: [],
      status: "active",
      photos: []
    });
    setEditingFarm(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      // Валидация
      if (!formData.name.trim()) throw new Error("Название обязательно");
      if (!formData.region.trim()) throw new Error("Регион обязателен");
      if (!formData.area || isNaN(parseFloat(formData.area)) || parseFloat(formData.area) <= 0) {
        throw new Error("Площадь должна быть положительным числом");
      }

      const payload = {
        name: formData.name.trim(),
        region: formData.region.trim(),
        area: parseFloat(formData.area),
        address: formData.address?.trim() || null,
        description: formData.description?.trim() || null,
        coordinates_lat: formData.coordinates_lat ? parseFloat(formData.coordinates_lat) : null,
        coordinates_lng: formData.coordinates_lng ? parseFloat(formData.coordinates_lng) : null,
        phone: formData.phone?.trim() || null,
        owner_name: formData.owner_name?.trim() || null,
        owner_iin: formData.owner_iin?.trim() || null,
        farm_type: formData.farm_type || null,
        established_date: formData.established_date || null,
        crops: formData.crops.length > 0 ? formData.crops : null,
        equipment: formData.equipment.length > 0 ? formData.equipment : null,
        status: formData.status,
        photos: formData.photos.length > 0 ? formData.photos : null,
      };

      if (editingFarm) {
        await updateFarm(editingFarm.id, payload);
      } else {
        await createFarm(payload);
      }

      resetForm();
      setShowAddFarm(false);
      await loadFarms();
    } catch (err) {
      setError(err.message || "Ошибка при сохранении");
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditFarm = (farm) => {
    setEditingFarm(farm);
    setFormData({
      name: farm.name || "",
      address: farm.address || "",
      region: farm.region || "",
      area: farm.area?.toString() || "",
      coordinates_lat: farm.coordinates_lat?.toString() || "",
      coordinates_lng: farm.coordinates_lng?.toString() || "",
      phone: farm.phone || "",
      description: farm.description || "",
      owner_name: farm.owner_name || "",
      owner_iin: farm.owner_iin || "",
      farm_type: farm.farm_type || "",
      established_date: farm.established_date ? farm.established_date.split('T')[0] : "",
      crops: farm.crops || [],
      equipment: farm.equipment || [],
      status: farm.status || "active",
      photos: farm.photos || []
    });
    setShowAddFarm(true);
  };

  const handleDeleteFarm = async (farmId) => {
    if (!window.confirm(t('farms.confirmDelete') || "Вы уверены, что хотите удалить ферму?")) return;

    try {
      await deleteFarm(farmId);
      await loadFarms();
      if (selectedFarm?.id === farmId) setSelectedFarm(null);
    } catch (err) {
      setError(err.message || "Ошибка удаления");
    }
  };

  // Вычисляемые значения
  const totalArea = farms.reduce((acc, f) => acc + (Number(f.area) || 0), 0);

  const farmMarkers = farms
    .filter(f => f.coordinates_lat != null && f.coordinates_lng != null)
    .map(f => ({
      lat: f.coordinates_lat,
      lng: f.coordinates_lng,
      title: f.name,
      description: `${f.area || '?'} ${t('units.ha')} | ${f.region || t('farms.regionNotSpecified')}`,
      type: "farm",
    }));

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

  const farmTypes = [
    { value: "livestock", label: t('farms.types.livestock') || "Животноводство" },
    { value: "crop", label: t('farms.types.crop') || "Растениеводство" },
    { value: "mixed", label: t('farms.types.mixed') || "Смешанное" },
    { value: "organic", label: t('farms.types.organic') || "Органическое" },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-green-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mx-6 mt-4 rounded-r">
          <p>{error}</p>
        </div>
      )}

      {/* Hero */}
      <div className="relative pt-20 pb-16 bg-gradient-to-br from-green-500 via-emerald-600 to-teal-600">
        <div className="relative max-w-7xl mx-auto px-6 pt-12">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                {t('farms.title')}
              </h1>
              <p className="text-white/90 text-lg">
                {t('farms.subtitle')}
              </p>
            </div>
            <Button
              onClick={() => { resetForm(); setShowAddFarm(true); }}
              className="bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 border border-white/30 shadow-md"
            >
              <Plus className="w-5 h-5 mr-2" />
              {t('farms.addFarm')}
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-10">
        {/* Статистика */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <Card className="border-none shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <LandPlot className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{farms.length}</p>
                  <p className="text-sm text-muted-foreground">{t('farms.stats.farms')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalArea.toFixed(1)}</p>
                  <p className="text-sm text-muted-foreground">{t('farms.stats.hectares')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                  <Wheat className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {farms.filter(f => f.status === 'active').length}
                  </p>
                  <p className="text-sm text-muted-foreground">{t('farms.stats.active')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {new Set(farms.map(f => f.region).filter(Boolean)).size}
                  </p>
                  <p className="text-sm text-muted-foreground">{t('farms.stats.regions')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Модальное окно добавления / редактирования */}
        {showAddFarm && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl p-6 w-full max-w-4xl shadow-2xl border border-gray-200 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6 sticky top-0 bg-white z-10 pb-4 border-b">
                <h3 className="text-2xl font-bold text-gray-900">
                  {editingFarm ? t('farms.editFarm') : t('farms.addFarm')}
                </h3>
                <button
                  onClick={() => { setShowAddFarm(false); resetForm(); }}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-6 h-6 text-gray-600" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Основная информация */}
                <section>
                  <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <LandPlot className="w-5 h-5 text-green-600" />
                    Основная информация
                  </h4>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Название фермы *
                      </label>
                      <Input
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Например: Ферма Жасыл Дала"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Регион *
                      </label>
                      <Select
                        value={formData.region}
                        onValueChange={value => setFormData({ ...formData, region: value })}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Выберите регион" />
                        </SelectTrigger>
                        <SelectContent>
                          {regions.map(r => (
                            <SelectItem key={r} value={r}>{r}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Площадь (га) *
                      </label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.area}
                        onChange={e => setFormData({ ...formData, area: e.target.value })}
                        placeholder="250.5"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Тип хозяйства
                      </label>
                      <Select
                        value={formData.farm_type}
                        onValueChange={value => setFormData({ ...formData, farm_type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Выберите тип" />
                        </SelectTrigger>
                        <SelectContent>
                          {farmTypes.map(type => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Дата основания
                      </label>
                      <Input
                        type="date"
                        value={formData.established_date}
                        onChange={e => setFormData({ ...formData, established_date: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Статус
                      </label>
                      <Select
                        value={formData.status}
                        onValueChange={value => setFormData({ ...formData, status: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Активно</SelectItem>
                          <SelectItem value="inactive">Неактивно</SelectItem>
                          <SelectItem value="seasonal">Сезонное</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </section>

                {/* Контакты и владелец */}
                <section>
                  <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <Phone className="w-5 h-5 text-blue-600" />
                    Контакты и владелец
                  </h4>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Телефон
                      </label>
                      <Input
                        type="tel"
                        value={formData.phone}
                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+7 (777) 123-45-67"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Имя владельца
                      </label>
                      <Input
                        value={formData.owner_name}
                        onChange={e => setFormData({ ...formData, owner_name: e.target.value })}
                        placeholder="Иванов Иван Иванович"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        ИИН владельца
                      </label>
                      <Input
                        value={formData.owner_iin}
                        onChange={e => setFormData({ ...formData, owner_iin: e.target.value })}
                        placeholder="900101300123"
                        maxLength={12}
                      />
                    </div>
                  </div>
                </section>

                {/* Адрес и описание */}
                <section>
                  <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-red-600" />
                    Адрес и описание
                  </h4>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Адрес
                      </label>
                      <Input
                        value={formData.address}
                        onChange={e => setFormData({ ...formData, address: e.target.value })}
                        placeholder="Қарағанды қаласы, Абай ауданы, ауыл Қарағанды"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Описание фермы
                      </label>
                      <Textarea
                        value={formData.description}
                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Краткое описание: виды культур, техника, особенности..."
                        rows={4}
                      />
                    </div>
                  </div>
                </section>

                {/* GPS */}
                <section>
                  <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-purple-600" />
                    Местоположение на карте
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Широта (latitude)
                      </label>
                      <Input
                        value={formData.coordinates_lat}
                        onChange={e => setFormData({ ...formData, coordinates_lat: e.target.value })}
                        placeholder="49.8047"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Долгота (longitude)
                      </label>
                      <Input
                        value={formData.coordinates_lng}
                        onChange={e => setFormData({ ...formData, coordinates_lng: e.target.value })}
                        placeholder="73.1094"
                      />
                    </div>
                  </div>

                  <div className="mt-4">
                    <LeafletMap
                      center={[43.238949, 76.945465]}
                      zoom={6}
                      selectable={true}
                      onLocationSelect={handleLocationSelect}
                      height="300px"
                      markers={farmMarkers}
                    />
                  </div>
                </section>

                {/* Кнопки */}
                <div className="flex flex-col sm:flex-row gap-4 pt-8 border-t">
                  <Button
                    type="submit"
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Сохранение...
                      </>
                    ) : (
                      <>
                        <Check className="w-5 h-5 mr-2" />
                        {editingFarm ? "Сохранить изменения" : "Добавить ферму"}
                      </>
                    )}
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 sm:flex-none sm:w-40"
                    onClick={() => { setShowAddFarm(false); resetForm(); }}
                    disabled={submitting}
                  >
                    Отмена
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Модальное окно просмотра фермы */}
        {selectedFarm && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="relative h-56 bg-gradient-to-br from-green-600 to-emerald-700 rounded-t-2xl">
                <button
                  onClick={() => setSelectedFarm(null)}
                  className="absolute top-4 right-4 p-3 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-colors"
                >
                  <X className="w-6 h-6 text-white" />
                </button>
                <div className="absolute bottom-6 left-6 right-6">
                  <h2 className="text-3xl font-bold text-white mb-1">
                    {selectedFarm.name}
                  </h2>
                  <p className="text-white/90 text-lg flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    {selectedFarm.region || t('farms.regionNotSpecified')}
                  </p>
                </div>
              </div>

              <div className="p-6 space-y-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="bg-green-50 p-5 rounded-xl border border-green-100">
                    <p className="text-sm text-green-700 font-medium mb-1">Площадь</p>
                    <p className="text-3xl font-bold text-green-900">
                      {selectedFarm.area} <span className="text-xl">га</span>
                    </p>
                  </div>

                  <div className="bg-blue-50 p-5 rounded-xl border border-blue-100">
                    <p className="text-sm text-blue-700 font-medium mb-1">Статус</p>
                    <Badge variant={selectedFarm.status === 'active' ? "default" : "secondary"} className="text-lg px-4 py-1">
                      {selectedFarm.status === 'active' ? 'Активно' : selectedFarm.status}
                    </Badge>
                  </div>

                  {selectedFarm.farm_type && (
                    <div className="bg-purple-50 p-5 rounded-xl border border-purple-100">
                      <p className="text-sm text-purple-700 font-medium mb-1">Тип</p>
                      <p className="text-xl font-bold text-purple-900 capitalize">
                        {selectedFarm.farm_type}
                      </p>
                    </div>
                  )}
                </div>

                <div className="space-y-6">
                  {selectedFarm.address && (
                    <div className="flex items-start gap-4">
                      <MapPin className="w-6 h-6 text-gray-600 mt-1" />
                      <div>
                        <p className="text-sm text-gray-500">Адрес</p>
                        <p className="text-gray-900">{selectedFarm.address}</p>
                      </div>
                    </div>
                  )}

                  {selectedFarm.phone && (
                    <div className="flex items-start gap-4">
                      <Phone className="w-6 h-6 text-gray-600 mt-1" />
                      <div>
                        <p className="text-sm text-gray-500">Телефон</p>
                        <p className="text-gray-900">{selectedFarm.phone}</p>
                      </div>
                    </div>
                  )}

                  {selectedFarm.owner_name && (
                    <div className="flex items-start gap-4">
                      <User className="w-6 h-6 text-gray-600 mt-1" />
                      <div>
                        <p className="text-sm text-gray-500">Владелец</p>
                        <p className="text-gray-900">{selectedFarm.owner_name}</p>
                        {selectedFarm.owner_iin && (
                          <p className="text-sm text-gray-600 mt-1">
                            ИИН: <span className="font-mono">{selectedFarm.owner_iin}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {selectedFarm.description && (
                    <div className="pt-2">
                      <p className="text-sm text-gray-500 mb-2">Описание</p>
                      <p className="text-gray-900 whitespace-pre-line leading-relaxed">
                        {selectedFarm.description}
                      </p>
                    </div>
                  )}

                  {selectedFarm.coordinates_lat && selectedFarm.coordinates_lng && (
                    <div className="pt-4">
                      <p className="text-sm text-gray-500 mb-3">Местоположение</p>
                      <div className="rounded-xl overflow-hidden border border-gray-200 shadow-sm">
                        <LeafletMap
                          center={[selectedFarm.coordinates_lat, selectedFarm.coordinates_lng]}
                          zoom={13}
                          markers={[{
                            lat: selectedFarm.coordinates_lat,
                            lng: selectedFarm.coordinates_lng,
                            title: selectedFarm.name,
                          }]}
                          height="300px"
                        />
                      </div>
                    </div>
                  )}

                  {(selectedFarm.crops?.length > 0 || selectedFarm.equipment?.length > 0) && (
                    <div className="pt-4 grid md:grid-cols-2 gap-6">
                      {selectedFarm.crops?.length > 0 && (
                        <div>
                          <h5 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
                            <Wheat className="w-5 h-5 text-amber-600" />
                            Культуры
                          </h5>
                          <div className="flex flex-wrap gap-2">
                            {selectedFarm.crops.map((crop, i) => (
                              <Badge key={i} variant="outline" className="px-3 py-1">
                                {crop}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {selectedFarm.equipment?.length > 0 && (
                        <div>
                          <h5 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
                            <Tractor className="w-5 h-5 text-blue-600" />
                            Техника
                          </h5>
                          <div className="flex flex-wrap gap-2">
                            {selectedFarm.equipment.map((eq, i) => (
                              <Badge key={i} variant="secondary" className="px-3 py-1">
                                {eq}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex gap-4 pt-6 border-t">
                  <Button
                    onClick={() => {
                      handleEditFarm(selectedFarm);
                      setSelectedFarm(null);
                    }}
                    className="flex-1 bg-amber-600 hover:bg-amber-700"
                  >
                    <Edit3 className="w-4 h-4 mr-2" />
                    Редактировать
                  </Button>

                  <Button
                    variant="destructive"
                    onClick={() => handleDeleteFarm(selectedFarm.id)}
                    className="flex-1"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Удалить
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Список ферм и карта */}
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl">Карта ферм</CardTitle>
              </CardHeader>
              <CardContent className="p-2">
                <div className="rounded-xl overflow-hidden border border-gray-200">
                  <LeafletMap
                    center={
                      farmMarkers.length > 0
                        ? [farmMarkers[0].lat, farmMarkers[0].lng]
                        : [48.0, 68.0]
                    }
                    zoom={farmMarkers.length > 0 ? 6 : 5}
                    markers={farmMarkers}
                    height="500px"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl">Мои фермы</CardTitle>
              </CardHeader>
              <CardContent>
                {farms.length === 0 ? (
                  <div className="text-center py-16">
                    <LandPlot className="w-20 h-20 text-gray-300 mx-auto mb-6" />
                    <p className="text-xl font-medium text-gray-600 mb-3">
                      У вас пока нет ферм
                    </p>
                    <p className="text-gray-500 mb-6">
                      Добавьте свою первую ферму, чтобы начать работу
                    </p>
                    <Button
                      onClick={() => { resetForm(); setShowAddFarm(true); }}
                      size="lg"
                    >
                      <Plus className="w-5 h-5 mr-2" />
                      Добавить ферму
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {farms.map(farm => (
                      <div
                        key={farm.id}
                        className="p-5 rounded-xl border hover:border-green-300 bg-white shadow-sm cursor-pointer transition-all hover:shadow-md"
                        onClick={() => setSelectedFarm(farm)}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center flex-wrap gap-3 mb-3">
                              <h4 className="font-semibold text-xl">{farm.name}</h4>
                              <Badge variant="secondary" className="text-base px-3 py-1">
                                {farm.area} га
                              </Badge>
                              {farm.status && (
                                <Badge
                                  variant={farm.status === 'active' ? "default" : "secondary"}
                                  className="text-sm"
                                >
                                  {farm.status === 'active' ? 'Активно' : farm.status}
                                </Badge>
                              )}
                              {farm.farm_type && (
                                <Badge variant="outline" className="text-sm">
                                  {farm.farm_type}
                                </Badge>
                              )}
                            </div>

                            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-600">
                              {farm.region && (
                                <span className="flex items-center gap-1.5">
                                  <MapPin className="w-4 h-4" />
                                  {farm.region}
                                </span>
                              )}
                              {farm.address && (
                                <span className="flex items-center gap-1.5">
                                  <Building2 className="w-4 h-4" />
                                  {farm.address}
                                </span>
                              )}
                              {farm.created_at && (
                                <span className="flex items-center gap-1.5">
                                  <Calendar className="w-4 h-4" />
                                  {new Date(farm.created_at).toLocaleDateString('ru-RU')}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-col sm:flex-row gap-2">
                            <button
                              onClick={e => { e.stopPropagation(); setSelectedFarm(farm); }}
                              className="p-2.5 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Просмотр"
                            >
                              <Eye className="w-5 h-5 text-blue-600" />
                            </button>
                            <button
                              onClick={e => { e.stopPropagation(); handleEditFarm(farm); }}
                              className="p-2.5 hover:bg-amber-50 rounded-lg transition-colors"
                              title="Редактировать"
                            >
                              <Edit3 className="w-5 h-5 text-amber-600" />
                            </button>
                            <button
                              onClick={e => { e.stopPropagation(); handleDeleteFarm(farm.id); }}
                              className="p-2.5 hover:bg-red-50 rounded-lg transition-colors"
                              title="Удалить"
                            >
                              <Trash2 className="w-5 h-5 text-red-600" />
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
            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg">Быстрые действия</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  className="w-full justify-start text-left"
                  onClick={() => { resetForm(); setShowAddFarm(true); }}
                >
                  <Plus className="w-5 h-5 mr-3" />
                  Добавить ферму
                </Button>

                <Button
                  variant="outline"
                  className="w-full justify-start text-left"
                  onClick={() => navigate("/")}
                >
                  <Home className="w-5 h-5 mr-3" />
                  На главную
                </Button>
              </CardContent>
            </Card>

            {/* Можно добавить ещё блок со статистикой по регионам или типам */}
          </div>
        </div>
      </div>
    </div>
  );
}