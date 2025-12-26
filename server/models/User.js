const bcrypt = require('bcrypt');
require('dotenv').config();
const saltRounds = Number(process.env.SALT_ROUNDS);

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define(
    "User",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      first_name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      last_name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          isEmail: {
            msg: "Must be a valid email address",
          },
        },
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
        set(value) {
          if (value) {
            this.setDataValue("password", bcrypt.hashSync(value, saltRounds));
          }
        },
      },
      role: {
        type: DataTypes.ENUM("admin", "event_manager", "customer"),
        defaultValue: "customer",
      },
    },
    {
      tableName: "users",
      timestamps: true,
    }
  );

  /* ================= ASSOCIATIONS ================= */
  User.associate = (models) => {
    User.hasMany(models.Event, {
      foreignKey: "userId",
      as: "events",
      onDelete: "CASCADE",
    });

    User.hasMany(models.Booking, {
      foreignKey: "userId",
      as: "bookings",
      onDelete: "CASCADE",
    });
  };

  return User;
};
