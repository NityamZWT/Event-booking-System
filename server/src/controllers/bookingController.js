const bookingService = require("../services/bookingService");
const { createBookingSchema, getUserBookingsSchema } = require("../validators/bookingValidator");
const {
  CreatedResponse,
  SuccessResponse,
} = require("../utils/responseHandler");
const { ValidationError } = require("../utils/errors");

const createBooking = async (req, res, next) => {
  try {
    const validatedData = await createBookingSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    const booking = await bookingService.createBooking( 
      validatedData,
      req.user.id
    );

    return new CreatedResponse("Booking created successfully", booking).send(
      res
    );
  } catch (error) {
    if (error.name === "ValidationError") {
      const errors = error.inner.reduce((acc, err) => {
        if (err.path) {
          acc[err.path] = err.message;
        }
        return acc;
      }, {});
      return next(new ValidationError("Validation failed", errors));
    }
    next(error);
  }
};

const getUserBookings = async (req, res, next) => {
  try {
    const validatedQuery = await getUserBookingsSchema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true,
    });

    const page = validatedQuery.page || 1;
    const limit = validatedQuery.limit || 10;
    const eventId = validatedQuery.eventId;

    const result = await bookingService.getUserBookings(
      req.user.id,
      req.user.role,
      eventId ?? undefined,
      page,
      limit
    );

    return new SuccessResponse("Bookings retrieved successfully", result).send(
      res
    );
  } catch (error) {
    next(error);
  }
};

const getBookingById = async (req, res, next) => {
  try {
    const booking = await bookingService.getBookingById(
      parseInt(req.params.id),
      req.user.id,
      req.user.role
    );

    return new SuccessResponse("Booking retrieved successfully", booking).send(
      res
    );
  } catch (error) {
    next(error);
  }
};

const cancelBooking = async (req, res, next) => {
  try {
    const result = await bookingService.cancelBooking(
      parseInt(req.params.id),
      req.user.id,
      req.user.role
    );

    return new SuccessResponse(result.message).send(res);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createBooking,
  getUserBookings,
  getBookingById,
  cancelBooking,
};
