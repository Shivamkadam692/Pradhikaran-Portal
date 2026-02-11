import client from './client';

export const listAll = (params) =>
  client.get('/answers/all', { params }).then((r) => r.data);

export const listByQuestion = (questionId) =>
  client.get(`/questions/${questionId}/answers`).then((r) => r.data);

export const getOne = (answerId) =>
  client.get(`/answers/${answerId}`).then((r) => r.data);

export const getVersions = (answerId) =>
  client.get(`/answers/${answerId}/versions`).then((r) => r.data);

export const submit = (questionId, data, files = []) => {
  const formData = new FormData();
  formData.append('content', data.content || '');
  if (data.revisionNote) {
    formData.append('revisionNote', data.revisionNote);
  }
  
  // Append files
  files.forEach((file) => {
    formData.append('attachments', file);
  });
  
  return client.post(`/questions/${questionId}/answers`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }).then((r) => r.data);
};

export const downloadFile = (answerId, fileId) => {
  const token = localStorage.getItem('token');
  return fetch(`/api/answers/${answerId}/files/${fileId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }).then((res) => {
    if (!res.ok) throw new Error('Download failed');
    return res.blob();
  });
};

export const requestRevision = (answerId, revisionReason = '') =>
  client.post(`/answers/${answerId}/request-revision`, { revisionReason }).then((r) => r.data);

export const approveAnswer = (answerId) =>
  client.post(`/answers/${answerId}/approve`).then((r) => r.data);

export const rejectAnswer = (answerId, reason) =>
  client.post(`/answers/${answerId}/reject`, { reason }).then((r) => r.data);

export const deleteAnswer = (answerId) =>
  client.delete(`/answers/${answerId}`).then((r) => r.data);
