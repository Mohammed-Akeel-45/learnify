const express = require('express');
const Quiz = require('../models/Quiz');
const { protect } = require('../middleware/auth');
const { generateQuiz } = require('../services/groqAI');

const router = express.Router();

// @route   POST /api/quizzes/generate
// @desc    Generate a quiz using Groq AI
router.post('/generate', protect, async (req, res) => {
  try {
    const { topic, numQuestions, difficulty } = req.body;

    if (!topic || !numQuestions || !difficulty) {
      return res.status(400).json({ success: false, message: 'Please provide topic, numQuestions, and difficulty' });
    }

    const aiResult = await generateQuiz(topic, numQuestions, difficulty);

    const quiz = await Quiz.create({
      userId: req.user._id,
      title: aiResult.title || `${topic} Quiz`,
      topic,
      difficulty,
      questions: aiResult.questions || [],
      totalQuestions: aiResult.questions ? aiResult.questions.length : 0,
      score: null,
      completed: false
    });

    // Don't send correct answers to frontend initially
    const quizResponse = quiz.toObject();
    quizResponse.questions = quizResponse.questions.map(q => ({
      _id: q._id,
      question: q.question,
      options: q.options
      // correctAnswer and explanation hidden until submission
    }));

    res.status(201).json({ success: true, data: quizResponse });
  } catch (error) {
    console.error('Quiz generation error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate quiz: ' + error.message });
  }
});

// @route   POST /api/quizzes/:id/submit
// @desc    Submit quiz answers and get score
router.post('/:id/submit', protect, async (req, res) => {
  try {
    const quiz = await Quiz.findOne({ _id: req.params.id, userId: req.user._id });
    if (!quiz) {
      return res.status(404).json({ success: false, message: 'Quiz not found' });
    }

    if (quiz.completed) {
      return res.status(400).json({ success: false, message: 'Quiz already submitted' });
    }

    const { answers } = req.body; // Array of { questionId, answer }
    let correct = 0;

    answers.forEach(a => {
      const question = quiz.questions.id(a.questionId);
      if (question) {
        question.userAnswer = a.answer;
        if (a.answer === question.correctAnswer) {
          correct++;
        }
      }
    });

    quiz.score = Math.round((correct / quiz.totalQuestions) * 100);
    quiz.completed = true;
    await quiz.save();

    res.json({
      success: true,
      data: {
        quiz,
        results: {
          totalQuestions: quiz.totalQuestions,
          correctAnswers: correct,
          wrongAnswers: quiz.totalQuestions - correct,
          score: quiz.score
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/quizzes
// @desc    Get all quizzes for current user
router.get('/', protect, async (req, res) => {
  try {
    const quizzes = await Quiz.find({ userId: req.user._id }).sort({ createdAt: -1 });

    // Hide correct answers for incomplete quizzes
    const sanitized = quizzes.map(q => {
      const obj = q.toObject();
      if (!q.completed) {
        obj.questions = obj.questions.map(question => ({
          _id: question._id,
          question: question.question,
          options: question.options
        }));
      }
      return obj;
    });

    res.json({ success: true, data: sanitized });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/quizzes/:id
// @desc    Get a single quiz
router.get('/:id', protect, async (req, res) => {
  try {
    const quiz = await Quiz.findOne({ _id: req.params.id, userId: req.user._id });
    if (!quiz) {
      return res.status(404).json({ success: false, message: 'Quiz not found' });
    }

    const obj = quiz.toObject();
    if (!quiz.completed) {
      obj.questions = obj.questions.map(q => ({
        _id: q._id,
        question: q.question,
        options: q.options
      }));
    }

    res.json({ success: true, data: obj });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
