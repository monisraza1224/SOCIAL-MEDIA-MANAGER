const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  hashtags: [{
    type: String
  }],
  cta: {
    type: String,
    default: ''
  },
  mediaType: {
    type: String,
    enum: ['text', 'image', 'carousel', 'video', 'reel'],
    required: true
  },
  mediaUrls: [{
    type: String
  }],
  scheduledFor: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['draft', 'scheduled', 'published', 'failed'],
    default: 'draft'
  },
  platforms: [{
    accountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SocialAccount',
      required: true
    },
    publishedId: String,
    status: {
      type: String,
      enum: ['pending', 'published', 'failed'],
      default: 'pending'
    }
  }],
  selectedAccounts: [{
    id: String,
    platform: String,
    name: String,
    type: String
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Post', postSchema);
