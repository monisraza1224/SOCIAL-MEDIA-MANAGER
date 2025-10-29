const express = require('express');
const Post = require('../models/Post');
const SocialAccount = require('../models/SocialAccount');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Get all posts for the logged-in user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const posts = await Post.find({ userId: req.user._id })
      .populate('platforms.accountId', 'platform accountName')
      .sort({ scheduledFor: 1 });

    res.json({
      message: 'Posts retrieved successfully',
      posts: posts
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create a new post
router.post('/', authMiddleware, async (req, res) => {
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

    console.log('📨 Received post creation request:', { 
      title, 
      mediaType, 
      selectedAccounts: selectedAccounts?.length,
      platforms 
    });

    // Validate required fields
    if (!title || !content || !mediaType || !scheduledFor) {
      return res.status(400).json({ 
        message: 'Missing required fields: title, content, mediaType, scheduledFor' 
      });
    }

    // Validate scheduled time is in future
    const scheduledTime = new Date(scheduledFor);
    if (scheduledTime <= new Date()) {
      return res.status(400).json({ 
        message: 'Scheduled time must be in the future' 
      });
    }

    // Mock account IDs for demo
    const mockAccountIds = {
      'fb1': '654a1b2c3d4e5f6a7b8c9d0a',
      'fb2': '654a1b2c3d4e5f6a7b8c9d0b', 
      'fb3': '654a1b2c3d4e5f6a7b8c9d0c',
      'ig1': '654a1b2c3d4e5f6a7b8c9d0d',
      'ig2': '654a1b2c3d4e5f6a7b8c9d0e',
      'ig3': '654a1b2c3d4e5f6a7b8c9d0f',
      'tt1': '654a1b2c3d4e5f6a7b8c9d10'
    };

    // Handle both old and new data structures
    let platformsData = [];
    let finalSelectedAccounts = [];

    if (selectedAccounts && selectedAccounts.length > 0) {
      // NEW: Using selectedAccounts from frontend
      finalSelectedAccounts = selectedAccounts;
      
      // Convert to platforms array for backward compatibility
      platformsData = selectedAccounts.map(account => ({
        accountId: mockAccountIds[account.id] || mockAccountIds.fb1,
        status: 'pending'
      }));
    } else if (platforms && platforms.length > 0) {
      // OLD: Using platforms array (backward compatibility)
      finalSelectedAccounts = platforms.map(platform => ({
        id: platform.toLowerCase() === 'facebook' ? 'fb1' : 
            platform.toLowerCase() === 'instagram' ? 'ig1' : 'tt1',
        platform: platform,
        name: `${platform} Page`,
        type: 'page'
      }));
      
      platformsData = platforms.map(platform => ({
        accountId: mockAccountIds.fb1,
        status: 'pending'
      }));
    } else {
      return res.status(400).json({ 
        message: 'No platforms or accounts selected' 
      });
    }

    // Filter out empty media URLs for text posts
    const finalMediaUrls = mediaType === 'text' ? [] : (mediaUrls || []).filter(url => url.trim() !== '');

    const post = new Post({
      userId: req.user._id,
      title,
      content,
      hashtags: hashtags ? (typeof hashtags === 'string' ? hashtags.split(',').map(tag => tag.trim()).filter(tag => tag) : hashtags) : [],
      cta: cta || '',
      mediaType,
      mediaUrls: finalMediaUrls,
      scheduledFor: scheduledTime,
      status: 'scheduled',
      platforms: platformsData,
      selectedAccounts: finalSelectedAccounts
    });

    await post.save();
    
    // Populate the response
    await post.populate('platforms.accountId', 'platform accountName');

    console.log('✅ Post created successfully:', post.title);
    
    res.status(201).json({
      message: 'Post created and scheduled successfully',
      post: post
    });
  } catch (error) {
    console.error('❌ Error creating post:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message
    });
  }
});

// Update a post
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const post = await Post.findOne({ 
      _id: req.params.id, 
      userId: req.user._id 
    });

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (post.status === 'published') {
      return res.status(400).json({ message: 'Cannot update published post' });
    }

    Object.assign(post, req.body);
    await post.save();

    res.json({
      message: 'Post updated successfully',
      post: post
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete a post
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const post = await Post.findOne({ 
      _id: req.params.id, 
      userId: req.user._id 
    });

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (post.status === 'published') {
      return res.status(400).json({ message: 'Cannot delete published post' });
    }

    await Post.findByIdAndDelete(req.params.id);

    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
