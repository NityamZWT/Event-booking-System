const db = require("../models");
const {
  NotFoundError,
  ConflictError,
  AuthorizationError,
} = require("../utils/errors");
const { Transaction } = require("sequelize");
const { UserRole } = require("../constants/common.types");

const { Booking, Event, User, sequelize } = db;

class BookingService {
  compareDatesOnly(date1, date2) {
    try {
      const d1 = new Date(
        date1.getFullYear(),
        date1.getMonth(),
        date1.getDate(),
      );
      const d2 = new Date(
        date2.getFullYear(),
        date2.getMonth(),
        date2.getDate(),
      );
      return d1 < d2;
    } catch (error) {
      console.error("Error in compareDatesOnly:", error);
      return false;
    }
  }

  async createBooking(bookingData, userId, sessionId) {
    return await sequelize.transaction(
      {
        isolationLevel: Transaction.ISOLATION_LEVELS.SERIALIZABLE,
      },
      async (transaction) => {
        const event = await Event.findByPk(bookingData.event_id, {
          lock: transaction.LOCK.UPDATE,
          transaction,
        });

        if (!event) {
          throw new NotFoundError(`Event with ID ${bookingData.event_id} not found`);
        }

        const totalBookings = await Booking.sum("quantity", {
          where: { event_id: bookingData.event_id },
          transaction,
        });

        const bookedTickets = totalBookings || 0;
        const requestedQuantity = bookingData.quantity || 1;

        if (bookedTickets + requestedQuantity > event.capacity) {
          const availableTickets = event.capacity - bookedTickets;
          throw new ConflictError(
            `Insufficient capacity. Only ${availableTickets} tickets available`,
          );
        }

        const bookingAmount = Number(event.ticket_price) * requestedQuantity;
        const incomingAmount = Number(bookingData.booking_amount || 0);
        if (
          Number(incomingAmount.toFixed(2)) !== Number(bookingAmount.toFixed(2))
        ) {
          throw new ConflictError(
            `Payment amount mismatch. Expected ${bookingAmount.toFixed(
              2,
            )} for quantity ${requestedQuantity}`,
          );
        }
        const booking = await Booking.create(
          {
            user_id: userId,
            event_id: bookingData.event_id,
            attendee_name: bookingData.attendee_name,
            quantity: requestedQuantity,
            booking_amount: bookingAmount,
            session_id: sessionId,
          },
          { transaction },
        );

        const createdBooking = await Booking.findByPk(booking.id, {
          include: [
            {
              model: Event,
              as: "event",
              attributes: ["id", "title", "date", "location"],
            },
          ],
          transaction,
        });

        return {
          id: createdBooking.id,
          attendee_name: createdBooking.attendee_name,
          quantity: createdBooking.quantity,
          booking_amount: createdBooking.booking_amount,
          createdAt: createdBooking.createdAt,
          event: {
            title: createdBooking.event.title,
            date: createdBooking.event.date,
            location: createdBooking.event.location,
          },
        };
      },
    );
  }

  async getUserBookings(userId, userRole, eventId, page = 1, limit = 10) {
    const offset = (page - 1) * limit;

    const where = {};
    const include = [
      {
        model: Event,
        as: "event",
        attributes: ["id", "title", "date", "location"],
      },
    ];

    if (userRole === UserRole.CUSTOMER || userRole === UserRole.EVENT_MANAGER) {
      where.user_id = userId;
    }

    if (eventId) {
      where.event_id = eventId;
    }

    const { count, rows } = await Booking.findAndCountAll({
      where,
      limit,
      offset,
      order: [["createdAt", "DESC"]],
      include,
      attributes: [
        "id",
        "user_id",
        "attendee_name",
        "quantity",
        "booking_amount",
        "createdAt",
      ],
    });

    const bookings = rows.map((booking) => {
      const isPastEvent = this.compareDatesOnly(booking.event.date, new Date());

      return {
        id: booking.id,
        user_id: booking.user_id,
        attendee_name: booking.attendee_name,
        quantity: booking.quantity,
        booking_amount: booking.booking_amount,
        createdAt: booking.createdAt,
        event: {
          id: booking.event.id,
          title: booking.event.title,
          date: booking.event.date,
          location: booking.event.location,
          pastEvent: isPastEvent,
        },
      };
    });

    return {
      bookings,
      pagination: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit),
      },
    };
  }

  async getBookingById(bookingId, userId, userRole) {
    const booking = await Booking.findByPk(bookingId, {
      include: [
        {
          model: Event,
          as: "event",
          attributes: ["id", "title", "date", "location"],
        },
      ],
      attributes: [
        "id",
        "attendee_name",
        "quantity",
        "booking_amount",
        "createdAt",
        "user_id",
      ],
    });

    if (!booking) {
      throw new NotFoundError("Booking not found");
    }

    if (userRole === UserRole.CUSTOMER && booking.user_id !== userId) {
      throw new AuthorizationError("Access denied to this booking");
    }

    if (userRole === UserRole.EVENT_MANAGER) {
      const event = await Event.findByPk(booking.event_id, {
        attributes: ["created_by"],
      });
      if (booking.user_id !== userId && event?.created_by !== userId) {
        throw new AuthorizationError("Access denied to this booking");
      }
    }

    return {
      id: booking.id,
      attendee_name: booking.attendee_name,
      quantity: booking.quantity,
      booking_amount: booking.booking_amount,
      createdAt: booking.createdAt,
      event: {
        title: booking.event.title,
        date: booking.event.date,
        location: booking.event.location,
      },
    };
  }

  async cancelBooking(bookingId, userId, userRole) {
    return await sequelize.transaction(async (transaction) => {
      const booking = await Booking.findByPk(bookingId, {
        transaction,
        attributes: ["id", "user_id", "event_id"],
      });

      if (!booking) {
        throw new NotFoundError("Booking not found");
      }

      if (userRole === UserRole.CUSTOMER && booking.user_id !== userId) {
        throw new AuthorizationError("You can only cancel your own bookings");
      }

      if (userRole === UserRole.EVENT_MANAGER) {
        const event = await Event.findByPk(booking.event_id, {
          transaction,
          attributes: ["created_by"],
        });

        if (!event || event.created_by !== userId) {
          throw new AuthorizationError("Event managers cannot cancel bookings");
        }
      }

      await Booking.destroy({
        where: { id: bookingId },
        transaction,
      });

      return { message: "Booking cancelled successfully" };
    });
  }
}

module.exports = new BookingService();
