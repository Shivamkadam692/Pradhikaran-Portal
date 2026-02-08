import client from './client';

export const listMine = (params) =>
  client.get('/questions/mine', { params }).then((r) => r.data);

export const listOpen = () =>
  client.get('/questions/open').then((r) => r.data);

export const listAnswered = () =>
  client.get('/questions/answered').then((r) => r.data);

export const getOne = (id) =>
  client.get(`/questions/${id}`).then((r) => r.data);

export const create = (data) =>
  client.post('/questions', data).then((r) => r.data);

export const update = (questionId, data) =>
  client.put(`/questions/${questionId}`, data).then((r) => r.data);

export const publish = (questionId) =>
  client.post(`/questions/${questionId}/publish`).then((r) => r.data);

export const close = (questionId) =>
  client.post(`/questions/${questionId}/close`).then((r) => r.data);

export const deleteQuestion = (questionId) =>
  client.delete(`/questions/${questionId}`).then((r) => r.data);
