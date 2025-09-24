// routes/dashboard.js

const express = require('express');
const { User, Course, Quiz, QuizAttempt, ChatSession, Roadmap, sequelize } = require('../models');
const { auth } = require('../middleware/auth');

const router = express.Router();

router.get('/stats', auth, async (req, res) => {
  try {
    const userId = req.userId;

    const [
      courseCount,
      quizCount,
      avgScoreResult,
      chatCount,
      recentQuizzes,
      recentCourses,
      roadmapCount
    ] = await Promise.allSettled([
      Course.count({ where: { createdBy: userId } }),
      QuizAttempt.count({ where: { userId } }),
      QuizAttempt.findOne({
        where: { userId },
        attributes: [[sequelize.fn('AVG', sequelize.col('score')), 'avgScore']],
        raw: true
      }),
      ChatSession.count({ where: { userId } }),
      QuizAttempt.findAll({
        where: { userId },
        include: [{ model: Quiz, attributes: ['title', 'topic'], required: false }],
        order: [['completedAt', 'DESC']],
        limit: 5
      }),
      Course.findAll({
        where: { createdBy: userId },
        order: [['createdAt', 'DESC']],
        limit: 5,
        attributes: ['id', 'title', 'difficulty', 'createdAt']
      }),
      Roadmap.count({ where: { userId } })
    ]);

    const stats = {
      courses: courseCount.status === 'fulfilled' ? courseCount.value : 0,
      quizzes: quizCount.status === 'fulfilled' ? quizCount.value : 0,
      roadmaps: roadmapCount.status === 'fulfilled' ? roadmapCount.value : 0,
      averageScore: avgScoreResult.status === 'fulfilled' && avgScoreResult.value?.avgScore 
        ? Math.round(avgScoreResult.value.avgScore) : 0,
      chatSessions: chatCount.status === 'fulfilled' ? chatCount.value : 0,
      studyTime: Math.floor((chatCount.status === 'fulfilled' ? chatCount.value : 0) * 0.5) + 'h'
    };

    const recentActivity = {
      quizzes: recentQuizzes.status === 'fulfilled' 
        ? recentQuizzes.value.map(attempt => ({
            id: attempt.id,
            title: attempt.Quiz?.title || 'Quiz',
            score: attempt.score,
            completedAt: attempt.completedAt,
            topic: attempt.Quiz?.topic || 'General'
          })) : [],
      courses: recentCourses.status === 'fulfilled'
        ? recentCourses.value.map(course => ({
            id: course.id,
            title: course.title,
            difficulty: course.difficulty,
            createdAt: course.createdAt
          })) : []
    };

    res.json({ stats, recentActivity });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.json({
      stats: { courses: 0, quizzes: 0, roadmaps: 0, averageScore: 0, chatSessions: 0, studyTime: '0h' },
      recentActivity: { quizzes: [], courses: [] }
    });
  }
});

module.exports = router;