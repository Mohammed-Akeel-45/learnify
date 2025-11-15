// src/pages/MyCourses.jsx
import { useState, useEffect } from 'react'
import { courseService } from '../services/course'
import { useToast } from '../components/Toast'
import Loading from '../components/Loading'
import CourseCard from '../components/CourseCard'
const MyCourses = () => {
const [courses, setCourses] = useState([])
const [loading, setLoading] = useState(true)
const [filter, setFilter] = useState('all') // all, in_progress, completed
const { showToast } = useToast()
useEffect(() => {
loadCourses()
}, [])
const loadCourses = async () => {
try {
const data = await courseService.getEnrolledCourses()
setCourses(data)
} catch (error) {
showToast('Failed to load courses', 'error')
} finally {
setLoading(false)
}
}
const filteredCourses = courses.filter(item => {
if (filter === 'all') return true
if (filter === 'in_progress') return item.progress?.progress > 0 && !item.progress?.completed
if (filter === 'completed') return item.progress?.completed
return true
})
if (loading) return <Loading text="Loading your courses" />
return (
<div className="fade-in">
{/* Header */}
<div className="card">
<h1 style={{ margin: 0 }}>My Courses</h1>
<p style={{ margin: '0.5rem 0 0 0', color: '#999' }}>
Continue where you left off
</p>
</div>
  {/* Filter Tabs */}
  <div className="card">
    <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid #2a2a2a', paddingBottom: '1rem' }}>
      <button
        onClick={() => setFilter('all')}
        style={{
          padding: '0.5rem 1rem',
          background: filter === 'all' ? '#4f46e5' : 'transparent',
          border: 'none',
          borderRadius: '0.5rem',
          color: filter === 'all' ? 'white' : '#ccc',
          cursor: 'pointer',
          fontWeight: '600'
        }}
      >
        All ({courses.length})
      </button>
      <button
        onClick={() => setFilter('in_progress')}
        style={{
          padding: '0.5rem 1rem',
          background: filter === 'in_progress' ? '#4f46e5' : 'transparent',
          border: 'none',
          borderRadius: '0.5rem',
          color: filter === 'in_progress' ? 'white' : '#ccc',
          cursor: 'pointer',
          fontWeight: '600'
        }}
      >
        In Progress ({courses.filter(c => c.progress?.progress > 0 && !c.progress?.completed).length})
      </button>
      <button
        onClick={() => setFilter('completed')}
        style={{
          padding: '0.5rem 1rem',
          background: filter === 'completed' ? '#4f46e5' : 'transparent',
          border: 'none',
          borderRadius: '0.5rem',
          color: filter === 'completed' ? 'white' : '#ccc',
          cursor: 'pointer',
          fontWeight: '600'
        }}
      >
        Completed ({courses.filter(c => c.progress?.completed).length})
      </button>
    </div>
  </div>

  {/* Courses Grid */}
  {filteredCourses.length === 0 ? (
    <div className="card" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
      <h2>No Courses Found</h2>
      <p style={{ color: '#999' }}>
        {filter === 'all' 
          ? 'Start learning by creating a roadmap first' 
          : `No ${filter.replace('_', ' ')} courses yet`}
      </p>
    </div>
  ) : (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
      {filteredCourses.map((item) => (
        <CourseCard 
          key={item.id} 
          course={item}
          progress={item.progress}
        />
      ))}
    </div>
  )}
</div>
)
}
export default MyCourses;