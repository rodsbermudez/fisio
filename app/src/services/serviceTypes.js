import api from './api';

export const listServiceTypes = (params = {}) => api.get('/service-types', { params });

export const getServiceType = (id) => api.get(`/service-types/${id}`);

export const createServiceType = (data) => api.post('/service-types', data);

export const updateServiceType = (id, data) => api.put(`/service-types/${id}`, data);

export const deleteServiceType = (id) => api.delete(`/service-types/${id}`);
