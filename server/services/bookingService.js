const db = require("../models");
const {
  NotFoundError,
  ConflictError,
  AuthorizationError,
} = require("../utils/errors");
const { Transaction } = require("sequelize");
const { UserRole } = require("../types/common.types");

const { Booking, Event, User, sequelize } = db;

class BookingService {
  async createBooking(bookingData, userId) {
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
          throw new NotFoundError("Event not found");
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
            `Insufficient capacity. Only ${availableTickets} tickets available`
          );
        }

        const bookingAmount = Number(event.ticket_price) * requestedQuantity;

        const booking = await Booking.create(
          {
            user_id: userId,
            event_id: bookingData.event_id,
            attendee_name: bookingData.attendee_name,
            quantity: requestedQuantity,
            booking_amount: bookingAmount,
          },
          { transaction }
        );

        return await Booking.findByPk(booking.id, {
          include: [
            {
              model: Event,
              as: "event",
              attributes: ["id", "title", "date", "location", "ticket_price"],
            },
            {
              model: User,
              as: "user",
              attributes: ["id", "first_name", "last_name", "email"],
            },
          ],
          transaction,
        });
      }
    );
  }

  async getUserBookings(userId, page = 1, limit = 10) {
    const offset = (page - 1) * limit;

    const { count, rows } = await Booking.findAndCountAll({
      where: { user_id: userId },
      limit,
      offset,
      order: [["created_at", "DESC"]],
      include: [
        {
          model: Event,
          as: "event",
          attributes: ["id", "title", "date", "location", "ticket_price"],
        },
      ],
    });

    return {
      bookings: rows,
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
          include: [
            {
              model: User,
              as: "creator",
              attributes: ["id", "first_name", "last_name", "email"],
            },
          ],
        },
        {
          model: User,
          as: "user",
          attributes: ["id", "first_name", "last_name", "email"],
        },
      ],
    });

    if (!booking) {
      throw new NotFoundError("Booking not found");
    }

    const event = booking.get("event");

    if (userRole === UserRole.CUSTOMER && booking.user_id !== userId) {
      throw new AuthorizationError("Access denied to this booking");
    }

    if (
      userRole === UserRole.EVENT_MANAGER &&
      booking.user_id !== userId &&
      event?.created_by !== userId
    ) {
      throw new AuthorizationError("Access denied to this booking");
    }

    return booking;
  }

  async cancelBooking(bookingId, userId, userRole) {
    return await sequelize.transaction(async (transaction) => {
      const booking = await Booking.findByPk(bookingId, { transaction });

      if (!booking) {
        throw new NotFoundError("Booking not found");
      }

      if (userRole === UserRole.CUSTOMER && booking.user_id !== userId) {
        throw new AuthorizationError("You can only cancel your own bookings");
      }

      if (userRole === UserRole.EVENT_MANAGER) {
        throw new AuthorizationError("Event managers cannot cancel bookings");
      }

      await booking.destroy({ transaction });

      return { message: "Booking cancelled successfully" };
    });
  }
}

module.exports = new BookingService();
