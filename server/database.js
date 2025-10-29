const { Sequelize } = require('sequelize');
require('dotenv').config();

// Database connection - uses environment variables for production
const sequelize = new Sequelize(
  process.env.DATABASE_URL || 'sqlite://./database.sqlite',
  {
    dialect: process.env.DATABASE_URL ? 'postgres' : 'sqlite',
    storage: './database.sqlite',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    dialectOptions: process.env.DATABASE_URL ? {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    } : {}
  }
);

// Test database connection
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');
    
    // Sync all models
    await sequelize.sync({ force: false });
    console.log('✅ Database synchronized successfully.');
  } catch (error) {
    console.error('❌ Unable to connect to database:', error);
  }
};

module.exports = { sequelize, testConnection };
