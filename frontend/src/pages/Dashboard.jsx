// src/pages/Dashboard.jsx - Fresh Simple Dashboard
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

const Dashboard = () => {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Mock data loading
    setTimeout(() => {
      setStats({
        courses: 8,
        quizzes: 15,
        averageScore: 85,
        chatSessions: 12
      })
      setLoading(false)
    }, 1000)
  }, [])

  if (loading) {
    return (
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
          <div className="spinner"></div>
          <span style={{ marginLeft: '0.5rem' }}>Loading...</span>
        </div>
      </div>
    )
  }

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
          <span className="stat-label">Courses</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">{stats.quizzes}</span>
          <span className="stat-label">Quizzes</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">{stats.averageScore}%</span>
          <span className="stat-label">Average Score</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">{stats.chatSessions}</span>
          <span className="stat-label">AI Chats</span>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h2>Quick Actions</h2>
        <div className="action-grid">
          <Link to="/app/quiz" className="action-card">
            <span className="action-icon">🧠</span>
            <div className="action-title">Create Quiz</div>
            <div className="action-desc">Generate AI-powered quizzes on any topic</div>
          </Link>
          
          <Link to="/app/chat" className="action-card">
            <span className="action-icon">💬</span>
            <div className="action-title">AI Assistant</div>
            <div className="action-desc">Chat with your personal learning assistant</div>
          </Link>
        </div>
      </div>

      {/* Getting Started */}
      <div className="card" style={{ textAlign: 'center' }}>
        <h2>Ready to Learn?</h2>
        <p>Choose an option below to get started with your learning journey.</p>
        <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/app/quiz" className="btn btn-primary">
            Start Quiz
          </Link>
          <Link to="/app/chat" className="btn btn-secondary">
            Ask AI
          </Link>
        </div>
      </div>
    </div>
  )
}

export default Dashboard;