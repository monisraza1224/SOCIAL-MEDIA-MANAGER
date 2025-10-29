const { Sequelize, DataTypes } = require('sequelize');
const { sequelize } = require('../database');

// User Model
const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  role: {
    type: DataTypes.ENUM('admin', 'editor', 'viewer'),
    defaultValue: 'editor'
  }
}, {
  tableName: 'users',
  timestamps: true
});

// SocialAccount Model
const SocialAccount = sequelize.define('SocialAccount', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  platform: {
    type: DataTypes.ENUM('facebook', 'instagram', 'tiktok', 'whatsapp'),
    allowNull: false
  },
  accountName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  accountId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  accessToken: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  pageId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'social_accounts',
  timestamps: true
});

// Post Model
const Post = sequelize.define('Post', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  hashtags: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  cta: {
    type: DataTypes.STRING,
    defaultValue: ''
  },
  mediaType: {
    type: DataTypes.ENUM('text', 'image', 'video', 'carousel', 'reel'),
    allowNull: false
  },
  mediaUrls: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  scheduledFor: {
    type: DataTypes.DATE,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('draft', 'scheduled', 'published', 'failed'),
    defaultValue: 'draft'
  },
  selectedAccounts: {
    type: DataTypes.JSONB,
    defaultValue: []
  }
}, {
  tableName: 'posts',
  timestamps: true
});

// Conversation Model
const Conversation = sequelize.define('Conversation', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  platform: {
    type: DataTypes.STRING,
    defaultValue: 'facebook'
  },
  status: {
    type: DataTypes.ENUM('active', 'closed', 'archived'),
    defaultValue: 'active'
  },
  messages: {
    type: DataTypes.JSONB,
    defaultValue: []
  }
}, {
  tableName: 'conversations',
  timestamps: true
});

// Define Relationships
User.hasMany(SocialAccount, { foreignKey: 'userId' });
SocialAccount.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(Post, { foreignKey: 'userId' });
Post.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(Conversation, { foreignKey: 'userId' });
Conversation.belongsTo(User, { foreignKey: 'userId' });

module.exports = {
  User,
  SocialAccount,
  Post,
  Conversation,
  sequelize
};
