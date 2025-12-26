module.exports = (sequelize, DataTypes) => {
  const Event = sequelize.define(
    "Event",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      event_name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      event_date: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      event_location: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      ticket_price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      capacity: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      tableName: "events",
      timestamps: true,
    }
  );

  /* ================= ASSOCIATIONS ================= */
  Event.associate = (models) => {
    Event.belongsTo(models.User, {
      foreignKey: "userId",
      as: "creator",
    });

    Event.hasMany(models.Booking, {
      foreignKey: "eventId",
      as: "bookings",
      onDelete: "CASCADE",
    });
  };

  return Event;
};
