const eventService = require("../services/eventService");
const {
  createEventSchema,
  updateEventSchema,
  getEventsSchema,
} = require("../validators/eventValidator");
const {
  CreatedResponse,
  SuccessResponse,
} = require("../utils/responseHandler");
const { ValidationError } = require("../utils/errors");

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
    const validatedQuery = await getEventsSchema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true,
    });

    const page = validatedQuery.page || 1;
    const limit = validatedQuery.limit || 10;
    const own_events = validatedQuery.own_events;

    const filters = {};
    if (req.user.role === "EVENT_MANAGER" && own_events === 1) {
      filters.created_by = req.user.id;
    }

    if (validatedQuery.date_from) {
      filters.date_from = validatedQuery.date_from;
    }

    if (validatedQuery.date_to) {
      filters.date_to = validatedQuery.date_to;
    }
    if (validatedQuery.q) {
      filters.q = validatedQuery.q;
    }

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
    const event = await eventService.getEventById(parseInt(req.params.id), req.user.role);

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
