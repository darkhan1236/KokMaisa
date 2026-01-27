// src/app/components/ProfileFarmer.jsx
import { useState, useEffect } from "react";
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
  Map as MapIcon,
  Wheat,
  Plane,
  BarChart3,
  Calendar,
  ChevronRight,
  X,
  Loader2,
  Plus,
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";

export default function ProfileFarmer() {
  const { t } = useTranslation();
  const { 
    user, 
    isAuthenticated, 
    loading: authLoading,
    getFarms,
    getPastures,
    getDrones
  } = useAuth();
  const navigate = useNavigate();
  const [selectedFarm, setSelectedFarm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [farms, setFarms] = useState([]);
  const [pastures, setPastures] = useState([]);
  const [drones, setDrones] = useState([]);

  // Загрузка данных при монтировании
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
    try {
      const [farmsData, pasturesData, dronesData] = await Promise.all([
        getFarms(),
        getPastures(),
        getDrones()
      ]);
      
      setFarms(farmsData || []);
      setPastures(pasturesData || []);
      setDrones(dronesData || []);
    } catch (error) {
      console.error("Ошибка загрузки данных профиля:", error);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-green-600 mx-auto mb-4" />
          <p className="text-gray-600">Загрузка профиля...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-2xl shadow-lg max-w-md mx-4">
          <p className="text-gray-600 mb-6 text-lg">{t('profile.pleaseLogin')}</p>
          <Button onClick={() => navigate("/login")}>{t('nav.login')}</Button>
        </div>
      </div>
    );
  }

  const farmMarkers = farms
    .filter((f) => f.coordinates_lat && f.coordinates_lng)
    .map((f) => ({
      lat: parseFloat(f.coordinates_lat),
      lng: parseFloat(f.coordinates_lng),
      title: f.name,
      description: `${f.area || '?'} га | ${f.region || 'Неизвестно'}`,
      type: "farm",
    }));

  const totalArea = farms.reduce((acc, f) => acc + parseFloat(f.area || 0), 0);
  const totalPasturesArea = pastures.reduce((acc, p) => acc + parseFloat(p.area || 0), 0);
  const activeDrones = drones.filter(d => d.status === "active").length;

  // Функция для отображения фото или инициалов
  const renderProfileImage = (containerClass = "w-24 h-24", textClass = "text-3xl") => {
    const initials = user.full_name?.charAt(0)?.toUpperCase() || "U";
    
    if (user.profile_photo) {
      return (
        <div className={`${containerClass} overflow-hidden rounded-2xl border-2 border-white/30 shadow-lg shrink-0`}>
          <img 
            src={`http://127.0.0.1:8000${user.profile_photo}`}
            alt={user.full_name || t('roles.farmer')}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.style.display = 'none';
              const parent = e.target.parentElement;
              if (parent) {
                parent.style.background = 'linear-gradient(135deg, #10B981, #059669)';
                parent.style.display = 'flex';
                parent.style.alignItems = 'center';
                parent.style.justifyContent = 'center';
                const span = document.createElement('span');
                span.className = `${textClass} font-bold text-white`;
                span.textContent = initials;
                parent.appendChild(span);
              }
            }}
          />
        </div>
      );
    }

    return (
      <div className={`${containerClass} bg-gradient-to-br from-green-400 to-emerald-600 rounded-2xl flex items-center justify-center border-2 border-white/30 shadow-lg shrink-0`}>
        <span className={`${textClass} font-bold text-white`}>{initials}</span>
      </div>
    );
  };

  // Функция для маленького фото в контактной информации
  const renderSmallProfileImage = () => {
    const initials = user.full_name?.charAt(0)?.toUpperCase() || "U";
    
    if (user.profile_photo) {
      return (
        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
          <img 
            src={`http://127.0.0.1:8000${user.profile_photo}`}
            alt={user.full_name || t('roles.farmer')}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.style.display = 'none';
              const parent = e.target.parentElement;
              if (parent) {
                parent.style.background = 'linear-gradient(135deg, #10B981, #059669)';
                parent.style.display = 'flex';
                parent.style.alignItems = 'center';
                parent.style.justifyContent = 'center';
                const span = document.createElement('span');
                span.className = 'text-sm font-bold text-white';
                span.textContent = initials;
                parent.appendChild(span);
              }
            }}
          />
        </div>
      );
    }

    return (
      <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-600 rounded-lg flex items-center justify-center flex-shrink-0">
        <span className="text-sm font-bold text-white">{initials}</span>
      </div>
    );
  };

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
            {/* Фото профиля */}
            {renderProfileImage()}
            
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
                {user.full_name || t('roles.farmer')}
              </h1>
              <p className="text-white/90 text-xl">{user.email}</p>
              <div className="flex flex-wrap items-center gap-3 mt-4">
                <span className="inline-block px-5 py-2 bg-white/25 text-white rounded-full text-lg font-medium backdrop-blur-sm">
                  {t('roles.farmer')}
                </span>
                <span className="text-white/80">
                  {user.city || t('common.notSpecified')}, {user.country || 'Казахстан'}
                </span>
              </div>
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
                <p className="text-sm text-gray-600">Фермы</p>
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
                <p className="text-sm text-gray-600">Пастбища</p>
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
                <p className="text-sm text-gray-600">Дроны</p>
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
                  {totalArea.toLocaleString('ru-RU')}
                </p>
                <p className="text-sm text-gray-600">Гектаров</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* ЛЕВАЯ КОЛОНКА - Контактная информация и Быстрые действия */}
          <div className="space-y-6">
            {/* Контактная информация */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Контактная информация</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="flex items-center gap-4">
                  {renderSmallProfileImage()}
                  <div>
                    <p className="text-sm text-gray-500">ФИО</p>
                    <p className="text-gray-900 font-medium">{user.full_name || 'Не указано'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Mail className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="text-gray-900 font-medium">{user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Phone className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Телефон</p>
                    <p className="text-gray-900 font-medium">
                      {user.phone || t('common.notSpecified')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Местоположение</p>
                    <p className="text-gray-900 font-medium">
                      {user.city || t('common.notSpecified')}, {user.country || 'Казахстан'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 pt-3 border-t border-gray-100">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Дата регистрации</p>
                    <p className="text-gray-900 font-medium">
                      {user.created_at ? new Date(user.created_at).toLocaleDateString('ru-RU') : 'Неизвестно'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Быстрые действия */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Быстрые действия</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link
                  to="/farms"
                  className="flex items-center justify-between p-4 rounded-xl hover:bg-gray-50 transition-colors group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <MapIcon className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <span className="text-gray-900 font-medium block">Управлять фермами</span>
                      <span className="text-sm text-gray-500">{farms.length} ферм • {totalArea.toLocaleString('ru-RU')} га</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Plus className="w-4 h-4 text-gray-400 group-hover:text-green-600 transition-colors" />
                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-900 transition-colors" />
                  </div>
                </Link>

                <Link
                  to="/pastures"
                  className="flex items-center justify-between p-4 rounded-xl hover:bg-gray-50 transition-colors group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Wheat className="w-6 h-6 text-amber-600" />
                    </div>
                    <div>
                      <span className="text-gray-900 font-medium block">Пастбища</span>
                      <span className="text-sm text-gray-500">{pastures.length} пастбищ • {totalPasturesArea.toLocaleString('ru-RU')} га</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Plus className="w-4 h-4 text-gray-400 group-hover:text-amber-600 transition-colors" />
                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-900 transition-colors" />
                  </div>
                </Link>

                <Link
                  to="/drones"
                  className="flex items-center justify-between p-4 rounded-xl hover:bg-gray-50 transition-colors group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Plane className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <span className="text-gray-900 font-medium block">Дроны</span>
                      <span className="text-sm text-gray-500">{drones.length} дронов • {activeDrones} активных</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Plus className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-900 transition-colors" />
                  </div>
                </Link>

                <Link
                  to="/biomass-dashboard"
                  className="flex items-center justify-between p-4 rounded-xl hover:bg-gray-50 transition-colors group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <BarChart3 className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <span className="text-gray-900 font-medium block">Анализ биомассы</span>
                      <span className="text-sm text-gray-500">Мониторинг и аналитика</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-900 transition-colors" />
                  </div>
                </Link>

                <Link
                  to="/pastures-map"
                  className="flex items-center justify-between p-4 rounded-xl hover:bg-gray-50 transition-colors group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-cyan-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <MapIcon className="w-6 h-6 text-cyan-600" />
                    </div>
                    <div>
                      <span className="text-gray-900 font-medium block">Карта пастбищ</span>
                      <span className="text-sm text-gray-500">Просмотр на карте</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-900 transition-colors" />
                  </div>
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* ПРАВАЯ КОЛОНКА - Мои фермы и Карта ферм */}
          <div className="lg:col-span-2 space-y-8">
            {/* Мои фермы */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Мои фермы</CardTitle>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-500">
                      {pastures.length} пастбищ • {drones.length} дронов
                    </span>
                    <Link
                      to="/farms"
                      className="text-sm text-green-600 hover:text-green-700 font-medium"
                    >
                      Управлять →
                    </Link>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {farms.length === 0 ? (
                  <div className="text-center py-16">
                    <MapIcon className="w-20 h-20 text-gray-400 mx-auto mb-4" />
                    <p className="text-lg text-gray-600 mb-2">
                      У вас еще нет ферм
                    </p>
                    <p className="text-gray-500 mb-4">
                      Создайте свою первую ферму, чтобы начать
                    </p>
                    <Link
                      to="/farms"
                      className="inline-block px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                    >
                      Добавить ферму
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {farms.map((farm) => {
                      // Находим пастбища этой фермы
                      const farmPastures = pastures.filter(p => p.farm_id === farm.id);
                      // Находим дроны этой фермы
                      const farmDrones = drones.filter(d => d.farm_id === farm.id);
                      
                      return (
                        <div
                          key={farm.id}
                          className="p-6 bg-gray-50 rounded-2xl border border-gray-200 hover:border-green-300 transition-colors cursor-pointer"
                          onClick={() => setSelectedFarm({
                            ...farm,
                            pastures: farmPastures,
                            drones: farmDrones
                          })}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="text-lg font-semibold text-gray-900 mb-2">
                                {farm.name}
                              </h4>
                              <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-3">
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-4 h-4" />
                                  {farm.region || 'Неизвестно'}
                                </span>
                                <span className="font-medium">
                                  {farm.area} га
                                </span>
                                <Badge variant="secondary" className="bg-green-100 text-green-700">
                                  {farmPastures.length} пастбищ
                                </Badge>
                                <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                                  {farmDrones.length} дронов
                                </Badge>
                              </div>
                              {farm.description && (
                                <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                                  {farm.description}
                                </p>
                              )}
                              {farm.farm_type && (
                                <div className="mb-3">
                                  <Badge>{farm.farm_type}</Badge>
                                </div>
                              )}
                              {farm.crops && Array.isArray(farm.crops) && farm.crops.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                  {farm.crops.slice(0, 3).map((crop, index) => (
                                    <Badge key={index} variant="outline" className="text-xs">
                                      {crop}
                                    </Badge>
                                  ))}
                                  {farm.crops.length > 3 && (
                                    <Badge variant="outline" className="text-xs">
                                      +{farm.crops.length - 3}
                                    </Badge>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Карта ферм */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Карта ферм</CardTitle>
                  {farmMarkers.length > 0 && (
                    <span className="text-sm text-gray-500">
                      {farmMarkers.length} ферм на карте
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {farmMarkers.length > 0 ? (
                  <>
                    <LeafletMap
                      center={[
                        parseFloat(farmMarkers[0]?.lat || 51.1605),
                        parseFloat(farmMarkers[0]?.lng || 71.4704),
                      ]}
                      zoom={8}
                      markers={farmMarkers}
                      height="350px"
                    />
                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <div className="bg-green-50 rounded-lg p-3">
                        <p className="text-xs text-green-700">Всего ферм</p>
                        <p className="text-lg font-bold text-green-900">{farms.length}</p>
                      </div>
                      <div className="bg-blue-50 rounded-lg p-3">
                        <p className="text-xs text-blue-700">С координатами</p>
                        <p className="text-lg font-bold text-blue-900">{farmMarkers.length}</p>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-12">
                    <MapIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-2">Нет ферм с координатами</p>
                    <p className="text-sm text-gray-500 mb-4">
                      Добавьте координаты ферм для отображения на карте
                    </p>
                    <Link
                      to="/farms"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm"
                    >
                      <Plus className="w-4 h-4" />
                      Добавить координаты
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Farm Detail Modal */}
      {selectedFarm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="relative h-48 bg-gradient-to-br from-green-500 to-emerald-600 rounded-t-2xl">
              <button
                onClick={() => setSelectedFarm(null)}
                className="absolute top-4 right-4 p-2 bg-white/20 backdrop-blur-sm rounded-lg hover:bg-white/30 transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
              <div className="absolute bottom-4 left-6">
                <h2 className="text-2xl font-bold text-white">{selectedFarm.name}</h2>
                <p className="text-white/80">{selectedFarm.region || 'Неизвестно'}</p>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-green-50 rounded-xl p-4">
                  <p className="text-sm text-green-700">Площадь</p>
                  <p className="text-xl font-bold text-green-900">
                    {selectedFarm.area} га
                  </p>
                </div>
                {selectedFarm.farm_type && (
                  <div className="bg-blue-50 rounded-xl p-4">
                    <p className="text-sm text-blue-700">Тип фермы</p>
                    <p className="text-xl font-bold text-blue-900">
                      {selectedFarm.farm_type}
                    </p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-amber-50 rounded-xl p-4">
                  <p className="text-sm text-amber-700">Пастбища</p>
                  <p className="text-xl font-bold text-amber-900">
                    {selectedFarm.pastures?.length || 0}
                  </p>
                </div>
                <div className="bg-indigo-50 rounded-xl p-4">
                  <p className="text-sm text-indigo-700">Дроны</p>
                  <p className="text-xl font-bold text-indigo-900">
                    {selectedFarm.drones?.length || 0}
                  </p>
                </div>
              </div>

              {selectedFarm.address && (
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-gray-600 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Адрес</p>
                    <p className="text-gray-900">{selectedFarm.address}</p>
                  </div>
                </div>
              )}

              {selectedFarm.owner_name && (
                <div className="flex items-start gap-3">
                  <User className="w-5 h-5 text-gray-600 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Владелец</p>
                    <p className="text-gray-900">{selectedFarm.owner_name}</p>
                  </div>
                </div>
              )}

              {selectedFarm.phone && (
                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-gray-600 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Телефон</p>
                    <p className="text-gray-900">{selectedFarm.phone}</p>
                  </div>
                </div>
              )}

              {selectedFarm.description && (
                <div>
                  <p className="text-sm text-gray-500 mb-2">Описание</p>
                  <p className="text-gray-900">{selectedFarm.description}</p>
                </div>
              )}

              {selectedFarm.crops && Array.isArray(selectedFarm.crops) && selectedFarm.crops.length > 0 && (
                <div>
                  <p className="text-sm text-gray-500 mb-2">Культуры</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedFarm.crops.map((crop, index) => (
                      <Badge key={index}>{crop}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {selectedFarm.equipment && Array.isArray(selectedFarm.equipment) && selectedFarm.equipment.length > 0 && (
                <div>
                  <p className="text-sm text-gray-500 mb-2">Оборудование</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedFarm.equipment.map((equip, index) => (
                      <Badge key={index} variant="secondary">
                        {equip}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {selectedFarm.coordinates_lat && selectedFarm.coordinates_lng && (
                <div>
                  <p className="text-sm text-gray-500 mb-2">Местоположение</p>
                  <LeafletMap
                    center={[
                      parseFloat(selectedFarm.coordinates_lat),
                      parseFloat(selectedFarm.coordinates_lng),
                    ]}
                    zoom={12}
                    markers={[
                      {
                        lat: parseFloat(selectedFarm.coordinates_lat),
                        lng: parseFloat(selectedFarm.coordinates_lng),
                        title: selectedFarm.name,
                      },
                    ]}
                    height="200px"
                  />
                </div>
              )}

              {/* Пастбища фермы */}
              {selectedFarm.pastures && selectedFarm.pastures.length > 0 && (
                <div>
                  <p className="text-sm text-gray-500 mb-2">Пастбища этой фермы</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {selectedFarm.pastures.slice(0, 4).map(pasture => (
                      <div key={pasture.id} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-gray-900 text-sm">{pasture.name}</span>
                          <span className="text-xs text-gray-500">{pasture.area} га</span>
                        </div>
                        {pasture.pasture_type && (
                          <p className="text-xs text-gray-600 mt-1">{pasture.pasture_type}</p>
                        )}
                      </div>
                    ))}
                    {selectedFarm.pastures.length > 4 && (
                      <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 flex items-center justify-center">
                        <span className="text-sm text-gray-500">
                          +{selectedFarm.pastures.length - 4} пастбищ
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <Link
                  to="/farms"
                  onClick={() => setSelectedFarm(null)}
                  className="flex-1 px-6 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors font-medium text-center"
                >
                  Редактировать
                </Link>
                <Button
                  variant="outline"
                  onClick={() => setSelectedFarm(null)}
                  className="px-6"
                >
                  Закрыть
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}