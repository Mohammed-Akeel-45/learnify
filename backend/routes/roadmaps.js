const express = require('express');
const Roadmap = require('../models/Roadmap');
const { protect } = require('../middleware/auth');
const { generateRoadmap } = require('../services/groqAI');

const router = express.Router();

// @route   POST /api/roadmaps/generate
// @desc    Generate a new roadmap using Groq AI
router.post('/generate', protect, async (req, res) => {
  try {
    const { topic, totalWeeks, additionalInfo } = req.body;

    if (!topic || !totalWeeks) {
      return res.status(400).json({ success: false, message: 'Please provide topic and totalWeeks' });
    }

    const aiResult = await generateRoadmap(topic, totalWeeks, additionalInfo);

    const roadmap = await Roadmap.create({
      userId: req.user._id,
      title: aiResult.title,
      description: aiResult.description,
      topic,
      totalWeeks,
      weeks: aiResult.weeks,
      status: 'draft'
    });

    res.status(201).json({ success: true, data: roadmap });
  } catch (error) {
    console.error('Roadmap generation error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate roadmap: ' + error.message });
  }
});

// @route   PUT /api/roadmaps/:id/regenerate
// @desc    Regenerate a roadmap with additional feedback
router.put('/:id/regenerate', protect, async (req, res) => {
  try {
    const roadmap = await Roadmap.findOne({ _id: req.params.id, userId: req.user._id });
    if (!roadmap) {
      return res.status(404).json({ success: false, message: 'Roadmap not found' });
    }

    const { feedback } = req.body;
    const additionalInfo = `Previous roadmap feedback: ${feedback}. The user wants changes to the roadmap for "${roadmap.topic}" over ${roadmap.totalWeeks} weeks.`;

    const aiResult = await generateRoadmap(roadmap.topic, roadmap.totalWeeks, additionalInfo);

    roadmap.title = aiResult.title;
    roadmap.description = aiResult.description;
    roadmap.weeks = aiResult.weeks;
    roadmap.status = 'draft';
    await roadmap.save();

    res.json({ success: true, data: roadmap });
  } catch (error) {
    console.error('Roadmap regeneration error:', error);
    res.status(500).json({ success: false, message: 'Failed to regenerate roadmap: ' + error.message });
  }
});

// @route   POST /api/roadmaps/:id/approve
// @desc    Approve a roadmap and generate course content
router.post('/:id/approve', protect, async (req, res) => {
  try {
    const roadmap = await Roadmap.findOne({ _id: req.params.id, userId: req.user._id });
    if (!roadmap) {
      return res.status(404).json({ success: false, message: 'Roadmap not found' });
    }

    roadmap.status = 'approved';
    await roadmap.save();

    res.json({ success: true, data: roadmap, message: 'Roadmap approved! You can now generate a course from it.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/roadmaps
// @desc    Get all roadmaps for current user
router.get('/', protect, async (req, res) => {
  try {
    const roadmaps = await Roadmap.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, data: roadmaps });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/roadmaps/:id
// @desc    Get a single roadmap
router.get('/:id', protect, async (req, res) => {
  try {
    const roadmap = await Roadmap.findOne({ _id: req.params.id, userId: req.user._id });
    if (!roadmap) {
      return res.status(404).json({ success: false, message: 'Roadmap not found' });
    }
    res.json({ success: true, data: roadmap });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   DELETE /api/roadmaps/:id
// @desc    Delete a roadmap
router.delete('/:id', protect, async (req, res) => {
  try {
    const roadmap = await Roadmap.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!roadmap) {
      return res.status(404).json({ success: false, message: 'Roadmap not found' });
    }
    res.json({ success: true, message: 'Roadmap deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
