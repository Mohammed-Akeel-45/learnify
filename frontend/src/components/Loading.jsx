// src/components/Loading.jsx - Optimized Loading Component
import { useState, useEffect } from 'react'

const Loading = ({ text = 'Loading...', showProgress = false, duration = null }) => {
  const [progress, setProgress] = useState(0)
  const [dots, setDots] = useState('')

  // Animated dots effect
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => {
        if (prev === '...') return ''
        return prev + '.'
      })
    }, 500)

    return () => clearInterval(interval)
  }, [])

  // Progress bar effect if duration is provided
  useEffect(() => {
    if (!showProgress || !duration) return

    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) return 100
        return prev + (100 / (duration / 100))
      })
    }, 100)

    return () => clearInterval(interval)
  }, [showProgress, duration])

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '3rem 2rem',
      minHeight: '200px'
    }}>
      {/* Spinner */}
      <div style={{
        width: '40px',
        height: '40px',
        border: '4px solid #333',
        borderTop: '4px solid #4f46e5',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
        marginBottom: '1.5rem'
      }} />

      {/* Loading Text */}
      <div style={{
        fontSize: '1rem',
        color: '#ccc',
        textAlign: 'center',
        marginBottom: showProgress ? '1rem' : '0'
      }}>
        {text}{dots}
      </div>

      {/* Progress Bar (optional) */}
      {showProgress && (
        <div style={{
          width: '200px',
          height: '4px',
          background: '#333',
          borderRadius: '2px',
          overflow: 'hidden',
          marginBottom: '0.5rem'
        }}>
          <div style={{
            width: `${progress}%`,
            height: '100%',
            background: '#4f46e5',
            borderRadius: '2px',
            transition: 'width 0.2s ease'
          }} />
        </div>
      )}

      {showProgress && (
        <div style={{
          fontSize: '0.8rem',
          color: '#888'
        }}>
          {Math.round(progress)}% complete
        </div>
      )}


    </div>
  )
}

// Different loading states for specific use cases
export const LoadingScreen = ({ message = 'Loading application...' }) => (
  <div style={{
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: '#111',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999
  }}>
    <div style={{ textAlign: 'center' }}>
      <div style={{
        width: '60px',
        height: '60px',
        border: '6px solid #333',
        borderTop: '6px solid #4f46e5',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
        marginBottom: '2rem'
      }} />
      <h2 style={{ color: '#4f46e5', marginBottom: '0.5rem', fontSize: '1.5rem' }}>
        Learnify
      </h2>
      <p style={{ color: '#ccc', fontSize: '1rem' }}>
        {message}
      </p>
    </div>
  </div>
)

export const LoadingButton = ({ 
  loading = false, 
  children, 
  loadingText = 'Processing...',
  className = 'btn btn-primary',
  ...props 
}) => (
  <button 
    className={className}
    disabled={loading}
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.5rem',
      opacity: loading ? 0.7 : 1,
      cursor: loading ? 'not-allowed' : 'pointer'
    }}
    {...props}
  >
    {loading && (
      <div style={{
        width: '16px',
        height: '16px',
        border: '2px solid currentColor',
        borderTop: '2px solid transparent',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite'
      }} />
    )}
    {loading ? loadingText : children}
  </button>
)

export const LoadingSpinner = ({ size = '20px', color = '#4f46e5' }) => (
  <div style={{
    width: size,
    height: size,
    border: `2px solid ${color}20`,
    borderTop: `2px solid ${color}`,
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  }} />
)

export default Loading;