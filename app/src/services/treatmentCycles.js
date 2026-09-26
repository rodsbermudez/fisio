import api from './api';

export const listTreatmentCycles = (params = {}) => api.get('/treatment-cycles', { params });

export const getTreatmentCycle = (id) => api.get(`/treatment-cycles/${id}`);

export const createTreatmentCycle = (data) => api.post('/treatment-cycles', data);

export const updateTreatmentCycle = (id, data) => api.put(`/treatment-cycles/${id}`, data);

export const deleteTreatmentCycle = (id) => api.delete(`/treatment-cycles/${id}`);
