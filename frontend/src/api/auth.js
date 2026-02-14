import client from './client';

export const login = (email, password) => {
  // Validate inputs
  if (!email || !password) {
    return Promise.reject(new Error('Email and password are required'));
  }
  
  return client.post('/auth/login', { email, password }).then((r) => r.data);
};

export const register = (data) => {
  // Validate inputs
  if (!data || !data.email || !data.password || !data.name || !data.role || !data.department) {
    return Promise.reject(new Error('Required fields are missing for registration'));
  }
  
  return client.post('/auth/register', data).then((r) => r.data);
};

export const me = () => client.get('/auth/me').then((r) => r.data);
