const yup = require('yup');

const createBookingSchema = yup.object({
  event_id: yup
    .number()
    .integer('Event ID must be an integer')
    .positive('Event ID must be positive')
    .required('Event ID is required'),
  attendee_name: yup
    .string()
    .trim()
    .min(2, 'Attendee name must be at least 2 characters')
    .max(100, 'Attendee name cannot exceed 100 characters')
    .matches(/^[a-zA-Z\s]+$/, 'Attendee name must only contain letters')
    .required('Attendee name is required'),
  quantity: yup
    .number()
    .integer('Quantity must be an integer')
    .min(1, 'Quantity must be at least 1')
    .default(1)
  ,
  booking_amount: yup
    .number()
    .min(0, 'Booking amount must be greater than or equal to 0')
    .required('Booking amount is required'),
   session_id: yup
    .string()
    .trim()
    .min(10, 'Session ID must be at least 10 characters')
    .max(255, 'Session ID cannot exceed 255 characters')
    .required('Session ID is required')
    .matches(/^cs_(test_|live_)/, 'Invalid session ID format'),
});

const getUserBookingsSchema = yup.object({
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
    eventId: yup
    .number()
    .integer('Event ID must be an integer')
    .positive('Event ID must be positive')
    .optional()
});

module.exports = {
  createBookingSchema,
  getUserBookingsSchema,
};