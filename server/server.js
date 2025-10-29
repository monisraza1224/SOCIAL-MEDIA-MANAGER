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
      // Store plain text password temporarily
      adminUser = await User.create({
        username: 'admin',
        email: 'admin@test.com',
        password: 'password123', // Plain text
        role: 'admin'
      });
      console.log('Admin user created with plain text password');
    }
  } catch (error) {
    console.error('Error creating default data:', error);
  }
};

// ====================
// WORKING AUTH ROUTES - PLAIN TEXT PASSWORDS
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

    console.log('✅ User found:', user.email);
    console.log('🔑 Stored password:', user.password);
    console.log('🔑 Input password:', password);

    // SIMPLE PLAIN TEXT COMPARISON - THIS WILL WORK
    if (password === user.password) {
      console.log('🎉 Login successful!');
      
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
      console.log('❌ Password mismatch');
      return res.status(400).json({ message: 'Invalid credentials' });
    }
  } catch (error) {
    console.error('💥 Login error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// CREATE ADMIN ROUTE - PLAIN TEXT
app.post('/api/create-admin', async (req, res) => {
  try {
    console.log('🔄 Creating admin user...');
    
    // Delete existing admin
    await User.destroy({ where: { email: 'admin@test.com' } });
    
    // Create new admin with plain text password
    const user = await User.create({
      username: 'admin',
      email: 'admin@test.com',
      password: 'password123', // Plain text
      role: 'admin'
    });
    
    console.log('✅ Admin user created with password: password123');
    
    res.json({ 
      message: 'Admin user created successfully',
      credentials: {
        email: 'admin@test.com',
        password: 'password123'
      },
      note: 'Using plain text passwords for immediate login functionality'
    });
  } catch (error) {
    console.error('Create admin error:', error);
    res.status(500).json({ message: 'Error creating admin', error: error.message });
  }
});

// CHECK USER DATA
app.get('/api/debug-users', async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'username', 'email', 'password', 'role']
    });
    
    res.json({
      message: 'All users in database',
      users: users,
      total: users.length
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users', error: error.message });
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
    environment: process.env.NODE_ENV || 'development',
    database: process.env.DATABASE_URL ? 'PostgreSQL' : 'SQLite',
    login: 'POST /api/auth/login',
    createAdmin: 'POST /api/create-admin'
  });
});

app.get('/api', (req, res) => {
  res.json({ 
    message: 'Social Media Manager API',
    version: '1.0.0',
    status: 'running',
    endpoints: [
      'GET    /api/health',
      'POST   /api/auth/login',
      'POST   /api/create-admin',
      'GET    /api/debug-users',
      'GET    /api/social-accounts',
      'POST   /api/social-accounts',
      'GET    /api/posts',
      'POST   /api/posts',
      'POST   /api/upload'
    ]
  });
});

app.get('/api/health', async (req, res) => {
  try {
    const usersCount = await User.count();
    const postsCount = await Post.count();
    const accountsCount = await SocialAccount.count();
    const conversationsCount = await Conversation.count();
    
    res.json({
      status: 'OK',
      database: process.env.DATABASE_URL ? 'PostgreSQL' : 'SQLite',
      environment: process.env.NODE_ENV || 'development',
      users: usersCount,
      socialAccounts: accountsCount,
      posts: postsCount,
      conversations: conversationsCount,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'ERROR', 
      error: error.message 
    });
  }
});

// ====================
// SOCIAL ACCOUNTS ROUTES
// ====================
app.get('/api/social-accounts', authMiddleware, async (req, res) => {
  try {
    const accounts = await SocialAccount.findAll({ 
      where: { userId: req.user.id } 
    });
    
    res.json({
      message: 'Social accounts retrieved successfully',
      accounts
    });
  } catch (error) {
    console.error('Get accounts error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.post('/api/social-accounts', authMiddleware, async (req, res) => {
  try {
    const account = await SocialAccount.create({
      userId: req.user.id,
      ...req.body
    });
    
    res.status(201).json({
      message: 'Social account added successfully',
      account
    });
  } catch (error) {
    console.error('Create account error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ====================
// POSTS ROUTES
// ====================
app.get('/api/posts', authMiddleware, async (req, res) => {
  try {
    const posts = await Post.findAll({ 
      where: { userId: req.user.id },
      order: [['scheduledFor', 'ASC']],
      include: [{ model: SocialAccount, attributes: ['platform', 'accountName'] }]
    });
    
    res.json({
      message: 'Posts retrieved successfully',
      posts
    });
  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.post('/api/posts', authMiddleware, async (req, res) => {
  try {
    const { 
      title, 
      content, 
      hashtags, 
      cta, 
      mediaType, 
      mediaUrls, 
      scheduledFor, 
      platforms,
      selectedAccounts 
    } = req.body;

    if (!title || !content || !mediaType || !scheduledFor) {
      return res.status(400).json({ 
        message: 'Missing required fields: title, content, mediaType, scheduledFor' 
      });
    }

    const post = await Post.create({
      userId: req.user.id,
      title,
      content,
      hashtags: hashtags || [],
      cta: cta || '',
      mediaType,
      mediaUrls: mediaUrls || [],
      scheduledFor: new Date(scheduledFor),
      status: 'scheduled',
      selectedAccounts: selectedAccounts || []
    });

    res.status(201).json({
      message: 'Post created successfully',
      post
    });
  } catch (error) {
    console.error('Post creation error:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
});

// ====================
// FILE UPLOAD ROUTES
// ====================
app.post('/api/upload', authMiddleware, upload.single('media'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    
    res.json({
      message: 'File uploaded successfully',
      fileName: req.file.originalname,
      fileUrl: fileUrl,
      fileSize: req.file.size,
      mimetype: req.file.mimetype
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: 'File upload failed', error: error.message });
  }
});

app.use('/uploads', express.static(uploadsDir));

// START SERVER
const startServer = async () => {
  try {
    await testConnection();
    await initializeDefaultData();
    
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`✅ Server running on port ${PORT}`);
      console.log(`✅ Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`✅ Database: ${process.env.DATABASE_URL ? 'PostgreSQL' : 'SQLite'}`);
      console.log(`✅ API: https://social-media-manager-2.onrender.com/api`);
      console.log(`🔑 Login: admin@test.com / password123 (plain text)`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
