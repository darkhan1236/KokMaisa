import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import { useAuth } from "@/contexts/AuthContext";
import { Leaf, Eye, EyeOff, Mail, Lock, ArrowLeft } from "lucide-react";
import { LanguageSwitcher } from "@/app/components/LanguageSwitcher";

export function LoginPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { setUser } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ email: "", password: "" });

  // Модалка "Забыли пароль"
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetMessage, setResetMessage] = useState("");
  const [resetLoading, setResetLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch('http://localhost:8000/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email.trim(),
          password: formData.password
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || t('login.invalidCredentials') || "Неверный email или пароль");
      }

      localStorage.setItem('token', data.access_token);

      const meRes = await fetch('http://localhost:8000/api/users/me', {
        headers: { 'Authorization': `Bearer ${data.access_token}` }
      });

      if (!meRes.ok) throw new Error("Не удалось загрузить профиль");

      const userData = await meRes.json();
      if (setUser) setUser(userData);

      navigate("/"); // ← на главную

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!resetEmail.trim()) {
      setResetMessage(t('login.enterEmail') || "Введите email");
      return;
    }

    setResetLoading(true);
    setResetMessage("");

    try {
      const res = await fetch('http://localhost:8000/api/users/password-reset-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail.trim() })
      });

      const result = await res.json();

      if (res.ok) {
        setResetMessage(t('login.resetEmailSent') || "Письмо со ссылкой отправлено на почту");
      } else {
        setResetMessage(result.detail || t('login.resetError') || "Ошибка отправки письма");
      }
    } catch (err) {
      setResetMessage(t('common.connectionError') || "Ошибка соединения");
    } finally {
      setResetLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <div className="min-h-screen flex">
      {/* Левая часть */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-green-500 to-emerald-600">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1659564455690-fee35bff87f6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkcm9uZSUyMGZhcm1pbmclMjBhZXJpYWx8ZW58MXx8fHwxNzY4ODQ5MTMzfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
            alt="Agriculture background"
            className="w-full h-full object-cover opacity-20"
          />
        </div>
        <div className="relative z-10 flex flex-col justify-center items-center p-12 text-white">
          <Link to="/" className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-6 hover:bg-white/30 transition-all duration-300 hover:scale-110">
            <Leaf className="w-12 h-12 text-white" />
          </Link>
          <Link to="/" className="hover:scale-105 transition-transform duration-300">
            <h1 className="text-5xl mb-4">KokMaisa</h1>
          </Link>
          <p className="text-xl text-center text-white/90 max-w-md">
            {t('login.welcome')}
          </p>
        </div>
      </div>

      {/* Правая часть */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          <div className="flex justify-between items-center mb-6">
            <Link to="/" className="inline-flex items-center gap-2 text-gray-600 hover:text-green-600 transition-colors duration-300">
              <ArrowLeft className="w-5 h-5" />
              <span>{t('nav.backToHome')}</span>
            </Link>
            <LanguageSwitcher />
          </div>

          <Link to="/" className="lg:hidden flex items-center gap-3 mb-8 justify-center hover:opacity-80 transition-opacity">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center">
              <Leaf className="w-7 h-7 text-white" />
            </div>
            <span className="text-3xl text-gray-900">KokMaisa</span>
          </Link>

          <div className="mb-8">
            <h2 className="text-3xl mb-2 text-gray-900">{t('login.title')}</h2>
            <p className="text-gray-600">{t('login.subtitle')}</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label htmlFor="email" className="block mb-2 text-gray-700">
                {t('login.email')}
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
                  placeholder={t('login.emailPlaceholder')}
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label htmlFor="password" className="text-gray-700">
                  {t('login.password')}
                </label>
                <button
                  type="button"
                  onClick={() => setShowResetModal(true)}
                  className="text-sm text-green-600 hover:text-green-700 transition-colors"
                >
                  {t('login.forgotPassword')}
                </button>
              </div>
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
                  placeholder={t('login.passwordPlaceholder')}
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

            <button
              type="submit"
              disabled={loading}
              className={`w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-300 hover:scale-[1.02] shadow-lg hover:shadow-xl flex items-center justify-center gap-2 ${
                loading ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {loading ? (
                <>
                  <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span>
                  <span>{t('common.loading')}</span>
                </>
              ) : (
                t('login.submitButton')
              )}
            </button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">
                  {t('login.noAccount')}
                </span>
              </div>
            </div>

            <Link
              to="/register"
              className="block w-full text-center py-3 border-2 border-green-500 text-green-600 rounded-xl hover:bg-green-50 transition-all duration-300 font-medium"
            >
              {t('login.registerLink')}
            </Link>
          </form>
        </div>
      </div>

      {/* Модальное окно сброса пароля */}
      {showResetModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl">
            <h3 className="text-2xl font-bold mb-4 text-center">
              {t('login.resetPassword')}
            </h3>
            <p className="text-gray-600 mb-6 text-center">
              {t('login.resetInstructions')}
            </p>

            <input
              type="email"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              placeholder={t('login.emailPlaceholder')}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl mb-4 focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            />

            {resetMessage && (
              <p className={`mb-4 text-center ${resetMessage.includes('отправлена') ? 'text-green-600' : 'text-red-600'}`}>
                {resetMessage}
              </p>
            )}

            <button
              onClick={handleResetPassword}
              disabled={resetLoading}
              className={`w-full bg-green-600 text-white py-3 rounded-xl hover:bg-green-700 transition-colors flex items-center justify-center gap-2 ${
                resetLoading ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {resetLoading ? (
                <>
                  <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span>
                  <span>{t('common.sending')}</span>
                </>
              ) : (
                t('login.sendResetLink')
              )}
            </button>

            <button
              onClick={() => {
                setShowResetModal(false);
                setResetMessage("");
                setResetEmail("");
              }}
              className="mt-4 w-full text-gray-600 hover:text-gray-800 text-center"
            >
              {t('common.close')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}