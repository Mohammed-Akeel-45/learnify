// routes/courses.js - UPDATED FOR YOUR DATABASE
const express = require('express');
const { Course, Roadmap, UserProgress } = require('../models');
const { auth } = require('../middleware/auth');
const { Op } = require('sequelize');
const router = express.Router();
// Get all courses (public)
router.get('/', async (req, res) => {
try {
const { difficulty, category, search } = req.query;
let where = { isPublished: true };
if (difficulty) where.difficulty = difficulty;
if (category) where.category = category;
if (search) {
  where[Op.or] = [
    { title: { [Op.like]: `%${search}%` } },
    { description: { [Op.like]: `%${search}%` } }
  ];
}

const courses = await Course.findAll({
  where,
  attributes: ['id', 'title', 'description', 'difficulty', 'duration', 'lessons', 'category', 'tags'],
  order: [['createdAt', 'DESC']]
});

res.json(courses);
} catch (error) {
console.error('Get courses error:', error);
res.json([]);
}
});
// Get single course with user progress
router.get('/:id', auth, async (req, res) => {
try {
const userId = req.userId;
const { id } = req.params;
const course = await Course.findByPk(id);

if (!course) {
  return res.status(404).json({ message: 'Course not found' });
}

// Get progress
const progress = await UserProgress.findOne({
  where: { 
    userId,
    resourceType: 'course',
    resourceId: id
  }
});

res.json({
  ...course.toJSON(),
  userProgress: progress || null
});
} catch (error) {
console.error('Get course error:', error);
res.status(500).json({ message: 'Server error' });
}
});
// Get user's enrolled courses
router.get('/my/enrolled', auth, async (req, res) => {
try {
const userId = req.userId;
const enrolledProgress = await UserProgress.findAll({
  where: { 
    userId,
    resourceType: 'course'
  },
  order: [['lastAccessed', 'DESC']]
});

// Get course details
const enrolledCourses = [];
for (const progress of enrolledProgress) {
  const course = await Course.findByPk(progress.resourceId, {
    attributes: ['id', 'title', 'description', 'difficulty', 'duration', 'category', 'content']
  });
  
  if (course) {
    enrolledCourses.push({
      ...course.toJSON(),
      progress: progress.toJSON()
    });
  }
}

res.json(enrolledCourses);
} catch (error) {
console.error('Get enrolled courses error:', error);
res.status(500).json({ message: 'Server error' });
}
});
// Enroll in a course
router.post('/:id/enroll', auth, async (req, res) => {
try {
const userId = req.userId;
const { id } = req.params;
// Check if course exists
const course = await Course.findByPk(id);
if (!course) {
  return res.status(404).json({ message: 'Course not found' });
}

// Check if already enrolled
const existingProgress = await UserProgress.findOne({
  where: { 
    userId, 
    resourceType: 'course',
    resourceId: id 
  }
});

if (existingProgress) {
  return res.status(400).json({ 
    message: 'Already enrolled in this course',
    progress: existingProgress
  });
}

// Create progress entry
const progress = await UserProgress.create({
  userId,
  resourceType: 'course',
  resourceId: id,
  progress: 0,
  completed: false,
  data: {
    completedLessons: [],
    currentLesson: 0,
    roadmapId: course.roadmapId
  }
});

res.json({
  message: 'Enrolled successfully',
  progress
});
} catch (error) {
console.error('Enroll error:', error);
res.status(500).json({ message: 'Error enrolling in course' });
}
});
module.exports = router;