// /models/Course.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Course = sequelize.define('Course', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  difficulty: {
    type: DataTypes.ENUM('Beginner', 'Intermediate', 'Advanced'),
    defaultValue: 'Beginner'
  },
  category: {
    type: DataTypes.STRING(100),
    defaultValue: 'General'
  },
  tags: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  duration: DataTypes.STRING(50),
  lessons: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  content: {
    type: DataTypes.JSON,
    defaultValue: {}
  },
  roadmapId: {
    type: DataTypes.INTEGER,
    references: { model: 'roadmaps', key: 'id' }
  },
  moduleIndex: DataTypes.INTEGER,
  isPublished: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  createdBy: {
    type: DataTypes.INTEGER,
    references: { model: 'users', key: 'id' }
  }
}, {
  tableName: 'courses',
  indexes: [
    { fields: ['difficulty'] },
    { fields: ['category'] },
    { fields: ['isPublished'] }
  ]
});

module.exports = Course;