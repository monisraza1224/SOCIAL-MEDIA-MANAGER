const mongoose = require('mongoose');
require('dotenv').config();

console.log('Testing MongoDB connection...');
console.log('Connection string:', process.env.MONGODB_URI ? 'Present' : 'Missing');

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✓ SUCCESS: MongoDB connected!');
    process.exit(0);
  })
  .catch(err => {
    console.log('✗ FAILED: MongoDB connection error');
    console.log('Error details:', err.message);
    process.exit(1);
  });
