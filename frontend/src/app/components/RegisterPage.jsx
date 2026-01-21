import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import { useAuth } from "@/contexts/AuthContext";
import { 
  Leaf, 
  Eye, 
  EyeOff, 
  Mail, 
  Lock, 
  User, 
  ArrowLeft, 
  Phone, 
  MapPin, 
  Navigation,
  GraduationCap
} from "lucide-react";
import { LanguageSwitcher } from "@/app/components/LanguageSwitcher";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";

export function RegisterPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { register } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [accountType, setAccountType] = useState("farmer");
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
    country: "",
    city: "",
    // Поля для агронома
    education: "",
    specializations: []
  });

  const educationOptions = [
    { value: "bachelor", label: { ru: "Бакалавр", kk: "Бакалавр", en: "Bachelor" } },
    { value: "master", label: { ru: "Магистр", kk: "Магистр", en: "Master" } },
    { value: "phd", label: { ru: "Кандидат наук", kk: "Ғылым кандидаты", en: "PhD" } },
    { value: "doctorate", label: { ru: "Доктор наук", kk: "Ғылым докторы", en: "Doctorate" } }
  ];

  const specializationOptions = [
    { value: "agronomy", label: { ru: "Агрономия", kk: "Агрономия", en: "Agronomy" } },
    { value: "livestock", label: { ru: "Животноводство", kk: "Мал шаруашылығы", en: "Livestock" } },
    { value: "soilScience", label: { ru: "Почвоведение", kk: "Топырақтану", en: "Soil Science" } },
    { value: "plantProtection", label: { ru: "Защита растений", kk: "Өсімдіктерді қорғау", en: "Plant Protection" } },
    { value: "pasture", label: { ru: "Пастбищное хозяйство", kk: "Жайылым шаруашылығы", en: "Pasture Management" } }
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    // Валидация
    if (formData.password !== formData.confirmPassword) {
      setError(t('register.passwordMismatch') || "Пароли не совпадают");
      return;
    }

    if (formData.password.length < 6) {
      setError("Пароль должен содержать минимум 6 символов");
      return;
    }

    // Для агронома проверяем дополнительные поля
    if (accountType === "agronomist") {
      if (!formData.education) {
        setError("Укажите образование");
        return;
      }
      if (formData.specializations.length === 0) {
        setError("Выберите хотя бы одну специализацию");
        return;
      }
    }

    // Подготовка данных для регистрации
    const userData = {
      fullName: formData.fullName,
      email: formData.email,
      password: formData.password,
      phone: formData.phone,
      country: formData.country,
      city: formData.city,
      accountType: accountType,
    };

    // Добавляем поля агронома если нужно
    if (accountType === "agronomist") {
      userData.education = formData.education;
      userData.specializations = formData.specializations;
    }

    const result = register(userData);

    if (result.success) {
      // Перенаправляем на соответствующий профиль
      if (accountType === "farmer") {
        navigate("/profile/farmer");
      } else {
        navigate("/profile/agronomist");
      }
    } else {
      setError(result.error);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSelectChange = (name, value) => {
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const toggleSpecialization = (value) => {
    setFormData(prev => ({
      ...prev,
      specializations: prev.specializations.includes(value)
        ? prev.specializations.filter(s => s !== value)
        : [...prev.specializations, value]
    }));
  };

  const { i18n } = useTranslation();
  const currentLang = i18n.language || 'ru';

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Left Side - Image */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-green-500 to-emerald-600">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1677126577258-1a82fdf1a976?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxncmVlbiUyMHBhc3R1cmUlMjBkcm9uZSUyMGFncmljdWx0dXJlfGVufDF8fHx8MTc2ODg0OTEzM3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
            alt="Agriculture background"
            className="w-full h-full object-cover opacity-20"
          />
        </div>
        <div className="relative z-10 flex flex-col justify-center items-center p-12 text-white">
          <Link 
            to="/" 
            className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-6 hover:bg-white/30 transition-all duration-300 hover:scale-110"
          >
            <Leaf className="w-12 h-12 text-white" />
          </Link>
          <Link to="/" className="hover:scale-105 transition-transform duration-300">
            <h1 className="text-5xl mb-4">KokMaisa</h1>
          </Link>
          <p className="text-xl text-center text-white/90 max-w-md">
            {t('register.welcome')}
          </p>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 md:p-8 bg-white overflow-y-auto">
        <div className="w-full max-w-2xl">
          {/* Header with language switcher */}
          <div className="flex justify-between items-center mb-6">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-gray-600 hover:text-green-600 transition-colors duration-300"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>{t('nav.backToHome')}</span>
            </Link>
            <LanguageSwitcher />
          </div>

          {/* Logo for mobile */}
          <Link to="/" className="lg:hidden flex items-center gap-3 mb-8 justify-center hover:opacity-80 transition-opacity">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center">
              <Leaf className="w-7 h-7 text-white" />
            </div>
            <span className="text-3xl text-gray-900">KokMaisa</span>
          </Link>

          <div className="mb-8">
            <h2 className="text-3xl mb-2 text-gray-900">
              {t('register.title')}
            </h2>
            <p className="text-gray-600">
              {t('register.subtitle')}
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Account Type Selection */}
            <div>
              <label className="block mb-3 text-gray-700 font-medium">
                {t('register.accountType')}
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setAccountType("farmer")}
                  className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                    accountType === "farmer"
                      ? "border-green-500 bg-green-50 text-green-700"
                      : "border-gray-300 hover:border-green-300"
                  }`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <Navigation className="w-6 h-6" />
                    <span className="text-sm font-medium">{t('register.farmer')}</span>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setAccountType("agronomist")}
                  className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                    accountType === "agronomist"
                      ? "border-green-500 bg-green-50 text-green-700"
                      : "border-gray-300 hover:border-green-300"
                  }`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <GraduationCap className="w-6 h-6" />
                    <span className="text-sm font-medium">{t('register.agronomist')}</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Basic Fields */}
            <div className="grid md:grid-cols-2 gap-4">
              {/* Full Name */}
              <div className="md:col-span-2">
                <label htmlFor="fullName" className="block mb-2 text-gray-700">
                  {t('register.fullName')} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User className="w-5 h-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    id="fullName"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    placeholder={t('register.fullNamePlaceholder')}
                    required
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label htmlFor="phone" className="block mb-2 text-gray-700">
                  {t('register.phone')} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Phone className="w-5 h-5 text-gray-400" />
                  </div>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    placeholder={t('register.phonePlaceholder')}
                    required
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block mb-2 text-gray-700">
                  {t('register.email')} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="w-5 h-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    placeholder={t('register.emailPlaceholder')}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Location Fields */}
            <div className="grid md:grid-cols-2 gap-4">
              {/* Country */}
              <div>
                <label htmlFor="country" className="block mb-2 text-gray-700">
                  {t('register.country')} <span className="text-red-500">*</span>
                </label>
                <Select
                  value={formData.country}
                  onValueChange={(value) => handleSelectChange("country", value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t('register.selectCountry')} />
                  </SelectTrigger>
                  <SelectContent className="z-50 bg-white shadow-lg">
                    <SelectItem value="kz">{t('countries.kazakhstan')}</SelectItem>
                    <SelectItem value="ru">{t('countries.russia')}</SelectItem>
                    <SelectItem value="kg">{t('countries.kyrgyzstan')}</SelectItem>
                    <SelectItem value="uz">{t('countries.uzbekistan')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* City */}
              <div>
                <label htmlFor="city" className="block mb-2 text-gray-700">
                  {t('register.city')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  placeholder={t('register.cityPlaceholder')}
                  required
                />
              </div>
            </div>

            {/* Agronomist-specific fields */}
            {accountType === "agronomist" && (
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-green-600" />
                  {t('register.professionalInfo')}
                </h3>

                {/* Education */}
                <div className="mb-4">
                  <label htmlFor="education" className="block mb-2 text-gray-700">
                    {t('register.education')} <span className="text-red-500">*</span>
                  </label>
                  <Select
                    value={formData.education}
                    onValueChange={(value) => handleSelectChange("education", value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={t('register.selectEducation')} />
                    </SelectTrigger>
                    <SelectContent className="z-50 bg-white shadow-lg">
                      {educationOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label[currentLang]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Specializations */}
                <div>
                  <label className="block mb-2 text-gray-700">
                    {t('register.specialization')} <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {specializationOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => toggleSpecialization(option.value)}
                        className={`p-3 rounded-lg border-2 transition-all text-sm ${
                          formData.specializations.includes(option.value)
                            ? "border-green-500 bg-green-50 text-green-700"
                            : "border-gray-300 hover:border-green-300"
                        }`}
                      >
                        {option.label[currentLang]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Password Fields */}
            <div className="grid md:grid-cols-2 gap-4">
              {/* Password */}
              <div>
                <label htmlFor="password" className="block mb-2 text-gray-700">
                  {t('register.password')} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="w-5 h-5 text-gray-400" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full pl-12 pr-12 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    placeholder={t('register.passwordPlaceholder')}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label htmlFor="confirmPassword" className="block mb-2 text-gray-700">
                  {t('register.confirmPassword')} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="w-5 h-5 text-gray-400" />
                  </div>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="w-full pl-12 pr-12 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    placeholder={t('register.passwordPlaceholder')}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-4 rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-300 hover:scale-[1.02] shadow-lg hover:shadow-xl font-medium"
            >
              {t('register.submitButton')}
            </button>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">
                  {t('register.haveAccount')}
                </span>
              </div>
            </div>

            {/* Login Link */}
            <Link
              to="/login"
              className="block w-full text-center py-3 border-2 border-green-500 text-green-600 rounded-xl hover:bg-green-50 transition-all duration-300 font-medium"
            >
              {t('register.loginLink')}
            </Link>
          </form>
        </div>
      </div>
    </div>
  );
}
