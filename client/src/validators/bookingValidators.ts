import * as Yup from "yup";

export const bookingSchema = Yup.object({
  attendee_name: Yup.string()
    .trim()
    .min(2, "Attendee name must be at least 2 characters")
    .max(100, "Attendee name cannot exceed 100 characters")
    .matches(/^[a-zA-Z\s]+$/, "Attendee name must only contain letters")
    .required("Attendee name is required"),
  quantity: Yup.number()
    .integer("Quantity must be an integer")
    .min(1, "Quantity must be at least 1")
    .default(1),
});
