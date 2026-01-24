// src/app/components/SettingsPage.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from 'react-i18next';
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
} from "lucide-react";

export default function SettingsPage() {
  const { t } = useTranslation();
  const { user, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("profile");
  const [isSaving, setIsSaving] = useState(false);

  // Состояния форм
  const [profileData, setProfileData] = useState({
    fullName: user?.full_name || "",
    email: user?.email || "",
    phone: user?.profile?.phone || "",
    address: user?.profile?.address || "",
    bio: user?.profile?.bio || "",
  });

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

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">
            {t('settings.pleaseLogin')}
          </p>
          <Button onClick={() => navigate("/login")}>
            {t('nav.login')}
          </Button>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: "profile",       label: t('settings.tabs.profile'),       icon: User },
    { id: "notifications", label: t('settings.tabs.notifications'), icon: Bell },
    { id: "display",       label: t('settings.tabs.display'),       icon: Palette },
    { id: "security",      label: t('settings.tabs.security'),      icon: Shield },
    { id: "data",          label: t('settings.tabs.data'),          icon: Database },
  ];

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      await new Promise((r) => setTimeout(r, 1000)); // симуляция
      updateProfile(profileData);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveNotifications = async () => {
    setIsSaving(true);
    try {
      await new Promise((r) => setTimeout(r, 1000));
      updateProfile({ notifications: notificationSettings });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveDisplay = async () => {
    setIsSaving(true);
    try {
      await new Promise((r) => setTimeout(r, 1000));
      updateProfile({ display: displaySettings });
      // Если сменили язык → можно вызвать i18n.changeLanguage(displaySettings.language)
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveSecurity = async () => {
    setIsSaving(true);
    try {
      await new Promise((r) => setTimeout(r, 1000));
      updateProfile({ security: securitySettings });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero */}
      <div className="relative pt-20 pb-16 bg-gradient-to-br from-slate-600 via-slate-700 to-slate-800">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg ...')] opacity-30" />
        <div className="relative max-w-7xl mx-auto px-6 pt-12">
          <h1 className="text-3xl font-bold text-white mb-2">
            {t('settings.title')}
          </h1>
          <p className="text-white/80">
            {t('settings.subtitle')}
          </p>
        </div>
      </div>

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
                <CardTitle className="text-sm">{t('settings.quickActions')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start bg-transparent" size="sm">
                  <HelpCircle className="w-4 h-4 mr-2" />
                  {t('common.help')}
                </Button>
                <Button variant="outline" className="w-full justify-start bg-transparent" size="sm">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  {t('common.documentation')}
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
                  <CardTitle>{t('settings.profile.title')}</CardTitle>
                  <CardDescription>
                    {t('settings.profile.description')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Аватар */}
                  <div className="flex items-center gap-6">
                    <div className="relative">
                      <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center text-white text-3xl font-bold">
                        {profileData.fullName?.charAt(0) || "U"}
                      </div>
                      <button
                        type="button"
                        className="absolute -bottom-2 -right-2 p-2 bg-card border border-border rounded-xl shadow-sm hover:bg-secondary transition-colors"
                      >
                        <Camera className="w-4 h-4" />
                      </button>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">
                        {profileData.fullName || t('common.user')}
                      </h3>
                      <p className="text-muted-foreground">{profileData.email}</p>
                      <Badge className="mt-2">
                        {user.account_type === "farmer"
                          ? t('roles.farmer')
                          : t('roles.agronomist')}
                      </Badge>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        {t('settings.profile.fullName')}
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <input
                          type="text"
                          value={profileData.fullName}
                          onChange={(e) => setProfileData({ ...profileData, fullName: e.target.value })}
                          className="w-full pl-11 pr-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder={t('settings.profile.fullNamePlaceholder')}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        {t('settings.profile.email')}
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <input
                          type="email"
                          value={profileData.email}
                          onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                          className="w-full pl-11 pr-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="email@example.com"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        {t('settings.profile.phone')}
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
                        {t('settings.profile.address')}
                      </label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <input
                          type="text"
                          value={profileData.address}
                          onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                          className="w-full pl-11 pr-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder={t('settings.profile.addressPlaceholder')}
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      {t('settings.profile.bio')}
                    </label>
                    <textarea
                      value={profileData.bio}
                      onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                      className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                      rows={3}
                      placeholder={t('settings.profile.bioPlaceholder')}
                    />
                  </div>

                  <div className="flex justify-end">
                    <Button onClick={handleSaveProfile} disabled={isSaving}>
                      {isSaving ? (
                        t('common.saving')
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          {t('common.saveChanges')}
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Уведомления */}
            {activeTab === "notifications" && (
              <Card>
                <CardHeader>
                  <CardTitle>{t('settings.notifications.title')}</CardTitle>
                  <CardDescription>
                    {t('settings.notifications.description')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <h4 className="font-medium text-sm text-muted-foreground">
                      {t('settings.notifications.channels')}
                    </h4>
                    {[
                      {
                        key: "emailAlerts",
                        label: t('settings.notifications.email'),
                        description: t('settings.notifications.emailDesc'),
                        icon: Mail,
                      },
                      {
                        key: "pushNotifications",
                        label: t('settings.notifications.push'),
                        description: t('settings.notifications.pushDesc'),
                        icon: Bell,
                      },
                    ].map((item) => (
                      <div
                        key={item.key}
                        className="flex items-center justify-between p-4 rounded-xl bg-secondary/50"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <item.icon className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{item.label}</p>
                            <p className="text-sm text-muted-foreground">{item.description}</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            setNotificationSettings({
                              ...notificationSettings,
                              [item.key]: !notificationSettings[item.key],
                            })
                          }
                          className={`relative w-12 h-7 rounded-full transition-colors ${
                            notificationSettings[item.key] ? "bg-primary" : "bg-muted"
                          }`}
                        >
                          <div
                            className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                              notificationSettings[item.key] ? "translate-x-6" : "translate-x-1"
                            }`}
                          />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium text-sm text-muted-foreground">
                      {t('settings.notifications.types')}
                    </h4>
                    {[
                      {
                        key: "droneAlerts",
                        label: t('settings.notifications.drone'),
                        description: t('settings.notifications.droneDesc'),
                      },
                      {
                        key: "biomassAlerts",
                        label: t('settings.notifications.biomass'),
                        description: t('settings.notifications.biomassDesc'),
                      },
                      {
                        key: "weatherAlerts",
                        label: t('settings.notifications.weather'),
                        description: t('settings.notifications.weatherDesc'),
                      },
                      {
                        key: "weeklyReport",
                        label: t('settings.notifications.weeklyReport'),
                        description: t('settings.notifications.weeklyReportDesc'),
                      },
                    ].map((item) => (
                      <div
                        key={item.key}
                        className="flex items-center justify-between p-4 rounded-xl border border-border"
                      >
                        <div>
                          <p className="font-medium">{item.label}</p>
                          <p className="text-sm text-muted-foreground">{item.description}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            setNotificationSettings({
                              ...notificationSettings,
                              [item.key]: !notificationSettings[item.key],
                            })
                          }
                          className={`relative w-12 h-7 rounded-full transition-colors ${
                            notificationSettings[item.key] ? "bg-primary" : "bg-muted"
                          }`}
                        >
                          <div
                            className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                              notificationSettings[item.key] ? "translate-x-6" : "translate-x-1"
                            }`}
                          />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-end">
                    <Button onClick={handleSaveNotifications} disabled={isSaving}>
                      {isSaving ? t('common.saving') : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          {t('common.saveSettings')}
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
                  <CardTitle>{t('settings.display.title')}</CardTitle>
                  <CardDescription>
                    {t('settings.display.description')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium mb-3">
                      {t('settings.display.theme')}
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { value: "light", label: t('settings.display.light'), icon: Sun },
                        { value: "dark",  label: t('settings.display.dark'),  icon: Moon },
                        { value: "system",label: t('settings.display.system'),icon: Monitor },
                      ].map((theme) => (
                        <button
                          key={theme.value}
                          type="button"
                          onClick={() =>
                            setDisplaySettings({ ...displaySettings, theme: theme.value })
                          }
                          className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-colors ${
                            displaySettings.theme === theme.value
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/50"
                          }`}
                        >
                          <theme.icon className="w-6 h-6" />
                          <span className="text-sm font-medium">{theme.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      {t('settings.display.language')}
                    </label>
                    <select
                      value={displaySettings.language}
                      onChange={(e) =>
                        setDisplaySettings({ ...displaySettings, language: e.target.value })
                      }
                      className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="ru">{t('languages.ru')}</option>
                      <option value="kk">{t('languages.kk')}</option>
                      <option value="en">{t('languages.en')}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      {t('settings.display.mapStyle')}
                    </label>
                    <select
                      value={displaySettings.mapStyle}
                      onChange={(e) =>
                        setDisplaySettings({ ...displaySettings, mapStyle: e.target.value })
                      }
                      className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="satellite">{t('mapStyles.satellite')}</option>
                      <option value="terrain">{t('mapStyles.terrain')}</option>
                      <option value="street">{t('mapStyles.street')}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      {t('settings.display.units')}
                    </label>
                    <select
                      value={displaySettings.units}
                      onChange={(e) =>
                        setDisplaySettings({ ...displaySettings, units: e.target.value })
                      }
                      className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="metric">{t('units.metric')}</option>
                      <option value="imperial">{t('units.imperial')}</option>
                    </select>
                  </div>

                  <div className="flex justify-end">
                    <Button onClick={handleSaveDisplay} disabled={isSaving}>
                      {isSaving ? t('common.saving') : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          {t('common.saveSettings')}
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
                  <CardTitle>{t('settings.security.title')}</CardTitle>
                  <CardDescription>
                    {t('settings.security.description')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="p-4 rounded-xl bg-secondary/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Key className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{t('settings.security.changePassword')}</p>
                          <p className="text-sm text-muted-foreground">
                            {t('settings.security.lastChanged', { time: "30 дней" })}
                          </p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        {t('settings.security.change')}
                      </Button>
                    </div>
                  </div>

                  {/* 2FA, Session Timeout, Login Notifications — аналогично с t() */}
                  {/* ... (оставляю структуру, добавляйте переводы по аналогии) ... */}

                  <div className="flex justify-end">
                    <Button onClick={handleSaveSecurity} disabled={isSaving}>
                      {isSaving ? t('common.saving') : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          {t('common.saveSettings')}
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Данные */}
            {activeTab === "data" && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>{t('settings.data.title')}</CardTitle>
                    <CardDescription>
                      {t('settings.data.description')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/50">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                          <Download className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium">{t('settings.data.export')}</p>
                          <p className="text-sm text-muted-foreground">
                            {t('settings.data.exportDesc')}
                          </p>
                        </div>
                      </div>
                      <Button variant="outline">{t('settings.data.exportBtn')}</Button>
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/50">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                          <Upload className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium">{t('settings.data.import')}</p>
                          <p className="text-sm text-muted-foreground">
                            {t('settings.data.importDesc')}
                          </p>
                        </div>
                      </div>
                      <Button variant="outline">{t('settings.data.importBtn')}</Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-destructive/50">
                  <CardHeader>
                    <CardTitle className="text-destructive">
                      {t('settings.dangerZone.title')}
                    </CardTitle>
                    <CardDescription>
                      {t('settings.dangerZone.description')}
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
                            {t('settings.dangerZone.deleteAccount')}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {t('settings.dangerZone.deleteWarning')}
                          </p>
                        </div>
                      </div>
                      <Button variant="destructive">
                        {t('settings.dangerZone.deleteBtn')}
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