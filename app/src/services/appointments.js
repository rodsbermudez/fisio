import api from './api';

export const listAppointments = (params = {}) => api.get('/appointments', { params });

export const getAppointment = (id) => api.get(`/appointments/${id}`);

export const createAppointment = (data) => api.post('/appointments', data);

export const updateAppointment = (id, data) => api.put(`/appointments/${id}`, data);

export const deleteAppointment = (id) => api.delete(`/appointments/${id}`);

export const getCalendarAppointments = (params = {}) => api.get('/appointments/calendar', { params });

export const rescheduleAppointment = (id, data) => api.post(`/appointments/${id}/reschedule`, data);
