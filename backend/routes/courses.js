const express = require('express');
const Course = require('../models/Course');
const Roadmap = require('../models/Roadmap');
const { protect } = require('../middleware/auth');
const { generateCourseContent } = require('../services/groqAI');

const router = express.Router();

// @route   POST /api/courses/generate/:roadmapId
// @desc    Generate course content from an approved roadmap
router.post('/generate/:roadmapId', protect, async (req, res) => {
  try {
    const roadmap = await Roadmap.findOne({ _id: req.params.roadmapId, userId: req.user._id });
    if (!roadmap) {
      return res.status(404).json({ success: false, message: 'Roadmap not found' });
    }

    if (roadmap.status !== 'approved') {
      return res.status(400).json({ success: false, message: 'Please approve the roadmap first' });
    }

    // Check if course already exists for this roadmap
    const existingCourse = await Course.findOne({ roadmapId: roadmap._id, userId: req.user._id });
    if (existingCourse) {
      return res.status(400).json({ success: false, message: 'Course already generated for this roadmap', data: existingCourse });
    }

    const aiResult = await generateCourseContent(roadmap);

    // Count total lessons
    let totalLessons = 0;
    if (aiResult.modules) {
      aiResult.modules.forEach(m => {
        totalLessons += m.lessons ? m.lessons.length : 0;
      });
    }

    const course = await Course.create({
      userId: req.user._id,
      roadmapId: roadmap._id,
      title: aiResult.title || roadmap.title,
      description: aiResult.description || roadmap.description,
      modules: aiResult.modules || [],
      totalLessons,
      completedLessons: 0,
      progress: 0
    });

    res.status(201).json({ success: true, data: course });
  } catch (error) {
    console.error('Course generation error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate course: ' + error.message });
  }
});

// @route   GET /api/courses
// @desc    Get all courses for current user
router.get('/', protect, async (req, res) => {
  try {
    const courses = await Course.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, data: courses });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/courses/:id
// @desc    Get a single course with full content
router.get('/:id', protect, async (req, res) => {
  try {
    const course = await Course.findOne({ _id: req.params.id, userId: req.user._id });
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }
    res.json({ success: true, data: course });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   PUT /api/courses/:id/lesson/:moduleIndex/:lessonIndex/complete
// @desc    Mark a lesson as completed
router.put('/:id/lesson/:moduleIndex/:lessonIndex/complete', protect, async (req, res) => {
  try {
    const course = await Course.findOne({ _id: req.params.id, userId: req.user._id });
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    const moduleIdx = parseInt(req.params.moduleIndex);
    const lessonIdx = parseInt(req.params.lessonIndex);

    if (!course.modules[moduleIdx] || !course.modules[moduleIdx].lessons[lessonIdx]) {
      return res.status(400).json({ success: false, message: 'Invalid module or lesson index' });
    }

    const lesson = course.modules[moduleIdx].lessons[lessonIdx];
    const wasCompleted = lesson.completed;
    lesson.completed = !lesson.completed; // Toggle

    // Recalculate progress
    let completedCount = 0;
    let totalCount = 0;
    course.modules.forEach(m => {
      m.lessons.forEach(l => {
        totalCount++;
        if (l.completed) completedCount++;
      });
    });

    course.completedLessons = completedCount;
    course.totalLessons = totalCount;
    course.progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    await course.save();

    res.json({ success: true, data: course });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
