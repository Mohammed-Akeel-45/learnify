// routes/courses.js
const express = require('express');
const { Course, Roadmap } = require('../models');
const { auth } = require('../middleware/auth');
const { validate, roadmapValidation } = require('../middleware/validation');
const aiService = require('../services/ai');
const { Op } = require('sequelize');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { difficulty, category, search } = req.query;
    let where = { isPublished: true };

    if (difficulty) where.difficulty = difficulty;
    if (category) where.category = category;
    if (search) {
      where[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } }
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

router.get('/:id', async (req, res) => {
  try {
    const course = await Course.findByPk(req.params.id);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    res.json(course);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/generate-roadmap', auth, validate(roadmapValidation.generate), async (req, res) => {
  try {
    const { topic, level, duration } = req.body;
    const userId = req.userId;

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

    res.json({ id: roadmap.id, ...roadmapData });
  } catch (error) {
    console.error('Roadmap generation error:', error);
    res.status(500).json({ message: 'Error generating roadmap' });
  }
});

router.post('/generate-content', auth, async (req, res) => {
  try {
    const { roadmapId, moduleIndex } = req.body;
    const userId = req.userId;

    const roadmap = await Roadmap.findOne({ where: { id: roadmapId, userId } });
    if (!roadmap) {
      return res.status(404).json({ message: 'Roadmap not found' });
    }

    const module = roadmap.data.modules[moduleIndex];
    const courseContent = {
      title: module.title,
      description: module.description,
      lessons: module.lessons || ['Introduction', 'Core Concepts', 'Practice', 'Summary'],
      content: { modules: [module] }
    };

    const course = await Course.create({
      title: courseContent.title,
      description: courseContent.description,
      difficulty: roadmap.level,
      content: courseContent,
      roadmapId,
      moduleIndex,
      isPublished: true,
      createdBy: userId,
      category: 'Generated',
      lessons: courseContent.lessons.length,
      duration: module.duration || '2-3 hours'
    });

    res.json({ courseId: course.id, ...courseContent });
  } catch (error) {
    console.error('Course content generation error:', error);
    res.status(500).json({ message: 'Error generating course content' });
  }
});

module.exports = router;