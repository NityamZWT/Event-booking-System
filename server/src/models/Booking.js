module.exports = (sequelize, DataTypes) => {
  const Booking = sequelize.define(
    'Booking',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      event_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'events',
          key: 'id'
        }
      },
      attendee_name: {
        type: DataTypes.STRING(100),
        allowNull: false
      },
      booking_amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
          min: 0
        }
      },
      quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
        validate: {
          min: 1
        }
      }
    },
    {
      tableName: 'bookings',
      timestamps: true,
      underscored: true,
      paranoid: true,
      indexes: [
        {
          fields: ['user_id']
        },
        {
          fields: ['event_id']
        }
      ]
    }
  );

  Booking.associate = (models) => {
    Booking.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user'
    });
    Booking.belongsTo(models.Event, {
      foreignKey: 'event_id',
      as: 'event'
    });
  };

  return Booking;
};