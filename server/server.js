const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { Op } = require('sequelize');
require('dotenv').config();

const { testConnection, sequelize } = require('./database');
const { User, SocialAccount, Post, Conversation } = require('./models');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://social-media-manager-frontend-fkqp.onrender.com',
    'https://social-media-manager-2.onrender.com'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.options('*', cors());
app.use(express.json());

// ====================
// WORKING LOGIN - HANDLES BOTH PLAIN TEXT AND HASHED
// ====================
app.post('/api/auth/login', async (req, res) => {
  try {
    console.log('🔐 Login attempt for:', req.body.email);
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    console.log('🔑 Stored password:', user.password);
    
    // CHECK IF PASSWORD IS HASHED (starts with $2a$)
    if (user.password.startsWith('$2a$')) {
      console.log('🔐 Password is hashed, using bcrypt...');
      const isMatch = await bcrypt.compare(password, user.password);
      if (isMatch) {
        return sendLoginSuccess(res, user);
      }
    } else {
      console.log('🔓 Password is plain text, direct comparison...');
      if (user.password === password) {
        return sendLoginSuccess(res, user);
      }
    }
    
    console.log('❌ Password mismatch');
    return res.status(400).json({ message: 'Invalid credentials' });
    
  } catch (error) {
    console.error('💥 Login error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

function sendLoginSuccess(res, user) {
  const token = jwt.sign(
    { userId: user.id, role: user.role },
    process.env.JWT_SECRET || 'fallback_secret',
    { expiresIn: '7d' }
  );

  console.log('🎉 Login successful for:', user.email);
  res.json({
    message: 'Login successful',
    token,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role
    }
  });
}

// CREATE ADMIN WITH PLAIN TEXT
app.post('/api/create-admin-plain', async (req, res) => {
  try {
    await User.destroy({ where: { email: 'admin@test.com' } });
    
    const user = await User.create({
      username: 'admin',
      email: 'admin@test.com',
      password: 'password123', // Plain text
      role: 'admin'
    });
    
    res.json({ 
      message: 'Admin created with PLAIN TEXT password',
      credentials: {
        email: 'admin@test.com',
        password: 'password123'
      },
      storedPassword: user.password
    });
  } catch (error) {
    res.status(500).json({ message: 'Error', error: error.message });
  }
});

// CHECK PASSWORD STATUS
app.get('/api/password-status', async (req, res) => {
  try {
    const user = await User.findOne({ where: { email: 'admin@test.com' } });
    
    if (!user) {
      return res.json({ message: 'No admin user' });
    }
    
    res.json({
      email: user.email,
      storedPassword: user.password,
      isHashed: user.password.startsWith('$2a$'),
      passwordType: user.password.startsWith('$2a$') ? 'HASHED' : 'PLAIN TEXT',
      testCommand: `curl -X POST https://social-media-manager-2.onrender.com/api/auth/login -H "Content-Type: application/json" -d "{\\"email\\":\\"admin@test.com\\",\\"password\\":\\"password123\\"}"`
    });
  } catch (error) {
    res.status(500).json({ message: 'Error', error: error.message });
  }
});

// HEALTH CHECK
app.get('/api/health', async (req, res) => {
  try {
    const usersCount = await User.count();
    res.json({
      status: 'OK',
      users: usersCount,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ status: 'ERROR', error: error.message });
  }
});

// START SERVER
const startServer = async () => {
  try {
    await testConnection();
    
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`✅ Server running on port ${PORT}`);
      console.log(`🔑 Login should work now with both hashed and plain text passwords`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
