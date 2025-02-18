// src/components/dashboardAPI.js
import axios from 'axios';
import { authService } from './services/authService';

// Create axios instance with default config
const api = axios.create({
  baseURL: 'https://goldrep-1.onrender.com/api/dashboard'
});

// Add request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = authService.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized error
      authService.removeToken();
      // Redirect to login page
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const dashboardAPI = {
  // Get shop overview stats
  getShopStats: async () => {
    try {
      const response = await api.get('/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching shop stats:', error);
      throw error;
    }
  },

  // Get sales analysis
  getSalesAnalysis: async (timeframe) => {
    try {
      const response = await api.get('/sales', {
        params: { timeframe }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching sales analysis:', error);
      throw error;
    }
  },

  // Get inventory analysis
  getInventoryAnalysis: async () => {
    try {
      const response = await api.get('/inventory');
      return response.data;
    } catch (error) {
      console.error('Error fetching inventory analysis:', error);
      throw error;
    }
  },

  // Get Udhaar analysis
  getUdhaarAnalysis: async () => {
    try {
      const response = await api.get('/udhaar');
      return response.data;
    } catch (error) {
      console.error('Error fetching udhaar analysis:', error);
      throw error;
    }
  },

  // Get metal prices trends
  getMetalPrices: async () => {
    try {
      const response = await api.get('/metal-prices');
      return response.data;
    } catch (error) {
      console.error('Error fetching metal prices:', error);
      throw error;
    }
  }
};
