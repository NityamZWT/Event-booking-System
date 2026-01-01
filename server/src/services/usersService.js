const db = require("../models");
const {
  NotFoundError,
  AuthorizationError
} = require("../utils/errors");
const { UserRole } = require("../constants/common.types");

const { User, Event, Booking, sequelize } = db;

class UserService {
  async getUsers(
    page = 1,
    limit = 10,
    role
  ) {
    const offset = (page - 1) * limit;
    const where = {};

    if (role) {
      where.role = role;
    }

    const { count, rows } = await User.findAndCountAll({
      where,
      limit,
      offset,
      order: [['created_at', 'DESC']],
      attributes: { exclude: ['password'] },
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
          attributes: ['id', 'title', 'date', 'location'],
        },
        {
          model: Booking,
          as: 'bookings',
          attributes: ['id', 'event_id', 'attendee_name', 'booking_amount'],
        },
      ],
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return user;
  }

  async deleteUser(
    userId,
    currentUserId,
    currentUserRole
  ) {
    return await sequelize.transaction(async (transaction) => {
      const user = await User.findByPk(userId, { transaction });

      if (!user) {
        throw new NotFoundError('User not found');
      }

      if (userId === currentUserId) {
        throw new AuthorizationError('You cannot delete your own account');
      }

      if (currentUserRole === UserRole.ADMIN && user.role === UserRole.ADMIN) {
        throw new AuthorizationError('Admins cannot delete other admin accounts');
      }

      if (currentUserRole === UserRole.EVENT_MANAGER) {
        throw new AuthorizationError('Event managers cannot delete user accounts');
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

      return { message: 'User deleted successfully' };
    });
  }

  async updateUserRole(
    userId,
    newRole,
    currentUserId,
    currentUserRole
  ) {
    return await sequelize.transaction(async (transaction) => {
      const user = await User.findByPk(userId, { transaction });

      if (!user) {
        throw new NotFoundError('User not found');
      }

      if (userId === currentUserId) {
        throw new AuthorizationError('You cannot change your own role');
      }

      if (currentUserRole !== UserRole.ADMIN) {
        throw new AuthorizationError('Only admins can change user roles');
      }

      if (user.role === UserRole.ADMIN && newRole !== UserRole.ADMIN) {
        throw new AuthorizationError('Cannot change admin role to non-admin');
      }

      await user.update({ role: newRole }, { transaction });

      return await User.findByPk(userId, {
        attributes: { exclude: ['password'] },
        transaction,
      });
    });
  }
}

module.exports =  new UserService();