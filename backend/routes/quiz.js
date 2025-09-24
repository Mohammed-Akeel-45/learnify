// routes/quiz.js 
const express = require('express');
const { Quiz, QuizAttempt } = require('../models');
const { auth } = require('../middleware/auth');
const { validate, quizValidation } = require('../middleware/validation');
const aiService = require('../services/ai');
const { body } = require('express-validator');

const router = express.Router();

// Generate quiz with AI
router.post('/generate', auth, validate(quizValidation.generate), async (req, res) => {
  try {
    const { topic, difficulty = 'medium', questionCount = 5 } = req.body;
    const userId = req.userId;

    console.log(`Generating quiz for topic: ${topic}, difficulty: ${difficulty}, questions: ${questionCount}`);

    // Generate quiz using AI service
    const quizData = await aiService.generateQuiz(topic, difficulty, questionCount);

    // Save quiz to database
    const quiz = await Quiz.create({
      title: quizData.title,
      description: quizData.description,
      topic,
      difficulty,
      questions: quizData.questions,
      timeLimit: quizData.timeLimit,
      passingScore: quizData.passingScore,
      isPublished: true,
      createdBy: userId
    });

    // Return quiz without correct answers to frontend
    const responseData = {
      id: quiz.id,
      title: quiz.title,
      description: quiz.description,
      difficulty: quiz.difficulty,
      timeLimit: quiz.timeLimit,
      passingScore: quiz.passingScore,
      questions: quizData.questions.map(q => ({
        id: q.id,
        question: q.question,
        options: q.options
        // Note: 'correct' and 'explanation' are omitted for security
      }))
    };

    res.json(responseData);
  } catch (error) {
    console.error('Quiz generation error:', error);
    res.status(500).json({ 
      message: 'Error generating quiz',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Submit quiz answers
router.post('/submit', auth, [
  body('quizId').isInt().withMessage('Valid quiz ID required'),
  body('answers').isArray().withMessage('Answers array required')
], async (req, res) => {
  try {
    const { quizId, answers, timeSpent = 0 } = req.body;
    const userId = req.userId;

    // Find the quiz
    const quiz = await Quiz.findByPk(quizId);
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    const questions = quiz.questions;
    let correct = 0;
    const results = [];

    // Grade the quiz
    questions.forEach((question, index) => {
      const userAnswer = answers[index];
      const isCorrect = userAnswer === question.correct;
      if (isCorrect) correct++;

      results.push({
        questionId: question.id,
        question: question.question,
        userAnswer,
        correctAnswer: question.correct,
        options: question.options,
        isCorrect,
        explanation: question.explanation
      });
    });

    const score = Math.round((correct / questions.length) * 100);
    const passed = score >= quiz.passingScore;

    // Save attempt to database
    const attempt = await QuizAttempt.create({
      userId,
      quizId,
      answers,
      score,
      timeSpent,
      passed,
      results,
      completedAt: new Date()
    });

    res.json({ 
      score, 
      correct, 
      total: questions.length, 
      passed, 
      passingScore: quiz.passingScore, 
      results,
      attemptId: attempt.id
    });
  } catch (error) {
    console.error('Quiz submit error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get quiz history
router.get('/history', auth, async (req, res) => {
  try {
    const userId = req.userId;
    const { page = 1, limit = 10 } = req.query;
    
    const offset = (page - 1) * limit;
    
    const attempts = await QuizAttempt.findAndCountAll({
      where: { userId },
      include: [{ 
        model: Quiz, 
        attributes: ['title', 'topic', 'difficulty'] 
      }],
      order: [['completedAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      attempts: attempts.rows,
      total: attempts.count,
      page: parseInt(page),
      pages: Math.ceil(attempts.count / limit)
    });
  } catch (error) {
    console.error('Quiz history error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get specific quiz (for retaking)
router.get('/:id', auth, async (req, res) => {
  try {
    const quiz = await Quiz.findByPk(req.params.id);
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    // Return quiz without correct answers
    const responseData = {
      id: quiz.id,
      title: quiz.title,
      description: quiz.description,
      difficulty: quiz.difficulty,
      timeLimit: quiz.timeLimit,
      passingScore: quiz.passingScore,
      questions: quiz.questions.map(q => ({
        id: q.id,
        question: q.question,
        options: q.options
      }))
    };

    res.json(responseData);
  } catch (error) {
    console.error('Get quiz error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Health check for AI service
router.get('/ai/health', auth, async (req, res) => {
  try {
    const health = await aiService.checkAIService();
    res.json(health);
  } catch (error) {
    res.json({ status: 'error', error: error.message });
  }
});

module.exports = router;