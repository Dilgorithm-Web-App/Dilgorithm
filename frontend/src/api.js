import axios from 'axios';

// Same-origin in dev: Vite proxies /api → Django (see vite.config.js).
// Use VITE_API_BASE_URL only if you need a direct backend URL (e.g. special local setup).
const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || '/api/',
});

// Automatically attach the JWT token to every request if the user is logged in
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;