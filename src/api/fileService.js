import apiClient from './apiClient';

/**
 * Uploads a file (Image or PDF) to the local backend storage.
 * @param {File} file - The file to upload
 * @returns {Promise<string>} - The public URL of the uploaded file
 */
export const uploadFile = async (file) => {
  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await apiClient.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data.url;
  } catch (error) {
    console.error('File Upload Error:', error);
    const message = error.response?.data?.message || 'Failed to upload file to local storage.';
    throw new Error(message);
  }
};
