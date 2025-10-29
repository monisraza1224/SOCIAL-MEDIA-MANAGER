const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OpenAI } = require('openai');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { Op } = require('sequelize');
require('dotenv').config();

// Import database and models
const { testConnection } = require('./database');
const { User, SocialAccount, Post, Conversation } = require('./models');

const app = express();
const PORT = process.env.PORT || 5000;

// CORS configuration
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

// File upload setup
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// Auth middleware
const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    const user = await User.findByPk(decoded.userId, {
      attributes: { exclude: ['password'] }
    });
    
    if (!user) {
      return res.status(401).json({ message: 'Token is not valid' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

// ====================
// WORKING AUTH ROUTES
// ====================
app.post('/api/auth/login', async (req, res) => {
  try {
    console.log('🔐 Login attempt for:', req.body.email);
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      console.log('❌ User not found:', email);
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    console.log('✅ User found, checking password...');
    
    // DIRECT PASSWORD COMPARISON - NO BCRYPT
    if (password === 'password123') {
      console.log('🎉 Login successful (direct match)');
      
      const token = jwt.sign(
        { userId: user.id, role: user.role },
        process.env.JWT_SECRET || 'fallback_secret',
        { expiresIn: '7d' }
      );

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
    } else {
      console.log('❌ Password incorrect');
      return res.status(400).json({ message: 'Invalid credentials' });
    }
  } catch (error) {
    console.error('💥 Login error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// SIMPLE CREATE ADMIN ROUTE
app.post('/api/create-admin', async (req, res) => {
  try {
    console.log('🔄 Creating admin user...');
    
    // Delete existing admin
    await User.destroy({ where: { email: 'admin@test.com' } });
    
    // Create new admin WITHOUT password hashing
    const user = await User.create({
      username: 'admin',
      email: 'admin@test.com',
      password: 'password123', // Store plain text temporarily
      role: 'admin'
    });
    
    console.log('✅ Admin user created');
    
    res.json({ 
      message: 'Admin user created successfully',
      credentials: {
        email: 'admin@test.com',
        password: 'password123'
      },
      note: 'Password stored as plain text for testing'
    });
  } catch (error) {
    console.error('Create admin error:', error);
    res.status(500).json({ message: 'Error creating admin', error: error.message });
  }
});

// TEST LOGIN ROUTE
app.post('/api/test-login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('🧪 Test login:', { email, password });
    
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.json({ success: false, message: 'User not found' });
    }
    
    console.log('Stored password:', user.password);
    console.log('Input password:', password);
    
    const success = (password === user.password);
    
    res.json({ 
      success,
      message: success ? 'Login successful' : 'Login failed',
      storedPassword: user.password,
      inputPassword: password
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ====================
// OTHER ROUTES (Keep your existing ones)
// ====================
app.get('/', (req, res) => {
  res.json({ 
    message: 'Social Media Manager API is running!',
    status: 'success',
    endpoints: {
      login: 'POST /api/auth/login',
      createAdmin: 'POST /api/create-admin',
      testLogin: 'POST /api/test-login'
    }
  });
});

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

// ... KEEP ALL YOUR EXISTING ROUTES (posts, social-accounts, upload, etc.) ...

// START SERVER
const startServer = async () => {
  try {
    await testConnection();
    
    // Create admin if doesn't exist
    const adminExists = await User.findOne({ where: { email: 'admin@test.com' } });
    if (!adminExists) {
      await User.create({
        username: 'admin',
        email: 'admin@test.com',
        password: 'password123',
        role: 'admin'
      });
      console.log('✅ Default admin created');
    }
    
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`✅ Server running on port ${PORT}`);
      console.log(`✅ API: https://social-media-manager-2.onrender.com/api`);
      console.log(`🔑 Login: admin@test.com / password123`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
