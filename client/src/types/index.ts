export enum UserRole {
  ADMIN = 'ADMIN',
  EVENT_MANAGER = 'EVENT_MANAGER',
  CUSTOMER = 'CUSTOMER'
}

export interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  role: UserRole;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface Event {
  id: number;
  title: string;
  description?: string;
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

export interface Booking {
  id: number;
  user_id: number;
  event_id: number;
  attendee_name: string;
  booking_amount: number;
  quantity: number;
  created_at: string;
  updated_at: string;
  event?: Event;
  user?: User;
}

export interface Analytics {
  summary: {
    total_events: number;
    total_bookings: number;
    total_revenue: string;
  };
  revenue_by_event: RevenueByEvent[];
}

export interface RevenueByEvent {
  event_id: number;
  event_title: string;
  event_date: string;
  location: string;
  capacity: number;
  revenue: number;
  total_tickets_sold: number;
  booking_count: number;
  capacity_utilization: string;
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

export interface BookingFilters extends PaginationParams {}

export interface ApiResponse<T> {
  success: boolean;
  type: string;
  message: string;
  data: T;
}

export interface PaginatedResponse<T> {
  events?: T[];
  bookings?: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}