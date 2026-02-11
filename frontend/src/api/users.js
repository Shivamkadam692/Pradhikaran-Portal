import client from './client';

// Get pending department registrations (Pradhikaran Office only)
export const getPendingRegistrations = () =>
  client.get('/users/pending').then((r) => r.data);

// Approve a department registration
export const approveRegistration = (userId) =>
  client.post(`/users/${userId}/approve`).then((r) => r.data);

// Reject a department registration
export const rejectRegistration = (userId, reason = '') =>
  client.post(`/users/${userId}/reject`, { reason }).then((r) => r.data);

// Get all departments (for Pradhikaran Office management)
export const getAllDepartments = () =>
  client.get('/users/departments').then((r) => r.data);

// Update user information
export const updateUser = (userId, data) =>
  client.put(`/users/${userId}`, data).then((r) => r.data);

// Disable/enable user account
export const toggleUserStatus = (userId) =>
  client.post(`/users/${userId}/toggle-status`).then((r) => r.data);

// Get user by ID
export const getUserById = (userId) =>
  client.get(`/users/${userId}`).then((r) => r.data);