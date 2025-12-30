import * as Yup from "yup";

export const eventSchema = Yup.object({
  title: Yup.string().min(3).max(200).required("Title is required"),
  description: Yup.string().max(1000),
  date: Yup.date()
    .min(new Date(), "Date must be in the future")
    .required("Date is required"),
  location: Yup.string().min(3).max(255).required("Location is required"),
  ticket_price: Yup.number().min(0).required("Price is required"),
  capacity: Yup.number().min(1).required("Capacity is required"),
});
