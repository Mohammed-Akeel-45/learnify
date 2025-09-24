// /routes/index.js
const express = require('express');
const authRoutes = require('./auth');
const courseRoutes = require('./courses');
const quizRoutes = require('./quiz');
const chatRoutes = require('./chat');
const dashboardRoutes = require('./dashboard');
const roadmapRoutes = require('./roadmap');

const router = express.Router();

// Health check
router.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Route mounting
router.use('/auth', authRoutes);
router.use('/courses', courseRoutes);
router.use('/quiz', quizRoutes);
router.use('/chat', chatRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/roadmaps', roadmapRoutes);

module.exports = router;