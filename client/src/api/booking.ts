import axios from '@/lib/axios';
import { Booking, CreateBookingData, ApiResponse, PaginatedResponse } from '@/types';

interface GetBookingsParams {
  page?: number;
  limit?: number;
}

export const bookingsAPI = {
  createBooking: async (data: CreateBookingData) => {
    const response = await axios.post<ApiResponse<Booking>>('/bookings', data);
    return response.data;
  },

  getUserBookings: async (params: GetBookingsParams = {}) => {
    const response = await axios.get<ApiResponse<PaginatedResponse<Booking>>>('/bookings', { params });
    return response.data;
  },

  getBookingById: async (id: number) => {
    const response = await axios.get<ApiResponse<Booking>>(`/bookings/${id}`);
    return response.data;
  },

  cancelBooking: async (id: number) => {
    const response = await axios.delete<ApiResponse>(`/bookings/${id}`);
    return response.data;
  },
};