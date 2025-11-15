
// routes/dashboard.js - UPDATED FOR YOUR DATABASE
const express = require('express');
const { User, Course, Quiz, QuizAttempt, ChatSession, Roadmap, UserProgress, sequelize } = require('../models');
const { auth } = require('../middleware/auth');
const router = express.Router();
router.get('/stats', auth, async (req, res) => {
try {
const userId = req.userId;
const [
  quizCount,
  avgScoreResult,
  chatCount,
  recentQuizzes,
  roadmapCount,
  courseProgress
] = await Promise.allSettled([
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
  Roadmap.count({ where: { userId } }),
  UserProgress.findAll({
    where: { 
      userId,
      resourceType: 'course'
    },
    order: [['lastAccessed', 'DESC']],
    limit: 10
  })
]);

// Get course details for progress
let inProgressCourses = [];
if (courseProgress.status === 'fulfilled') {
  for (const progress of courseProgress.value) {
    const course = await Course.findByPk(progress.resourceId, {
      attributes: ['id', 'title', 'difficulty', 'duration', 'category']
    });
    
    if (course && !progress.completed && progress.progress > 0) {
      inProgressCourses.push({
        ...progress.toJSON(),
        course: course.toJSON()
      });
    }
  }
}

const stats = {
  courses: courseProgress.status === 'fulfilled' ? courseProgress.value.length : 0,
  quizzes: quizCount.status === 'fulfilled' ? quizCount.value : 0,
  roadmaps: roadmapCount.status === 'fulfilled' ? roadmapCount.value : 0,
  averageScore: avgScoreResult.status === 'fulfilled' && avgScoreResult.value?.avgScore 
    ? Math.round(avgScoreResult.value.avgScore) : 0,
  chatSessions: chatCount.status === 'fulfilled' ? chatCount.value : 0,
  activeCourses: inProgressCourses.length,
  completedCourses: courseProgress.status === 'fulfilled' 
    ? courseProgress.value.filter(p => p.completed).length 
    : 0
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
  
  inProgressCourses: inProgressCourses.map(item => ({
    courseId: item.resourceId,
    title: item.course?.title || 'Course',
    progress: item.progress,
    difficulty: item.course?.difficulty,
    category: item.course?.category,
    lastAccessed: item.lastAccessed,
    currentLesson: item.data?.currentLesson || 0
  }))
};

res.json({ stats, recentActivity });
} catch (error) {
console.error('Dashboard stats error:', error);
res.json({
stats: {
courses: 0,
quizzes: 0,
roadmaps: 0,
averageScore: 0,
chatSessions: 0,
activeCourses: 0,
completedCourses: 0
},
recentActivity: { quizzes: [], inProgressCourses: [] }
});
}
});
module.exports = router;
