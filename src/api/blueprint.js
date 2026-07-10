import client from './client';

const ML_URL = import.meta.env.VITE_ML_URL || 'http://localhost:8000';

export const blueprintAPI = {
  // Upload blueprint image/PDF — returns analysis job ID
  upload: (formData) =>
    client.post('/blueprint/analyze', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 120000, // ML processing can take time
    }),

  // Poll for results
  getResult: (jobId) => client.get(`/blueprint/${jobId}`),

  // Get all blueprints for current user
  getAll: () => client.get('/blueprint'),

  // Delete a blueprint analysis
  delete: (id) => client.delete(`/blueprint/${id}`),

  // ── ML Room Segmentation (calls FastAPI directly) ───────────
  // Returns: { status, rooms: [{name, type, zone, vastu, confidence, bbox}] }
  predictRooms: async (imageFile) => {
    const formData = new FormData();
    formData.append('file', imageFile);
    const res = await fetch(`${ML_URL}/predict-rooms/`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) throw new Error(`Room ML API error: ${res.status}`);
    return res.json();
  },

  // Send coordinates to 3D frontend (blueprint-ai-frontend at :3000)
  sendCoordinatesToViewer: (coordinates) => {
    return fetch(`${import.meta.env.VITE_3D_APP_URL}/api/blueprint-coordinates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(coordinates),
    });
  },
};

