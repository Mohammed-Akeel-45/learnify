
// src/pages/CourseDetail.jsx
import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { courseService } from '../services/course'
import { progressService } from '../services/progress'
import { useToast } from '../components/Toast'
import Loading from '../components/Loading'
import ProgressBar from '../components/ProgressBar'
const CourseDetail = () => {
const { id } = useParams()
const [course, setCourse] = useState(null)
const [progress, setProgress] = useState(null)
const [currentLesson, setCurrentLesson] = useState(0)
const [loading, setLoading] = useState(true)
const { showToast } = useToast()
useEffect(() => {
loadCourse()
}, [id])
const loadCourse = async () => {
try {
const [courseData, progressData] = await Promise.all([
courseService.getCourse(id),
progressService.getCourseProgress(id)
])
  setCourse(courseData.course || courseData)
  setProgress(progressData)
  setCurrentLesson(progressData?.data?.currentLesson || 0)
} catch (error) {
  showToast('Failed to load course', 'error')
} finally {
  setLoading(false)
}
}
const handleLessonComplete = async (lessonIndex) => {
try {
const isCompleted = progress?.data?.completedLessons?.includes(lessonIndex)
  const data = await progressService.updateProgress(id, lessonIndex, !isCompleted)
  
  // Reload progress
  const updatedProgress = await progressService.getCourseProgress(id)
  setProgress(updatedProgress)
  
  showToast(
    isCompleted ? 'Lesson marked as incomplete' : 'Lesson completed! 🎉',
    isCompleted ? 'info' : 'success'
  )
} catch (error) {
  showToast('Failed to update progress', 'error')
}
}
const isLessonCompleted = (lessonIndex) => {
return progress?.data?.completedLessons?.includes(lessonIndex) || false
}
if (loading) return <Loading text="Loading course" />
if (!course) return <div className="card">Course not found</div>
const lessons = course.content?.lessons || []
const progressPercent = progress?.progress || 0
return (
<div className="fade-in">
{/* Header */}
<div className="card">
<Link to="/app/courses" style={{ color: '#4f46e5', textDecoration: 'none', marginBottom: '1rem', display: 'inline-block' }}>
← Back to My Courses
</Link>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
      <div style={{ flex: 1 }}>
        <h1 style={{ margin: '0 0 0.5rem 0' }}>{course.title}</h1>
        <p style={{ color: '#999', margin: 0 }}>{course.description}</p>
      </div>
      <span style={{
        padding: '0.5rem 1rem',
        background: '#4f46e5',
        borderRadius: '999px',
        fontSize: '0.875rem',
        fontWeight: '600'
      }}>
        {course.difficulty}
      </span>
    </div>

    <div style={{ display: 'flex', gap: '2rem', fontSize: '0.875rem', marginBottom: '1rem' }}>
      <span>📚 {lessons.length} lessons</span>
      <span>⏱️ {course.duration}</span>
      <span>🎯 {progress?.data?.completedLessons?.length || 0}/{lessons.length} completed</span>
    </div>

    <ProgressBar progress={progressPercent} />
  </div>

  {/* Course Content */}
  <div style={{ display: 'grid', gridTemplateColumns: '250px 1fr', gap: '1.5rem' }}>
    {/* Lessons Sidebar */}
    <div className="card" style={{ height: 'fit-content', position: 'sticky', top: '1rem' }}>
      <h3 style={{ margin: '0 0 1rem 0' }}>Lessons</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {lessons.map((lesson, index) => (
          <button
            key={index}
            onClick={() => setCurrentLesson(index)}
            style={{
              padding: '0.75rem',
              background: currentLesson === index ? '#4f46e5' : '#2a2a2a',
              border: 'none',
              borderRadius: '0.5rem',
              color: 'white',
              cursor: 'pointer',
              textAlign: 'left',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.875rem'
            }}
          >
            {isLessonCompleted(index) ? '✓' : index + 1}.
            <span style={{ flex: 1 }}>{lesson.title}</span>
          </button>
        ))}
      </div>
    </div>

    {/* Lesson Content */}
    <div className="card">
      {lessons[currentLesson] ? (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ margin: 0 }}>{lessons[currentLesson].title}</h2>
            <button
              onClick={() => handleLessonComplete(currentLesson)}
              className={isLessonCompleted(currentLesson) ? 'btn btn-secondary' : 'btn btn-primary'}
            >
              {isLessonCompleted(currentLesson) ? '✓ Completed' : 'Mark as Complete'}
            </button>
          </div>

          <div style={{ marginBottom: '2rem', lineHeight: '1.8', color: '#ccc' }}>
            {lessons[currentLesson].content}
          </div>

          {lessons[currentLesson].examples && lessons[currentLesson].examples.length > 0 && (
            <div style={{ marginBottom: '2rem' }}>
              <h3>📝 Examples</h3>
              <ul style={{ paddingLeft: '1.5rem', color: '#ccc' }}>
                {lessons[currentLesson].examples.map((example, i) => (
                  <li key={i} style={{ marginBottom: '0.5rem' }}>{example}</li>
                ))}
              </ul>
            </div>
          )}

          {lessons[currentLesson].exercises && lessons[currentLesson].exercises.length > 0 && (
            <div style={{ marginBottom: '2rem' }}>
              <h3>💪 Practice Exercises</h3>
              <ul style={{ paddingLeft: '1.5rem', color: '#ccc' }}>
                {lessons[currentLesson].exercises.map((exercise, i) => (
                  <li key={i} style={{ marginBottom: '0.5rem' }}>{exercise}</li>
                ))}
              </ul>
            </div>
          )}

          {lessons[currentLesson].keyTakeaways && lessons[currentLesson].keyTakeaways.length > 0 && (
            <div style={{ 
              padding: '1.5rem', 
              background: '#2a2a2a', 
              borderRadius: '0.5rem',
              border: '1px solid #4f46e5'
            }}>
              <h3 style={{ margin: '0 0 1rem 0' }}>🎯 Key Takeaways</h3>
              <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#ccc' }}>
                {lessons[currentLesson].keyTakeaways.map((takeaway, i) => (
                  <li key={i} style={{ marginBottom: '0.5rem' }}>{takeaway}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Navigation */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            marginTop: '2rem',
            paddingTop: '1.5rem',
            borderTop: '1px solid #2a2a2a'
          }}>
            <button
              onClick={() => setCurrentLesson(Math.max(0, currentLesson - 1))}
              disabled={currentLesson === 0}
              className="btn btn-secondary"
            >
              ← Previous
            </button>
            <button
              onClick={() => setCurrentLesson(Math.min(lessons.length - 1, currentLesson + 1))}
              disabled={currentLesson === lessons.length - 1}
              className="btn btn-primary"
            >
              Next →
            </button>
          </div>
        </>
      ) : (
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <p>No lesson content available</p>
        </div>
      )}
    </div>
  </div>
</div>
)
}
export default CourseDetail;
