import apiClient from './apiClient';

export const login = async (email, password) => {
  try {
    const response = await apiClient.post('/admin/auth/login', { email, password });
    if (response.data.token) {
      localStorage.setItem('broomboom_admin_token', response.data.token);
      localStorage.setItem('broomboom_admin_user', JSON.stringify(response.data.admin));
    }
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error('Network Error');
  }
};

export const logout = () => {
  localStorage.removeItem('broomboom_admin_token');
  localStorage.removeItem('broomboom_admin_user');
};

export const getProfile = async () => {
  try {
    const response = await apiClient.get('/admin/auth/profile');
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error('Network Error');
  }
};

export const isAuthenticated = () => {
  return !!localStorage.getItem('broomboom_admin_token');
};
