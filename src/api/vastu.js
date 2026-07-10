import client from './client.js';

export const vastuAPI = {
  // POST /api/vastu/analyze  — compute real vastu score
  analyze: (data) => client.post('/vastu/analyze', data),

  // GET /api/vastu/zones  — get all zone info
  getZones: () => client.get('/vastu/zones'),

  // GET /api/vastu/project/:id
  getProjectVastu: (projectId) => client.get(`/vastu/project/${projectId}`),

  // POST /api/vastu/:id/apply-fixes
  applyFixes: (id, data) => client.post(`/vastu/${id}/apply-fixes`, data),
};
