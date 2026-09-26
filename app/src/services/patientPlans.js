import api from './api';

export const listPatientPlans = (params = {}) => api.get('/patient-plans', { params });

export const getPatientPlan = (id) => api.get(`/patient-plans/${id}`);

export const createPatientPlan = (data) => api.post('/patient-plans', data);

export const updatePatientPlan = (id, data) => api.put(`/patient-plans/${id}`, data);

export const extendPatientPlan = (id, data = {}) => api.post(`/patient-plans/${id}/extend`, data);

export const finishPatientPlan = (id) => api.patch(`/patient-plans/${id}/finish`);

export const reopenPatientPlan = (id) => api.patch(`/patient-plans/${id}/reopen`);

export const deletePatientPlan = (id) => api.delete(`/patient-plans/${id}`);

export const getPatientPlanHistory = (id) => api.get(`/patient-plans/${id}/history`);

export const toggleExtensionPayment = (extensionId) => api.patch(`/patient-plan-extensions/${extensionId}/toggle-payment`);

export const toggleEvaluationPayment = (appointmentId) => api.patch(`/appointments/${appointmentId}/toggle-evaluation-payment`);
