import client from './client';

export const listComments = (answerId) =>
  client.get(`/answers/${answerId}/comments`).then((r) => r.data);

export const addComment = (answerId, data) =>
  client.post(`/answers/${answerId}/comments`, data).then((r) => r.data);

export const resolveComment = (answerId, commentId) =>
  client.patch(`/answers/${answerId}/comments/${commentId}/resolve`).then((r) => r.data);
