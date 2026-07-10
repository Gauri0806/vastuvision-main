import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const client = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// ── Request: attach JWT token ──────────────────────────────
client.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('vv_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response: DO NOT auto-logout on 401 ───────────────────
// Let each page / AuthContext handle auth errors individually.
// Auto-logout caused a race condition: Dashboard API calls returned
// 401 (projects not found / backend issue) and wiped the session
// immediately after login.
client.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error)
);

export default client;
