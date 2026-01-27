// src/contexts/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';

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

    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    if (res.status === 401 || res.status === 403) {
      localStorage.removeItem('token');
      setIsAuthenticated(false);
      setUser(null);
      throw new Error('Сессия истекла. Пожалуйста, войдите заново.');
    }

    if (res.status === 204) {
      return null;
    }

    const contentType = res.headers.get('content-type');
    const hasContent = res.headers.get('content-length') && res.headers.get('content-length') !== '0';

    if (!res.ok) {
      let errorData;
      try {
        if (contentType && contentType.includes('application/json') && hasContent) {
          errorData = await res.json();
        } else {
          errorData = { detail: `Ошибка ${res.status}: ${res.statusText}` };
        }
      } catch {
        errorData = { detail: `Ошибка ${res.status}: ${res.statusText}` };
      }
      throw new Error(errorData.detail || `Ошибка ${res.status}`);
    }

    if (contentType && contentType.includes('application/json') && hasContent) {
      return await res.json();
    }

    return null;
  };

  const loadUser = async () => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }

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

  // ────────────────────────────────────────────────
  // Функции для работы с профилем пользователя
  // ────────────────────────────────────────────────
  const updateProfile = async (profileData) => {
    try {
      const data = await apiFetch('/users/me', {
        method: 'PUT',
        body: JSON.stringify(profileData),
      });
      
      setUser(data);
      return data;
    } catch (error) {
      console.error('Ошибка при обновлении профиля:', error);
      throw error;
    }
  };

  const changePassword = async (oldPassword, newPassword) => {
    try {
      return await apiFetch('/users/me/password', {
        method: 'PUT',
        body: JSON.stringify({
          old_password: oldPassword,
          new_password: newPassword
        }),
      });
    } catch (error) {
      console.error('Ошибка при изменении пароля:', error);
      throw error;
    }
  };

  // Функция для запроса сброса пароля
  const requestPasswordReset = async (email) => {
    try {
      return await apiFetch('/users/password-reset-request', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
    } catch (error) {
      console.error('Ошибка при запросе сброса пароля:', error);
      throw error;
    }
  };

  // Функция для сброса пароля с токеном
  const resetPassword = async (token, newPassword) => {
    try {
      return await apiFetch('/users/password-reset', {
        method: 'POST',
        body: JSON.stringify({
          token,
          new_password: newPassword
        }),
      });
    } catch (error) {
      console.error('Ошибка при сбросе пароля:', error);
      throw error;
    }
  };

  // ────────────────────────────────────────────────
  // Функции для работы с фермами
  // ────────────────────────────────────────────────
  const getFarms = () => apiFetch('/farms/');
  const createFarm = (farmData) => apiFetch('/farms/', {
    method: 'POST',
    body: JSON.stringify(farmData),
  });
  const updateFarm = (id, farmData) => apiFetch(`/farms/${id}`, {
    method: 'PUT',
    body: JSON.stringify(farmData),
  });
  const deleteFarm = (id) => apiFetch(`/farms/${id}`, {
    method: 'DELETE',
  });

  // ────────────────────────────────────────────────
  // Функции для работы с пастбищами
  // ────────────────────────────────────────────────
  const getPastures = () => apiFetch('/pastures/');
  const getPasturesByFarm = (farmId) => apiFetch(`/pastures/farm/${farmId}`);
  const createPasture = (pastureData) => apiFetch('/pastures/', {
    method: 'POST',
    body: JSON.stringify(pastureData),
  });
  const updatePasture = (id, pastureData) => apiFetch(`/pastures/${id}`, {
    method: 'PUT',
    body: JSON.stringify(pastureData),
  });
  const deletePasture = (id) => apiFetch(`/pastures/${id}`, {
    method: 'DELETE',
  });

  // ────────────────────────────────────────────────
  // Функции для работы с дронами
  // ────────────────────────────────────────────────
  const getDrones = () => apiFetch('/drones/');
  const getDronesByFarm = (farmId) => apiFetch(`/drones/farm/${farmId}`);
  const getDrone = (id) => apiFetch(`/drones/${id}`);
  const createDrone = (droneData) => apiFetch('/drones/', {
    method: 'POST',
    body: JSON.stringify(droneData),
  });
  const updateDrone = (id, droneData) => apiFetch(`/drones/${id}`, {
    method: 'PUT',
    body: JSON.stringify(droneData),
  });
  const deleteDrone = (id) => apiFetch(`/drones/${id}`, {
    method: 'DELETE',
  });
  const updateDroneStatus = (id, status) => apiFetch(`/drones/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });

  useEffect(() => {
    loadUser();
  }, []);

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('token');
  };

  const login = async (credentials) => {
    try {
      const response = await fetch(`${API_BASE}/users/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Ошибка входа');
      }

      const data = await response.json();
      localStorage.setItem('token', data.access_token);
      await loadUser();
      return data;
    } catch (error) {
      throw error;
    }
  };

  const register = async (userData) => {
    try {
      const response = await fetch(`${API_BASE}/users/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Ошибка регистрации');
      }

      const data = await response.json();
      localStorage.setItem('token', data.access_token);
      await loadUser();
      return data;
    } catch (error) {
      throw error;
    }
  };

  const uploadProfilePhoto = async (file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const token = getToken();
      const res = await fetch(`${API_BASE}/users/me/photo`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.detail || 'Ошибка при загрузке фото');
      }

      const data = await res.json();
      setUser(data);
      return data;
    } catch (error) {
      console.error('Ошибка при загрузке фото:', error);
      throw error;
    }
  };

  const uploadProfilePhotoBase64 = async (base64String, mimeType) => {
    try {
      const data = await apiFetch('/users/me/photo-base64', {
        method: 'POST',
        body: JSON.stringify({
          photo_base64: base64String,
          mime_type: mimeType
        }),
      });
      
      setUser(data);
      return data;
    } catch (error) {
      console.error('Ошибка при загрузке фото:', error);
      throw error;
    }
  };

  const deleteProfilePhoto = async () => {
    try {
      const data = await apiFetch('/users/me/photo', {
        method: 'DELETE',
      });
      
      setUser(data);
      return data;
    } catch (error) {
      console.error('Ошибка при удалении фото:', error);
      throw error;
    }
  };


  const value = {
    // Состояние
    user,
    loading,
    isAuthenticated,
    setUser,
    
    // Основные методы аутентификации
    logout,
    login,
    register,
    loadUser,

    // Методы работы с фото профиля
    uploadProfilePhoto,
    uploadProfilePhotoBase64,
    deleteProfilePhoto,

    
    // Методы работы с профилем
    updateProfile,
    changePassword,
    requestPasswordReset,
    resetPassword,
    
    // Фермы
    getFarms,
    createFarm,
    updateFarm,
    deleteFarm,
    
    // Пастбища
    getPastures,
    getPasturesByFarm,
    createPasture,
    updatePasture,
    deletePasture,
    
    // Дроны
    getDrones,
    getDronesByFarm,
    getDrone,
    createDrone,
    updateDrone,
    deleteDrone,
    updateDroneStatus,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}