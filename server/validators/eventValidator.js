const yup = require('yup');

const createEventSchema = yup.object({
  title: yup
    .string()
    .trim()
    .min(3, 'Title must be at least 3 characters')
    .max(200, 'Title cannot exceed 200 characters')
    .required('Title is required'),
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
  ticket_price: yup
    .number()
    .min(0, 'Ticket price must be greater than or equal to 0'),
  capacity: yup
    .number()
    .integer('Capacity must be an integer')
    .min(1, 'Capacity must be at least 1')
});

module.exports = {
  createEventSchema,
  updateEventSchema
};