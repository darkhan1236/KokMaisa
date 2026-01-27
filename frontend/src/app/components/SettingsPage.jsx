// src/app/components/SettingsPage.jsx
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "react-i18next";
import Header from "@/app/components/Header";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import {
  Settings as SettingsIcon,
  User,
  Bell,
  Shield,
  Palette,
  Database,
  Key,
  Mail,
  Phone,
  MapPin,
  Camera,
  Save,
  ChevronRight,
  Moon,
  Sun,
  Monitor,
  HelpCircle,
  ExternalLink,
  Trash2,
  Download,
  Upload,
  Lock,
  Globe,
  Eye,
  EyeOff,
  AlertCircle,
} from "lucide-react";

const API_BASE = '/api';

export default function SettingsPage() {
  const { t } = useTranslation();
  const { user, updateProfile, changePassword, loadUser, uploadProfilePhoto, deleteProfilePhoto } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("profile");
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  
  const fileInputRef = useRef(null);
  
  // Состояния для смены пароля
  const [passwordData, setPasswordData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [showPasswords, setShowPasswords] = useState({
    old: false,
    new: false,
    confirm: false
  });

  // Состояния форм профиля
  const [profileData, setProfileData] = useState({
    full_name: "",
    email: "",
    phone: "",
    country: "",
    city: "",
    education: "",
    specializations: []
  });

  // Показать сообщение
  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: "", text: "" }), 3000);
  };

  // Загружаем данные пользователя при монтировании
  useEffect(() => {
    if (user) {
      setProfileData({
        full_name: user.full_name || "",
        email: user.email || "",
        phone: user.phone || "",
        country: user.country || "",
        city: user.city || "",
        education: user.education || "",
        specializations: user.specializations || []
      });
    }
  }, [user]);

  const [notificationSettings, setNotificationSettings] = useState({
    emailAlerts: true,
    pushNotifications: true,
    smsAlerts: false,
    weeklyReport: true,
    droneAlerts: true,
    biomassAlerts: true,
    weatherAlerts: true,
  });

  const [displaySettings, setDisplaySettings] = useState({
    theme: "light",
    language: "ru",
    mapStyle: "satellite",
    units: "metric",
  });

  const [securitySettings, setSecuritySettings] = useState({
    twoFactorAuth: false,
    sessionTimeout: "30",
    loginNotifications: true,
  });

  // Функция для обработки выбора файла
  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    // Проверяем тип файла
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      showMessage("error", "Неподдерживаемый тип файла. Используйте JPEG, PNG, GIF или WebP");
      return;
    }
    
    // Проверяем размер файла (максимум 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showMessage("error", "Файл слишком большой. Максимальный размер: 5MB");
      return;
    }
    
    setIsUploadingPhoto(true);
    try {
      await uploadProfilePhoto(file);
      showMessage("success", "Фото профиля успешно обновлено");
    } catch (error) {
      showMessage("error", error.message || "Ошибка при загрузке фото");
    } finally {
      setIsUploadingPhoto(false);
      // Очищаем input
      event.target.value = '';
    }
  };

  // Функция для удаления фото
  const handleDeletePhoto = async () => {
    if (!user.profile_photo) return;
    
    if (!window.confirm("Удалить фото профиля?")) return;
    
    setIsUploadingPhoto(true);
    try {
      await deleteProfilePhoto();
      showMessage("success", "Фото профиля удалено");
    } catch (error) {
      showMessage("error", error.message || "Ошибка при удалении фото");
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">
            {t('settings.pleaseLogin') || "Пожалуйста, войдите в систему"}
          </p>
          <Button onClick={() => navigate("/login")}>
            {t('nav.login') || "Войти"}
          </Button>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: "profile",       label: t('settings.tabs.profile') || "Профиль",       icon: User },
    { id: "notifications", label: t('settings.tabs.notifications') || "Уведомления", icon: Bell },
    { id: "display",       label: t('settings.tabs.display') || "Отображение",       icon: Palette },
    { id: "security",      label: t('settings.tabs.security') || "Безопасность",      icon: Shield },
    { id: "data",          label: t('settings.tabs.data') || "Данные",          icon: Database },
  ];

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      // Фильтруем только измененные поля
      const updateData = {};
      Object.keys(profileData).forEach(key => {
        if (JSON.stringify(profileData[key]) !== JSON.stringify(user[key])) {
          updateData[key] = profileData[key];
        }
      });

      if (Object.keys(updateData).length === 0) {
        showMessage("info", t('common.noChanges') || "Нет изменений для сохранения");
        return;
      }

      await updateProfile(updateData);
      showMessage("success", t('settings.profile.saved') || "Профиль успешно обновлен");
      
      // Обновляем данные пользователя
      await loadUser();
    } catch (error) {
      showMessage("error", error.message || t('common.saveError') || "Ошибка при сохранении");
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!passwordData.oldPassword || !passwordData.newPassword) {
      showMessage("error", t('settings.security.fillAllFields') || "Заполните все поля");
      return;
    }
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showMessage("error", t('settings.security.passwordsNotMatch') || "Пароли не совпадают");
      return;
    }
    
    if (passwordData.newPassword.length < 6) {
      showMessage("error", t('settings.security.passwordMinLength') || "Пароль должен быть не менее 6 символов");
      return;
    }

    try {
      await changePassword(passwordData.oldPassword, passwordData.newPassword);
      showMessage("success", t('settings.security.passwordChanged') || "Пароль успешно изменен");
      
      // Очищаем поля
      setPasswordData({
        oldPassword: "",
        newPassword: "",
        confirmPassword: ""
      });
    } catch (error) {
      showMessage("error", error.message || t('settings.security.passwordChangeError') || "Ошибка при изменении пароля");
    }
  };

  const handleSaveNotifications = async () => {
    setIsSaving(true);
    try {
      // Здесь можно добавить вызов API для сохранения настроек уведомлений
      await new Promise((r) => setTimeout(r, 1000)); // временная симуляция
      showMessage("success", t('settings.notifications.saved') || "Настройки уведомлений сохранены");
    } catch (error) {
      showMessage("error", error.message || t('common.saveError') || "Ошибка при сохранении");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveDisplay = async () => {
    setIsSaving(true);
    try {
      // Здесь можно добавить вызов API для сохранения настроек отображения
      await new Promise((r) => setTimeout(r, 1000)); // временная симуляция
      showMessage("success", t('settings.display.saved') || "Настройки отображения сохранены");
      // Если сменили язык → можно вызвать i18n.changeLanguage(displaySettings.language)
    } catch (error) {
      showMessage("error", error.message || t('common.saveError') || "Ошибка при сохранении");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveSecurity = async () => {
    setIsSaving(true);
    try {
      // Здесь можно добавить вызов API для сохранения настроек безопасности
      await new Promise((r) => setTimeout(r, 1000)); // временная симуляция
      showMessage("success", t('settings.security.settingsSaved') || "Настройки безопасности сохранены");
    } catch (error) {
      showMessage("error", error.message || t('common.saveError') || "Ошибка при сохранении");
    } finally {
      setIsSaving(false);
    }
  };

  // Функция для отображения специализаций
  const renderSpecializations = () => {
    if (!profileData.specializations || profileData.specializations.length === 0) {
      return <span className="text-muted-foreground">{t('settings.profile.noSpecializations') || "Специализации не указаны"}</span>;
    }
    return profileData.specializations.map((spec, index) => (
      <Badge key={index} variant="secondary" className="mr-2 mb-2">
        {spec}
      </Badge>
    ));
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero */}
      <div className="relative pt-20 pb-16 bg-gradient-to-br from-slate-600 via-slate-700 to-slate-800">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg ...')] opacity-30" />
        <div className="relative max-w-7xl mx-auto px-6 pt-12">
          <h1 className="text-3xl font-bold text-white mb-2">
            {t('settings.title') || "Настройки"}
          </h1>
          <p className="text-white/80">
            {t('settings.subtitle') || "Управление профилем и настройками аккаунта"}
          </p>
        </div>
      </div>

      {/* Сообщения */}
      {message.text && (
        <div className={`fixed top-20 right-6 z-50 px-6 py-3 rounded-lg shadow-lg transition-all duration-300 ${
          message.type === "success" 
            ? "bg-green-100 border border-green-300 text-green-800" 
            : message.type === "error"
            ? "bg-red-100 border border-red-300 text-red-800"
            : "bg-blue-100 border border-blue-300 text-blue-800"
        }`}>
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span>{message.text}</span>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardContent className="p-4">
                <nav className="space-y-1">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                        activeTab === tab.id
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <tab.icon className="w-5 h-5" />
                        {tab.label}
                      </div>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  ))}
                </nav>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">{t('settings.quickActions') || "Быстрые действия"}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start bg-transparent" size="sm">
                  <HelpCircle className="w-4 h-4 mr-2" />
                  {t('common.help') || "Помощь"}
                </Button>
                <Button variant="outline" className="w-full justify-start bg-transparent" size="sm">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  {t('common.documentation') || "Документация"}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Content Area */}
          <div className="lg:col-span-3">
            {/* Профиль */}
            {activeTab === "profile" && (
              <Card>
                <CardHeader>
                  <CardTitle>{t('settings.profile.title') || "Настройки профиля"}</CardTitle>
                  <CardDescription>
                    {t('settings.profile.description') || "Управление личной информацией"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Аватар */}
                  <div className="flex items-center gap-6">
                    <div className="relative group">
                      <div className="w-24 h-24 rounded-2xl flex items-center justify-center text-white text-3xl font-bold overflow-hidden bg-gradient-to-br from-green-400 to-emerald-600">
                        {user.profile_photo ? (
                          <img 
                            src={`http://127.0.0.1:8000${user.profile_photo}`} 
                            alt={profileData.full_name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              const parent = e.target.parentElement;
                              if (parent) {
                                parent.style.background = 'linear-gradient(135deg, #34D399, #059669)';
                                const span = document.createElement('span');
                                span.textContent = profileData.full_name?.charAt(0)?.toUpperCase() || "U";
                                parent.appendChild(span);
                              }
                            }}
                          />
                        ) : (
                          <span>{profileData.full_name?.charAt(0)?.toUpperCase() || "U"}</span>
                        )}
                      </div>
                      
                      {/* Кнопки для управления фото */}
                      <div className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploadingPhoto}
                            className="p-2 bg-white rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
                            title="Изменить фото"
                          >
                            <Camera className="w-4 h-4 text-gray-700" />
                          </button>
                          
                          {user.profile_photo && (
                            <button
                              type="button"
                              onClick={handleDeletePhoto}
                              disabled={isUploadingPhoto}
                              className="p-2 bg-white rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
                              title="Удалить фото"
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </button>
                          )}
                        </div>
                      </div>
                      
                      {isUploadingPhoto && (
                        <div className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                        </div>
                      )}
                    </div>
                    
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileSelect}
                      accept="image/jpeg,image/png,image/gif,image/webp"
                      className="hidden"
                    />
                    
                    <div>
                      <h3 className="text-lg font-semibold">
                        {profileData.full_name || t('common.user') || "Пользователь"}
                      </h3>
                      <p className="text-muted-foreground">{profileData.email}</p>
                      <Badge className="mt-2">
                        {user.account_type === "farmer"
                          ? t('roles.farmer') || "Фермер"
                          : t('roles.agronomist') || "Агроном"}
                      </Badge>
                      
                      {/* Кнопка загрузки фото (альтернативная) */}
                      <div className="mt-4">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isUploadingPhoto}
                        >
                          {isUploadingPhoto ? (
                            <>
                              <span className="animate-spin mr-2">⟳</span>
                              Загрузка...
                            </>
                          ) : (
                            <>
                              <Camera className="w-4 h-4 mr-2" />
                              {user.profile_photo ? "Изменить фото" : "Загрузить фото"}
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        {t('settings.profile.fullName') || "Полное имя"}
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <input
                          type="text"
                          value={profileData.full_name}
                          onChange={(e) => setProfileData({ ...profileData, full_name: e.target.value })}
                          className="w-full pl-11 pr-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder={t('settings.profile.fullNamePlaceholder') || "Введите ваше полное имя"}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        {t('settings.profile.email') || "Email"}
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <input
                          type="email"
                          value={profileData.email}
                          onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                          className="w-full pl-11 pr-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="email@example.com"
                          disabled
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                          {t('settings.profile.emailReadOnly') || "Только для чтения"}
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        {t('settings.profile.phone') || "Телефон"}
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <input
                          type="tel"
                          value={profileData.phone}
                          onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                          className="w-full pl-11 pr-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="+7 (777) 123-45-67"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        {t('settings.profile.country') || "Страна"}
                      </label>
                      <div className="relative">
                        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <input
                          type="text"
                          value={profileData.country}
                          onChange={(e) => setProfileData({ ...profileData, country: e.target.value })}
                          className="w-full pl-11 pr-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder={t('settings.profile.countryPlaceholder') || "Введите страну"}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        {t('settings.profile.city') || "Город"}
                      </label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <input
                          type="text"
                          value={profileData.city}
                          onChange={(e) => setProfileData({ ...profileData, city: e.target.value })}
                          className="w-full pl-11 pr-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder={t('settings.profile.cityPlaceholder') || "Введите город"}
                        />
                      </div>
                    </div>

                    {user.account_type === "agronomist" && (
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          {t('settings.profile.education') || "Образование"}
                        </label>
                        <input
                          type="text"
                          value={profileData.education}
                          onChange={(e) => setProfileData({ ...profileData, education: e.target.value })}
                          className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder={t('settings.profile.educationPlaceholder') || "Введите образование"}
                        />
                      </div>
                    )}
                  </div>

                  {user.account_type === "agronomist" && (
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        {t('settings.profile.specializations') || "Специализации"}
                      </label>
                      <div className="flex flex-wrap items-center gap-2 p-4 bg-secondary/30 rounded-xl">
                        {renderSpecializations()}
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">
                        {t('settings.profile.specializationsNote') || "Для изменения специализаций обратитесь к администратору"}
                      </p>
                    </div>
                  )}

                  <div className="flex justify-end">
                    <Button onClick={handleSaveProfile} disabled={isSaving}>
                      {isSaving ? (
                        <>
                          <span className="animate-spin mr-2">⟳</span>
                          {t('common.saving') || "Сохранение..."}
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          {t('common.saveChanges') || "Сохранить изменения"}
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Остальные вкладки (уведомления, отображение, безопасность, данные) остаются без изменений */}
            {/* Уведомления */}
            {activeTab === "notifications" && (
              <Card>
                <CardHeader>
                  <CardTitle>{t('settings.notifications.title') || "Уведомления"}</CardTitle>
                  <CardDescription>
                    {t('settings.notifications.description') || "Управление уведомлениями"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* ... остальной код вкладки уведомлений ... */}
                  <div className="flex justify-end">
                    <Button onClick={handleSaveNotifications} disabled={isSaving}>
                      {isSaving ? (
                        <>
                          <span className="animate-spin mr-2">⟳</span>
                          {t('common.saving') || "Сохранение..."}
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          {t('common.saveSettings') || "Сохранить настройки"}
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Отображение */}
            {activeTab === "display" && (
              <Card>
                <CardHeader>
                  <CardTitle>{t('settings.display.title') || "Отображение"}</CardTitle>
                  <CardDescription>
                    {t('settings.display.description') || "Настройки интерфейса"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* ... остальной код вкладки отображения ... */}
                  <div className="flex justify-end">
                    <Button onClick={handleSaveDisplay} disabled={isSaving}>
                      {isSaving ? (
                        <>
                          <span className="animate-spin mr-2">⟳</span>
                          {t('common.saving') || "Сохранение..."}
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          {t('common.saveSettings') || "Сохранить настройки"}
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Безопасность */}
            {activeTab === "security" && (
              <Card>
                <CardHeader>
                  <CardTitle>{t('settings.security.title') || "Безопасность"}</CardTitle>
                  <CardDescription>
                    {t('settings.security.description') || "Настройки безопасности аккаунта"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="p-4 rounded-xl bg-secondary/50">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Key className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{t('settings.security.changePassword') || "Сменить пароль"}</p>
                          <p className="text-sm text-muted-foreground">
                            {t('settings.security.lastChanged') || "Обновите пароль для безопасности"}
                          </p>
                        </div>
                      </div>
                      
                      {/* Форма смены пароля */}
                      <div className="space-y-4 pt-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            {t('settings.security.oldPassword') || "Старый пароль"}
                          </label>
                          <div className="relative">
                            <input
                              type={showPasswords.old ? "text" : "password"}
                              value={passwordData.oldPassword}
                              onChange={(e) => setPasswordData({ ...passwordData, oldPassword: e.target.value })}
                              className="w-full pl-4 pr-10 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                              placeholder={t('settings.security.enterOldPassword') || "Введите старый пароль"}
                            />
                            <button
                              type="button"
                              onClick={() => setShowPasswords({ ...showPasswords, old: !showPasswords.old })}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                              {showPasswords.old ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            {t('settings.security.newPassword') || "Новый пароль"}
                          </label>
                          <div className="relative">
                            <input
                              type={showPasswords.new ? "text" : "password"}
                              value={passwordData.newPassword}
                              onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                              className="w-full pl-4 pr-10 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                              placeholder={t('settings.security.enterNewPassword') || "Введите новый пароль"}
                              minLength={6}
                            />
                            <button
                              type="button"
                              onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                              {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {t('settings.security.passwordRequirements') || "Минимум 6 символов"}
                          </p>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            {t('settings.security.confirmPassword') || "Подтверждение пароля"}
                          </label>
                          <div className="relative">
                            <input
                              type={showPasswords.confirm ? "text" : "password"}
                              value={passwordData.confirmPassword}
                              onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                              className="w-full pl-4 pr-10 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                              placeholder={t('settings.security.confirmNewPassword') || "Подтвердите новый пароль"}
                            />
                            <button
                              type="button"
                              onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                              {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>
                        
                        <Button onClick={handleChangePassword} className="w-full">
                          {t('settings.security.changePassword') || "Сменить пароль"}
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* 2FA */}
                  <div className="flex items-center justify-between p-4 rounded-xl border border-border">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Lock className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{t('settings.security.twoFactorAuth') || "Двухфакторная аутентификация"}</p>
                        <p className="text-sm text-muted-foreground">
                          {t('settings.security.twoFactorAuthDesc') || "Дополнительная защита аккаунта"}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSecuritySettings({ ...securitySettings, twoFactorAuth: !securitySettings.twoFactorAuth })}
                      className={`relative w-12 h-7 rounded-full transition-colors ${
                        securitySettings.twoFactorAuth ? "bg-primary" : "bg-muted"
                      }`}
                    >
                      <div
                        className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                          securitySettings.twoFactorAuth ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex justify-end">
                    <Button onClick={handleSaveSecurity} disabled={isSaving}>
                      {isSaving ? (
                        <>
                          <span className="animate-spin mr-2">⟳</span>
                          {t('common.saving') || "Сохранение..."}
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          {t('common.saveSettings') || "Сохранить настройки"}
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Данные - оставляем как в оригинале */}
            {activeTab === "data" && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>{t('settings.data.title') || "Данные"}</CardTitle>
                    <CardDescription>
                      {t('settings.data.description') || "Управление данными аккаунта"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/50">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                          <Download className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium">{t('settings.data.export') || "Экспорт данных"}</p>
                          <p className="text-sm text-muted-foreground">
                            {t('settings.data.exportDesc') || "Скачайте все ваши данные"}
                          </p>
                        </div>
                      </div>
                      <Button variant="outline">{t('settings.data.exportBtn') || "Экспорт"}</Button>
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/50">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                          <Upload className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium">{t('settings.data.import') || "Импорт данных"}</p>
                          <p className="text-sm text-muted-foreground">
                            {t('settings.data.importDesc') || "Загрузите данные в систему"}
                          </p>
                        </div>
                      </div>
                      <Button variant="outline">{t('settings.data.importBtn') || "Импорт"}</Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-destructive/50">
                  <CardHeader>
                    <CardTitle className="text-destructive">
                      {t('settings.dangerZone.title') || "Опасная зона"}
                    </CardTitle>
                    <CardDescription>
                      {t('settings.dangerZone.description') || "Необратимые действия"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between p-4 rounded-xl bg-destructive/10">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-destructive/20 flex items-center justify-center">
                          <Trash2 className="w-5 h-5 text-destructive" />
                        </div>
                        <div>
                          <p className="font-medium text-destructive">
                            {t('settings.dangerZone.deleteAccount') || "Удаление аккаунта"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {t('settings.dangerZone.deleteWarning') || "Это действие нельзя отменить"}
                          </p>
                        </div>
                      </div>
                      <Button variant="destructive">
                        {t('settings.dangerZone.deleteBtn') || "Удалить аккаунт"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}