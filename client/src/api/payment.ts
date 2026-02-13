import axios from "@/lib/axios";
import { ApiResponse } from "@/types";

interface CheckoutSessionResponse {
  url: string;
}

export const paymentAPI = {
  createCheckoutSession: async (
    eventId: number,
    quantity: number,
    attendeeName: string
  ) => {
    const response = await axios.post<ApiResponse<CheckoutSessionResponse>>(
      "/payments/checkout-session",
      {
        event_id: eventId,
        quantity,
        attendee_name: attendeeName,
      }
    );
    return response.data;
  },
};
