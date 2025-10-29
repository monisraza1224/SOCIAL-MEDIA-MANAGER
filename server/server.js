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

// Initialize default data
const initializeDefaultData = async () => {
  try {
    let adminUser = await User.findOne({ where: { email: 'admin@test.com' } });
    
    if (!adminUser) {
      console.log('Creating admin user...');
      const hashedPassword = await bcrypt.hash('password123', 12);
      adminUser = await User.create({
        username: 'admin',
        email: 'admin@test.com',
        password: hashedPassword,
        role: 'admin'
      });
      console.log('Admin user created');
    }
  } catch (error) {
    console.error('Error creating default data:', error);
  }
};

// ====================
// AUTH ROUTES - WORKING VERSION
// ====================
app.post('/api/auth/login', async (req, res) => {
  try {
    console.log('Login attempt:', req.body.email);
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      console.log('User not found:', email);
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    console.log('User found, checking password...');
    const isMatch = await bcrypt.compare(password, user.password);
    console.log('Password match:', isMatch);

    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '7d' }
    );

    console.log('Login successful for:', user.email);
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
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// COMPLETE RESET ROUTE
app.post('/api/complete-reset', async (req, res) => {
  try {
    console.log('COMPLETE SYSTEM RESET...');
    
    // Delete all data
    await User.destroy({ where: {} });
    await SocialAccount.destroy({ where: {} });
    await Post.destroy({ where: {} });
    
    // Create fresh admin
    const hashedPassword = await bcrypt.hash('password123', 12);
    const user = await User.create({
      username: 'admin',
      email: 'admin@test.com',
      password: hashedPassword,
      role: 'admin'
    });

    // Test the password
    const testMatch = await bcrypt.compare('password123', user.password);
    
    res.json({ 
      message: 'Complete system reset successful',
      credentials: {
        email: 'admin@test.com',
        password: 'password123'
      },
      password_test: testMatch ? 'PASSWORD WORKS ✅' : 'PASSWORD FAILED ❌'
    });
  } catch (error) {
    console.error('Reset error:', error);
    res.status(500).json({ message: 'Error resetting system', error: error.message });
  }
});

// ... REST OF YOUR ROUTES (posts, social-accounts, upload, etc.) ...
// Keep all your existing routes exactly as they are

// START SERVER
const startServer = async () => {
  try {
    await testConnection();
    await initializeDefaultData();
    
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`✅ Server running on port ${PORT}`);
      console.log(`✅ API: https://social-media-manager-2.onrender.com/api`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
