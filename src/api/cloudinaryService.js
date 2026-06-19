import axios from 'axios';

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

/**
 * Uploads an image to Cloudinary using an unsigned upload preset.
 * @param {File} file - The image file to upload
 * @returns {Promise<string>} - The secure URL of the uploaded image
 */
export const uploadImageToCloudinary = async (file) => {
  if (!CLOUD_NAME || !UPLOAD_PRESET || CLOUD_NAME.includes('your_') || UPLOAD_PRESET.includes('your_')) {
    console.warn('Cloudinary credentials missing or using placeholders. Skipping actual upload.');
    // Throw error so the UI can handle the missing config
    throw new Error('Cloudinary credentials not configured. Please update your .env file.');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', UPLOAD_PRESET);

  try {
    const response = await axios.post(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    return response.data.secure_url;
  } catch (error) {
    console.error('Cloudinary Upload Error:', error);
    const message = error.response?.data?.error?.message || 'Failed to upload image to cloud storage.';
    throw new Error(message);
  }
};
