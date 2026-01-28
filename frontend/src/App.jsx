// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

// Импорт страниц
import HomePage from '@/app/components/HomePage';
import { RegisterPage } from '@/app/components/RegisterPage';
import { LoginPage } from '@/app/components/LoginPage';
import ProfileFarmer from '@/app/components/ProfileFarmer';
import ProfileAgronomist from '@/app/components/ProfileAgronomist';
import PasturesPage from '@/app/components/PasturesPage';   
import DronesPage from '@/app/components/DronesPage';
import AIChatPage from '@/app/components/AIChatPage';
import FarmsPage from '@/app/components/FarmsPage';
import PasturesMapPage from '@/app/components/PasturesMapPage';
import SettingsPage from '@/app/components/SettingsPage';
import PasturesAnalysisPage from '@/app/components/PasturesAnalysisPage';
import { ResetPassword } from '@/app/components/ResetPassword';
import BiomassMeasurementPage from '@/app/components/BiomassMeasurementPage';
import BiomassDashboardPage from '@/app/components/BiomassDashboardPage';

// Импорт контекста и ProtectedRoute
import { AuthProvider, useAuth } from '@/contexts/AuthContext';

// Защищённый роут (у тебя уже есть)
function ProtectedRoute({ children, allowedTypes }) {
  const { user, loading } = useAuth();
  const { t } = useTranslation();

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
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Защищённые роуты */}
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

      <Route
        path="/pastures-analysis"
        element={
          <ProtectedRoute allowedTypes={['agronomist']}>
            <PasturesAnalysisPage />
          </ProtectedRoute>
        }
      />

      {/* Новый маршрут для пастбищ — только для фермеров */}
      <Route
        path="/pastures"
        element={
          <ProtectedRoute allowedTypes={['farmer']}>
            <PasturesPage />
          </ProtectedRoute>
        }
      />
      {/* Дроны — только для фермеров */}
      <Route
        path="/drones"
        element={
          <ProtectedRoute allowedTypes={['farmer']}>
            <DronesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/ai-chat"
        element={
          <ProtectedRoute allowedTypes={['farmer', 'agronomist']}>
            <AIChatPage />
          </ProtectedRoute>
        }
      />
      <Route path="/biomass" element={<BiomassMeasurementPage />} />
      <Route path="/farms" element={<FarmsPage />} />
      <Route path="/biomass-dashboard" element={<BiomassDashboardPage />} />
      <Route path="/pastures-map" element={<PasturesMapPage />} />

      {/* Заглушки */}
      <Route path="/profile" element={<Navigate to="/" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

// Главный App
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}