const mongoose = require('mongoose');

const socialAccountSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  platform: {
    type: String,
    required: true,
    enum: ['facebook', 'instagram', 'tiktok']
  },
  accountName: {
    type: String,
    required: true
  },
  accountId: {
    type: String,
    required: true
  },
  accessToken: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  pageId: {
    type: String, // For Facebook Pages
    default: null
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('SocialAccount', socialAccountSchema);
