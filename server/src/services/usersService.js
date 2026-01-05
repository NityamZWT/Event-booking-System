const db = require("../models");
const { NotFoundError, AuthorizationError } = require("../utils/errors");
const { UserRole } = require("../constants/common.types");

const { User, Event, Booking, sequelize } = db;

class UserService {
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
  async getUsers(page = 1, limit = 10, role) {
    const offset = (page - 1) * limit;
    const where = {};

    if (role) {
      where.role = role;
    }

    const { count, rows } = await User.findAndCountAll({
      where,
      limit,
      offset,
      order: [["created_at", "DESC"]],
      attributes: { exclude: ["password"] },
    });

    return {
      users: rows,
      pagination: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit),
      },
    };
  }

async getUserById(userId) {
  const user = await User.findByPk(userId, {
    attributes: { exclude: ['password'] },
    include: [
      {
        model: Event,
        as: 'events',
        attributes: ['id', 'title', 'date', 'location', 'ticket_price', 'capacity'],
        include: [{
          model: Booking,
          as: 'bookings',
          attributes: ['quantity'] // Only quantity needed
        }]
      },
      {
        model: Booking,
        as: 'bookings',
        attributes: ['id', 'event_id', 'quantity', 'attendee_name', 'booking_amount', 'createdAt'],
        include: [{
          model: Event,
          as: 'event',
          attributes: ['id', 'title', 'date', 'location', 'ticket_price']
        }]
      },
    ],
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  // Convert Sequelize instances to plain objects
  const plainUser = user.toJSON();

  // Helper function to check if event is past
  const isEventPast = (eventDate) => {
    const eventDateObj = new Date(eventDate);
    const today = new Date();
    
    // Compare only dates (ignore time)
    const eventDateOnly = new Date(
      eventDateObj.getFullYear(),
      eventDateObj.getMonth(),
      eventDateObj.getDate()
    );
    const todayOnly = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );
    
    return eventDateOnly < todayOnly;
  };

  // Process events to add pastEvent flag and calculate booked tickets
  if (plainUser.events) {
    plainUser.events = plainUser.events.map(event => {
      const bookedTickets = event.bookings?.reduce(
        (sum, booking) => sum + (booking.quantity || 0),
        0
      ) || 0;
      
      return {
        id: event.id,
        title: event.title,
        date: event.date,
        location: event.location,
        ticket_price: event.ticket_price,
        capacity: event.capacity,
        pastEvent: isEventPast(event.date),
        bookedTickets: bookedTickets,
        remainingCapacity: event.capacity - bookedTickets
        // Note: bookings array is not included in the final output
      };
    });
  }

  // Process bookings to add pastEvent flag to associated events
  if (plainUser.bookings) {
    plainUser.bookings = plainUser.bookings.map(booking => {
      const bookingWithEvent = {
        id: booking.id,
        event_id: booking.event_id,
        quantity: booking.quantity,
        attendee_name: booking.attendee_name,
        booking_amount: booking.booking_amount,
        createdAt: booking.createdAt
      };
      
      // Include event details if available
      if (booking.event) {
        bookingWithEvent.event = {
          id: booking.event.id,
          title: booking.event.title,
          date: booking.event.date,
          location: booking.event.location,
          ticket_price: booking.event.ticket_price,
          pastEvent: isEventPast(booking.event.date)
        };
      }
      
      return bookingWithEvent;
    });
  }

  return plainUser;
}

  async deleteUser(userId, currentUserId, currentUserRole) {
    return await sequelize.transaction(async (transaction) => {
      const user = await User.findByPk(userId, { transaction });

      if (!user) {
        throw new NotFoundError("User not found");
      }

      if (userId === currentUserId) {
        throw new AuthorizationError("You cannot delete your own account");
      }

      if (currentUserRole === UserRole.ADMIN && user.role === UserRole.ADMIN) {
        throw new AuthorizationError(
          "Admins cannot delete other admin accounts"
        );
      }

      if (currentUserRole === UserRole.EVENT_MANAGER) {
        throw new AuthorizationError(
          "Event managers cannot delete user accounts"
        );
      }

      if (user.role === UserRole.EVENT_MANAGER) {
        const events = await Event.findAll({
          where: { created_by: userId },
          transaction,
        });

        for (const event of events) {
          await Booking.destroy({
            where: { event_id: event.id },
            transaction,
            individualHooks: true,
          });

          await event.destroy({ transaction });
        }
      }

      await Booking.destroy({
        where: { user_id: userId },
        transaction,
        individualHooks: true,
      });

      await user.destroy({ transaction });

      return { message: "User deleted successfully" };
    });
  }

  async updateUserRole(userId, newRole, currentUserId, currentUserRole) {
    console.log(userId, newRole, currentUserId, currentUserRole);
    
    return await sequelize.transaction(async (transaction) => {
      const user = await User.findByPk(userId, { transaction });

      if (!user) {
        throw new NotFoundError("User not found");
      }

      if (userId === currentUserId) {
        throw new AuthorizationError("You cannot change your own role");
      }

      if (currentUserRole !== UserRole.ADMIN) {
        throw new AuthorizationError("Only admins can change user roles");
      }

      if (user.role === UserRole.ADMIN && newRole !== UserRole.ADMIN) {
        throw new AuthorizationError("Cannot change admin role to non-admin");
      }

      await user.update({ role: newRole }, { transaction });

      return await User.findByPk(userId, {
        attributes: { exclude: ["password"] },
        transaction,
      });
    });
  }
}

module.exports = new UserService();
