import { useMutation } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { paymentAPI } from "@/api/payment";

export const useCreateCheckoutSession = () => {
  return useMutation({
    mutationFn: ({
      eventId,
      quantity,
      attendeeName,
    }: {
      eventId: number;
      quantity: number;
      attendeeName: string;
    }) => paymentAPI.createCheckoutSession(eventId, quantity, attendeeName),
    onError: () => {
      toast.error("Failed to initiate payment");
    },
  });
};
