
// src/App.jsx - FINAL VERSION WITH ALL ROUTES
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './hooks/useAuth'
import { ToastProvider } from './components/Toast'
import Layout from './components/Layout'
import Loading from './components/Loading'
// Existing pages
import Home from './pages/Home'
import Auth from './pages/Auth'
import Dashboard from './pages/Dashboard'
import Quiz from './pages/Quiz'
import Chat from './pages/Chat'
// New pages
import Roadmap from './pages/Roadmap'
import RoadmapDetail from './pages/RoadmapDetail'
import MyCourses from './pages/MyCourses'
import CourseDetail from './pages/CourseDetail'
const ProtectedRoute = ({ children }) => {
const { user, loading } = useAuth()
if (loading) return <Loading />
return user ? children : <Navigate to="/auth" />
}
function App() {
return (
<BrowserRouter>
<AuthProvider>
<ToastProvider>
<Routes>
<Route path="/" element={<Home />} />
<Route path="/auth" element={<Auth />} />
<Route path="/app" element={<Layout />}>
<Route index element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
<Route path="roadmap" element={<ProtectedRoute><Roadmap /></ProtectedRoute>} />
<Route path="roadmap/:id" element={<ProtectedRoute><RoadmapDetail /></ProtectedRoute>} />
<Route path="courses" element={<ProtectedRoute><MyCourses /></ProtectedRoute>} />
<Route path="course/:id" element={<ProtectedRoute><CourseDetail /></ProtectedRoute>} />
<Route path="quiz" element={<ProtectedRoute><Quiz /></ProtectedRoute>} />
<Route path="chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
</Route>
<Route path="*" element={<Navigate to="/" />} />
</Routes>
</ToastProvider>
</AuthProvider>
</BrowserRouter>
)
}
export default App;