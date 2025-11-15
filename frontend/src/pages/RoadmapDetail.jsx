
// src/pages/RoadmapDetail.jsx
import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { roadmapService } from '../services/roadmap'
import { useToast } from '../components/Toast'
import Loading from '../components/Loading'
import ProgressBar from '../components/ProgressBar'
const RoadmapDetail = () => {
const { id } = useParams()
const [roadmap, setRoadmap] = useState(null)
const [loading, setLoading] = useState(true)
const [generating, setGenerating] = useState({})
const { showToast } = useToast()
useEffect(() => {
loadRoadmap()
}, [id])
const loadRoadmap = async () => {
try {
const data = await roadmapService.getRoadmap(id)
setRoadmap(data)
} catch (error) {
showToast('Failed to load roadmap', 'error')
} finally {
setLoading(false)
}
}
const handleGenerateCourse = async (moduleIndex) => {
setGenerating({ ...generating, [moduleIndex]: true })
try {
const data = await roadmapService.generateCourse(id, moduleIndex)
showToast('Course generated successfully!', 'success')
loadRoadmap() // Reload to get updated data
} catch (error) {
showToast(error.response?.data?.message || 'Failed to generate course', 'error')
} finally {
setGenerating({ ...generating, [moduleIndex]: false })
}
}
const getCourseForModule = (moduleIndex) => {
return roadmap?.Courses?.find(c => c.moduleIndex === moduleIndex)
}
if (loading) return <Loading text="Loading roadmap details" />
if (!roadmap) return <div className="card">Roadmap not found</div>
return (
<div className="fade-in">
{/* Header */}
<div className="card">
<Link to="/app/roadmap" style={{ color: '#4f46e5', textDecoration: 'none', marginBottom: '1rem', display: 'inline-block' }}>
← Back to Roadmaps
</Link>
<h1 style={{ margin: '0 0 0.5rem 0' }}>{roadmap.title}</h1>
<p style={{ color: '#999', marginBottom: '1rem' }}>{roadmap.description}</p>
    <div style={{ display: 'flex', gap: '2rem', fontSize: '0.875rem' }}>
      <span>📚 {roadmap.data?.modules?.length || 0} modules</span>
      <span>⏱️ {roadmap.estimatedDuration}</span>
      <span>🎯 {roadmap.level}</span>
    </div>

    {roadmap.overallProgress > 0 && (
      <div style={{ marginTop: '1rem' }}>
        <ProgressBar progress={roadmap.overallProgress} />
      </div>
    )}
  </div>

  {/* Prerequisites */}
  {roadmap.data?.prerequisites && roadmap.data.prerequisites.length > 0 && (
    <div className="card">
      <h3>📋 Prerequisites</h3>
      <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#ccc' }}>
        {roadmap.data.prerequisites.map((prereq, i) => (
          <li key={i}>{prereq}</li>
        ))}
      </ul>
    </div>
  )}

  {/* Skills to be Gained */}
  {roadmap.data?.skills && roadmap.data.skills.length > 0 && (
    <div className="card">
      <h3>🎯 Skills You'll Gain</h3>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
        {roadmap.data.skills.map((skill, i) => (
          <span key={i} style={{
            padding: '0.5rem 1rem',
            background: '#2a2a2a',
            borderRadius: '999px',
            fontSize: '0.875rem'
          }}>
            {skill}
          </span>
        ))}
      </div>
    </div>
  )}

  {/* Modules */}
  <div>
    <h2>Learning Modules</h2>
    <div style={{ display: 'grid', gap: '1rem' }}>
      {roadmap.data?.modules?.map((module, index) => {
        const course = getCourseForModule(index)
        const hasProgress = course?.UserProgresses?.[0]
        const progress = hasProgress?.progress || 0

        return (
          <div key={index} className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                  <span style={{
                    padding: '0.25rem 0.75rem',
                    background: course ? '#10b981' : '#2a2a2a',
                    borderRadius: '999px',
                    fontSize: '0.75rem',
                    fontWeight: '600'
                  }}>
                    Module {index + 1}
                  </span>
                  {course && (
                    <span style={{ fontSize: '0.875rem', color: '#10b981' }}>
                      ✓ Course Generated
                    </span>
                  )}
                </div>

                <h3 style={{ margin: '0 0 0.5rem 0' }}>{module.title}</h3>
                <p style={{ color: '#999', margin: '0 0 1rem 0' }}>{module.description}</p>

                <div style={{ fontSize: '0.875rem', color: '#999', marginBottom: '1rem' }}>
                  <div>⏱️ Duration: {module.duration}</div>
                  <div style={{ marginTop: '0.5rem' }}>
                    📚 Lessons: {module.lessons?.join(', ') || 'Various topics'}
                  </div>
                </div>

                {course && progress > 0 && (
                  <ProgressBar progress={progress} />
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {!course ? (
                  <button
                    onClick={() => handleGenerateCourse(index)}
                    disabled={generating[index]}
                    className="btn btn-primary"
                  >
                    {generating[index] ? 'Generating...' : 'Generate Course'}
                  </button>
                ) : (
                  <Link
                    to={`/app/course/${course.id}`}
                    className="btn btn-secondary"
                  >
                    {progress > 0 ? 'Continue' : 'Start'} Course →
                  </Link>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  </div>
</div>
)
}
export default RoadmapDetail;