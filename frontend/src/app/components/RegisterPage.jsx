// src/app/components/RegisterPage.jsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Leaf, Eye, EyeOff, Mail, Lock, User, ArrowLeft } from 'lucide-react';

function RegisterPage() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();

    // Простая проверка совпадения паролей (можно расширить)
    if (formData.password !== formData.confirmPassword) {
      alert('Пароли не совпадают!');
      return;
    }

    // Здесь будет реальная логика регистрации (запрос на бэкенд)
    console.log('Данные регистрации:', formData);

    // Пример: после успешной регистрации перенаправляем на главную или логин
    // navigate('/');
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen flex">
      {/* Левая часть — изображение (только на больших экранах) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-green-500 to-emerald-600">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1677126577258-1a82fdf1a976?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxncmVlbiUyMHBhc3R1cmUlMjBkcm9uZSUyMGFncmljdWx0dXJlfGVufDF8fHx8MTc2ODg0OTEzM3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
            alt="Зелёное пастбище с дрона"
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
            <h1 className="text-5xl mb-4 font-bold">KokMaisa</h1>
          </Link>
          <p className="text-xl text-center text-white/90 max-w-md">
            Присоединяйтесь к революции в агротехнологиях
          </p>
        </div>
      </div>

      {/* Правая часть — форма регистрации */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          {/* Кнопка "На главную" */}
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-green-600 mb-6 transition-colors duration-300"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>На главную</span>
          </Link>

          {/* Логотип для мобильных */}
          <Link to="/" className="lg:hidden flex items-center gap-3 mb-8 justify-center hover:opacity-80 transition-opacity">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center">
              <Leaf className="w-7 h-7 text-white" />
            </div>
            <span className="text-3xl text-gray-900 font-semibold">KokMaisa</span>
          </Link>

          <div className="mb-8">
            <h2 className="text-3xl mb-2 text-gray-900 font-bold">
              Создать аккаунт
            </h2>
            <p className="text-gray-600">
              Заполните данные для регистрации
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Поле Имя */}
            <div>
              <label htmlFor="name" className="block mb-2 text-gray-700 font-medium">
                Имя
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                  placeholder="Ваше имя"
                  required
                />
              </div>
            </div>

            {/* Поле Email */}
            <div>
              <label htmlFor="email" className="block mb-2 text-gray-700 font-medium">
                Email
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
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                  placeholder="example@email.com"
                  required
                />
              </div>
            </div>

            {/* Поле Пароль */}
            <div>
              <label htmlFor="password" className="block mb-2 text-gray-700 font-medium">
                Пароль
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full pl-12 pr-12 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Поле Подтверждение пароля */}
            <div>
              <label htmlFor="confirmPassword" className="block mb-2 text-gray-700 font-medium">
                Подтвердите пароль
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full pl-12 pr-12 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Кнопка Зарегистрироваться */}
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-300 hover:scale-[1.02] shadow-lg hover:shadow-xl font-medium"
            >
              Зарегистрироваться
            </button>

            {/* Разделитель */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">
                  Уже есть аккаунт?
                </span>
              </div>
            </div>

            {/* Ссылка на вход */}
            <Link
              to="/login"
              className="block w-full text-center py-3 border-2 border-green-500 text-green-600 rounded-xl hover:bg-green-50 transition-all duration-300 font-medium"
            >
              Войти
            </Link>
          </form>
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;