import axios, { AxiosError } from 'axios';
import { toast } from 'react-toastify';
import { ApiResponse } from '@/types';

const axiosInstance = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

axiosInstance.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiResponse>) => {
    const errorResponse = error.response?.data;
    const errorType = errorResponse?.type;
    const errorMessage = errorResponse?.message || 'An error occurred';

    switch (errorType) {
      case 'VALIDATION_ERROR':
        if (errorResponse?.errors) {
          const firstError = Object.values(errorResponse.errors)[0];
          toast.error(firstError || errorMessage);
        } else {
          toast.error(errorMessage);
        }
        break;

      case 'AUTHENTICATION_ERROR':
        toast.error(errorMessage);
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
        break;

      case 'AUTHORIZATION_ERROR':
        toast.error(errorMessage);
        break;

      case 'NOT_FOUND_ERROR':
        toast.error(errorMessage);
        break;

      case 'CONFLICT_ERROR':
        toast.error(errorMessage);
        break;

      case 'DATABASE_ERROR':
        toast.error('Database error occurred');
        break;

      case 'INTERNAL_SERVER_ERROR':
        toast.error('Internal server error');
        break;

      default:
        if (error.response?.status === 500) {
          toast.error('Server error occurred');
        } else if (error.code === 'ERR_NETWORK') {
          toast.error('Network error. Please check your connection.');
        } else {
          toast.error(errorMessage);
        }
        break;
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;