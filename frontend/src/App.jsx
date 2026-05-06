// src/App.jsx — KokMaisa 2025 — roles: farmer | admin

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import HomePage               from '@/app/components/HomePage';
import { RegisterPage }       from '@/app/components/RegisterPage';
import { LoginPage }          from '@/app/components/LoginPage';
import PasturesPage           from '@/app/components/PasturesPage';
import DronesPage             from '@/app/components/DronesPage';
import AIChatPage             from '@/app/components/AIChatPage';
import FarmsPage              from '@/app/components/FarmsPage';
import SettingsPage           from '@/app/components/SettingsPage';
import { ResetPassword }      from '@/app/components/ResetPassword';
import BiomassMeasurementPage from '@/app/components/BiomassMeasurementPage';
import BiomassDashboardPage   from '@/app/components/BiomassDashboardPage';
import AdminPanel             from '@/app/components/AdminPanel';
import SuggestionPage         from '@/app/components/SuggestionPage';
import { ThemeProvider }      from '@/contexts/ThemeContext';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';

function ProtectedRoute({ children, allowedTypes }) {
  const { user, loading } = useAuth();
  const { t } = useTranslation();
  if (loading) return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ textAlign:"center" }}>
        <div style={{ width:48,height:48,border:"4px solid #22c55e",borderTopColor:"transparent",borderRadius:"50%",animation:"spin 1s linear infinite",margin:"0 auto 12px" }} />
        <p style={{ color:"#6b7280", fontSize:14 }}>{t('common.loading')}</p>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  if (allowedTypes && !allowedTypes.includes(user.account_type)) return <Navigate to="/" replace />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/"               element={<HomePage />} />
      <Route path="/register"       element={<RegisterPage />} />
      <Route path="/login"          element={<LoginPage />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/suggestions"     element={<SuggestionPage />} />

      <Route path="/admin" element={
        <ProtectedRoute allowedTypes={['admin']}><AdminPanel /></ProtectedRoute>
      } />

      <Route path="/pastures" element={
        <ProtectedRoute allowedTypes={['farmer']}><PasturesPage /></ProtectedRoute>
      } />
      <Route path="/drones" element={
        <ProtectedRoute allowedTypes={['farmer']}><DronesPage /></ProtectedRoute>
      } />
      <Route path="/ai-chat" element={
        <ProtectedRoute allowedTypes={['farmer','admin']}><AIChatPage /></ProtectedRoute>
      } />
      <Route path="/settings" element={
        <ProtectedRoute><SettingsPage /></ProtectedRoute>
      } />

      <Route path="/biomass"           element={<BiomassMeasurementPage />} />
      <Route path="/farms"             element={<FarmsPage />} />
      <Route path="/biomass-dashboard" element={<BiomassDashboardPage />} />

      <Route path="/profile"           element={<Navigate to="/" replace />} />
      <Route path="*"                  element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}
