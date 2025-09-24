// src/pages/Home.jsx - Optimized Home Component
import { Link } from 'react-router-dom'

const Home = () => {
  const features = [
    {
      icon: '🧠',
      title: 'AI Quiz Generator',
      description: 'Create personalized quizzes on any topic with advanced AI technology powered by Groq'
    },
    {
      icon: '💬',
      title: 'Smart AI Tutor',
      description: 'Get instant help and detailed explanations from our intelligent AI assistant'
    },
    {
      icon: '📊',
      title: 'Progress Tracking',
      description: 'Track your learning progress with detailed analytics and performance insights'
    }
  ]

  const stats = [
    { number: '1000+', label: 'Active Learners' },
    { number: '5000+', label: 'Quizzes Created' },
    { number: '95%', label: 'Success Rate' },
    { number: '24/7', label: 'AI Support' }
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#111' }}>
      {/* Navigation */}
      <nav className="header">
        <div className="logo">Learnify</div>
        <Link to="/auth" className="btn btn-primary">
          Get Started
        </Link>
      </nav>
      
      {/* Hero Section */}
      <section style={{ 
        padding: '4rem 2rem', 
        textAlign: 'center',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        <div className="fade-in">
          <h1 style={{ 
            fontSize: 'clamp(2rem, 5vw, 4rem)', 
            fontWeight: 'bold', 
            color: '#fff',
            marginBottom: '1rem',
            lineHeight: '1.2'
          }}>
            AI-Powered Learning Platform
          </h1>
          <p style={{ 
            fontSize: 'clamp(1rem, 2.5vw, 1.25rem)', 
            color: '#ccc',
            marginBottom: '2rem',
            maxWidth: '600px',
            margin: '0 auto 2rem'
          }}>
            Transform your learning experience with cutting-edge AI technology. 
            Create personalized quizzes, chat with intelligent tutors, and accelerate your educational journey.
          </p>
          
          <div style={{ 
            display: 'flex', 
            gap: '1rem', 
            justifyContent: 'center',
            flexWrap: 'wrap',
            marginBottom: '3rem'
          }}>
            <Link to="/auth" className="btn btn-primary" style={{ 
              padding: '1rem 2rem',
              fontSize: '1.1rem'
            }}>
              Start Learning Free
            </Link>
            <Link to="#features" className="btn btn-secondary" style={{ 
              padding: '1rem 2rem',
              fontSize: '1.1rem'
            }}>
              Learn More
            </Link>
          </div>

          {/* Stats */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '2rem',
            marginTop: '3rem',
            padding: '2rem',
            background: '#1a1a1a',
            borderRadius: '12px',
            border: '1px solid #333'
          }}>
            {stats.map((stat, index) => (
              <div key={index} style={{ textAlign: 'center' }}>
                <div style={{ 
                  fontSize: '2rem', 
                  fontWeight: 'bold', 
                  color: '#4f46e5',
                  marginBottom: '0.25rem'
                }}>
                  {stat.number}
                </div>
                <div style={{ color: '#ccc', fontSize: '0.9rem' }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" style={{ 
        padding: '4rem 2rem', 
        background: '#0a0a0a'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h2 style={{ 
              fontSize: 'clamp(1.5rem, 4vw, 2.5rem)', 
              fontWeight: 'bold',
              color: '#fff',
              marginBottom: '1rem'
            }}>
              Everything You Need to Learn Better
            </h2>
            <p style={{ 
              fontSize: '1.1rem', 
              color: '#ccc',
              maxWidth: '600px',
              margin: '0 auto'
            }}>
              Discover powerful AI-driven tools designed to make learning more effective and engaging.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '2rem'
          }}>
            {features.map((feature, index) => (
              <div key={index} className="card" style={{ 
                textAlign: 'center',
                padding: '2rem',
                height: '100%',
                display: 'flex',
                flexDirection: 'column'
              }}>
                <div style={{ 
                  fontSize: '3rem', 
                  marginBottom: '1rem'
                }}>
                  {feature.icon}
                </div>
                <h3 style={{ 
                  fontSize: '1.25rem',
                  fontWeight: '600',
                  color: '#fff',
                  marginBottom: '1rem'
                }}>
                  {feature.title}
                </h3>
                <p style={{ 
                  color: '#ccc',
                  lineHeight: '1.6',
                  flex: '1'
                }}>
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section style={{ 
        padding: '4rem 2rem'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ 
            fontSize: 'clamp(1.5rem, 4vw, 2.5rem)', 
            fontWeight: 'bold',
            color: '#fff',
            marginBottom: '3rem'
          }}>
            How Learnify Works
          </h2>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '2rem'
          }}>
            {[
              { step: '1', title: 'Sign Up', desc: 'Create your free account in seconds' },
              { step: '2', title: 'Choose Topic', desc: 'Select what you want to learn about' },
              { step: '3', title: 'Start Learning', desc: 'Use AI quizzes and chat to master topics' }
            ].map((item, index) => (
              <div key={index} style={{ textAlign: 'center' }}>
                <div style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  background: '#4f46e5',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.5rem',
                  fontWeight: 'bold',
                  margin: '0 auto 1rem'
                }}>
                  {item.step}
                </div>
                <h3 style={{ 
                  fontSize: '1.25rem',
                  fontWeight: '600',
                  color: '#fff',
                  marginBottom: '0.5rem'
                }}>
                  {item.title}
                </h3>
                <p style={{ color: '#ccc' }}>
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section style={{ 
        padding: '4rem 2rem',
        background: '#0a0a0a'
      }}>
        <div style={{ 
          maxWidth: '800px', 
          margin: '0 auto', 
          textAlign: 'center'
        }}>
          <div className="card" style={{ 
            background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
            padding: '3rem 2rem'
          }}>
            <h2 style={{ 
              fontSize: 'clamp(1.5rem, 4vw, 2.5rem)', 
              fontWeight: 'bold',
              color: '#fff',
              marginBottom: '1rem'
            }}>
              Ready to Transform Your Learning?
            </h2>
            <p style={{ 
              fontSize: '1.1rem',
              color: '#e5e7eb',
              marginBottom: '2rem'
            }}>
              Join thousands of learners who are already experiencing the power of AI-enhanced education.
            </p>
            <div style={{ 
              display: 'flex', 
              gap: '1rem', 
              justifyContent: 'center',
              flexWrap: 'wrap'
            }}>
              <Link to="/auth" className="btn" style={{
                background: 'white',
                color: '#4f46e5',
                padding: '1rem 2rem',
                fontSize: '1.1rem',
                fontWeight: '600'
              }}>
                Get Started Free
              </Link>
            </div>
            <p style={{ 
              fontSize: '0.9rem', 
              color: '#e5e7eb',
              marginTop: '1rem',
              opacity: '0.8'
            }}>
              No credit card required • Free forever
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ 
        background: '#000',
        borderTop: '1px solid #333',
        padding: '2rem',
        textAlign: 'center'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div className="logo" style={{ marginBottom: '1rem' }}>Learnify</div>
          <p style={{ color: '#666', fontSize: '0.9rem' }}>
            © 2024 Learnify. AI-powered learning platform for the future.
          </p>
        </div>
      </footer>
    </div>
  )
}

export default Home;