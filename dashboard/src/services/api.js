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

// AI API
export const aiAPI = {
  getPopularProducts: (limit = 5) => api.get(`/api/ai/recommendations/popular?limit=${limit}`),
  getUserRecommendations: (userId, limit = 5) => api.get(`/api/ai/recommendations/user/${userId}?limit=${limit}`),
  getSimilarProducts: (productId, limit = 5) => api.get(`/api/ai/recommendations/product/${productId}?limit=${limit}`),
  trainModel: () => api.post('/api/ai/train'),
  getModelStatus: () => api.get('/api/ai/model/status'),
};

export default api;
