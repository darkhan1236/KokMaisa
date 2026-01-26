import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000"; // адрес FastAPI

export const getFarms = async (token) => {
  const res = await axios.get(`${API_URL}/farms/`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

export const createFarm = async (farmData, token) => {
  const res = await axios.post(`${API_URL}/farms/`, farmData, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

export const updateFarm = async (farmId, farmData, token) => {
  const res = await axios.put(`${API_URL}/farms/${farmId}`, farmData, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

export const deleteFarm = async (farmId, token) => {
  const res = await axios.delete(`${API_URL}/farms/${farmId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};
