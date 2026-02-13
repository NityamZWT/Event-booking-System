import type { Event } from './events';
import type { User } from './users';

export interface Booking {
  id: number;
  user_id: number;
  event_id: number;
  attendee_name: string;
  booking_amount: number;
  quantity: number;
  createdAt: string;
  updatedAt: string;
  event?: Event;
  user?: User;
}

export interface CreateBookingData {
  event_id: number;
  attendee_name: string;
  booking_amount: number;
  quantity: number;
  session_id: string;
}
