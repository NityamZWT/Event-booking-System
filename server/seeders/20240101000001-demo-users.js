'use strict';
const bcrypt = require('bcrypt'); // make sure bcrypt is installed

module.exports = {
  up: async (queryInterface) => {
    const passwordAdmin = await bcrypt.hash('Admin@123', 10);
    const passwordManager = await bcrypt.hash('Manager@123', 10);

    await queryInterface.bulkInsert('users', [
      {
        first_name: 'Alice',
        last_name: 'Admin',
        email: 'alice.admin@example.com',
        password: passwordAdmin,
        role: 'ADMIN',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        first_name: 'Bob',
        last_name: 'Manager',
        email: 'bob.manager@example.com',
        password: passwordManager,
        role: 'EVENT_MANAGER',
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);
  },

  down: async (queryInterface) => {
    await queryInterface.bulkDelete('users', null, {});
  },
};
