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
    const response = await axios.post<ApiResponse<Event>>("/events", data);
    return response.data;
  },

  updateEvent: async ({
    id,
    data,
  }: {
    id: number;
    data: Partial<CreateEventData>;
  }) => {
    const response = await axios.put<ApiResponse<Event>>(`/events/${id}`, data);
    return response.data;
  },

  deleteEvent: async (id: number) => {
    const response = await axios.delete<ApiResponse<null>>(`/events/${id}`);
    return response.data;
  },
};
