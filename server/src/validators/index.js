const createEventSchema = require('./eventValidator').createEventSchema;
const updateEventSchema = require('./eventValidator').updateEventSchema;
const getEventsSchema = require('./eventValidator').getEventsSchema;

const createBookingSchema = require('./bookingValidator').createBookingSchema;

const loginSchema = require('./authValidator').loginSchema;
const registerSchema = require('./authValidator').registerSchema;

module.exports = {
  createEventSchema,
  updateEventSchema,
  getEventsSchema,
  createBookingSchema,
  loginSchema,
  registerSchema,
};
