// models/index.js - FIXED VERSION
const { sequelize } = require('../config/database');
const User = require('./User');
const Course = require('./Course');
const { Quiz, QuizAttempt } = require('./Quiz');
const { ChatSession, Roadmap } = require('./Chat');

// Define associations
User.hasMany(Course, { foreignKey: 'createdBy' });
User.hasMany(Quiz, { foreignKey: 'createdBy' });
User.hasMany(QuizAttempt, { foreignKey: 'userId' });
User.hasMany(ChatSession, { foreignKey: 'userId' });
User.hasMany(Roadmap, { foreignKey: 'userId' });

Course.belongsTo(User, { foreignKey: 'createdBy' });
Course.belongsTo(Roadmap, { foreignKey: 'roadmapId' });

Quiz.belongsTo(User, { foreignKey: 'createdBy' });
Quiz.hasMany(QuizAttempt, { foreignKey: 'quizId' });

QuizAttempt.belongsTo(User, { foreignKey: 'userId' });
QuizAttempt.belongsTo(Quiz, { foreignKey: 'quizId' });

ChatSession.belongsTo(User, { foreignKey: 'userId' });
Roadmap.belongsTo(User, { foreignKey: 'userId' });
Roadmap.hasMany(Course, { foreignKey: 'roadmapId' });

module.exports = {
  sequelize,
  User,
  Course,
  Quiz,
  QuizAttempt,
  ChatSession,
  Roadmap
};