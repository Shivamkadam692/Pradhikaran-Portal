import client from './client';

export const list = (params) =>
  client.get('/notifications', { params }).then((r) => r.data);

export const markRead = (id) =>
  client.patch(`/notifications/${id}/read`).then((r) => r.data);

export const markAllRead = () =>
  client.post('/notifications/read-all').then((r) => r.data);
