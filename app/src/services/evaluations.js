import api from './api';

export const listEvaluations = (params = {}) => api.get('/evaluations', { params });

export const getEvaluation = (id) => api.get(`/evaluations/${id}`);

export const createEvaluation = (data) => api.post('/evaluations', data);

export const updateEvaluation = (id, data) => api.put(`/evaluations/${id}`, data);

export const deleteEvaluation = (id) => api.delete(`/evaluations/${id}`);

export const finalizeEvaluation = (id) => api.post(`/evaluations/${id}/finalize`);

export const unfinalizeEvaluation = (id) => api.post(`/evaluations/${id}/unfinalize`);
