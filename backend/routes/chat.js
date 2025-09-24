// routes/chat.js - Simplified unified chat system
const express = require('express');
const { ChatSession } = require('../models');
const { auth } = require('../middleware/auth');
const aiService = require('../services/ai');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// Send message to unified AI assistant
router.post('/message', auth, [
  body('message').trim().isLength({ min: 1, max: 2000 }).withMessage('Message must be between 1 and 2000 characters'),
  body('sessionId').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { message, sessionId } = req.body;
    const userId = req.userId;

    // Generate session ID if not provided
    const currentSessionId = sessionId || `session_${userId}_${Date.now()}`;

    console.log(`💬 Unified chat request - User: ${userId}, Session: ${currentSessionId}`);

    // Get recent messages for context (last 6 messages for better context)
    let previousMessages = [];
    if (currentSessionId) {
      try {
        previousMessages = await ChatSession.findAll({
          where: { userId, sessionId: currentSessionId },
          order: [['createdAt', 'DESC']],
          limit: 6
        });
        previousMessages = previousMessages.reverse();
      } catch (error) {
        console.warn('Failed to fetch previous messages:', error.message);
      }
    }

    // Build context for AI
    const chatContext = {
      sessionId: currentSessionId,
      userId,
      previousMessages
    };

    // Generate AI response using unified system
    const aiResponse = await aiService.generateChatResponse(message, chatContext);

    // Save conversation to database
    try {
      const chatSession = await ChatSession.create({
        userId,
        sessionId: currentSessionId,
        userMessage: message,
        aiResponse,
        mode: 'unified', // Single mode for all conversations
        provider: 'groq',
        context: {}
      });

      res.json({
        response: aiResponse,
        provider: 'groq',
        sessionId: currentSessionId,
        messageId: chatSession.id,
        timestamp: new Date().toISOString()
      });
    } catch (dbError) {
      console.error('Failed to save chat session:', dbError);
      res.json({
        response: aiResponse,
        provider: 'groq',
        sessionId: currentSessionId,
        messageId: null,
        timestamp: new Date().toISOString(),
        warning: 'Response not saved to history'
      });
    }

  } catch (error) {
    console.error('Chat error:', error);
    
    let errorMessage = 'I apologize, but I encountered an error processing your message. Please try again.';
    let statusCode = 500;

    if (error.message.includes('API key') || error.message.includes('authentication')) {
      errorMessage = 'AI service is temporarily unavailable. Please try again later.';
      statusCode = 503;
    } else if (error.message.includes('rate limit')) {
      errorMessage = 'Too many requests. Please wait a moment before trying again.';
      statusCode = 429;
    }

    res.status(statusCode).json({ 
      message: errorMessage,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get chat history
router.get('/history', auth, async (req, res) => {
  try {
    const userId = req.userId;
    const { sessionId, limit = 50, page = 1 } = req.query;

    let where = { userId };
    if (sessionId) where.sessionId = sessionId;

    const offset = (page - 1) * limit;

    const history = await ChatSession.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
      attributes: ['id', 'sessionId', 'userMessage', 'aiResponse', 'createdAt']
    });

    if (!sessionId) {
      // Group by session for overview
      const groupedHistory = {};
      history.rows.forEach(chat => {
        if (!groupedHistory[chat.sessionId]) {
          groupedHistory[chat.sessionId] = [];
        }
        groupedHistory[chat.sessionId].push(chat);
      });

      res.json({
        history: groupedHistory,
        totalSessions: Object.keys(groupedHistory).length,
        totalMessages: history.count,
        page: parseInt(page),
        pages: Math.ceil(history.count / limit)
      });
    } else {
      // Return specific session in chronological order
      res.json({
        history: history.rows.reverse(),
        total: history.count,
        page: parseInt(page),
        pages: Math.ceil(history.count / limit)
      });
    }
  } catch (error) {
    console.error('Chat history error:', error);
    res.status(500).json({ message: 'Error fetching chat history' });
  }
});

// Get all chat sessions
router.get('/sessions', auth, async (req, res) => {
  try {
    const userId = req.userId;
    
    const sessions = await ChatSession.findAll({
      where: { userId },
      attributes: [
        'sessionId',
        [ChatSession.sequelize.fn('COUNT', ChatSession.sequelize.col('id')), 'messageCount'],
        [ChatSession.sequelize.fn('MAX', ChatSession.sequelize.col('createdAt')), 'lastActivity'],
        [ChatSession.sequelize.fn('MIN', ChatSession.sequelize.col('createdAt')), 'startTime']
      ],
      group: ['sessionId'],
      order: [[ChatSession.sequelize.fn('MAX', ChatSession.sequelize.col('createdAt')), 'DESC']]
    });

    res.json({ sessions });
  } catch (error) {
    console.error('Get sessions error:', error);
    res.status(500).json({ message: 'Error fetching sessions' });
  }
});

// Delete chat session
router.delete('/session/:sessionId', auth, async (req, res) => {
  try {
    const userId = req.userId;
    const { sessionId } = req.params;

    const deletedCount = await ChatSession.destroy({
      where: { userId, sessionId }
    });

    if (deletedCount === 0) {
      return res.status(404).json({ message: 'Session not found' });
    }

    res.json({ message: 'Session deleted successfully', deletedMessages: deletedCount });
  } catch (error) {
    console.error('Delete session error:', error);
    res.status(500).json({ message: 'Error deleting session' });
  }
});

// Clear all chat history for user
router.delete('/history', auth, async (req, res) => {
  try {
    const userId = req.userId;

    const deletedCount = await ChatSession.destroy({
      where: { userId }
    });

    res.json({ message: 'Chat history cleared successfully', deletedMessages: deletedCount });
  } catch (error) {
    console.error('Clear history error:', error);
    res.status(500).json({ message: 'Error clearing chat history' });
  }
});

// Rate a chat response (optional feature)
router.post('/rate/:messageId', auth, [
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5')
], async (req, res) => {
  try {
    const userId = req.userId;
    const { messageId } = req.params;
    const { rating } = req.body;

    const chatSession = await ChatSession.findOne({
      where: { id: messageId, userId }
    });

    if (!chatSession) {
      return res.status(404).json({ message: 'Message not found' });
    }

    await chatSession.update({ rating });
    res.json({ message: 'Rating saved successfully' });
  } catch (error) {
    console.error('Rate message error:', error);
    res.status(500).json({ message: 'Error saving rating' });
  }
});

// AI service health check
router.get('/health', auth, async (req, res) => {
  try {
    const health = await aiService.checkAIService();
    res.json(health);
  } catch (error) {
    res.json({ status: 'error', error: error.message });
  }
});

module.exports = router;