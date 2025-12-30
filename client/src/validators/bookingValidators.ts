import * as Yup from "yup";

export const bookingSchema = Yup.object({
  attendee_name: Yup.string()
    .min(2)
    .max(100)
    .required("Attendee name is required"),
  quantity: Yup.number()
    .integer("Quantity must be a whole number")
    .min(1, "Quantity must be at least 1")
    .required("Quantity is required"),
});
