// src/contexts/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';
import { extractApiDetail } from '@/app/utils/apiErrors';

const AuthContext = createContext(null);
const API_BASE = '/api';

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const getToken = () => localStorage.getItem('token');

  const apiFetch = async (endpoint, options = {}) => {
    const token = getToken();
    const headers = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    };

    const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });

    if (res.status === 401 || res.status === 403) {
      localStorage.removeItem('token');
      setIsAuthenticated(false);
      setUser(null);
      throw new Error('session_expired');
    }
    if (res.status === 204) return null;

    const contentType = res.headers.get('content-type');
    const hasContent  = res.headers.get('content-length') !== '0';

    if (!res.ok) {
      let errorData;
      try {
        errorData = contentType?.includes('application/json') && hasContent
          ? await res.json()
          : { detail: `Ошибка ${res.status}: ${res.statusText}` };
      } catch {
        errorData = { detail: `Ошибка ${res.status}: ${res.statusText}` };
      }
      throw new Error(extractApiDetail(errorData.detail || `Ошибка ${res.status}`));
    }

    if (contentType?.includes('application/json') && hasContent) {
      return await res.json();
    }
    return null;
  };

  /** Multipart upload helper – does NOT set Content-Type (browser does it). */
  const apiFetchForm = async (endpoint, formData) => {
    const token = getToken();
    const res   = await fetch(`${API_BASE}${endpoint}`, {
      method:  'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body:    formData,
    });

    if (res.status === 401 || res.status === 403) {
      localStorage.removeItem('token');
      setIsAuthenticated(false);
      setUser(null);
      throw new Error('session_expired');
    }

    const contentType = res.headers.get('content-type');
    const hasContent  = res.headers.get('content-length') !== '0';

    if (!res.ok) {
      let errorData;
      try {
        errorData = contentType?.includes('application/json') && hasContent
          ? await res.json()
          : { detail: `Ошибка ${res.status}: ${res.statusText}` };
      } catch {
        errorData = { detail: `Ошибка ${res.status}: ${res.statusText}` };
      }
      throw new Error(extractApiDetail(errorData.detail || `Ошибка ${res.status}`));
    }

    if (contentType?.includes('application/json') && hasContent) {
      return await res.json();
    }
    return null;
  };

  const loadUser = async () => {
    const token = getToken();
    if (!token) { setLoading(false); return; }
    try {
      const data = await apiFetch('/users/me');
      setUser(data);
      setIsAuthenticated(true);
    } catch (err) {
      console.error(err);
      localStorage.removeItem('token');
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  // ── AI Chat ────────────────────────────────────────────────────────────────
  const chatAI = (message, history = []) =>
  apiFetch('/ai/chat', {
    method: 'POST',
    body: JSON.stringify({
      message,
      history: history.map(m => ({ role: m.role, content: m.content })),
    }),
  });

  // ── Profile ────────────────────────────────────────────────────────────────
  const updateProfile = async (profileData) => {
    const data = await apiFetch('/users/me', { method: 'PUT', body: JSON.stringify(profileData) });
    setUser(data);
    return data;
  };
  const changePassword = (oldPassword, newPassword) =>
    apiFetch('/users/me/password', {
      method: 'PUT',
      body: JSON.stringify({ old_password: oldPassword, new_password: newPassword }),
    });
  const requestPasswordReset = (email) =>
    apiFetch('/users/password-reset-request', { method: 'POST', body: JSON.stringify({ email }) });
  const resetPassword = (token, newPassword) =>
    apiFetch('/users/password-reset', {
      method: 'POST',
      body: JSON.stringify({ token, new_password: newPassword }),
    });

  // ── Farms ──────────────────────────────────────────────────────────────────
  const getFarms    = ()               => apiFetch('/farms/');
  const createFarm  = (d)              => apiFetch('/farms/',    { method: 'POST',   body: JSON.stringify(d) });
  const updateFarm  = (id, d)          => apiFetch(`/farms/${id}`, { method: 'PUT',  body: JSON.stringify(d) });
  const deleteFarm  = (id)             => apiFetch(`/farms/${id}`, { method: 'DELETE' });

  // ── Pastures ───────────────────────────────────────────────────────────────
  const getPastures       = ()         => apiFetch('/pastures/');
  const getPasturesByFarm = (farmId)   => apiFetch(`/pastures/farm/${farmId}`);
  const createPasture     = (d)        => apiFetch('/pastures/', { method: 'POST',   body: JSON.stringify(d) });
  const updatePasture     = (id, d)    => apiFetch(`/pastures/${id}`, { method: 'PUT', body: JSON.stringify(d) });
  const deletePasture     = (id)       => apiFetch(`/pastures/${id}`, { method: 'DELETE' });

  // ── Drones ─────────────────────────────────────────────────────────────────
  const getDrones         = ()         => apiFetch('/drones/');
  const getDronesByFarm   = (farmId)   => apiFetch(`/drones/farm/${farmId}`);
  const getDrone          = (id)       => apiFetch(`/drones/${id}`);
  const createDrone       = (d)        => apiFetch('/drones/',   { method: 'POST',   body: JSON.stringify(d) });
  const updateDrone       = (id, d)    => apiFetch(`/drones/${id}`, { method: 'PUT', body: JSON.stringify(d) });
  const deleteDrone       = (id)       => apiFetch(`/drones/${id}`, { method: 'DELETE' });
  const updateDroneStatus = (id, s)    => apiFetch(`/drones/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status: s }) });

  // ── Biomass Measurements ───────────────────────────────────────────────────

  /**
   * Upload a photo and get biomass prediction.
   * @param {File}   photoFile   - The image file
   * @param {number} pastureId   - Which pasture
   * @param {string} [description]
   * @returns {Promise<MeasurementOut>}
   */
  const uploadBiomassPhoto = (photoFile, pastureId, description = "") => {
    const fd = new FormData();
    fd.append("photo",       photoFile);
    fd.append("pasture_id",  String(pastureId));
    if (description) fd.append("description", description);
    return apiFetchForm('/measurements/photo', fd);
  };

  /**
   * Register a drone scan (creates measurement record in "processing" status).
   */
  const startDroneMeasurement = (pastureId, droneId, description = "") => {
    const fd = new FormData();
    fd.append("pasture_id",  String(pastureId));
    fd.append("drone_id",    String(droneId));
    if (description) fd.append("description", description);
    return apiFetchForm('/measurements/drone', fd);
  };

  /** All measurements (for the current user's farm). */
  const getMeasurements = ()             => apiFetch('/measurements/');

  /** Measurements for a specific pasture. */
  const getPastureMeasurements = (pid)   => apiFetch(`/measurements/pasture/${pid}`);

  /** Aggregated stats for a pasture. */
  const getPastureStats = (pid)          => apiFetch(`/measurements/pasture/${pid}/stats`);

  /** Delete a measurement. */
  const deleteMeasurement = (id)         => apiFetch(`/measurements/${id}`, { method: 'DELETE' });

  // ── Photo profile ──────────────────────────────────────────────────────────
  const uploadProfilePhoto = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const token = getToken();
    const res   = await fetch(`${API_BASE}/users/me/photo`, {
      method:  'POST',
      headers: { Authorization: `Bearer ${token}` },
      body:    formData,
    });
    if (!res.ok) { const e = await res.json(); throw new Error(extractApiDetail(e.detail || 'Ошибка при загрузке фото')); }
    const data = await res.json();
    setUser(data);
    return data;
  };
  const uploadProfilePhotoBase64 = async (base64String, mimeType) => {
    const data = await apiFetch('/users/me/photo-base64', {
      method: 'POST',
      body:   JSON.stringify({ photo_base64: base64String, mime_type: mimeType }),
    });
    setUser(data);
    return data;
  };
  const deleteProfilePhoto = async () => {
    const data = await apiFetch('/users/me/photo', { method: 'DELETE' });
    setUser(data);
    return data;
  };

  useEffect(() => { loadUser(); }, []);

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('token');
  };

  const login = async (credentials) => {
    const response = await fetch(`${API_BASE}/users/login`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(credentials),
    });
    if (!response.ok) { const e = await response.json(); throw new Error(extractApiDetail(e.detail || 'Ошибка входа')); }
    const data = await response.json();
    localStorage.setItem('token', data.access_token);
    await loadUser();
    return data;
  };

  const register = async (userData) => {
    const response = await fetch(`${API_BASE}/users/register`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(userData),
    });
    if (!response.ok) { const e = await response.json(); throw new Error(extractApiDetail(e.detail || 'Ошибка регистрации')); }
    const data = await response.json();
    localStorage.setItem('token', data.access_token);
    await loadUser();
    return data;
  };

  const value = {
    user, loading, isAuthenticated, setUser,
    logout, login, register, loadUser,
    uploadProfilePhoto, uploadProfilePhotoBase64, deleteProfilePhoto,
    updateProfile, changePassword, requestPasswordReset, resetPassword,
    getFarms, createFarm, updateFarm, deleteFarm,
    getPastures, getPasturesByFarm, createPasture, updatePasture, deletePasture,
    getDrones, getDronesByFarm, getDrone, createDrone, updateDrone, deleteDrone, updateDroneStatus,
    chatAI,
    // Biomass
    uploadBiomassPhoto,
    startDroneMeasurement,
    getMeasurements,
    getPastureMeasurements,
    getPastureStats,
    deleteMeasurement,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
