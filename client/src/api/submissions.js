import API from './axios';
// but the token interceptor in axios.js must still fire (it does via the shared instance)
export const submitTask = (taskId, formData) =>
  API.post(`/submissions/${taskId}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

export const fetchSubmission = (taskId) => API.get(`/submissions/${taskId}`);

export const fetchMySubmissions = () => API.get('/submissions/talent/mine');

export const fetchAllSubmissions = () => API.get('/submissions/admin/all');

export const reviewSubmission = (id, reviewStatus) =>
  API.put(`/submissions/${id}/review`, { reviewStatus });

