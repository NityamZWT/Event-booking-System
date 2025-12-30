const db = require("../models");
const { SuccessResponse } = require("../utils/responseHandler");
const { NotFoundError } = require("../utils/errors");

const { User } = db;

const getUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const role = req.query.role;
    const offset = (page - 1) * limit;

    const where = {};
    if (role) where.role = role;

    const { count, rows } = await User.findAndCountAll({
      where,
      limit,
      offset,
      order: [["created_at", "DESC"]],
    });

    const users = rows.map((r) =>
      typeof r.get === "function" ? r.get({ plain: true }) : r
    );

    return new SuccessResponse("Users retrieved successfully", {
      users,
      pagination: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit),
      },
    }).send(res);
  } catch (err) {
    next(err);
  }
};

const deleteUser = async (req, res, next) => {
  const { sequelize, Event, Booking } = db;
  try {
    const id = parseInt(req.params.id);
    const user = await User.findByPk(id);
    if (!user) return next(new NotFoundError("User not found"));

    await sequelize.transaction(async (transaction) => {
      if (user.role === 'EVENT_MANAGER') {
        const events = await Event.findAll({ where: { created_by: id }, transaction });
        for (const ev of events) {
         
          await Booking.destroy({ where: { event_id: ev.id }, transaction });
          await ev.destroy({ transaction });
        }
      }

      await Booking.destroy({ where: { user_id: id }, transaction });
      await user.destroy({ transaction });
    });

    return new SuccessResponse("User deleted successfully").send(res);
  } catch (err) {
    next(err);
  }
};

module.exports = { getUsers, deleteUser };
