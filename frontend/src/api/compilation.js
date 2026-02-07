import client from './client';

export const saveCompilation = (questionId, content) =>
  client.put(`/questions/${questionId}/compilation`, { content }).then((r) => r.data);

export const approveCompilation = (questionId) =>
  client.post(`/questions/${questionId}/compilation/approve`).then((r) => r.data);
