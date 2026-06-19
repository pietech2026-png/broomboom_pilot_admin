import apiClient from './apiClient';

export const getTickets = async (filters = {}) => {
  try {
    const response = await apiClient.get('/admin/support/tickets', { params: filters });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error('Network Error');
  }
};

export const getTicketDetails = async (id) => {
  try {
    const response = await apiClient.get(`/admin/support/tickets/${id}`);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error('Network Error');
  }
};

export const updateTicketStatus = async (id, status) => {
  try {
    const response = await apiClient.patch(`/admin/support/tickets/${id}`, { status });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error('Network Error');
  }
};

export const replyTicket = async (id, message) => {
  try {
    const response = await apiClient.post(`/admin/support/tickets/${id}/reply`, { message });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error('Network Error');
  }
};

export const deleteTicket = async (id) => {
  try {
    const response = await apiClient.delete(`/admin/support/tickets/${id}`);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error('Network Error');
  }
};
