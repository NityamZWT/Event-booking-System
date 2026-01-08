import * as Yup from "yup";

// Create a function that returns the schema with dynamic booked tickets validation
export const eventSchema = (bookedTickets: number = 0) => {
  return Yup.object({
    title: Yup.string().required("Title is required"),
    description: Yup.string(),
    // images: Yup.array().of(Yup.string().url("Invalid image URL")),
    date: Yup.string()
      .required("Event date is required")
      .test("is-valid-date", "Invalid date format", (value) => {
        if (!value) return false;
        const date = new Date(value);
        return !isNaN(date.getTime());
      })
      .test(
        "is-future-or-today",
        "Event date must be today or in the future",
        (value) => {
          if (!value) return false;

          const selectedDate = new Date(value);
          const today = new Date();

          // Compare only dates
          const selectedDateOnly = new Date(
            selectedDate.getFullYear(),
            selectedDate.getMonth(),
            selectedDate.getDate()
          );

          const todayOnly = new Date(
            today.getFullYear(),
            today.getMonth(),
            today.getDate()
          );

          return selectedDateOnly >= todayOnly;
        }
      ),
    location: Yup.string().required("Location is required"),
    ticket_price: Yup.number()
      .required("Ticket price is required")
      .min(0, "Ticket price must be at least 0"),
    capacity: Yup.number()
      .required("Capacity is required")
      .min(1, "Capacity must be at least 1")
      .min(
        bookedTickets,
        `Capacity cannot be less than ${bookedTickets} (already booked tickets)`
      )
      .integer("Capacity must be a whole number"),
  });
};

