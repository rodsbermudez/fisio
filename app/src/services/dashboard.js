import api from './api';

export const getDashboard = (params = {}) => api.get('/dashboard', { params });
