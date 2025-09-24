// /models/Chat.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ChatSession = sequelize.define('ChatSession', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'users', key: 'id' }
  },
  sessionId: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  userMessage: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  aiResponse: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  mode: {
    type: DataTypes.ENUM('general', 'tutor', 'code'),
    defaultValue: 'general'
  },
  provider: {
    type: DataTypes.STRING(50),
    defaultValue: 'groq'
  },
  context: {
    type: DataTypes.JSON,
    defaultValue: {}
  }
}, {
  tableName: 'chat_sessions',
  indexes: [{ fields: ['userId'] }, { fields: ['sessionId'] }]
});

const Roadmap = sequelize.define('Roadmap', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'users', key: 'id' }
  },
  title: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  description: DataTypes.TEXT,
  topic: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  level: {
    type: DataTypes.ENUM('beginner', 'intermediate', 'advanced'),
    allowNull: false
  },
  duration: {
    type: DataTypes.ENUM('short', 'medium', 'long'),
    allowNull: false
  },
  estimatedDuration: DataTypes.STRING(50),
  data: {
    type: DataTypes.JSON,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('active', 'completed', 'paused'),
    defaultValue: 'active'
  }
}, {
  tableName: 'roadmaps',
  indexes: [{ fields: ['userId'] }, { fields: ['topic'] }]
});

module.exports = { ChatSession, Roadmap };
