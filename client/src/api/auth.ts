import axios from '@/lib/axios';
import { LoginCredentials, RegisterData, ApiResponse, AuthResponse } from '@/types';

export const authAPI = {
  register: async (data: RegisterData) => {
    const response = await axios.post<ApiResponse<AuthResponse>>('/auth/register', data);
    return response.data;
  },

  login: async (data: LoginCredentials) => {
    const response = await axios.post<ApiResponse<AuthResponse>>('/auth/login', data);
    return response.data;
  },
};