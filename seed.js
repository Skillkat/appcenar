const sequelize = require('./config/database');
const { Configuration, User, AdminProfile } = require('./models');
const bcrypt = require('bcryptjs');

async function seed() {
  await sequelize.sync({ force: true });

  // Create default configuration
  await Configuration.create({ itbis: 18 });

  // Create default admin
  const admin = await User.create({
    username: 'admin',
    email: 'admin@appcenar.com',
    password: await bcrypt.hash('admin123', 10),
    role: 'admin',
    active: true
  });

  await AdminProfile.create({
    userId: admin.id,
    firstName: 'Admin',
    lastName: 'User',
    idCard: '123456789'
  });

  console.log('Database seeded');
  sequelize.close();
}

seed();