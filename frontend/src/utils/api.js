import axios from 'axios';

// Uses relative URL so CRA proxy (package.json → "proxy": "http://localhost:10001")
const API = axios.create({
  baseURL: '/api',
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

API.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url || '';
    const is401 = error.response?.status === 401;
    const isAuthAction = url.includes('change-password') || url.includes('skip-password') || url.includes('login');
    // Only auto-logout on 401 if it's NOT a password change action
    if (is401 && !isAuthAction) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export const loginUser    = (data) => API.post('/auth/login', data);
export const registerUser = (data) => API.post('/auth/register', data);
export const getMe        = () => API.get('/auth/me');

export default API;
