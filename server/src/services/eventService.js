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
  // Helper function to create date at midnight local time
  createLocalDate(dateInput) {
    console.log("createLocalDate input:", dateInput, typeof dateInput);

    try {
      if (typeof dateInput === "string") {
        // Parse string like "2026-01-01" or ISO string
        if (dateInput.includes("T")) {
          // ISO string like "2026-01-01T00:00:00.000Z"
          const dateObj = new Date(dateInput);
          return new Date(
            dateObj.getFullYear(),
            dateObj.getMonth(),
            dateObj.getDate(),
            0,
            0,
            0,
            0
          );
        } else {
          // YYYY-MM-DD format
          const [year, month, day] = dateInput.split("-").map(Number);
          return new Date(year, month - 1, day, 0, 0, 0, 0);
        }
      } else if (dateInput instanceof Date) {
        // Already a Date object
        return new Date(
          dateInput.getFullYear(),
          dateInput.getMonth(),
          dateInput.getDate(),
          0,
          0,
          0,
          0
        );
      } else {
        console.error("Invalid date input type:", typeof dateInput, dateInput);
        throw new Error(`Invalid date input: ${dateInput}`);
      }
    } catch (error) {
      console.error("Error in createLocalDate:", error);
      throw new Error(`Invalid date format: ${dateInput}`);
    }
  }

  compareDatesOnly(date1, date2) {
    try {
      const d1 = new Date(
        date1.getFullYear(),
        date1.getMonth(),
        date1.getDate()
      );
      const d2 = new Date(
        date2.getFullYear(),
        date2.getMonth(),
        date2.getDate()
      );
      return d1 < d2;
    } catch (error) {
      console.error("Error in compareDatesOnly:", error);
      return false;
    }
  }

  async createEvent(eventData, userId) {
    return await sequelize.transaction(async (transaction) => {
      let eventDate = eventData.date;

      console.log("Creating event with data:", eventData);
      console.log("Date received:", eventDate, typeof eventDate);

      if (typeof eventDate === "string") {
        // Create date at midnight local time (IST)
        eventDate = this.createLocalDate(eventDate);
        console.log("Created local date:", eventDate.toString());
      }

      const event = await Event.create(
        {
          ...eventData,
          date: eventDate,
          created_by: userId,
        },
        { transaction }
      );

      // Check if event is in the past (date-only comparison)
      const isPastEvent = this.compareDatesOnly(event.date, new Date());

      console.log("Event created successfully. ID:", event.id);
      console.log("Stored date:", event.date.toString());
      console.log("Is past event?", isPastEvent);

      return {
        id: event.id,
        title: event.title,
        date: event.date,
        location: event.location,
        ticket_price: event.ticket_price,
        capacity: event.capacity,
        created_by: userId,
        pastEvent: isPastEvent,
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
      console.log("Filtering by date:", filters.date, typeof filters.date);

      try {
        let filterDate;
        if (typeof filters.date === "string") {
          const [year, month, day] = filters.date.split("-").map(Number);
          filterDate = new Date(year, month - 1, day, 0, 0, 0, 0);
        } else if (filters.date instanceof Date) {
          // Already a Date object
          filterDate = new Date(
            filters.date.getFullYear(),
            filters.date.getMonth(),
            filters.date.getDate(),
            0,
            0,
            0,
            0
          );
        } else {
          console.error("Invalid date filter type:", typeof filters.date);
          throw new Error("Invalid date filter format");
        }

        const nextDay = new Date(filterDate);
        nextDay.setDate(nextDay.getDate() + 1);

        console.log("Filter date range:", filterDate, "to", nextDay);

        where.date = {
          [Op.gte]: filterDate,
          [Op.lt]: nextDay,
        };
      } catch (error) {
        console.error("Error processing date filter:", error);
        throw new Error(`Invalid date format for filter: ${filters.date}`);
      }
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

    const events = rows.map((event) => {
      const bookedTickets = bookedMap[event.id] || 0;

      // Check if event is in the past (date-only comparison)
      const isPastEvent = this.compareDatesOnly(event.date, new Date());

      console.log(`Event ${event.id}:`);
      console.log(`  Date: ${event.date.toString()}`);
      console.log(`  Is Past: ${isPastEvent}`);

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
        bookings: [{ quantity: bookedTickets }],
        pastEvent: isPastEvent,
        _canEdit: canEdit,
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

    // Check if event is in the past (date-only comparison)
    const isPastEvent = this.compareDatesOnly(event.date, new Date());

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
        attributes: ["id", "created_by", "capacity"],
        include: [
          {
            model: Booking,
            as: "bookings",
            attributes: ["id", "quantity"],
          },
        ],
      });

      if (!event) {
        throw new NotFoundError("Event not found");
      }

      if (userRole === UserRole.EVENT_MANAGER && event.created_by !== userId) {
        throw new AuthorizationError(
          "You can only update events created by you"
        );
      }

      // Calculate total booked tickets
      const bookedTickets =
        event.bookings?.reduce(
          (sum, booking) => sum + (booking.quantity || 0),
          0
        ) || 0;

      // Validate capacity is not less than booked tickets
      if (updateData.capacity !== undefined) {
        const newCapacity = parseInt(updateData.capacity, 10);

        if (newCapacity < bookedTickets) {
          throw new ValidationError(
            `Capacity cannot be less than ${bookedTickets} (already booked tickets)`,
            {
              capacity: `Capacity cannot be less than ${bookedTickets} (already booked tickets)`,
            }
          );
        }
      }

      // Handle date conversion if updating date
      if (updateData.date && typeof updateData.date === "string") {
        // Create date at midnight local time
        updateData.date = this.createLocalDate(updateData.date);

        // Date validation for non-admin users
        if (userRole !== UserRole.ADMIN) {
          const today = new Date();
          const todayOnly = new Date(
            today.getFullYear(),
            today.getMonth(),
            today.getDate()
          );
          const eventDateOnly = new Date(
            updateData.date.getFullYear(),
            updateData.date.getMonth(),
            updateData.date.getDate()
          );

          if (this.compareDatesOnly(eventDateOnly, todayOnly)) {
            throw new ValidationError(
              "Event date must be today or in the future",
              {
                date: "Event date must be today or in the future",
              }
            );
          }
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

      // Check if event is in the past (date-only comparison)
      const isPastEvent = this.compareDatesOnly(updatedEvent.date, new Date());

      return {
        id: updatedEvent.id,
        title: updatedEvent.title,
        date: updatedEvent.date,
        location: updatedEvent.location,
        ticket_price: updatedEvent.ticket_price,
        capacity: updatedEvent.capacity,
        created_by: updatedEvent.created_by,
        pastEvent: isPastEvent,
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
