// src/components/Layout.jsx - Fresh Simple Layout
import { Outlet, NavLink } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

const Layout = () => {
  const { user, logout } = useAuth()

  const handleLogout = () => {
    logout()
  }

  return (
    <div>
      {/* Header */}
      <header className="header">
        <div className="logo">Learnify</div>
        <div className="user-info">
          <span>Welcome, {user?.name || 'User'}</span>
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </div>
      </header>

      {/* Main Layout */}
      <div className="app-layout">
        {/* Sidebar */}
        <nav className="sidebar">
          <ul className="nav-menu">
            <li className="nav-item">
              <NavLink to="/app" end className="nav-link">
                <span className="nav-icon">📊</span>
                Dashboard
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink to="/app/quiz" className="nav-link">
                <span className="nav-icon">🧠</span>
                Quiz
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink to="/app/chat" className="nav-link">
                <span className="nav-icon">💬</span>
                AI Chat
              </NavLink>
            </li>
          </ul>
        </nav>

        {/* Main Content */}
        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default Layout;