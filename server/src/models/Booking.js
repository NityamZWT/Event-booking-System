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
          model: 'users', // Make sure this matches your User table name exactly
          key: 'id'
        }
      },
      event_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'events', // Make sure this matches your Event table name exactly
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
      },
      // ADD THIS: session_id field
      session_id: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true
      },
      // Explicitly define timestamps for clarity
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      },
      deleted_at: {
        type: DataTypes.DATE,
        allowNull: true
      }
    },
    {
      tableName: 'bookings',
      timestamps: true, // This will use the defined created_at/updated_at above
      underscored: true,
      paranoid: true, // This enables soft deletes (requires deleted_at field)
      indexes: [
        {
          fields: ['user_id']
        },
        {
          fields: ['event_id']
        },
        {
          fields: ['session_id'],
          unique: true
        }
      ]
    }
  );

  Booking.associate = (models) => {
    Booking.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user',
      onDelete: 'CASCADE', // Add cascade for safety
      onUpdate: 'CASCADE'
    });
    Booking.belongsTo(models.Event, {
      foreignKey: 'event_id',
      as: 'event',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });
  };

  return Booking;
};