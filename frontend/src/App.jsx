// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';  // Если нужно для перевода в App

// Импорт страниц
import  HomePage  from '@/app/components/HomePage';
import { RegisterPage } from '@/app/components/RegisterPage';
import { LoginPage } from '@/app/components/LoginPage';
import { ProfileFarmer } from '@/app/components/ProfileFarmer';
import { ProfileAgronomist } from '@/app/components/ProfileAgronomist';

// Импорт контекста аутентификации
import { AuthProvider, useAuth } from '@/contexts/AuthContext';

// Компонент для защищённых роутов
function ProtectedRoute({ children, allowedTypes }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">{t('loading')}</p>  // Переводим "Загрузка..." через i18n
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedTypes && !allowedTypes.includes(user.accountType)) {
    return <Navigate to="/" replace />;  // Или на /profile/unauthorized, если добавишь
  }

  return children;
}

// Основные роуты
function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/login" element={<LoginPage />} />
      
      {/* Защищённые роуты по ролям */}
      <Route
        path="/profile/farmer"
        element={
          <ProtectedRoute allowedTypes={['farmer']}>
            <ProfileFarmer />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile/agronomist"
        element={
          <ProtectedRoute allowedTypes={['agronomist']}>
            <ProfileAgronomist />
          </ProtectedRoute>
        }
      />
      
      {/* Опционально: редирект для неизвестных путей */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

// Главный компонент App
export default function App() {
  const { t } = useTranslation();  // Если нужно глобально переводить в App

  return (
    <BrowserRouter>
      <AuthProvider>  {/* Оборачиваем в провайдер аутентификации */}
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}