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

const { testConnection, sequelize } = require('./database');
const { User, SocialAccount, Post, Conversation } = require('./models');

const app = express();
const PORT = process.env.PORT || 5000;
// CORS configuration - ALLOW ALL ORIGINS
app.use(cors({
  origin: true, // This allows ALL origins
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.options('*', cors()); // Handle preflight for all routes

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

// Initialize default data
const initializeDefaultData = async () => {
  try {
    let adminUser = await User.findOne({ where: { email: 'admin@test.com' } });
    
    if (!adminUser) {
      console.log('Creating admin user...');
      adminUser = await User.create({
        username: 'admin',
        email: 'admin@test.com',
        password: 'password123',
        role: 'admin'
      });
      console.log('Admin user created');
    }
  } catch (error) {
    console.error('Error creating default data:', error);
  }
};

// ====================
// AUTH ROUTES - COMPLETE
// ====================

// REGISTER ROUTE - ADD THIS
app.post('/api/auth/register', async (req, res) => {
  try {
    console.log('👤 Registration attempt:', req.body);
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Username, email and password are required' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ 
      where: { 
        [Op.or]: [{ email }, { username }] 
      } 
    });
    
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create new user
    const user = await User.create({
      username,
      email,
      password: password, // Plain text for now
      role: 'editor'
    });

    // Generate token
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '7d' }
    );

    console.log('✅ Registration successful for:', user.email);
    
    res.status(201).json({
      message: 'User created successfully',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// LOGIN ROUTE
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

    console.log('✅ User found:', user.email);
    
    // Handle both plain text and hashed passwords
    if (user.password.startsWith('$2a$')) {
      // Hashed password
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }
    } else {
      // Plain text password
      if (user.password !== password) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }
    }

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
  } catch (error) {
    console.error('💥 Login error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// CREATE ADMIN ROUTE
app.post('/api/create-admin', async (req, res) => {
  try {
    await User.destroy({ where: { email: 'admin@test.com' } });
    
    const user = await User.create({
      username: 'admin',
      email: 'admin@test.com',
      password: 'password123',
      role: 'admin'
    });
    
    res.json({ 
      message: 'Admin user created successfully',
      credentials: {
        email: 'admin@test.com',
        password: 'password123'
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error creating admin', error: error.message });
  }
});

// ====================
// OTHER ROUTES
// ====================

app.get('/', (req, res) => {
  res.json({ 
    message: 'Social Media Manager API is running!',
    status: 'success',
    version: '1.0.0',
    endpoints: {
      register: 'POST /api/auth/register',
      login: 'POST /api/auth/login',
      createAdmin: 'POST /api/create-admin',
      posts: 'GET /api/posts',
      socialAccounts: 'GET /api/social-accounts'
    }
  });
});

// ... KEEP ALL YOUR EXISTING ROUTES (posts, social-accounts, upload, health, etc.)

// START SERVER
const startServer = async () => {
  try {
    await testConnection();
    await initializeDefaultData();
    
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`✅ Server running on port ${PORT}`);
      console.log(`✅ API: https://social-media-manager-2.onrender.com/api`);
      console.log(`🌍 CORS: Enabled for all origins (global access)`);
      console.log(`🔑 Default login: admin@test.com / password123`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
