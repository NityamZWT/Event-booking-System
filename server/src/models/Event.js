module.exports = (sequelize, DataTypes) => {
  const Event = sequelize.define(
    'Event',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      title: {
        type: DataTypes.STRING(200),
        allowNull: false
      },
      description: {
        type: DataTypes.STRING(1000),
        allowNull: true
      },
      images: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: '[]',
        get() {
          const rawValue = this.getDataValue('images');
          try {
            return rawValue ? JSON.parse(rawValue) : [];
          } catch {
            return [];
          }
        },
        set(value) {
          if (Array.isArray(value)) {
            this.setDataValue('images', JSON.stringify(value));
          } else {
            this.setDataValue('images', '[]');
          }
        }
      },
      date: {
        type: DataTypes.DATE,
        allowNull: false
      },
      location: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      ticket_price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
          min: 0
        }
      },
      capacity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          min: 1
        }
      },
      created_by: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        }
      }
    },
    {
      tableName: 'events',
      timestamps: true,
      underscored: true,
      paranoid: true,
      indexes: [
        {
          fields: ['created_by']
        },
        {
          fields: ['date']
        }
      ]
    }
  );

  Event.associate = (models) => {
    Event.belongsTo(models.User, {
      foreignKey: 'created_by',
      as: 'creator'
    });
    Event.hasMany(models.Booking, {
      foreignKey: 'event_id',
      as: 'bookings'
    });
  };

  return Event;
};