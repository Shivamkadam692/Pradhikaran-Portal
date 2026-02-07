import client from './client';

export const getDashboard = () =>
  client.get('/analytics/dashboard').then((r) => r.data);
