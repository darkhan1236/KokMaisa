// src/app/components/ProfileAgronomist.jsx
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from 'react-i18next';
import Header from "@/app/components/Header";
import {
  User,
  MapPin,
  Phone,
  Mail,
  GraduationCap,
  Briefcase,
  Award,
  ChevronRight,
  Wheat,
  BarChart3,
  FileText,
  Calendar,
} from "lucide-react";

export default function ProfileAgronomist() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();

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

  const assignedFarms = user?.profile?.assignedFarms || [];

  // Можно оставить маппинг на русском, если это официальные термины в Казахстане
  // Или полностью перевести через i18n — здесь оставлен гибридный подход
  const educationLabels = {
    bachelor:   t('education.bachelor'),
    master:     t('education.master'),
    phd:        t('education.phd'),
    doctorate:  t('education.doctorate'),
  };

  const specializationLabels = {
    agronomy:        t('specializations.agronomy'),
    livestock:       t('specializations.livestock'),
    soilScience:     t('specializations.soilScience'),
    plantProtection: t('specializations.plantProtection'),
    pasture:         t('specializations.pasture'),
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Hero */}
      <div className="relative pt-20 pb-32 bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-700">
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
                {user.full_name || t('roles.agronomist')}
              </h1>
              <p className="text-white/90 text-xl">{user.email}</p>
              <span className="inline-block mt-4 px-5 py-2 bg-white/25 text-white rounded-full text-lg font-medium backdrop-blur-sm">
                {t('roles.agronomist')}
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
              <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center">
                <Briefcase className="w-7 h-7 text-blue-600" />
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-900">{assignedFarms.length}</p>
                <p className="text-sm text-gray-600">{t('profile.stats.assignedFarms')}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-xl border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-amber-100 rounded-xl flex items-center justify-center">
                <BarChart3 className="w-7 h-7 text-amber-600" />
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-900">0</p>
                <p className="text-sm text-gray-600">{t('profile.stats.analyses')}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-xl border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center">
                <GraduationCap className="w-7 h-7 text-green-600" />
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-900">
                  {user.specializations?.length || 0}
                </p>
                <p className="text-sm text-gray-600">{t('profile.stats.specializations')}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-xl border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center">
                <FileText className="w-7 h-7 text-purple-600" />
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-900">0</p>
                <p className="text-sm text-gray-600">{t('profile.stats.reports')}</p>
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
            {/* Контакты */}
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

            {/* Профессиональная информация */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-5 flex items-center gap-3">
                <GraduationCap className="w-6 h-6 text-blue-600" />
                {t('profile.professionalInfo.title')}
              </h3>
              <div className="space-y-6">
                <div>
                  <p className="text-sm text-gray-600 mb-2">{t('profile.professionalInfo.education')}</p>
                  <p className="text-gray-900 font-medium flex items-center gap-3">
                    <Award className="w-5 h-5 text-blue-600" />
                    {educationLabels[user.education] || user.education || t('common.notSpecified')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-3">{t('profile.professionalInfo.specializations')}</p>
                  <div className="flex flex-wrap gap-2">
                    {user.specializations?.length ? (
                      user.specializations.map((spec) => (
                        <span
                          key={spec}
                          className="px-4 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm font-medium"
                        >
                          {specializationLabels[spec] || spec}
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-500">{t('common.notSpecified')}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Быстрые действия */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-5">
                {t('profile.quickActions.title')}
              </h3>
              <div className="space-y-3">
                <Link
                  to="/pastures-analysis"
                  className="flex items-center justify-between p-4 rounded-xl hover:bg-gray-50 transition-colors group"
                >
                  <div className="flex items-center gap-4">
                    <Wheat className="w-6 h-6 text-amber-600" />
                    <span className="text-gray-900 font-medium">{t('profile.quickActions.pastureAnalysis')}</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-900 transition-colors" />
                </Link>

                <Link
                  to="/biomass-dashboard"
                  className="flex items-center justify-between p-4 rounded-xl hover:bg-gray-50 transition-colors group"
                >
                  <div className="flex items-center gap-4">
                    <BarChart3 className="w-6 h-6 text-purple-600" />
                    <span className="text-gray-900 font-medium">{t('profile.quickActions.biomassDashboard')}</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-900 transition-colors" />
                </Link>

                <Link
                  to="/ai-chat"
                  className="flex items-center justify-between p-4 rounded-xl hover:bg-gray-50 transition-colors group"
                >
                  <div className="flex items-center gap-4">
                    <FileText className="w-6 h-6 text-green-600" />
                    <span className="text-gray-900 font-medium">{t('profile.quickActions.aiConsultant')}</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-900 transition-colors" />
                </Link>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Назначенные фермы */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-2xl font-semibold text-gray-900">
                    {t('profile.assignedFarms.title')}
                  </h3>
                  <p className="text-gray-600 mt-2">
                    {t('profile.assignedFarms.description')}
                  </p>
                </div>
              </div>

              {assignedFarms.length === 0 ? (
                <div className="text-center py-20 bg-gray-50 rounded-2xl">
                  <Briefcase className="w-20 h-20 text-gray-400 mx-auto mb-6" />
                  <p className="text-xl text-gray-700 mb-3">
                    {t('profile.assignedFarms.empty.title')}
                  </p>
                  <p className="text-gray-500 max-w-md mx-auto">
                    {t('profile.assignedFarms.empty.description')}
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {assignedFarms.map((farm) => (
                    <div
                      key={farm.id}
                      className="p-6 bg-gray-50 rounded-2xl border border-gray-200 hover:border-blue-400 transition-all group"
                    >
                      <div className="flex flex-col sm:flex-row items-start justify-between gap-6">
                        <div className="flex-1">
                          <h4 className="text-xl font-semibold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
                            {farm.name}
                          </h4>
                          <div className="space-y-2 text-gray-600">
                            <p className="flex items-center gap-3">
                              <MapPin className="w-5 h-5 text-gray-500" />
                              {farm.location || t('common.notSpecified')}
                            </p>
                            {farm.area && (
                              <p>
                                {t('profile.assignedFarms.area')}:{' '}
                                <span className="text-gray-900 font-medium">
                                  {farm.area} {t('units.ha')}
                                </span>
                              </p>
                            )}
                            {farm.owner && (
                              <p className="flex items-center gap-3">
                                <User className="w-5 h-5 text-gray-500" />
                                {t('profile.assignedFarms.owner')}: {farm.owner}
                              </p>
                            )}
                          </div>
                        </div>
                        <Link
                          to={`/farms/${farm.id}`}
                          className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-sm hover:shadow-md whitespace-nowrap mt-4 sm:mt-0"
                        >
                          {t('common.open')}
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Последняя активность */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
              <h3 className="text-2xl font-semibold text-gray-900 mb-8">
                {t('profile.recentActivity.title')}
              </h3>
              <div className="space-y-6">
                <div className="flex items-start gap-5 p-6 bg-gray-50 rounded-2xl">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center shrink-0">
                    <Calendar className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-lg font-medium text-gray-900 mb-1">
                      {t('profile.recentActivity.welcome.title')}
                    </p>
                    <p className="text-gray-600">
                      {t('profile.recentActivity.welcome.message')}
                    </p>
                    <p className="text-sm text-gray-500 mt-2">
                      {t('common.today')}
                    </p>
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