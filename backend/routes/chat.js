const express = require('express');
const ChatMessage = require('../models/ChatMessage');
const { protect } = require('../middleware/auth');
const { chatWithAI } = require('../services/groqAI');

const router = express.Router();

// @route   POST /api/chat
// @desc    Send a message and get AI response
router.post('/', protect, async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ success: false, message: 'Please provide a message' });
    }

    // Save user message
    await ChatMessage.create({
      userId: req.user._id,
      role: 'user',
      content: message
    });

    // Get recent chat history for context (last 20 messages)
    const history = await ChatMessage.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(20);

    const messages = history.reverse().map(m => ({
      role: m.role,
      content: m.content
    }));

    // Get AI response
    const aiResponse = await chatWithAI(messages);

    // Save AI response
    const assistantMessage = await ChatMessage.create({
      userId: req.user._id,
      role: 'assistant',
      content: aiResponse
    });

    res.json({
      success: true,
      data: {
        userMessage: { role: 'user', content: message },
        assistantMessage: { role: 'assistant', content: aiResponse, _id: assistantMessage._id, createdAt: assistantMessage.createdAt }
      }
    });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ success: false, message: 'Failed to get AI response: ' + error.message });
  }
});

// @route   GET /api/chat/history
// @desc    Get chat history for current user
router.get('/history', protect, async (req, res) => {
  try {
    const messages = await ChatMessage.find({ userId: req.user._id })
      .sort({ createdAt: 1 })
      .limit(100);

    res.json({ success: true, data: messages });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   DELETE /api/chat/history
// @desc    Clear chat history
router.delete('/history', protect, async (req, res) => {
  try {
    await ChatMessage.deleteMany({ userId: req.user._id });
    res.json({ success: true, message: 'Chat history cleared' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
