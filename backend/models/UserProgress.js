
// models/UserProgress.js - MATCHING YOUR ACTUAL DATABASE STRUCTURE
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');const UserProgress = sequelize.define('UserProgress', {
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
resourceType: {
type: DataTypes.STRING(50),
allowNull: false,
comment: 'Type of resource: course, quiz, roadmap, etc.'
},
resourceId: {
type: DataTypes.INTEGER,
allowNull: false,
comment: 'ID of the resource (courseId, quizId, etc.)'
},
progress: {
type: DataTypes.INTEGER,
defaultValue: 0,
validate: { min: 0, max: 100 }
},
timeSpent: {
type: DataTypes.INTEGER,
defaultValue: 0,
comment: 'Time spent in minutes'
},
lastAccessed: {
type: DataTypes.DATE,
defaultValue: DataTypes.NOW
},
completed: {
type: DataTypes.BOOLEAN,
defaultValue: false
},
completedAt: {
type: DataTypes.DATE,
allowNull: true
},
data: {
type: DataTypes.JSON,
defaultValue: {},
comment: 'Additional data: completedLessons, currentLesson, etc.'
}
}, {
tableName: 'user_progress',
underscored: false,
timestamps: true,
indexes: [
{ fields: ['userId'] },
{ fields: ['resourceType'] },
{ fields: ['resourceId'] },
{
unique: true,
fields: ['userId', 'resourceType', 'resourceId'],
name: 'user_progress_unique'
}
]
});module.exports = UserProgress;
