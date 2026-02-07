import client from './client';

export const listByQuestion = (questionId) =>
  client.get(`/questions/${questionId}/answers`).then((r) => r.data);

export const getOne = (answerId) =>
  client.get(`/answers/${answerId}`).then((r) => r.data);

export const getVersions = (answerId) =>
  client.get(`/answers/${answerId}/versions`).then((r) => r.data);

export const submit = (questionId, data) =>
  client.post(`/questions/${questionId}/answers`, data).then((r) => r.data);

export const requestRevision = (answerId) =>
  client.post(`/answers/${answerId}/request-revision`).then((r) => r.data);

export const approveAnswer = (answerId) =>
  client.post(`/answers/${answerId}/approve`).then((r) => r.data);

export const rejectAnswer = (answerId, reason) =>
  client.post(`/answers/${answerId}/reject`, { reason }).then((r) => r.data);
