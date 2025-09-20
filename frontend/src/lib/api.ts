import axios from 'axios';

// Get the base URL for the API
export const getApiBaseUrl = () => {
  return process.env.NEXT_PUBLIC_API_URL || 'https://instagram-clone-backend-tu60.onrender.com';
};

// Helper function to get full image URL
export const getImageUrl = (imagePath: string | undefined) => {
  if (!imagePath) return '';
  
  // If the image path is already a full URL (Cloudinary), return as is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  
  // For backward compatibility with local uploads
  return `${getApiBaseUrl()}${imagePath}`;
};

// Create axios instance for API calls to Express.js backend
const api = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor to add auth token if available
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Redirect to login if unauthorized, but not if already on login page
      if (typeof window !== 'undefined') {
        localStorage.removeItem('authToken');
        if (!window.location.pathname.includes('/auth/login')) {
          window.location.href = '/auth/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
