// models/Quiz.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Quiz = sequelize.define('Quiz', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
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
  difficulty: {
    type: DataTypes.ENUM('easy', 'medium', 'hard'),
    defaultValue: 'medium'
  },
  questions: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: []
  },
  timeLimit: {
    type: DataTypes.INTEGER,
    defaultValue: 300
  },
  passingScore: {
    type: DataTypes.INTEGER,
    defaultValue: 70
  },
  isPublished: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  createdBy: {
    type: DataTypes.INTEGER,
    references: { model: 'users', key: 'id' }
  }
}, {
  tableName: 'quizzes',
  indexes: [{ fields: ['topic'] }, { fields: ['difficulty'] }]
});

const QuizAttempt = sequelize.define('QuizAttempt', {
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
  quizId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'quizzes', key: 'id' }
  },
  answers: {
    type: DataTypes.JSON,
    allowNull: false
  },
  score: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  timeSpent: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  passed: {
    type: DataTypes.BOOLEAN,
    allowNull: false
  },
  results: {
    type: DataTypes.JSON,
    defaultValue: {}
  },
  completedAt: {
    type: DataTypes.DATE,
    allowNull: false
  }
}, {
  tableName: 'quiz_attempts',
  indexes: [{ fields: ['userId'] }, { fields: ['quizId'] }]
});

module.exports = { Quiz, QuizAttempt };