// src/pages/Roadmap.jsx
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { roadmapService } from '../services/roadmap'
import { useToast } from '../components/Toast'
import Loading from '../components/Loading'
const Roadmap = () => {
const [roadmaps, setRoadmaps] = useState([])
const [loading, setLoading] = useState(true)
const [generating, setGenerating] = useState(false)
const [showForm, setShowForm] = useState(false)
const { showToast } = useToast()
const [formData, setFormData] = useState({
topic: '',
level: 'beginner',
duration: 'medium'
})
useEffect(() => {
loadRoadmaps()
}, [])
const loadRoadmaps = async () => {
try {
const data = await roadmapService.getAllRoadmaps()
setRoadmaps(data)
} catch (error) {
showToast('Failed to load roadmaps', 'error')
} finally {
setLoading(false)
}
}
const handleGenerate = async (e) => {
e.preventDefault()
if (!formData.topic.trim()) {
showToast('Please enter a topic', 'warning')
return
}
setGenerating(true)
try {
  const data = await roadmapService.generateRoadmap(
    formData.topic,
    formData.level,
    formData.duration
  )
  showToast('Roadmap generated successfully!', 'success')
  setShowForm(false)
  setFormData({ topic: '', level: 'beginner', duration: 'medium' })
  loadRoadmaps()
} catch (error) {
  showToast(error.response?.data?.message || 'Failed to generate roadmap', 'error')
} finally {
  setGenerating(false)
}
}
if (loading) return <Loading text="Loading roadmaps" />
return (
<div className="fade-in">
{/* Header */}
<div className="card">
<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
<div>
<h1 style={{ margin: 0 }}>Learning Roadmaps</h1>
<p style={{ margin: '0.5rem 0 0 0', color: '#999' }}>
Generate AI-powered learning paths for any topic
</p>
</div>
<button
className="btn btn-primary"
onClick={() => setShowForm(!showForm)}
>
{showForm ? 'Cancel' : '+ Create Roadmap'}
</button>
</div>
</div>
  {/* Generation Form */}
  {showForm && (
    <div className="card">
      <h2>Generate New Roadmap</h2>
      <form onSubmit={handleGenerate}>
        <div style={{ marginBottom: '1rem' }}>
          <label className="form-label">Topic *</label>
          <input
            type="text"
            className="form-input"
            placeholder="e.g., React, Python, Machine Learning"
            value={formData.topic}
            onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
            disabled={generating}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <label className="form-label">Level</label>
            <select
              className="form-input"
              value={formData.level}
              onChange={(e) => setFormData({ ...formData, level: e.target.value })}
              disabled={generating}
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>

          <div>
            <label className="form-label">Duration</label>
            <select
              className="form-input"
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
              disabled={generating}
            >
              <option value="short">Short (4-6 weeks)</option>
              <option value="medium">Medium (8-12 weeks)</option>
              <option value="long">Long (16-20 weeks)</option>
            </select>
          </div>
        </div>

        <button 
          type="submit" 
          className="btn btn-primary"
          disabled={generating}
          style={{ width: '100%' }}
        >
          {generating ? 'Generating Roadmap...' : 'Generate Roadmap'}
        </button>
      </form>
    </div>
  )}

  {/* Roadmaps List */}
  {roadmaps.length === 0 ? (
    <div className="card" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
      <h2>No Roadmaps Yet</h2>
      <p style={{ color: '#999', marginBottom: '1.5rem' }}>
        Create your first learning roadmap to get started
      </p>
      <button 
        className="btn btn-primary"
        onClick={() => setShowForm(true)}
      >
        Create First Roadmap
      </button>
    </div>
  ) : (
    <div style={{ display: 'grid', gap: '1rem' }}>
      {roadmaps.map((roadmap) => (
        <div key={roadmap.id} className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <h3 style={{ margin: 0 }}>{roadmap.title}</h3>
              <p style={{ margin: '0.5rem 0', color: '#999' }}>{roadmap.description}</p>
              
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', fontSize: '0.875rem' }}>
                <span>📚 {roadmap.totalCourses || 0} modules</span>
                <span>⏱️ {roadmap.estimatedDuration}</span>
                <span>🎯 {roadmap.level}</span>
                {roadmap.overallProgress > 0 && (
                  <span style={{ color: '#4f46e5', fontWeight: '600' }}>
                    {roadmap.overallProgress}% complete
                  </span>
                )}
              </div>
            </div>

            <Link 
              to={`/app/roadmap/${roadmap.id}`}
              className="btn btn-secondary"
            >
              View Details →
            </Link>
          </div>
        </div>
      ))}
    </div>
  )}
</div>
)
}
export default Roadmap;