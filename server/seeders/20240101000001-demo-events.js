'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const users = await queryInterface.sequelize.query(
      'SELECT id FROM users ORDER BY id ASC;',
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (!users || users.length < 2) {
      throw new Error('Events seeder requires at least 2 users');
    }

    await queryInterface.bulkInsert('events', [
      {
        title: 'Tech Conference 2025',
        date: new Date('2025-06-15'),
        location: 'San Francisco, CA',
        ticket_price: 299.99,
        capacity: 500,
        created_by: users[0].id,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        title: 'Music Festival 2025',
        date: new Date('2025-07-20'),
        location: 'Los Angeles, CA',
        ticket_price: 150.0,
        capacity: 1000,
        created_by: users[1].id,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);
  },

  down: async (queryInterface) => {
    await queryInterface.bulkDelete('events', null, {});
  },
};
