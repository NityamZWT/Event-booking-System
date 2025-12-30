'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('bookings', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      event_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'events',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      attendee_name: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      booking_amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      quantity: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
      },
      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
    });

    await queryInterface.addIndex('bookings', ['user_id'], {
      name: 'bookings_user_id_index',
    });

    await queryInterface.addIndex('bookings', ['event_id'], {
      name: 'bookings_event_id_index',
    });

    await queryInterface.addIndex('bookings', ['user_id', 'event_id'], {
      name: 'bookings_user_event_index',
    });

    await queryInterface.addIndex('bookings', ['created_at'], {
      name: 'bookings_created_at_index',
    });

    await queryInterface.addIndex('bookings', ['deleted_at'], {
      name: 'bookings_deleted_at_index',
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('bookings');
  },
};