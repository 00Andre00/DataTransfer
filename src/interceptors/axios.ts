// src/config/axios.ts
import axios from 'axios';
import authService from '../services/authService';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ==================== REQUEST ====================
apiClient.interceptors.request.use(
  (config) => {
    const token = authService.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ==================== RESPONSE ====================
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const errorMsg = error.response?.data?.error || error.message;

    if (status === 401) {
      // Evitar loop si ya estamos en login
      if (window.location.pathname !== '/login') {
        authService.logout();
        if (errorMsg !== 'Token de acceso requerido') {
          alert('Su sesión ha expirado. Por favor, inicie sesión nuevamente.');
        }
        window.location.href = '/login';
      }
    } else if (status === 403) {
      alert('No tiene permisos para realizar esta acción.');
    }

    return Promise.reject(error);
  }
);

export default apiClient;