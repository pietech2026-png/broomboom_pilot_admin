import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_BASE_URL || 'https://broomboom-pilot-backend.vercel.app/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to add the auth token to every request
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('broomboom_admin_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Bust 304 cache on every GET request
    if (config.method === 'get' || !config.method) {
      config.params = { ...config.params, _t: Date.now() };
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle token expiration
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Handle unauthorized error (e.g., redirect to login or clear token)
      localStorage.removeItem('broomboom_admin_token');
      // window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
