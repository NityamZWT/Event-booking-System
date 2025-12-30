const yup = require('yup');

const createEventSchema = yup.object({
  title: yup
    .string()
    .trim()
    .min(3, 'Title must be at least 3 characters')
    .max(200, 'Title cannot exceed 200 characters')
    .required('Title is required'),
  description: yup
    .string()
    .trim()
    .max(1000, 'Description cannot exceed 1000 characters'),
  date: yup
    .date()
    .min(new Date(), 'Event date must be in the future')
    .required('Event date is required'),
  location: yup
    .string()
    .trim()
    .min(3, 'Location must be at least 3 characters')
    .max(255, 'Location cannot exceed 255 characters')
    .required('Location is required'),
  ticket_price: yup
    .number()
    .min(0, 'Ticket price must be greater than or equal to 0')
    .required('Ticket price is required'),
  capacity: yup
    .number()
    .integer('Capacity must be an integer')
    .min(1, 'Capacity must be at least 1')
    .required('Capacity is required')
});

const updateEventSchema = yup.object({
  title: yup
    .string()
    .trim()
    .min(3, 'Title must be at least 3 characters')
    .max(200, 'Title cannot exceed 200 characters'),
  date: yup.date().min(new Date(), 'Event date must be in the future'),
  location: yup
    .string()
    .trim()
    .min(3, 'Location must be at least 3 characters')
    .max(255, 'Location cannot exceed 255 characters'),
  description: yup
    .string()
    .trim()
    .max(1000, 'Description cannot exceed 1000 characters'),
  ticket_price: yup
    .number()
    .min(0, 'Ticket price must be greater than or equal to 0'),
  capacity: yup
    .number()
    .integer('Capacity must be an integer')
    .min(1, 'Capacity must be at least 1')
});



const getEventsSchema = yup
  .object({
    page: yup
      .number()
      .integer()
      .min(1)
      .default(1)
      .transform((value, originalValue) => (originalValue === undefined ? undefined : Number(originalValue))),
    limit: yup
      .number()
      .integer()
      .min(1)
      .max(100)
      .default(10)
      .transform((value, originalValue) => (originalValue === undefined ? undefined : Number(originalValue))),
    own_events: yup
      .number()
      .oneOf([0, 1])
      .transform((value, originalValue) => (originalValue === undefined ? undefined : Number(originalValue))),
    date_from: yup
      .date()
      .transform((value, originalValue) => (originalValue ? new Date(originalValue) : undefined)),
    date_to: yup
      .date()
      .transform((value, originalValue) => (originalValue ? new Date(originalValue) : undefined)),
    q: yup.string().trim().max(255),
  })
  .test('date-range', 'date_to must be greater than or equal to date_from', (value) => {
    if (!value) return true;
    if (value.date_from && value.date_to) {
      return value.date_to >= value.date_from;
    }
    return true;
  });

module.exports = {
  createEventSchema,
  updateEventSchema,
  getEventsSchema,
};