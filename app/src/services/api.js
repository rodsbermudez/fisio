import axios from 'axios';

// URL base da API - definida em .env (VITE_API_URL)
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost/fisio/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Interceptor para adicionar token de autenticação
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const healthCheck = () => api.get('/health');

export default api;
