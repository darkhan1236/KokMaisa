// src/contexts/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

const API_BASE = 'http://localhost:8000/api';  // или process.env.REACT_APP_API_URL

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

    if (!res.ok) {
      let errorData;
      try {
        errorData = await res.json();
      } catch {
        errorData = { detail: 'Неизвестная ошибка' };
      }
      throw new Error(errorData.detail || `Ошибка ${res.status}`);
    }

    return res.json();
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
  // Функции для работы с фермами
  // ────────────────────────────────────────────────

  const getFarms = () => apiFetch('/farms');

  const createFarm = (farmData) => apiFetch('/farms', {
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

  useEffect(() => {
    loadUser();
  }, []);

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('token');
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    setUser,
    logout,
    loadUser,
    // фермы
    getFarms,
    createFarm,
    updateFarm,
    deleteFarm,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}