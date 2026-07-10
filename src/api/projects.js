import client from './client.js';

export const projectsAPI = {
  getAll:    (params) => client.get('/projects', { params }),
  getById:   (id)     => client.get(`/projects/${id}`),
  create:    (data)   => client.post('/projects', data),
  update:    (id, data) => client.put(`/projects/${id}`, data),
  delete:    (id)     => client.delete(`/projects/${id}`),
  saveWorkspace: (id, data) => client.patch(`/projects/${id}/workspace`, data),
};
