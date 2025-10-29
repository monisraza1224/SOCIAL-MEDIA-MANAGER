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

// Initialize OpenAI (optional - only if API key is provided)
let openai;
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });
}

// CORS configuration
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));
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

const fileFilter = (req, file, cb) => {
  const allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  const allowedVideoTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm'];
  
  if (allowedImageTypes.includes(file.mimetype) || allowedVideoTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images and videos are allowed.'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB
  }
});

// Auth middleware
const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    
    // Find user in database
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
    // Check if admin user exists
    const adminUser = await User.findOne({ where: { email: 'admin@test.com' } });
    
    if (!adminUser) {
      // Create admin user
      const hashedPassword = await bcrypt.hash('password123', 12);
      const user = await User.create({
        username: 'admin',
        email: 'admin@test.com',
        password: hashedPassword,
        role: 'admin'
      });

      // Create sample social accounts
      await SocialAccount.bulkCreate([
        {
          userId: user.id,
          platform: 'facebook',
          accountName: 'Sample Facebook Page',
          accountId: '123456789',
          accessToken: 'sample_token_123',
          pageId: '987654321',
          isActive: true
        },
        {
          userId: user.id,
          platform: 'instagram',
          accountName: 'Sample Instagram',
          accountId: '987654321',
          accessToken: 'sample_token_456',
          isActive: true
        }
      ]);

      console.log('✅ Default data created successfully');
    }
  } catch (error) {
    console.error('Error creating default data:', error);
  }
};

// ====================
// ROOT & API INFO ROUTES
// ====================
app.get('/', (req, res) => {
  res.json({ 
    message: 'Social Media Manager API is running!',
    status: 'success',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    database: process.env.DATABASE_URL ? 'PostgreSQL' : 'SQLite',
    endpoints: {
      health: '/api/health',
      test: '/api/test',
      auth: '/api/auth/login',
      posts: '/api/posts',
      accounts: '/api/social-accounts',
      upload: '/api/upload'
    },
    documentation: 'All API endpoints are under /api/ path'
  });
});

app.get('/api', (req, res) => {
  res.json({ 
    message: 'Social Media Manager API',
    version: '1.0.0',
    status: 'running',
    environment: process.env.NODE_ENV || 'development',
    endpoints: [
      'GET    /api/health',
      'GET    /api/test',
      'POST   /api/auth/login',
      'POST   /api/auth/register',
      'GET    /api/social-accounts',
      'POST   /api/social-accounts',
      'GET    /api/posts',
      'POST   /api/posts',
      'PUT    /api/posts/:id',
      'DELETE /api/posts/:id',
      'POST   /api/upload',
      'GET    /api/conversations'
    ]
  });
});

// ====================
// AUTH ROUTES
// ====================
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

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
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Username, email and password are required' });
    }

    const existingUser = await User.findOne({ 
      where: { 
        [Op.or]: [{ email }, { username }] 
      } 
    });
    
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = await User.create({
      username,
      email,
      password,
      role: role || 'editor'
    });

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '7d' }
    );

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

    // Validate required fields
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

app.put('/api/posts/:id', authMiddleware, async (req, res) => {
  try {
    const post = await Post.findOne({ 
      where: { 
        id: req.params.id, 
        userId: req.user.id 
      } 
    });

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (post.status === 'published') {
      return res.status(400).json({ message: 'Cannot update published post' });
    }

    await post.update(req.body);

    res.json({
      message: 'Post updated successfully',
      post
    });
  } catch (error) {
    console.error('Update post error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.delete('/api/posts/:id', authMiddleware, async (req, res) => {
  try {
    const post = await Post.findOne({ 
      where: { 
        id: req.params.id, 
        userId: req.user.id 
      } 
    });

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (post.status === 'published') {
      return res.status(400).json({ message: 'Cannot delete published post' });
    }

    await post.destroy();

    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
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
    
    console.log('File uploaded successfully:', req.file.originalname);
    
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

// ====================
// CONVERSATIONS ROUTES
// ====================
app.get('/api/conversations', authMiddleware, async (req, res) => {
  try {
    const conversations = await Conversation.findAll({ 
      where: { userId: req.user.id },
      order: [['updatedAt', 'DESC']]
    });
    
    res.json({
      message: 'Conversations retrieved successfully',
      conversations
    });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ====================
// TEST ROUTES
// ====================
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'Hello from the Social Media Manager API!', 
    status: 'success',
    database: process.env.DATABASE_URL ? 'PostgreSQL' : 'SQLite',
    environment: process.env.NODE_ENV || 'development'
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
// AI AUTO-REPLY SYSTEM (Optional)
// ====================
app.get('/webhook', (req, res) => {
  const VERIFY_TOKEN = process.env.FB_VERIFY_TOKEN || 'social_media_manager_token';
  
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode && token === VERIFY_TOKEN) {
    console.log('✓ Facebook webhook verified');
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

app.post('/webhook', async (req, res) => {
  const body = req.body;

  if (body.object === 'page') {
    body.entry.forEach(entry => {
      const webhookEvent = entry.messaging[0];
      console.log('Received Messenger event:', webhookEvent);

      if (webhookEvent.message) {
        handleMessage(webhookEvent);
      }
    });

    res.status(200).send('EVENT_RECEIVED');
  } else {
    res.sendStatus(404);
  }
});

async function handleMessage(event) {
  if (!openai) {
    console.log('OpenAI not configured - skipping AI reply');
    return;
  }

  const senderId = event.sender.id;
  const messageText = event.message.text;
  
  console.log(`Message from ${senderId}: ${messageText}`);

  try {
    // Find or create conversation
    let conversation = await Conversation.findOne({ where: { userId: senderId } });
    if (!conversation) {
      conversation = await Conversation.create({
        userId: senderId,
        platform: 'facebook',
        messages: [],
        status: 'active'
      });
    }

    // Add user message
    const updatedMessages = [...conversation.messages, {
      id: conversation.messages.length + 1,
      text: messageText,
      type: 'received',
      timestamp: new Date()
    }];

    await conversation.update({ 
      messages: updatedMessages,
      updatedAt: new Date()
    });

    // Generate AI reply
    const reply = await generateAutoReply(messageText, updatedMessages);
    
    // Add AI reply
    const finalMessages = [...updatedMessages, {
      id: updatedMessages.length + 1,
      text: reply,
      type: 'sent',
      timestamp: new Date()
    }];

    await conversation.update({ 
      messages: finalMessages,
      updatedAt: new Date()
    });

    console.log(`AI reply generated: ${reply}`);
  } catch (error) {
    console.error('Error handling message:', error);
  }
}

async function generateAutoReply(message, conversationHistory = []) {
  if (!openai) {
    return "Thanks for your message! Our team will get back to you shortly.";
  }

  try {
    const prompt = `You are a customer service agent for a business. 
    Based on the following conversation history and new message, provide a helpful, friendly response.
    
    Business Information:
    - E-commerce store with various products
    - Shipping: 3-5 business days, free over $50
    - Returns: 30-day return policy
    - Contact: support@business.com
    
    Conversation History:
    ${conversationHistory.slice(-5).map(msg => `${msg.type}: ${msg.text}`).join('\n')}
    
    New Message: ${message}
    
    Respond in a helpful, conversational tone. If asking for order info, request order number. 
    Keep responses concise but helpful.`;
    
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are a helpful customer service representative." },
        { role: "user", content: prompt }
      ],
      max_tokens: 150,
      temperature: 0.7
    });

    return completion.choices[0].message.content;
  } catch (error) {
    console.error('OpenAI error:', error);
    return "Thanks for your message! Our team will get back to you shortly.";
  }
}

// Comment out static file serving since we have separate frontend
// Serve static files in production - COMMENTED OUT FOR SEPARATE FRONTEND
// if (process.env.NODE_ENV === 'production') {
//   app.use(express.static(path.join(__dirname, '../client/dist')));
//   
//   app.get('*', (req, res) => {
//     res.sendFile(path.join(__dirname, '../client/dist/index.html'));
//   });
// }

// START SERVER
const startServer = async () => {
  try {
    // Test database connection
    await testConnection();
    
    // Initialize default data
    await initializeDefaultData();
    
    // Start server
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`✅ Server is running on port ${PORT}`);
      console.log(`✅ Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`✅ Database: ${process.env.DATABASE_URL ? 'PostgreSQL' : 'SQLite'}`);
      console.log(`✅ File Upload System Ready`);
      console.log(`✅ API Available at: http://localhost:${PORT}/api`);
      console.log(`✅ Root endpoint: http://localhost:${PORT}/`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
