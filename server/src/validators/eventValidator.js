const yup = require("yup");

const createEventSchema = yup.object({
  title: yup.string().required("Title is required"),
  description: yup.string(),
  images: yup
    .array()
    .of(
      yup.object({
        url: yup.string().url("Each image must be a valid URL").required(),
        public_id: yup.string().required(),
      })
    )
    .optional(),
  date: yup
    .string()
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
  location: yup.string().required("Location is required"),
  ticket_price: yup
    .number()
    .required("Ticket price is required")
    .min(0, "Ticket price must be at least 0"),
  capacity: yup
    .number()
    .required("Capacity is required")
    .min(1, "Capacity must be at least 1")
    .integer("Capacity must be a whole number"),
});

const updateEventSchema = yup.object({
  title: yup
    .string()
    .trim()
    .min(3, "Title must be at least 3 characters")
    .max(200, "Title cannot exceed 200 characters"),
  date: yup
    .date()
    .test(
      "is-future-or-today",
      "Event date must be today or in the future",
      (value) => {
        if (!value) return false;

        const selectedDate = new Date(value);
        const today = new Date();

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
    )
    .required("Event date is required"),
  location: yup
    .string()
    .trim()
    .min(3, "Location must be at least 3 characters")
    .max(255, "Location cannot exceed 255 characters"),
  description: yup
    .string()
    .trim()
    .max(1000, "Description cannot exceed 1000 characters"),
  ticket_price: yup
    .number()
    .min(0, "Ticket price must be greater than or equal to 0"),
  capacity: yup
    .number()
    .integer("Capacity must be an integer")
    .min(1, "Capacity must be at least 1"),
  images: yup
    .array()
    .of(
      yup.object({
        url: yup.string().url("Each image must be a valid URL").required(),
        public_id: yup.string().required(),
      })
    )
    .optional(),
  retain_images: yup
    .array()
    .of(yup.string())
    .optional()
    .nullable(),
});

const getEventsSchema = yup
  .object({
    page: yup
      .number()
      .integer()
      .min(1)
      .default(1)
      .transform((value, originalValue) =>
        originalValue === undefined ? undefined : Number(originalValue)
      ),
    limit: yup
      .number()
      .integer()
      .min(1)
      .max(100)
      .default(10)
      .transform((value, originalValue) =>
        originalValue === undefined ? undefined : Number(originalValue)
      ),
    own_events: yup
      .number()
      .oneOf([0, 1])
      .transform((value, originalValue) =>
        originalValue === undefined ? undefined : Number(originalValue)
      ),
    date: yup
      .date()
      .transform((value, originalValue) =>
        originalValue ? new Date(originalValue) : undefined
      ),
    q: yup.string().trim().max(255),
  })
  .test(
    "date-range",
    "date_to must be greater than or equal to date_from",
    (value) => {
      if (!value) return true;
      if (value.date_from && value.date_to) {
        return value.date_to >= value.date_from;
      }
      return true;
    }
  );

module.exports = {
  createEventSchema,
  updateEventSchema,
  getEventsSchema,
};
