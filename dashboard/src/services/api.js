import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3004';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Analytics API
export const analyticsAPI = {
  getDashboard: () => api.get('/api/analytics/dashboard'),
  getDailySales: (days = 7) => api.get(`/api/analytics/sales/daily?days=${days}`),
  getTopProducts: (limit = 10) => api.get(`/api/analytics/products/top-selling?limit=${limit}`),
  getUserActivity: (days = 30) => api.get(`/api/analytics/users/activity?days=${days}`),
  getOrderStatus: () => api.get('/api/analytics/orders/status-distribution'),
};

export default api;
