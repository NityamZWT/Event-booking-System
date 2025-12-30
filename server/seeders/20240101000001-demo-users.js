'use strict';
const bcrypt = require('bcrypt'); 

module.exports = {
  up: async (queryInterface) => {
    const passwordAdmin = await bcrypt.hash('Admin@123', 10);
    const passwordManager1 = await bcrypt.hash('Manager@123', 10);
    const passwordManager2 = await bcrypt.hash('Manager@123', 10);
    const passwordManager3 = await bcrypt.hash('Customer@123', 10);

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
        password: passwordManager1,
        role: 'EVENT_MANAGER',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        first_name: 'Mike',
        last_name: 'Manager',
        email: 'mike.manager@example.com',
        password: passwordManager2,
        role: 'EVENT_MANAGER',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        first_name: 'sobby',
        last_name: 'Customer',
        email: 'sobby.customer@example.com',
        password: passwordManager3,
        role: 'CUSTOMER',
        created_at: new Date(),
        updated_at: new Date(),
      },
          {
        first_name: 'jenny',
        last_name: 'Customer',
        email: 'jenny.customer@example.com',
        password: passwordManager3,
        role: 'CUSTOMER',
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);
  },

  down: async (queryInterface) => {
    await queryInterface.bulkDelete('users', null, {});
  },
};
