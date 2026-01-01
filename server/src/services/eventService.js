const db = require("../models");
const { Op } = require("sequelize");
const {
  NotFoundError,
  AuthorizationError,
  ValidationError,
} = require("../utils/errors");
const { UserRole } = require("../constants/common.types");

const { Event, User, Booking, sequelize } = db;

class EventService {
async createEvent(eventData, userId) {
  return await sequelize.transaction(async (transaction) => {
    // Handle date conversion
    let eventDate = eventData.date;

    if (typeof eventDate === 'string') {
      const parsedDate = new Date(eventDate);
      
      if (!isNaN(parsedDate.getTime())) {
        eventDate = parsedDate;
      }
    }
    
    const event = await Event.create(
      {
        ...eventData,
        date: eventDate,
        created_by: userId,
      },
      { transaction }
    );

    // Return date in ISO format for consistency
    return {
      id: event.id,
      title: event.title,
      date: event.date.toISOString(),
      location: event.location,
      ticket_price: event.ticket_price,
      capacity: event.capacity,
      created_by: userId,
      pastEvent: new Date(event.date) < new Date(),
    };
  });
}

  async getEvents(page = 1, limit = 10, filters = {}, userRole) {
    const offset = (page - 1) * limit;
    const where = {};

    if (filters.created_by) {
      where.created_by = filters.created_by;
    }

    if (filters.date) {
      where[Op.and] = [
        sequelize.where(
          sequelize.fn("DATE", sequelize.col("date")),
          "=",
          filters.date
        ),
      ];
    }

    if (filters.q) {
      where.title = { [Op.like]: `%${filters.q}%` };
    }

    // Get only essential fields
    const { count, rows } = await Event.findAndCountAll({
      where,
      limit,
      offset,
      order: [["date", "ASC"]],
      attributes: [
        "id",
        "title",
        "date",
        "location",
        "ticket_price",
        "capacity",
        "created_by",
      ],
    });

    // Get booked quantities for all events in one query
    const eventIds = rows.map((event) => event.id);
    const bookings = await Booking.findAll({
      where: { event_id: { [Op.in]: eventIds } },
      attributes: [
        "event_id",
        [sequelize.fn("SUM", sequelize.col("quantity")), "total_quantity"],
      ],
      group: ["event_id"],
      raw: true,
    });

    // Create a map for quick lookup
    const bookedMap = {};
    bookings.forEach((booking) => {
      bookedMap[booking.event_id] = parseInt(booking.total_quantity) || 0;
    });

    // Build minimal response - only what frontend actually uses
    const events = rows.map((event) => {
      const bookedTickets = bookedMap[event.id] || 0;
      // const remaining = event.capacity - bookedTickets;
      const isPastEvent = new Date(event.date) < new Date();

      // For admin or event manager who created the event
      let canEdit = false;
      if (
        userRole === UserRole.ADMIN ||
        (userRole === UserRole.EVENT_MANAGER &&
          event.created_by === (filters.userId || 0))
      ) {
        canEdit = true;
      }

      return {
        id: event.id,
        title: event.title,
        date: event.date,
        location: event.location,
        ticket_price: event.ticket_price,
        capacity: event.capacity,
        created_by: event.created_by,
        // Only include fields the frontend actually uses
        bookings: [
          // Minimal array for reduce() to work
          { quantity: bookedTickets },
        ],
        pastEvent: isPastEvent,
        _canEdit: canEdit, // Internal flag for frontend logic
      };
    });

    return {
      events,
      pagination: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit),
      },
    };
  }

  async getEventById(eventId, userRole) {
    // Get only essential fields
    const event = await Event.findByPk(eventId, {
      attributes: [
        "id",
        "title",
        "description",
        "date",
        "location",
        "ticket_price",
        "capacity",
        "created_by",
      ],
    });

    if (!event) {
      throw new NotFoundError("Event not found");
    }

    const isPastEvent = new Date(event.date) < new Date();

    // Base response for all users
    const response = {
      id: event.id,
      title: event.title,
      description: event.description,
      date: event.date,
      location: event.location,
      ticket_price: event.ticket_price,
      capacity: event.capacity,
      created_by: event.created_by,
      pastEvent: isPastEvent,
    };

    // Different data based on user role
    if (userRole === UserRole.ADMIN) {
      // ADMIN: Get detailed bookings
      const detailedBookings = await Booking.findAll({
        where: { event_id: eventId },
        attributes: [
          "id",
          "attendee_name",
          "quantity",
          "booking_amount",
          "createdAt",
        ],
        order: [["createdAt", "DESC"]],
        raw: true,
      });

      const totalBooked = detailedBookings.reduce(
        (sum, booking) => sum + (booking.quantity || 0),
        0
      );

      // Admin gets full bookings array with details
      response.bookings = detailedBookings.map((booking) => ({
        id: booking.id,
        attendee_name: booking.attendee_name,
        quantity: booking.quantity,
        booking_amount: booking.booking_amount,
        createdAt: booking.createdAt,
      }));
      response.totalBooked = totalBooked;
      response.remainingTickets = event.capacity - totalBooked;
    } else {
      // NON-ADMIN: Just get total booked count
      const totalBooked =
        (await Booking.sum("quantity", {
          where: { event_id: eventId },
        })) || 0;

      // Non-admin gets minimal bookings array (just for reduce() to work)
      response.bookings = [{ quantity: totalBooked }];
      response.totalBooked = totalBooked;
      response.remainingTickets = event.capacity - totalBooked;
    }

    return response;
  }

  async updateEvent(eventId, updateData, userId, userRole) {
    return await sequelize.transaction(async (transaction) => {
      const event = await Event.findByPk(eventId, {
        transaction,
        attributes: ["id", "created_by"],
      });

      if (!event) {
        throw new NotFoundError("Event not found");
      }

      if (userRole === UserRole.EVENT_MANAGER && event.created_by !== userId) {
        throw new AuthorizationError(
          "You can only update events created by you"
        );
      }

      // If a non-admin is updating the date, ensure it's in the future
      if (updateData.date && userRole !== UserRole.ADMIN) {
        const newDate = new Date(updateData.date);
        if (isNaN(newDate.getTime()) || newDate <= new Date()) {
          throw new ValidationError("Event date must be in the future", {
            date: "Event date must be in the future",
          });
        }
      }

      await Event.update(updateData, {
        where: { id: eventId },
        transaction,
      });

      // Return only updated essential fields
      const updatedEvent = await Event.findByPk(eventId, {
        attributes: [
          "id",
          "title",
          "date",
          "location",
          "ticket_price",
          "capacity",
          "created_by",
        ],
        transaction,
      });

      return {
        id: updatedEvent.id,
        title: updatedEvent.title,
        date: updatedEvent.date,
        location: updatedEvent.location,
        ticket_price: updatedEvent.ticket_price,
        capacity: updatedEvent.capacity,
        created_by: updatedEvent.created_by,
        pastEvent: new Date(updatedEvent.date) < new Date(),
      };
    });
  }

  async deleteEvent(eventId, userId, userRole) {
    return await sequelize.transaction(async (transaction) => {
      const event = await Event.findByPk(eventId, {
        transaction,
        attributes: ["id", "created_by"],
      });

      if (!event) {
        throw new NotFoundError("Event not found");
      }

      if (userRole === UserRole.EVENT_MANAGER && event.created_by !== userId) {
        throw new AuthorizationError(
          "You can only delete events created by you"
        );
      }

      if (userRole === UserRole.CUSTOMER) {
        throw new AuthorizationError(
          "Only administrators or event managers can delete events"
        );
      }

      // delete related bookings first
      await Booking.destroy({ where: { event_id: eventId }, transaction });
      await Event.destroy({
        where: { id: eventId },
        transaction,
      });

      return { message: "Event deleted successfully" };
    });
  }
}

module.exports = new EventService();
