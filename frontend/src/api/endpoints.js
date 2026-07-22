import api from './axios';

// ---------- Auth ----------
export const authApi = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  verifyTwoFactor: (data) => api.post('/auth/verify-2fa', data),
  verifyEmail: (token) => api.get(`/auth/verify-email/${token}`),
  resendVerification: () => api.post('/auth/resend-verification'),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, password) => api.post(`/auth/reset-password/${token}`, { password }),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  setupTwoFactor: () => api.post('/auth/2fa/setup'),
  confirmTwoFactor: (code) => api.post('/auth/2fa/confirm', { code }),
  disableTwoFactor: (password) => api.post('/auth/2fa/disable', { password }),
  googleLoginUrl: () => `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/google`,
};

// ---------- Users / Profiles ----------
export const userApi = {
  updateBasicProfile: (formData) =>
    api.put('/users/me', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getFreelancerProfile: (id = '') => api.get(`/users/freelancer/${id}`),
  updateFreelancerProfile: (data) => api.put('/users/freelancer/me', data),
  uploadFreelancerFile: (formData) =>
    api.post('/users/freelancer/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getClientProfile: (id = '') => api.get(`/users/client/${id}`),
  updateClientProfile: (data) => api.put('/users/client/me', data),
  getFreelancerAnalytics: () => api.get('/users/freelancer/analytics'),
};

// ---------- Gigs ----------
export const gigApi = {
  getGigs: (params) => api.get('/gigs', { params }),
  getGigById: (id) => api.get(`/gigs/${id}`),
  createGig: (data) => api.post('/gigs', data),
  updateGig: (id, data) => api.put(`/gigs/${id}`, data),
  deleteGig: (id) => api.delete(`/gigs/${id}`),
  inviteFreelancer: (id, freelancerUserId) => api.post(`/gigs/${id}/invite`, { freelancerUserId }),
  getRecommendations: (id) => api.get(`/gigs/${id}/recommendations`),
  uploadAttachment: (id, formData) =>
    api.post(`/gigs/${id}/attachments`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  updateMilestone: (gigId, milestoneId, data) => api.put(`/gigs/${gigId}/milestones/${milestoneId}`, data),
};

// ---------- Proposals ----------
export const proposalApi = {
  submit: (gigId, data) => api.post(`/proposals/${gigId}`, data),
  getForGig: (gigId) => api.get(`/proposals/gig/${gigId}`),
  getMine: () => api.get('/proposals/my'),
  accept: (id) => api.put(`/proposals/${id}/accept`),
  reject: (id) => api.put(`/proposals/${id}/reject`),
  negotiate: (id, data) => api.put(`/proposals/${id}/negotiate`, data),
  withdraw: (id) => api.put(`/proposals/${id}/withdraw`),
};

// ---------- Search ----------
export const searchApi = {
  gigs: (params) => api.get('/search/gigs', { params }),
  freelancers: (params) => api.get('/search/freelancers', { params }),
  trendingSkills: () => api.get('/search/trending-skills'),
};

// ---------- Reviews ----------
export const reviewApi = {
  create: (gigId, data) => api.post(`/reviews/${gigId}`, data),
  getForUser: (userId) => api.get(`/reviews/user/${userId}`),
  getForGig: (gigId) => api.get(`/reviews/gig/${gigId}`),
  getAnalytics: (userId) => api.get(`/reviews/analytics/${userId}`),
};

// ---------- Chat ----------
export const chatApi = {
  getInbox: () => api.get('/chat'),
  getConversation: (userId, params) => api.get(`/chat/${userId}`, { params }),
  sendMessage: (userId, formData) =>
    api.post(`/chat/${userId}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  markRead: (userId) => api.put(`/chat/${userId}/read`),
};

// ---------- Notifications ----------
export const notificationApi = {
  getAll: (params) => api.get('/notifications', { params }),
  markRead: (id) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/read-all'),
  remove: (id) => api.delete(`/notifications/${id}`),
};

// ---------- Payments ----------
export const paymentApi = {
  createRazorpayOrder: (data) => api.post('/payments/razorpay/create-order', data),
  verifyRazorpay: (data) => api.post('/payments/razorpay/verify', data),
  createStripeIntent: (data) => api.post('/payments/stripe/create-intent', data),
  release: (paymentId) => api.post(`/payments/${paymentId}/release`),
  refund: (paymentId) => api.post(`/payments/${paymentId}/refund`),
  getHistory: () => api.get('/payments/history'),
};

// ---------- Disputes ----------
export const disputeApi = {
  raise: (gigId, formData) =>
    api.post(`/disputes/${gigId}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getAll: (params) => api.get('/disputes', { params }),
  getById: (id) => api.get(`/disputes/${id}`),
  review: (id, note) => api.put(`/disputes/${id}/review`, { note }),
  resolve: (id, data) => api.put(`/disputes/${id}/resolve`, data),
};

// ---------- Admin ----------
export const adminApi = {
  getUsers: (params) => api.get('/admin/users', { params }),
  suspendUser: (id, reason) => api.put(`/admin/users/${id}/suspend`, { reason }),
  reinstateUser: (id) => api.put(`/admin/users/${id}/reinstate`),
  verifyFreelancer: (id) => api.put(`/admin/freelancers/${id}/verify`),
  approveGig: (id) => api.put(`/admin/gigs/${id}/approve`),
  rejectGig: (id, reason) => api.put(`/admin/gigs/${id}/reject`, { reason }),
  getAnalytics: () => api.get('/admin/analytics'),
  getFraudFlags: () => api.get('/admin/fraud-flags'),
  getLogs: () => api.get('/admin/logs'),
  getAllPayments: (params) => api.get('/admin/payments', { params }),
  getFlaggedReviews: () => api.get('/admin/reviews/flagged'),
  moderateReview: (id, data) => api.put(`/admin/reviews/${id}/moderate`, data),
};
