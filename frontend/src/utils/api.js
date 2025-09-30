import axios from 'axios';

export const API_BASE = 'https://m2t-backend.onrender.com';

export function apiPath(path) {
  const mod = localStorage.getItem('modulo') || 'actual'; // default: actual
  return `/api/${mod}${path}`;
}

export const api = axios.create({
  baseURL: API_BASE,
});

// añade token si existe
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});