'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('events', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      title: {
        type: Sequelize.STRING(200),
        allowNull: false,
      },
      description: {
        type: DataTypes.STRING(1000),
        allowNull: true
      },
      date: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      location: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      ticket_price: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      capacity: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      created_by: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
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

    await queryInterface.addIndex('events', ['created_by'], {
      name: 'events_created_by_index',
    });

    await queryInterface.addIndex('events', ['date'], {
      name: 'events_date_index',
    });

    await queryInterface.addIndex('events', ['created_by', 'date'], {
      name: 'events_created_by_date_index',
    });

    await queryInterface.addIndex('events', ['deleted_at'], {
      name: 'events_deleted_at_index',
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('events');
  },
};