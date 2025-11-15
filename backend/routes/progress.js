// routes/progress.js - UPDATED FOR YOUR DATABASE STRUCTURE
const express = require('express');
const { UserProgress, Course, Roadmap } = require('../models');
const { auth } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const router = express.Router();
// Get user's course progress
router.get('/course/:courseId', auth, async (req, res) => {
try {
const userId = req.userId;
const { courseId } = req.params;
let progress = await UserProgress.findOne({
  where: { 
    userId, 
    resourceType: 'course',
    resourceId: courseId 
  }
});

if (!progress) {
  // Create new progress entry
  progress = await UserProgress.create({
    userId,
    resourceType: 'course',
    resourceId: courseId,
    progress: 0,
    completed: false,
    data: { completedLessons: [], currentLesson: 0 }
  });
}

// Get course details
const course = await Course.findByPk(courseId);

res.json({
  ...progress.toJSON(),
  course: course ? {
    id: course.id,
    title: course.title,
    description: course.description
  } : null
});
} catch (error) {
console.error('Get progress error:', error);
res.status(500).json({ message: 'Error fetching progress' });
}
});
// Update course progress
router.post('/course/:courseId/update', auth, [
body('lessonIndex').isInt({ min: 0 }).withMessage('Valid lesson index required'),
body('completed').optional().isBoolean()
], async (req, res) => {
try {
const errors = validationResult(req);
if (!errors.isEmpty()) {
return res.status(400).json({ errors: errors.array() });
}
const userId = req.userId;
const { courseId } = req.params;
const { lessonIndex, completed = true } = req.body;

// Get or create progress
let progress = await UserProgress.findOne({
  where: { 
    userId, 
    resourceType: 'course',
    resourceId: courseId 
  }
});

if (!progress) {
  progress = await UserProgress.create({
    userId,
    resourceType: 'course',
    resourceId: courseId,
    progress: 0,
    completed: false,
    data: { completedLessons: [], currentLesson: 0 }
  });
}

// Get course to know total lessons
const course = await Course.findByPk(courseId);
if (!course) {
  return res.status(404).json({ message: 'Course not found' });
}

const totalLessons = course.content?.lessons?.length || 0;

// Get current data
let progressData = progress.data || { completedLessons: [], currentLesson: 0 };
let completedLessons = progressData.completedLessons || [];

// Update completed lessons
if (completed && !completedLessons.includes(lessonIndex)) {
  completedLessons.push(lessonIndex);
} else if (!completed) {
  completedLessons = completedLessons.filter(i => i !== lessonIndex);
}

// Calculate progress percentage
const progressPercent = totalLessons > 0 
  ? Math.round((completedLessons.length / totalLessons) * 100)
  : 0;

// Update progress
await progress.update({
  progress: progressPercent,
  completed: progressPercent === 100,
  completedAt: progressPercent === 100 ? new Date() : null,
  lastAccessed: new Date(),
  data: {
    ...progressData,
    completedLessons,
    currentLesson: lessonIndex
  }
});

res.json({
  message: 'Progress updated successfully',
  progress: {
    resourceId: progress.resourceId,
    progress: progress.progress,
    completed: progress.completed,
    completedLessons,
    currentLesson: lessonIndex
  }
});
} catch (error) {
console.error('Update progress error:', error);
res.status(500).json({ message: 'Error updating progress' });
}
});
// Get all user progress (for dashboard)
router.get('/all', auth, async (req, res) => {
try {
const userId = req.userId;
const allProgress = await UserProgress.findAll({
  where: { userId },
  order: [['lastAccessed', 'DESC']]
});

// Get course details for course progress
const courseProgress = [];
for (const progress of allProgress) {
  if (progress.resourceType === 'course') {
    const course = await Course.findByPk(progress.resourceId, {
      attributes: ['id', 'title', 'difficulty', 'duration', 'category'],
      include: [{
        model: Roadmap,
        attributes: ['id', 'title', 'topic']
      }]
    });
    
    if (course) {
      courseProgress.push({
        ...progress.toJSON(),
        course: course.toJSON()
      });
    }
  }
}

// Separate by status
const inProgress = courseProgress.filter(p => !p.completed && p.progress > 0);
const completed = courseProgress.filter(p => p.completed);
const notStarted = courseProgress.filter(p => p.progress === 0);

res.json({
  total: courseProgress.length,
  inProgress: inProgress.length,
  completed: completed.length,
  notStarted: notStarted.length,
  courses: courseProgress
});
} catch (error) {
console.error('Get all progress error:', error);
res.status(500).json({ message: 'Error fetching progress' });
}
});
// Update time spent on course
router.post('/course/:courseId/time', auth, [
body('minutes').isInt({ min: 1 }).withMessage('Valid time in minutes required')
], async (req, res) => {
try {
const userId = req.userId;
const { courseId } = req.params;
const { minutes } = req.body;
let progress = await UserProgress.findOne({
  where: { 
    userId, 
    resourceType: 'course',
    resourceId: courseId 
  }
});

if (!progress) {
  progress = await UserProgress.create({
    userId,
    resourceType: 'course',
    resourceId: courseId,
    timeSpent: minutes,
    lastAccessed: new Date(),
    data: { completedLessons: [], currentLesson: 0 }
  });
} else {
  await progress.update({
    timeSpent: progress.timeSpent + minutes,
    lastAccessed: new Date()
  });
}

res.json({ message: 'Time updated successfully' });
} catch (error) {
console.error('Update time error:', error);
res.status(500).json({ message: 'Error updating time' });
}
});
module.exports = router;
