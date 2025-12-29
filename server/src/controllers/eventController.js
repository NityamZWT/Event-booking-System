const eventService = require("../services/eventService");
const {
  createEventSchema,
  updateEventSchema,
} = require("../validators/eventValidator");
const {
  CreatedResponse,
  SuccessResponse,
} = require("../utils/responseHandler");
const { ValidationError } = require("../utils/errors");
const { boolean } = require("yup");

const createEvent = async (req, res, next) => {
  try {
    const validatedData = await createEventSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    const event = await eventService.createEvent(validatedData, req.user.id); 

    return new CreatedResponse("Event created successfully", event).send(res);
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

const getEvents = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const own_events = parseInt(req.query.own_events)
console.log("query---", req.query.own_events);

    const filters = {};
    if (req.user.role === "EVENT_MANAGER" && own_events === 1) {
      
      filters.created_by = req.user.id;
    }
    console.log("inside",filters);

    if (req.query.date_from) {
      filters.date_from = req.query.date_from;
    }

    if (req.query.date_to) {
      filters.date_to = req.query.date_to;
    }
    if (req.query.q) {
      filters.q = req.query.q;
    }
console.log(filters,'filter');

    const result = await eventService.getEvents(page, limit, filters);

    return new SuccessResponse("Events retrieved successfully", result).send(
      res
    );
  } catch (error) {
    next(error);
  }
};

const getEventById = async (req, res, next) => {
  try {
    const event = await eventService.getEventById(parseInt(req.params.id));

    return new SuccessResponse("Event retrieved successfully", event).send(res);
  } catch (error) {
    next(error);
  }
};

const updateEvent = async (req, res, next) => {
  try {
    const validatedData = await updateEventSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    const event = await eventService.updateEvent(
      parseInt(req.params.id),
      validatedData,
      req.user.id,
      req.user.role
    );

    return new SuccessResponse("Event updated successfully", event).send(res);
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

const deleteEvent = async (req, res, next) => {
  try {
    await eventService.deleteEvent(
      parseInt(req.params.id),
      req.user.id,
      req.user.role
    );

    return new SuccessResponse("Event deleted successfully").send(res);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createEvent,
  getEvents,
  getEventById,
  updateEvent,
  deleteEvent,
};
