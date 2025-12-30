import axios from '@/lib/axios';
import { ApiResponse } from '@/types';

export const analyticsAPI = {
  getAnalytics: async () => {
    const response = await axios.get<ApiResponse<any>>('/analytics');
    return response.data;
  },
};