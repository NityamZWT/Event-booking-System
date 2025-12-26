module.exports = (sequelize, DataTypes) => {
  const Booking = sequelize.define(
    "Booking",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      eventId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      ticket_count: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          min: 1,
        },
      },
    },
    {
      tableName: "bookings",
      timestamps: true,
      indexes: [
        {
          unique: true,
          fields: ["userId", "eventId"], // prevent duplicate booking
        },
      ],
    }
  );

  /* ================= ASSOCIATIONS ================= */
  Booking.associate = (models) => {
    Booking.belongsTo(models.User, {
      foreignKey: "userId",
      as: "user",
    });

    Booking.belongsTo(models.Event, {
      foreignKey: "eventId",
      as: "event",
    });
  };

  return Booking;
};
