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

export interface Summary {
  total_events: number;
  total_bookings: number;
  total_revenue: string;
}

// export interface Analytics {
//   summary: Summary;
//   revenue_by_event: RevenueByEvent[];
// }
