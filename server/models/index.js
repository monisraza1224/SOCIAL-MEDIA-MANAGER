const { DataTypes } = require('sequelize');
const { sequelize } = require('../database');
const bcrypt = require('bcryptjs');

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
  hooks: {
    beforeCreate: async (user) => {
      user.password = await bcrypt.hash(user.password, 12);
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        user.password = await bcrypt.hash(user.password, 12);
      }
    }
  }
});

// Social Account Model
const SocialAccount = sequelize.define('SocialAccount', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  platform: {
    type: DataTypes.ENUM('facebook', 'instagram', 'twitter', 'linkedin', 'tiktok'),
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
    allowNull: false
  },
  pageId: {
    type: DataTypes.STRING
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
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
    type: DataTypes.JSON,
    defaultValue: []
  },
  cta: {
    type: DataTypes.STRING,
    defaultValue: ''
  },
  mediaType: {
    type: DataTypes.ENUM('image', 'video', 'text'),
    allowNull: false
  },
  mediaUrls: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  scheduledFor: {
    type: DataTypes.DATE,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('draft', 'scheduled', 'published', 'failed'),
    defaultValue: 'scheduled'
  },
  selectedAccounts: {
    type: DataTypes.JSON,
    defaultValue: []
  }
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
  messages: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  status: {
    type: DataTypes.ENUM('active', 'resolved', 'archived'),
    defaultValue: 'active'
  }
});

// Define Relationships
User.hasMany(SocialAccount, { foreignKey: 'userId', onDelete: 'CASCADE' });
SocialAccount.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(Post, { foreignKey: 'userId', onDelete: 'CASCADE' });
Post.belongsTo(User, { foreignKey: 'userId' });

Post.belongsToMany(SocialAccount, { 
  through: 'PostAccounts',
  foreignKey: 'postId',
  otherKey: 'accountId'
});
SocialAccount.belongsToMany(Post, { 
  through: 'PostAccounts',
  foreignKey: 'accountId',
  otherKey: 'postId'
});

module.exports = {
  User,
  SocialAccount,
  Post,
  Conversation,
  sequelize
};
