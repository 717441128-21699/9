const BASE = '/api';

async function request(url, options = {}) {
  const res = await fetch(BASE + url, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  health: () => request('/health'),

  listTasks: () => request('/tasks'),
  getTask: (id) => request(`/tasks/${id}`),
  createTask: (data) => request('/tasks', { method: 'POST', body: JSON.stringify(data) }),
  updateTaskStatus: (id, status, progress) =>
    request(`/tasks/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status, progress }) }),

  listAlerts: (reviewed) =>
    request('/alerts' + (reviewed !== undefined ? `?reviewed=${reviewed}` : '')),
  reviewAlert: (id, reviewedBy, comment) =>
    request(`/alerts/${id}/review`, { method: 'POST', body: JSON.stringify({ reviewedBy, comment }) }),

  listApprovals: () => request('/approvals'),
  approveByEngineer: (taskId, engineerId, engineerName, comment, score) =>
    request(`/approvals/task/${taskId}/engineer`, {
      method: 'POST',
      body: JSON.stringify({ engineerId, engineerName, comment, score }),
    }),
  approveByChief: (taskId, chiefId, chiefName, comment) =>
    request(`/approvals/task/${taskId}/chief`, {
      method: 'POST',
      body: JSON.stringify({ chiefId, chiefName, comment }),
    }),
  rejectApproval: (taskId, comment) =>
    request(`/approvals/task/${taskId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ comment }),
    }),

  listPlans: () => request('/dispatch/plans'),
  createPlan: (data) =>
    request('/dispatch/plans', { method: 'POST', body: JSON.stringify(data) }),
  updatePlanStatus: (id, status) =>
    request(`/dispatch/plans/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) }),

  listRules: () => request('/dispatch/rules'),
  useRule: (id) => request(`/dispatch/rules/${id}/use`, { method: 'POST' }),

  dailyStats: () => request('/stats/daily'),
  radarStats: () => request('/stats/radar'),
  deviationStats: () => request('/stats/deviation'),

  listUsers: () => request('/users'),
  currentUser: () => request('/users/current'),

  uploadFile: async (taskId, type, file) => {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('taskId', taskId);
    fd.append('type', type);
    const res = await fetch(BASE + '/upload/file', { method: 'POST', body: fd });
    if (!res.ok) throw new Error('上传失败');
    return res.json();
  },
  listTaskFiles: (taskId) => request(`/upload/task/${taskId}`),

  runSimulation: (taskId) => request(`/simulate/${taskId}`, { method: 'POST' }),
  advanceTask: (taskId, status, progress, message) =>
    request(`/simulate/${taskId}/advance`, {
      method: 'POST',
      body: JSON.stringify({ status, progress, message }),
    }),
};
