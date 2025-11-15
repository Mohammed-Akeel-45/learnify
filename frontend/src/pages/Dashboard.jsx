// src/pages/Dashboard.jsx - UPDATED WITH COURSE PROGRESS
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import CourseCard from '../components/CourseCard'
import Loading from '../components/Loading'
const Dashboard = () => {
const [stats, setStats] = useState(null)
const [loading, setLoading] = useState(true)
const [inProgressCourses, setInProgressCourses] = useState([])
useEffect(() => {
loadDashboard()
}, [])
const loadDashboard = async () => {
try {
const { data } = await api.get('/dashboard/stats')
setStats(data.stats)
setInProgressCourses(data.recentActivity?.inProgressCourses || [])
} catch (error) {
console.error('Failed to load dashboard:', error)
// Set default stats
setStats({
courses: 0,
quizzes: 0,
averageScore: 0,
chatSessions: 0,
activeCourses: 0,
completedCourses: 0
})
} finally {
setLoading(false)
}
}
if (loading) return <Loading text="Loading dashboard" />
return (
<div className="fade-in">
{/* Welcome Card */}
<div className="card">
<h1>Dashboard</h1>
<p>Welcome back! Here's your learning progress overview.</p>
</div>
  {/* Stats Grid */}
  <div className="stats-grid">
    <div className="stat-card">
      <span className="stat-number">{stats.courses}</span>
      <span className="stat-label">Total Courses</span>
    </div>
    <div className="stat-card">
      <span className="stat-number">{stats.activeCourses}</span>
      <span className="stat-label">In Progress</span>
    </div>
    <div className="stat-card">
      <span className="stat-number">{stats.quizzes}</span>
      <span className="stat-label">Quizzes Taken</span>
    </div>
    <div className="stat-card">
      <span className="stat-number">{stats.averageScore}%</span>
      <span className="stat-label">Average Score</span>
    </div>
  </div>

  {/* In Progress Courses */}
  {inProgressCourses.length > 0 && (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2 style={{ margin: 0 }}>Continue Learning</h2>
        <Link to="/app/courses" className="btn btn-secondary btn-sm">
          View All Courses
        </Link>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
        {inProgressCourses.slice(0, 3).map((item) => (
          <CourseCard 
            key={item.courseId}
            course={{
              id: item.courseId,
              title: item.title,
              difficulty: item.difficulty,
              duration: '2-3 hours',
              category: item.category
            }}
            progress={{
              progress: item.progress,
              data: { currentLesson: item.currentLesson }
            }}
          />
        ))}
      </div>
    </div>
  )}

  {/* Quick Actions */}
  <div className="card">
    <h2>Quick Actions</h2>
    <div className="action-grid">
      <Link to="/app/roadmap" className="action-card">
        <span className="action-icon">🗺️</span>
        <div className="action-title">Create Roadmap</div>
        <div className="action-desc">Generate personalized learning paths</div>
      </Link>

      <Link to="/app/quiz" className="action-card">
        <span className="action-icon">🧠</span>
        <div className="action-title">Create Quiz</div>
        <div className="action-desc">Generate AI-powered quizzes</div>
      </Link>
      
      <Link to="/app/chat" className="action-card">
        <span className="action-icon">💬</span>
        <div className="action-title">AI Assistant</div>
        <div className="action-desc">Chat with your learning assistant</div>
      </Link>

      <Link to="/app/courses" className="action-card">
        <span className="action-icon">📚</span>
        <div className="action-title">My Courses</div>
        <div className="action-desc">View all your enrolled courses</div>
      </Link>
    </div>
  </div>
</div>
)
}
export default Dashboard;