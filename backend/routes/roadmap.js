// routes/roadmap.js - FIXED VERSION
const express = require('express');
const { Roadmap, Course, UserProgress } = require('../models');
const { auth } = require('../middleware/auth');
const { validate, roadmapValidation } = require('../middleware/validation');
const aiService = require('../services/ai');
const { body, validationResult } = require('express-validator');
const router = express.Router();

// Generate new roadmap with AI
router.post('/generate', auth, validate(roadmapValidation.generate), async (req, res) => {
  try {
    const { topic, level, duration } = req.body;
    const userId = req.userId;
    console.log(`🗺️ Generating roadmap - Topic: ${topic}, Level: ${level}, Duration: ${duration}`);

    // Generate roadmap using AI
    const roadmapData = await aiService.generateRoadmap(topic, level, duration);

    // Save roadmap to database
    const roadmap = await Roadmap.create({
      userId,
      title: roadmapData.title,
      description: roadmapData.description,
      topic,
      level,
      duration,
      estimatedDuration: roadmapData.estimatedDuration,
      data: roadmapData,
      status: 'active'
    });

    res.json({
      id: roadmap.id,
      ...roadmapData,
      message: 'Roadmap generated successfully'
    });
  } catch (error) {
    console.error('Roadmap generation error:', error);
    res.status(500).json({
      message: 'Error generating roadmap',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get all user roadmaps
router.get('/', auth, async (req, res) => {
  try {
    const userId = req.userId;
    
    // Get roadmaps with courses
    const roadmaps = await Roadmap.findAll({
      where: { userId },
      include: [{
        model: Course,
        attributes: ['id', 'title', 'moduleIndex']
      }],
      order: [['createdAt', 'DESC']]
    });

    // Manually get progress for each course
    const roadmapsWithProgress = await Promise.all(roadmaps.map(async (roadmap) => {
      const roadmapData = roadmap.toJSON();
      const courses = roadmapData.Courses || [];
      
      if (courses.length > 0) {
        // Get progress for all courses in this roadmap
        const courseIds = courses.map(c => c.id);
        const progressRecords = await UserProgress.findAll({
          where: {
            userId,
            resourceType: 'course',
            resourceId: courseIds
          }
        });

        // Map progress to courses
        const progressMap = {};
        progressRecords.forEach(p => {
          progressMap[p.resourceId] = p;
        });

        // Add progress to each course
        courses.forEach(course => {
          course.progress = progressMap[course.id]?.progress || 0;
          course.completed = progressMap[course.id]?.completed || false;
        });

        // Calculate overall progress
        const totalProgress = courses.reduce((sum, course) => sum + (course.progress || 0), 0);
        roadmapData.overallProgress = courses.length > 0 
          ? Math.round(totalProgress / courses.length) 
          : 0;
        roadmapData.completedCourses = courses.filter(c => c.completed).length;
        roadmapData.totalCourses = roadmapData.data?.modules?.length || 0;
      } else {
        roadmapData.overallProgress = 0;
        roadmapData.completedCourses = 0;
        roadmapData.totalCourses = roadmapData.data?.modules?.length || 0;
      }
      
      return roadmapData;
    }));

    res.json(roadmapsWithProgress);
  } catch (error) {
    console.error('Get roadmaps error:', error);
    res.status(500).json({ message: 'Error fetching roadmaps' });
  }
});

// Get single roadmap with details
router.get('/:id', auth, async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    
    const roadmap = await Roadmap.findOne({
      where: { id, userId },
      include: [{
        model: Course
      }]
    });

    if (!roadmap) {
      return res.status(404).json({ message: 'Roadmap not found' });
    }

    const roadmapData = roadmap.toJSON();
    
    // Get progress for all courses
    if (roadmapData.Courses && roadmapData.Courses.length > 0) {
      const courseIds = roadmapData.Courses.map(c => c.id);
      const progressRecords = await UserProgress.findAll({
        where: {
          userId,
          resourceType: 'course',
          resourceId: courseIds
        }
      });

      // Map progress to courses
      const progressMap = {};
      progressRecords.forEach(p => {
        progressMap[p.resourceId] = p.toJSON();
      });

      roadmapData.Courses.forEach(course => {
        course.userProgress = progressMap[course.id] || null;
      });
    }

    res.json(roadmapData);
  } catch (error) {
    console.error('Get roadmap error:', error);
    res.status(500).json({ message: 'Error fetching roadmap' });
  }
});

// Update/customize roadmap
router.put('/:id', auth, [
  body('duration').optional().isIn(['short', 'medium', 'long']),
  body('data').optional().isObject()
], async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const { duration, data } = req.body;
    
    const roadmap = await Roadmap.findOne({ where: { id, userId } });

    if (!roadmap) {
      return res.status(404).json({ message: 'Roadmap not found' });
    }

    // Update roadmap
    const updates = {};
    if (duration) updates.duration = duration;
    if (data) updates.data = data;

    await roadmap.update(updates);

    res.json({
      message: 'Roadmap updated successfully',
      roadmap
    });
  } catch (error) {
    console.error('Update roadmap error:', error);
    res.status(500).json({ message: 'Error updating roadmap' });
  }
});

// Generate course from roadmap module
router.post('/:id/generate-course', auth, [
  body('moduleIndex').isInt({ min: 0 }).withMessage('Valid module index required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const userId = req.userId;
    const { id } = req.params;
    const { moduleIndex } = req.body;

    // Find roadmap
    const roadmap = await Roadmap.findOne({ where: { id, userId } });

    if (!roadmap) {
      return res.status(404).json({ message: 'Roadmap not found' });
    }

    // Check if module exists
    const modules = roadmap.data.modules || [];
    if (moduleIndex >= modules.length) {
      return res.status(400).json({ message: 'Invalid module index' });
    }

    // Check if course already exists
    const existingCourse = await Course.findOne({
      where: { roadmapId: id, moduleIndex }
    });

    if (existingCourse) {
      return res.status(400).json({ 
        message: 'Course already generated for this module',
        courseId: existingCourse.id
      });
    }

    // Generate course content
    const module = modules[moduleIndex];
    console.log(`📚 Generating course for module: ${module.title}`);

    const courseContent = await aiService.generateCourseContent(
      module.title,
      module.description,
      roadmap.level
    );

    // Create course
    const course = await Course.create({
      title: courseContent.title,
      description: courseContent.description,
      difficulty: roadmap.level.charAt(0).toUpperCase() + roadmap.level.slice(1),
      content: courseContent,
      roadmapId: id,
      moduleIndex,
      isPublished: true,
      createdBy: userId,
      category: roadmap.topic,
      lessons: courseContent.lessons?.length || 0,
      duration: module.duration || '2-3 hours',
      tags: [roadmap.topic, roadmap.level]
    });

    // Create progress entry using resourceType pattern
    await UserProgress.create({
      userId,
      resourceType: 'course',
      resourceId: course.id,
      progress: 0,
      completed: false,
      data: {
        completedLessons: [],
        currentLesson: 0,
        roadmapId: id
      }
    });

    res.json({
      message: 'Course generated successfully',
      courseId: course.id,
      course: {
        id: course.id,
        title: course.title,
        description: course.description,
        lessons: courseContent.lessons
      }
    });
  } catch (error) {
    console.error('Course generation error:', error);
    res.status(500).json({
      message: 'Error generating course',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Delete roadmap
router.delete('/:id', auth, async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    
    const roadmap = await Roadmap.findOne({ where: { id, userId } });

    if (!roadmap) {
      return res.status(404).json({ message: 'Roadmap not found' });
    }

    // Get all courses for this roadmap
    const courses = await Course.findAll({
      where: { roadmapId: id },
      attributes: ['id']
    });

    const courseIds = courses.map(c => c.id);

    // Delete progress entries for courses
    if (courseIds.length > 0) {
      await UserProgress.destroy({
        where: {
          userId,
          resourceType: 'course',
          resourceId: courseIds
        }
      });
    }

    // Delete roadmap progress entries
    await UserProgress.destroy({
      where: {
        userId,
        resourceType: 'roadmap',
        resourceId: id
      }
    });

    // Delete courses
    await Course.destroy({ where: { roadmapId: id } });
    
    // Delete roadmap
    await roadmap.destroy();

    res.json({ message: 'Roadmap deleted successfully' });
  } catch (error) {
    console.error('Delete roadmap error:', error);
    res.status(500).json({ message: 'Error deleting roadmap' });
  }
});

module.exports = router;