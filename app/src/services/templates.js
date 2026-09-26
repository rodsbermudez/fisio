import api from './api';

export const listTemplates = (params = {}) => api.get('/templates', { params });

export const getTemplate = (id) => api.get(`/templates/${id}`);

export const createTemplate = (data) => api.post('/templates', data);

export const updateTemplate = (id, data) => api.put(`/templates/${id}`, data);

export const deleteTemplate = (id) => api.delete(`/templates/${id}`);
