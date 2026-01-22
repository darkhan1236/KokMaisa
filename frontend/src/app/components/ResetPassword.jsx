import { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Eye, EyeOff } from 'lucide-react';
import { LanguageSwitcher } from '@/app/components/LanguageSwitcher'; // ← импортируем переключатель

export function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (newPassword !== confirmPassword) {
      setError(t('reset.passwordMismatch') || "Пароли не совпадают");
      return;
    }

    if (newPassword.length < 6) {
      setError(t('reset.passwordTooShort') || "Пароль должен быть минимум 6 символов");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('http://localhost:8000/api/users/password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, new_password: newPassword })
      });

      const data = await res.json();

      if (res.ok) {
        setMessage(t('reset.success') || "Пароль успешно изменён. Перенаправляем на страницу входа...");
        setTimeout(() => navigate('/login'), 3000);
      } else {
        setError(data.detail || t('reset.error') || "Ошибка сброса пароля. Токен может быть недействителен или просрочен.");
      }
    } catch (err) {
      setError(t('common.connectionError') || "Ошибка соединения с сервером");
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="text-center p-8 bg-white rounded-2xl shadow-lg max-w-md w-full">
          {/* LanguageSwitcher сверху справа */}
          <div className="flex justify-end mb-4">
            <LanguageSwitcher />
          </div>

          <h2 className="text-2xl font-bold text-red-600 mb-4">
            {t('reset.tokenMissing') || "Ссылка недействительна"}
          </h2>
          <p className="text-gray-700 mb-6">
            Токен не найден в ссылке. Запросите сброс пароля заново.
          </p>
          <Link
            to="/login"
            className="inline-block bg-green-600 text-white px-6 py-3 rounded-xl hover:bg-green-700 transition-colors"
          >
            Вернуться к входу
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-xl relative">
        {/* LanguageSwitcher сверху справа */}
        <div className="absolute top-4 right-4 ">
          <LanguageSwitcher />
        </div>

        <h2 className="text-3xl font-bold mt-10 mb-6 text-center text-gray-900">
          {t('reset.title') || "Установка нового пароля"}
        </h2>

        {message && <p className="text-green-600 mb-6 text-center font-medium">{message}</p>}
        {error && <p className="text-red-600 mb-6 text-center font-medium">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block mb-2 text-gray-700 font-medium">
              {t('reset.newPassword') || "Новый пароль"}
            </label>
            <div className="relative">
              <input
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700"
              >
                {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block mb-2 text-gray-700 font-medium">
              {t('reset.confirmPassword') || "Подтвердите пароль"}
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700"
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-300 shadow-md flex items-center justify-center gap-2 ${
              loading ? 'opacity-70 cursor-not-allowed' : ''
            }`}
          >
            {loading ? (
              <>
                <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span>
                <span>{t('common.saving') || "Сохранение..."}</span>
              </>
            ) : (
              t('reset.submit') || "Сохранить новый пароль"
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-gray-600">
          <Link to="/login" className="text-green-600 hover:underline font-medium">
            {t('reset.backToLogin') || "Вернуться к входу"}
          </Link>
        </p>
      </div>
    </div>
  );
}
