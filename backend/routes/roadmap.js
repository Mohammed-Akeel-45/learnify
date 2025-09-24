// routes/roadmap.js
const express = require('express');
const { Roadmap } = require('../models');
const { auth } = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const userId = req.userId;
    const roadmaps = await Roadmap.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']]
    });
    res.json(roadmaps);
  } catch (error) {
    console.error('Get roadmaps error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;