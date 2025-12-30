const db = require("../models");
const { Op } = require("sequelize");
const { NotFoundError, AuthorizationError, ValidationError } = require("../utils/errors");
const { UserRole } = require("../constants/common.types");

const { Event, User, Booking, sequelize } = db;

class EventService {
  async createEvent(eventData, userId) {
    return await sequelize.transaction(async (transaction) => {
      const event = await Event.create(
        {
          ...eventData,
          created_by: userId,
        },
        { transaction }
      );

      return await Event.findByPk(event.id, { 
        include: [
          {
            model: User,
            as: "creator",
            attributes: ["id", "first_name", "last_name", "email"],
          },
        ],
        transaction,
      });
    });
  }

  async getEvents(page = 1, limit = 10, filters = {}) {
    const offset = (page - 1) * limit;
    const where = {};

    if (filters.created_by) {
      where.created_by = filters.created_by;
    }

    if (filters.date_from) {
      where.date = { [Op.gte]: new Date(filters.date_from) };
    }

    if (filters.date_to) {
      where.date = {
        ...where.date,
        [Op.lte]: new Date(filters.date_to),
      };
    }

    if (filters.q) {
      where.title = { [Op.like]: `%${filters.q}%` };
    }

    const { count, rows } = await Event.findAndCountAll({
      where,
      limit,
      offset,
      order: [["date", "ASC"]],
      include: [
        {
          model: User,
          as: "creator",
          attributes: ["id", "first_name", "last_name", "email"],
        },
        {
          model: Booking,
          as: "bookings",
          attributes: ["id", "quantity"],
          required: false,
        },
      ],
    });

    const events = rows.map((r) => {
      const e = typeof r.get === 'function' ? r.get({ plain: true }) : r;
      e.pastEvent = new Date(e.date) < new Date();
      return e;
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
    const includeArray = [
      {
        model: User,
        as: "creator",
        attributes: ["id", "first_name", "last_name", "email"],
      },
    ];

    // Include bookings based on user role
    if (userRole === "ADMIN") {
      // ADMIN can see full booking details
      includeArray.push({
        model: Booking,
        as: "bookings",
        attributes: ["id", "attendee_name", "quantity", "booking_amount", "created_at"],
      });
    } else {
      // Non-ADMIN users only get quantity for capacity calculation
      // but not individual booking details
      includeArray.push({
        model: Booking,
        as: "bookings",
        attributes: ["quantity"],
        required: false,
      });
    }

    const event = await Event.findByPk(eventId, {
      include: includeArray,
    });

    if (!event) {
      throw new NotFoundError("Event not found");
    }

    return event;
  }

  async updateEvent(eventId, updateData, userId, userRole) {
    return await sequelize.transaction(async (transaction) => {
      const event = await Event.findByPk(eventId, { transaction });

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
          throw new ValidationError('Event date must be in the future', { date: 'Event date must be in the future' });
        }
      }

      await event.update(updateData, { transaction });

      return await Event.findByPk(event.id, {
        include: [
          {
            model: User,
            as: "creator",
            attributes: ["id", "first_name", "last_name", "email"],
          },
        ],
        transaction,
      });
    });
  }

  async deleteEvent(eventId, userId, userRole) {
    return await sequelize.transaction(async (transaction) => {
      const event = await Event.findByPk(eventId, { transaction });

      if (!event) {
        throw new NotFoundError("Event not found");
      }

      // Allow deletion for admins, or event managers who created the event
      if (userRole === UserRole.ADMIN) {
        // admin can delete
      } else if (userRole === UserRole.EVENT_MANAGER) {
        if (event.created_by !== userId) {
          throw new AuthorizationError("You can only delete events created by you");
        }
      } else {
        throw new AuthorizationError("Only administrators or the event manager who created the event can delete it");
      }

      // delete related bookings first
      await Booking.destroy({ where: { event_id: eventId }, transaction });
      await event.destroy({ transaction });

      return { message: "Event deleted successfully" };
    });
  }
}

module.exports = new EventService();
