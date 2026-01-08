import type { User } from './users';
import type { Booking } from './booking';

export interface Event {
  id: number;
  title: string;
  description?: string;
  images?: Array<{url: string; public_id: string}>;
  date: string;
  location: string;
  ticket_price: number;
  capacity: number;
  created_by: number;
  created_at: string;
  updated_at: string;
  creator?: User;
  bookings?: Booking[];
  pastEvent?: boolean;
}

export interface CreateEventData {
  title: string;
  description?: string;
  date: string;
  location: string;
  ticket_price: number;
  capacity: number;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface EventFilters extends PaginationParams {
  date_from?: string;
  date_to?: string;
  q?: string;
  own_events?: number;
}

export interface PaginatedResponse<T> {
  events?: T[];
  bookings?: T[];
  users?: T[];
  items?: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface EventFormValues {
  title: string;
  description: string;
  images?: File[] | Array<{url: string; public_id: string}>;
  date: string;
  location: string;
  ticket_price: number;
  capacity: number;
}


