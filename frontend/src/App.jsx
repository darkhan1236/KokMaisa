// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

// Импорт страниц
import HomePage from '@/app/components/HomePage';
import { RegisterPage } from '@/app/components/RegisterPage';
import { LoginPage } from '@/app/components/LoginPage';
import { ProfileFarmer } from '@/app/components/ProfileFarmer';
import { ProfileAgronomist } from '@/app/components/ProfileAgronomist';
import { ResetPassword } from '@/app/components/ResetPassword';

// Импорт контекста
import { AuthProvider, useAuth } from '@/contexts/AuthContext';

// Защищённый роут
function ProtectedRoute({ children, allowedTypes }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedTypes && !allowedTypes.includes(user.account_type)) {
    return <Navigate to="/" replace />;
  }

  return children;
}

// Главные роуты
function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/login" element={<LoginPage />} />

      {/* Защищённые */}
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

      {/* Пока заглушка для профиля (можно позже сделать общий /profile) */}
      <Route path="/profile" element={<Navigate to="/" replace />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

// Главный App
export default function App() {
  const { t } = useTranslation();

  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}