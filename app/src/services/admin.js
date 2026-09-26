import api from './api';

export const getAdminDashboard = () => api.get('/admin/dashboard');

export const listTenants = (params = {}) => api.get('/admin/tenants', { params });

export const createTenant = (data) => api.post('/admin/tenants', data);

export const getTenant = (id) => api.get(`/admin/tenants/${id}`);

export const updateTenant = (id, data) => api.put(`/admin/tenants/${id}`, data);

export const deleteTenant = (id) => api.delete(`/admin/tenants/${id}`);

export const listTenantUsers = (id, params = {}) =>
  api.get(`/admin/tenants/${id}/users`, { params });

export const impersonateTenant = (id) => api.post(`/admin/tenants/${id}/impersonate`);
