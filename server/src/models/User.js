const bcrypt = require('bcrypt');
const { UserRole } = require('../constants/common.types');
require('dotenv').config()

const saltRounds = Number(process.env.SALT_ROUNDS)

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define(
    'User',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      first_name: {
        type: DataTypes.STRING(50),
        allowNull: false
      },
      last_name: {
        type: DataTypes.STRING(50),
        allowNull: false
      },
      email: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
        validate: {
          isEmail: {
            msg: 'Must be a valid email address'
          }
        }
      },
      password: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      role: {
        type: DataTypes.ENUM('ADMIN', 'EVENT_MANAGER', 'CUSTOMER'),
        allowNull: false,
        defaultValue: UserRole.CUSTOMER
      }
    },
    {
      tableName: 'users',
      timestamps: true,
      underscored: true,
      paranoid: true,
      hooks: {
        beforeCreate: async (user) => {
          if (user.password) {
            const salt = await bcrypt.genSalt(saltRounds);
            user.password = await bcrypt.hash(user.password, salt);
          }
        },
        beforeUpdate: async (user) => {
          if (user.changed('password')) {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(user.password, salt);
          }
        }
      }
    }
  );

  User.prototype.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
  };

  User.associate = (models) => {
    User.hasMany(models.Event, {
      foreignKey: 'created_by',
      as: 'events'
    });
    User.hasMany(models.Booking, {
      foreignKey: 'user_id',
      as: 'bookings'
    });
  };

  return User;
};