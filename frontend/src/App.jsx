// src/App.jsx — KokMaisa 2025 — roles: farmer | admin

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import HomePage               from '@/app/components/HomePage';
import { RegisterPage }       from '@/app/components/RegisterPage';
import { LoginPage }          from '@/app/components/LoginPage';
import PasturesPage           from '@/app/components/PasturesPage';
import AIChatPage             from '@/app/components/AIChatPage';
import FarmsPage              from '@/app/components/FarmsPage';
import SettingsPage           from '@/app/components/SettingsPage';
import { ResetPassword }      from '@/app/components/ResetPassword';
import BiomassMeasurementPage from '@/app/components/BiomassMeasurementPage';
import BiomassDashboardPage   from '@/app/components/BiomassDashboardPage';
import AdminPanel             from '@/app/components/AdminPanel';
import SuggestionPage         from '@/app/components/SuggestionPage';
import FloatingAIConsultant   from '@/app/components/FloatingAIConsultant';
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

function userHomePath(user) {
  if (user?.account_type === 'admin') return '/admin';
  return '/farms';
}

function PublicOnlyRoute({ children }) {
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
  if (user) return <Navigate to={userHomePath(user)} replace />;
  return children;
}

function AppRoutes() {
  return (
    <>
      <Routes>
        <Route path="/"               element={<HomePage />} />
        <Route path="/register"       element={<PublicOnlyRoute><RegisterPage /></PublicOnlyRoute>} />
        <Route path="/login"          element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>} />
        <Route path="/reset-password" element={<PublicOnlyRoute><ResetPassword /></PublicOnlyRoute>} />
        <Route path="/suggestions" element={
          <ProtectedRoute allowedTypes={['farmer','admin']}><SuggestionPage /></ProtectedRoute>
        } />

        <Route path="/admin" element={
          <ProtectedRoute allowedTypes={['admin']}><AdminPanel /></ProtectedRoute>
        } />

        <Route path="/pastures" element={
          <ProtectedRoute allowedTypes={['farmer']}><PasturesPage /></ProtectedRoute>
        } />
        <Route path="/ai-chat" element={
          <ProtectedRoute allowedTypes={['farmer','admin']}><AIChatPage /></ProtectedRoute>
        } />
        <Route path="/settings" element={
          <ProtectedRoute><SettingsPage /></ProtectedRoute>
        } />

        <Route path="/biomass" element={
          <ProtectedRoute allowedTypes={['farmer']}><BiomassMeasurementPage /></ProtectedRoute>
        } />
        <Route path="/farms" element={
          <ProtectedRoute allowedTypes={['farmer']}><FarmsPage /></ProtectedRoute>
        } />
        <Route path="/biomass-dashboard" element={
          <ProtectedRoute allowedTypes={['farmer']}><BiomassDashboardPage /></ProtectedRoute>
        } />

        <Route path="/profile"           element={<Navigate to="/" replace />} />
        <Route path="*"                  element={<Navigate to="/" replace />} />
      </Routes>
      <FloatingAIConsultant />
    </>
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
