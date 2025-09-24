// src/components/Toast.jsx - Optimized Toast Component
import { createContext, useContext, useState, useCallback } from 'react'

const ToastContext = createContext()

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([])

  const showToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random()
    const newToast = { id, message, type, duration }
    
    setToasts(prev => [...prev, newToast])
    
    // Auto remove toast after duration
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id))
    }, duration)
  }, [])

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }, [])

  const clearAllToasts = useCallback(() => {
    setToasts([])
  }, [])

  return (
    <ToastContext.Provider value={{ showToast, removeToast, clearAllToasts }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  )
}

const ToastContainer = ({ toasts, onRemove }) => {
  if (toasts.length === 0) return null

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      maxWidth: '400px',
      width: '100%'
    }}>
      {toasts.map(toast => (
        <Toast key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  )
}

const Toast = ({ toast, onRemove }) => {
  const getToastStyles = (type) => {
    const baseStyles = {
      padding: '16px 20px',
      borderRadius: '8px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '12px',
      minWidth: '300px',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
      animation: 'slideInRight 0.3s ease-out',
      border: '1px solid',
      backdropFilter: 'blur(10px)'
    }

    switch (type) {
      case 'success':
        return {
          ...baseStyles,
          background: 'rgba(16, 185, 129, 0.9)',
          borderColor: 'rgba(16, 185, 129, 0.5)',
          color: 'white'
        }
      case 'error':
        return {
          ...baseStyles,
          background: 'rgba(239, 68, 68, 0.9)',
          borderColor: 'rgba(239, 68, 68, 0.5)',
          color: 'white'
        }
      case 'warning':
        return {
          ...baseStyles,
          background: 'rgba(245, 158, 11, 0.9)',
          borderColor: 'rgba(245, 158, 11, 0.5)',
          color: 'white'
        }
      case 'info':
      default:
        return {
          ...baseStyles,
          background: 'rgba(79, 70, 229, 0.9)',
          borderColor: 'rgba(79, 70, 229, 0.5)',
          color: 'white'
        }
    }
  }

  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return (
          <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        )
      case 'error':
        return (
          <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        )
      case 'warning':
        return (
          <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        )
      case 'info':
      default:
        return (
          <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        )
    }
  }

  return (
    <div style={getToastStyles(toast.type)}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
        <div style={{ flexShrink: 0 }}>
          {getIcon(toast.type)}
        </div>
        <div style={{ 
          fontSize: '14px', 
          fontWeight: '500',
          lineHeight: '1.4',
          wordBreak: 'break-word'
        }}>
          {toast.message}
        </div>
      </div>
      
      <button
        onClick={() => onRemove(toast.id)}
        style={{
          background: 'none',
          border: 'none',
          color: 'currentColor',
          cursor: 'pointer',
          padding: '4px',
          borderRadius: '4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: '0.7',
          flexShrink: 0
        }}
        onMouseEnter={(e) => e.target.style.opacity = '1'}
        onMouseLeave={(e) => e.target.style.opacity = '0.7'}
      >
        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}

// Hook to use toast
export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within ToastProvider')
  }
  return context
}

// Utility functions for different toast types
export const toast = {
  success: (message, duration) => {
    const context = useContext(ToastContext)
    if (context) context.showToast(message, 'success', duration)
  },
  error: (message, duration) => {
    const context = useContext(ToastContext)
    if (context) context.showToast(message, 'error', duration)
  },
  warning: (message, duration) => {
    const context = useContext(ToastContext)
    if (context) context.showToast(message, 'warning', duration)
  },
  info: (message, duration) => {
    const context = useContext(ToastContext)
    if (context) context.showToast(message, 'info', duration)
  }
}

export default ToastProvider;