import apiClient from './apiClient';

/**
 * Fetches drivers with optional filters.
 * @param {Object} filters - Filter criteria (category, status, plan, city, search, page, limit)
 */
export const getDrivers = async (filters = {}) => {
  try {
    // Map 'state' from the Enter State Name field if provided in filters
    const response = await apiClient.get('/admin/drivers', { params: filters });
    return response.data; // Returns { total, page, drivers }
  } catch (error) {
    throw error.response ? error.response.data : new Error('Network Error');
  }
};

/**
 * Fetches details for a single driver.
 */
export const getDriverById = async (id) => {
  try {
    const response = await apiClient.get(`/admin/drivers/${id}`);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error('Network Error');
  }
};

// Alias for existing component usage
export const getDriverDetails = getDriverById;

/**
 * Updates driver status or details.
 */
export const updateDriver = async (id, data) => {
  try {
    const response = await apiClient.patch(`/admin/drivers/${id}`, data);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error('Network Error');
  }
};

/**
 * Verifies or rejects a driver document.
 */
export const verifyDocument = async (id, data) => {
  try {
    const response = await apiClient.post(`/admin/drivers/${id}/verify-document`, data);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error('Network Error');
  }
};
/**
 * Fetches all unique state names from drivers.
 */
export const getStates = async () => {
  try {
    const response = await apiClient.get('/admin/drivers/states');
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error('Network Error');
  }
};
/**
 * Updates driver wallet balance.
 */
export const updateDriverWallet = async (id, data) => {
  try {
    const response = await apiClient.post(`/admin/drivers/${id}/wallet/update`, data);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error('Network Error');
  }
};

/**
 * Fetches transaction history for a driver.
 */
export const getDriverTransactions = async (id) => {
  try {
    const response = await apiClient.get(`/admin/drivers/${id}/wallet/transactions`);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error('Network Error');
  }
};

/**
 * Deletes a driver by ID.
 */
export const deleteDriver = async (id) => {
  try {
    const response = await apiClient.delete(`/admin/drivers/${id}`);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error('Network Error');
  }
};
