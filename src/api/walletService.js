import apiClient from './apiClient';

/**
 * Fetches dashboard wallet summary.
 */
export const getWalletSummary = async () => {
  try {
    const response = await apiClient.get('/admin/wallet/summary');
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error('Network Error');
  }
};

/**
 * Fetches transaction history.
 */
export const getTransactions = async (params) => {
  try {
    const response = await apiClient.get('/admin/financial/transactions', { params });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error('Network Error');
  }
};

/**
 * Fetches withdrawal requests.
 */
export const getWithdrawals = async (status) => {
  try {
    const response = await apiClient.get('/admin/financial/withdrawals', { params: { status } });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error('Network Error');
  }
};

/**
 * Processes a withdrawal request.
 */
export const processWithdrawal = async (id, data) => {
  try {
    const response = await apiClient.post(`/admin/financial/withdrawals/${id}/process`, data);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error('Network Error');
  }
};

/**
 * Manually adjusts a wallet balance.
 */
export const adjustWallet = async (data) => {
  try {
    const response = await apiClient.post('/admin/financial/wallet/adjust', data);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error('Network Error');
  }
};
