// /models/User.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false, 
    validate: { len: [2, 100] }
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    validate: { isEmail: true }
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  profile: {
    type: DataTypes.JSON,
    defaultValue: {}
  },
  preferences: {
    type: DataTypes.JSON,
    defaultValue: {
      learningLevel: 'beginner',
      interests: [],
      notifications: true
    }
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'users',
  indexes: [{ fields: ['email'] }]
});

module.exports = User;