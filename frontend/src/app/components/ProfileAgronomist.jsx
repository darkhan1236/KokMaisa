import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { 
  Leaf, 
  LogOut, 
  User, 
  MapPin, 
  Phone, 
  Mail,
  GraduationCap,
  Briefcase,
  Award
} from "lucide-react";
import { LanguageSwitcher } from "@/app/components/LanguageSwitcher";

export function ProfileAgronomist() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  if (!user) return null;

  // Получаем образование и специализации
  const educationLabels = {
    bachelor: { ru: "Бакалавр", kk: "Бакалавр", en: "Bachelor" },
    master: { ru: "Магистр", kk: "Магистр", en: "Master" },
    phd: { ru: "Кандидат наук", kk: "Ғылым кандидаты", en: "PhD" },
    doctorate: { ru: "Доктор наук", kk: "Ғылым докторы", en: "Doctorate" }
  };

  const specializationLabels = {
    agronomy: { ru: "Агрономия", kk: "Агрономия", en: "Agronomy" },
    livestock: { ru: "Животноводство", kk: "Мал шаруашылығы", en: "Livestock" },
    soilScience: { ru: "Почвоведение", kk: "Топырақтану", en: "Soil Science" },
    plantProtection: { ru: "Защита растений", kk: "Өсімдіктерді қорғау", en: "Plant Protection" },
    pasture: { ru: "Пастбищное хозяйство", kk: "Жайылым шаруашылығы", en: "Pasture Management" }
  };

  const currentLang = 'ru'; // можно получить из i18n

  const assignedFarms = user?.profile?.assignedFarms || [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center">
                <Leaf className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl text-gray-900">KokMaisa</h1>
                <p className="text-sm text-gray-500">Профиль агронома</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <LanguageSwitcher />
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-red-600 transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span className="hidden md:inline">Выход</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Profile Info */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="text-center mb-6">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-400 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="w-12 h-12 text-white" />
                </div>
                <h2 className="text-2xl text-gray-900 mb-1">{user.fullName}</h2>
                <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                  Агроном
                </span>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="text-gray-900">{user.email}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Телефон</p>
                    <p className="text-gray-900">{user.phone}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Местоположение</p>
                    <p className="text-gray-900">{user.city}, {user.country}</p>
                  </div>
                </div>
              </div>

              {/* Professional Info */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-blue-600" />
                  Профессиональная информация
                </h3>

                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Award className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">Образование</p>
                      <p className="text-gray-900">
                        {educationLabels[user.education]?.[currentLang] || user.education}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Briefcase className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500 mb-2">Специализации</p>
                      <div className="flex flex-wrap gap-2">
                        {user.specializations?.map((spec) => (
                          <span
                            key={spec}
                            className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium"
                          >
                            {specializationLabels[spec]?.[currentLang] || spec}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Assigned Farms */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Назначенные фермы</h3>
                <p className="text-gray-500 text-sm mt-1">
                  Фермы, к которым у вас есть доступ
                </p>
              </div>

              {assignedFarms.length === 0 ? (
                <div className="text-center py-12">
                  <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg mb-2">У вас пока нет назначенных ферм</p>
                  <p className="text-gray-400">
                    Фермеры могут пригласить вас для работы на их фермах
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {assignedFarms.map((farm) => (
                    <div key={farm.id} className="p-6 border border-gray-200 rounded-xl hover:border-blue-300 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="text-lg font-semibold text-gray-900 mb-2">{farm.name}</h4>
                          <div className="space-y-1 text-sm text-gray-600">
                            <p className="flex items-center gap-2">
                              <MapPin className="w-4 h-4" />
                              {farm.location}
                            </p>
                            {farm.area && (
                              <p>Площадь: {farm.area} га</p>
                            )}
                            {farm.owner && (
                              <p className="text-gray-500">
                                Владелец: {farm.owner}
                              </p>
                            )}
                          </div>
                        </div>

                        <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
                          Открыть
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Statistics */}
            <div className="mt-8 grid md:grid-cols-3 gap-4">
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <Briefcase className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{assignedFarms.length}</p>
                    <p className="text-sm text-gray-500">Ферм</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Award className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">0</p>
                    <p className="text-sm text-gray-500">Анализов</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <GraduationCap className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {user.specializations?.length || 0}
                    </p>
                    <p className="text-sm text-gray-500">Специализаций</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
