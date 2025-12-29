import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { bookingsAPI } from '@/api/bookings';
import { QUERY_KEYS } from '@/lib/constants';
import { CreateBookingData } from '@/types';

interface UseBookingsParams {
  page?: number;
  limit?: number;
}

export const useBookings = (params: UseBookingsParams = {}) => {
  return useQuery({
    queryKey: [QUERY_KEYS.BOOKINGS, params],
    queryFn: () => bookingsAPI.getUserBookings(params),
  });
};

export const useBooking = (id: number | null) => {
  return useQuery({
    queryKey: [QUERY_KEYS.BOOKING, id],
    queryFn: () => bookingsAPI.getBookingById(id!),
    enabled: !!id,
  });
};

export const useCreateBooking = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: bookingsAPI.createBooking,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.BOOKINGS] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.EVENTS] });
      toast.success('Booking created successfully');
    },
  });
};

export const useCancelBooking = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: bookingsAPI.cancelBooking,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.BOOKINGS] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.EVENTS] });
      toast.success('Booking cancelled successfully');
    },
  });
};