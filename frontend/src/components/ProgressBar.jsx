
// src/components/ProgressBar.jsx
const ProgressBar = ({ progress = 0, showLabel = true, height = '8px', color = '#4f46e5' }) => {
  return (
    <div style={{ width: '100%' }}>
      {showLabel && (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          marginBottom: '0.5rem',
          fontSize: '0.875rem',
          color: '#ccc'
        }}>
          <span>Progress</span>
          <span style={{ fontWeight: '600', color }}>{progress}%</span>
        </div>
      )}
      <div style={{
        width: '100%',
        height,
        background: '#2a2a2a',
        borderRadius: '999px',
        overflow: 'hidden',
        position: 'relative'
      }}>
        <div style={{
          width: `${progress}%`,
          height: '100%',
          background: color,
          borderRadius: '999px',
          transition: 'width 0.3s ease',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {progress > 0 && (
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              bottom: 0,
              right: 0,
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
              animation: 'shimmer 2s infinite'
            }} />
          )}
        </div>
      </div>
    </div>
  )
}
export default ProgressBar;
