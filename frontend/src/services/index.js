import api from './api'

export const authService = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  me: () => api.get('/auth/me'),
  changePassword: (data) => api.patch('/auth/change-password', data),
  getStaff: () => api.get('/auth/staff'),
  createStaff: (data) => api.post('/auth/staff', data),
  deactivateStaff: (id) => api.delete(`/auth/staff/${id}`),
}

export const memberService = {
  list: (params) => api.get('/members', { params }),
  getOne: (id) => api.get(`/members/${id}`),
  create: (data) => api.post('/members', data),
  update: (id, data) => api.patch(`/members/${id}`, data),
  delete: (id) => api.delete(`/members/${id}`),
}

export const paymentService = {
  list: (params) => api.get('/payments', { params }),
  getOne: (id) => api.get(`/payments/${id}`),
  record: (data) => api.post('/payments', data),
  monthlyRevenue: (year) => api.get('/payments/monthly-revenue', { params: { year } }),
}

export const dashboardService = {
  summary: () => api.get('/dashboard/summary'),
  recentActivity: () => api.get('/dashboard/recent-activity'),
}

export const reminderService = {
  logs: (params) => api.get('/reminders/logs', { params }),
  triggerPayment: () => api.post('/reminders/trigger/payment'),
  triggerBirthday: () => api.post('/reminders/trigger/birthday'),
  triggerAutoExpire: () => api.post('/reminders/trigger/auto-expire'),
}

export const settingService = {
  getAll: () => api.get('/settings'),
  update: (key, value) => api.patch('/settings', { key, value }),
  updateBulk: (settings) => api.patch('/settings/bulk', { settings }),
  sendTestEmail: (type, to) => api.post('/settings/email-test', { type, to }),
}
