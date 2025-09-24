// src/pages/Auth.jsx - Optimized Auth Component
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../components/Toast'

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true)
  const [formData, setFormData] = useState({ 
    name: '', 
    email: '', 
    password: '' 
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  
  const { login, register } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.email) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid'
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
    }
    
    if (!isLogin && !formData.name.trim()) {
      newErrors.name = 'Name is required'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    setLoading(true)
    setErrors({})
    
    try {
      if (isLogin) {
        await login({ 
          email: formData.email.trim(), 
          password: formData.password 
        })
        showToast('Welcome back!', 'success')
        navigate('/app')
      } else {
        await register({
          name: formData.name.trim(),
          email: formData.email.trim(),
          password: formData.password
        })
        showToast('Account created successfully!', 'success')
        navigate('/app')
      }
    } catch (error) {
      console.error('Auth error:', error)
      const errorMessage = error.response?.data?.message || 
                          error.message || 
                          'Authentication failed. Please try again.'
      showToast(errorMessage, 'error')
      
      // Handle specific validation errors from backend
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const toggleMode = () => {
    setIsLogin(!isLogin)
    setFormData({ name: '', email: '', password: '' })
    setErrors({})
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
      background: '#111'
    }}>
      <div style={{ maxWidth: '400px', width: '100%' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ 
            fontSize: '2rem', 
            fontWeight: 'bold', 
            color: '#4f46e5',
            marginBottom: '0.5rem'
          }}>
            Learnify
          </h1>
          <p style={{ color: '#ccc', fontSize: '0.9rem' }}>
            {isLogin ? 'Welcome back to your learning journey' : 'Start your AI-powered learning adventure'}
          </p>
        </div>

        {/* Form Card */}
        <div className="card">
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {!isLogin && (
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  name="name"
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="form-input"
                  style={{
                    borderColor: errors.name ? '#ef4444' : '#444'
                  }}
                  disabled={loading}
                />
                {errors.name && (
                  <div style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                    {errors.name}
                  </div>
                )}
              </div>
            )}
            
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                name="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleInputChange}
                className="form-input"
                style={{
                  borderColor: errors.email ? '#ef4444' : '#444'
                }}
                disabled={loading}
                autoComplete="email"
              />
              {errors.email && (
                <div style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                  {errors.email}
                </div>
              )}
            </div>
            
            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                name="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleInputChange}
                className="form-input"
                style={{
                  borderColor: errors.password ? '#ef4444' : '#444'
                }}
                disabled={loading}
                autoComplete={isLogin ? 'current-password' : 'new-password'}
              />
              {errors.password && (
                <div style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                  {errors.password}
                </div>
              )}
            </div>

            <button 
              type="submit" 
              disabled={loading} 
              className="btn btn-primary"
              style={{ 
                width: '100%',
                marginTop: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
            >
              {loading ? (
                <>
                  <div className="spinner"></div>
                  Processing...
                </>
              ) : (
                isLogin ? 'Sign In' : 'Create Account'
              )}
            </button>
          </form>

          <div style={{ 
            marginTop: '1.5rem', 
            textAlign: 'center',
            borderTop: '1px solid #333',
            paddingTop: '1.5rem'
          }}>
            <button
              type="button"
              onClick={toggleMode}
              disabled={loading}
              style={{
                background: 'none',
                border: 'none',
                color: '#4f46e5',
                cursor: 'pointer',
                fontSize: '0.9rem'
              }}
            >
              {isLogin 
                ? "Don't have an account? Sign up" 
                : 'Already have an account? Sign in'
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Auth;