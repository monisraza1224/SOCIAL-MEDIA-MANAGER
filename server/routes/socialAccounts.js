const express = require('express');
const SocialAccount = require('../models/SocialAccount');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Get all social accounts for the logged-in user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const accounts = await SocialAccount.find({ userId: req.user._id });
    res.json({
      message: 'Social accounts retrieved successfully',
      accounts: accounts
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add a new social account
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { platform, accountName, accountId, accessToken, pageId } = req.body;

    const socialAccount = new SocialAccount({
      userId: req.user._id,
      platform,
      accountName,
      accountId,
      accessToken,
      pageId
    });

    await socialAccount.save();

    res.status(201).json({
      message: 'Social account added successfully',
      account: socialAccount
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete a social account
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const account = await SocialAccount.findOne({ 
      _id: req.params.id, 
      userId: req.user._id 
    });

    if (!account) {
      return res.status(404).json({ message: 'Account not found' });
    }

    await SocialAccount.findByIdAndDelete(req.params.id);

    res.json({ message: 'Social account deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
