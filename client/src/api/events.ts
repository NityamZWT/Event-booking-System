import axios from "@/lib/axios";
import {
  Event,
  CreateEventData,
  ApiResponse,
  PaginatedResponse,
} from "@/types";

interface GetEventsParams {
  page?: number;
  limit?: number;
  own_events?: number;
  date_from?: string;
  date_to?: string;
  q?: string;
}

export const eventsAPI = {
  getEvents: async (params: GetEventsParams = {}) => {
    const response = await axios.get<ApiResponse<PaginatedResponse<Event>>>(
      "/events",
      { params }
    );
    return response.data;
  },

  getEventById: async (id: number) => {
    const response = await axios.get<ApiResponse<Event>>(`/events/${id}`);
    return response.data;
  },

  createEvent: async (data: CreateEventData) => {
    const config = (data instanceof FormData)
      ? { headers: { 'Content-Type': 'multipart/form-data' } }
      : undefined;
    const response = await axios.post<ApiResponse<Event>>("/events", data as any, config);
    return response.data;
  },

  updateEvent: async ({
    id,
    data,
  }: {
    id: number;
    data: Partial<CreateEventData>;
  }) => {
    const config = (data instanceof FormData)
      ? { headers: { 'Content-Type': 'multipart/form-data' } }
      : undefined;
    const response = await axios.put<ApiResponse<Event>>(`/events/${id}`, data as any, config);
    return response.data;
  },

  deleteEvent: async (id: number) => {
    const response = await axios.delete<ApiResponse<null>>(`/events/${id}`);
    return response.data;
  },

  getEventList: async (query: string, page: number = 1, limit: number = 10) => {
    const response = await axios.get('/events/list', {
      params: { q: query, page, limit }
    });
    return response.data;
  },
};
