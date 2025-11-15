
// src/components/CourseCard.jsx
import { Link } from 'react-router-dom'
import ProgressBar from './ProgressBar'
const CourseCard = ({ course, progress, showProgress = true }) => {
const progressPercent = progress?.progress || 0
const currentLesson = progress?.data?.currentLesson || 0
return (
<div className="card" style={{
padding: '1.5rem',
transition: 'transform 0.2s, box-shadow 0.2s',
cursor: 'pointer'
}}
onMouseEnter={(e) => {
e.currentTarget.style.transform = 'translateY(-2px)'
e.currentTarget.style.boxShadow = '0 8px 16px rgba(79, 70, 229, 0.2)'
}}
onMouseLeave={(e) => {
e.currentTarget.style.transform = 'translateY(0)'
e.currentTarget.style.boxShadow = 'none'
}}>
{/* Header */}
<div style={{ marginBottom: '1rem' }}>
<div style={{
display: 'flex',
justifyContent: 'space-between',
alignItems: 'flex-start',
marginBottom: '0.5rem'
}}>
<h3 style={{ margin: 0, fontSize: '1.25rem' }}>{course.title}</h3>
<span style={{
padding: '0.25rem 0.75rem',
background: '#4f46e5',
borderRadius: '999px',
fontSize: '0.75rem',
fontWeight: '600'
}}>
{course.difficulty || 'Beginner'}
</span>
</div>
<p style={{
margin: '0.5rem 0 0 0',
color: '#999',
fontSize: '0.875rem',
lineHeight: '1.5'
}}>
{course.description}
</p>
</div>
  {/* Progress */}
  {showProgress && progress && (
    <div style={{ marginBottom: '1rem' }}>
      <ProgressBar progress={progressPercent} />
    </div>
  )}

  {/* Footer */}
  <div style={{ 
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    paddingTop: '1rem',
    borderTop: '1px solid #2a2a2a'
  }}>
    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem', color: '#999' }}>
      <span>📚 {course.lessons || 0} lessons</span>
      <span>⏱️ {course.duration || '2-3 hours'}</span>
    </div>
    
    <Link 
      to={`/app/course/${course.id}`}
      className="btn btn-sm btn-primary"
      style={{ textDecoration: 'none' }}
    >
      {progressPercent > 0 ? 'Continue' : 'Start'}
    </Link>
  </div>
</div>
)
}
export default CourseCard;