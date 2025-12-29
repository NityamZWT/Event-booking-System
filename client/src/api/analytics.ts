import axios from '@/lib/axios';
import { Analytics, ApiResponse } from '@/types';

export const analyticsAPI = {
  getAnalytics: async () => {
    const response = await axios.get<ApiResponse<Analytics>>('/analytics');
    return response.data;
  },
};