import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { eventsAPI } from '@/api/events';
import { QUERY_KEYS } from '@/lib/constants';
import { CreateEventData } from '@/types';

interface UseEventsParams {
  page?: number;
  limit?: number;
  own_events?: number;
  date_from?: string;
  date_to?: string;
  q?: string;
}

export const useEvents = (params: UseEventsParams = {}) => {
  return useQuery({
    queryKey: [QUERY_KEYS.EVENTS, params],
    queryFn: () => eventsAPI.getEvents(params),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};

export const useEvent = (id: number | null) => {
  return useQuery({
    queryKey: [QUERY_KEYS.EVENT, id],
    queryFn: () => eventsAPI.getEventById(id!),
    enabled: !!id,
  });
};

export const useCreateEvent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: eventsAPI.createEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.EVENTS] });
      toast.success('Event created successfully');
    },
  });
};

export const useUpdateEvent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: eventsAPI.updateEvent,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.EVENTS] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.EVENT, variables.id] });
      toast.success('Event updated successfully');
    },
  });
};

export const useDeleteEvent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: eventsAPI.deleteEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.EVENTS] });
      toast.success('Event deleted successfully');
    },
  });
};