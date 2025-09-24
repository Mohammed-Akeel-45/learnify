// src/pages/Quiz.jsx - Enhanced Quiz with Previous Scores and No Take Quiz Tab
import { useState, useEffect } from 'react'
import api from '../services/api'
import { useToast } from '../components/Toast'
import Loading from '../components/Loading'

const Quiz = () => {
  const [activeTab, setActiveTab] = useState('create')
  const [quiz, setQuiz] = useState(null)
  const [formData, setFormData] = useState({ 
    topic: '', 
    difficulty: 'medium', 
    questionCount: 5 
  })
  const [loading, setLoading] = useState(false)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState([])
  const [results, setResults] = useState(null)
  const [errors, setErrors] = useState({})
  const [quizHistory, setQuizHistory] = useState([])
  const [showingQuiz, setShowingQuiz] = useState(false)
  const { showToast } = useToast()

  // Load quiz history from localStorage on component mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('learnify_quiz_history')
    if (savedHistory) {
      try {
        setQuizHistory(JSON.parse(savedHistory))
      } catch (error) {
        console.error('Error loading quiz history:', error)
      }
    }
  }, [])

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.topic.trim()) {
      newErrors.topic = 'Topic is required'
    } else if (formData.topic.trim().length < 3) {
      newErrors.topic = 'Topic must be at least 3 characters'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const generateQuiz = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    setLoading(true)
    setErrors({})
    
    try {
      console.log('Generating quiz with data:', formData)
      
      const response = await api.post('/quiz/generate', {
        topic: formData.topic.trim(),
        difficulty: formData.difficulty,
        questionCount: parseInt(formData.questionCount)
      })
      
      console.log('Quiz generated successfully:', response.data)
      
      if (!response.data || !response.data.questions || response.data.questions.length === 0) {
        throw new Error('Invalid quiz data received from server')
      }
      
      setQuiz(response.data)
      setAnswers(new Array(response.data.questions.length).fill(null))
      setCurrentQuestion(0)
      setShowingQuiz(true)
      showToast('Quiz generated successfully! Good luck!', 'success')
      
    } catch (error) {
      console.error('Quiz generation error:', error)
      
      let errorMessage = 'Failed to generate quiz. Please try again.'
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message
      } else if (error.message) {
        errorMessage = error.message
      } else if (error.code === 'NETWORK_ERROR') {
        errorMessage = 'Network error. Please check your connection.'
      }
      
      showToast(errorMessage, 'error')
      
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors)
      }
    } finally {
      setLoading(false)
    }
  }

  const submitQuiz = async () => {
    const unansweredQuestions = answers.map((answer, index) => 
      answer === null ? index + 1 : null
    ).filter(q => q !== null)
    
    if (unansweredQuestions.length > 0) {
      showToast(`Please answer question${unansweredQuestions.length > 1 ? 's' : ''} ${unansweredQuestions.join(', ')}`, 'error')
      return
    }

    setLoading(true)
    
    try {
      const response = await api.post('/quiz/submit', {
        quizId: quiz.id || `quiz_${Date.now()}`,
        answers,
        timeSpent: 0,
        topic: quiz.topic || formData.topic
      })
      
      console.log('Quiz submitted successfully:', response.data)
      
      const quizResult = {
        ...response.data,
        topic: formData.topic,
        difficulty: formData.difficulty,
        questionCount: quiz.questions.length,
        date: new Date().toISOString(),
        id: Date.now()
      }
      
      setResults(quizResult)
      
      // Save to quiz history
      const updatedHistory = [quizResult, ...quizHistory].slice(0, 50) // Keep last 50 results
      setQuizHistory(updatedHistory)
      localStorage.setItem('learnify_quiz_history', JSON.stringify(updatedHistory))
      
      setActiveTab('results')
      setShowingQuiz(false)
      
      const passed = response.data.passed || response.data.score >= 33
      showToast(
        `Quiz completed! You scored ${response.data.score}%`, 
        passed ? 'success' : 'info'
      )
      
    } catch (error) {
      console.error('Quiz submission error:', error)
      
      // Calculate results locally as fallback
      const correct = quiz.questions.filter((q, i) => {
        const userAnswer = answers[i]
        const correctAnswer = q.correctAnswer || q.correct_answer
        return correctAnswer === userAnswer
      }).length
      
      const score = Math.round((correct / quiz.questions.length) * 100)
      const passed = score >= 33
      
      const fallbackResults = {
        score,
        correct,
        total: quiz.questions.length,
        passed,
        topic: formData.topic,
        difficulty: formData.difficulty,
        questionCount: quiz.questions.length,
        date: new Date().toISOString(),
        id: Date.now(),
        results: quiz.questions.map((question, i) => ({
          question: question.question,
          options: question.options,
          userAnswer: answers[i],
          correctAnswer: question.correctAnswer || question.correct_answer,
          isCorrect: (question.correctAnswer || question.correct_answer) === answers[i],
          explanation: question.explanation || `The correct answer is ${question.options[question.correctAnswer || question.correct_answer]}`
        }))
      }
      
      setResults(fallbackResults)
      
      // Save to quiz history
      const updatedHistory = [fallbackResults, ...quizHistory].slice(0, 50)
      setQuizHistory(updatedHistory)
      localStorage.setItem('learnify_quiz_history', JSON.stringify(updatedHistory))
      
      setActiveTab('results')
      setShowingQuiz(false)
      showToast(`Quiz completed! Score: ${score}%`, passed ? 'success' : 'info')
      
    } finally {
      setLoading(false)
    }
  }

  const resetQuiz = () => {
    setActiveTab('create')
    setQuiz(null)
    setResults(null)
    setCurrentQuestion(0)
    setAnswers([])
    setErrors({})
    setShowingQuiz(false)
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const calculateAverageScore = () => {
    if (quizHistory.length === 0) return 0
    const totalScore = quizHistory.reduce((sum, quiz) => sum + quiz.score, 0)
    return Math.round(totalScore / quizHistory.length)
  }

  const getScoreByDifficulty = (difficulty) => {
    const filtered = quizHistory.filter(q => q.difficulty === difficulty)
    if (filtered.length === 0) return { count: 0, average: 0 }
    const average = Math.round(filtered.reduce((sum, q) => sum + q.score, 0) / filtered.length)
    return { count: filtered.length, average }
  }

  if (loading) {
    return <Loading text={showingQuiz ? 'Processing your answers...' : 'Generating your personalized quiz...'} />
  }

  // Show quiz interface when quiz is generated
  if (showingQuiz && quiz) {
    return (
      <div className="fade-in">
        <div className="card">
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '1.5rem',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.25rem' }}>
                {quiz.title || `${formData.topic} Quiz`}
              </h2>
              <p style={{ margin: '0.25rem 0 0 0', color: '#ccc', fontSize: '0.9rem' }}>
                Question {currentQuestion + 1} of {quiz.questions.length} • {formData.difficulty} difficulty
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ color: '#4f46e5', fontSize: '0.9rem', fontWeight: '500' }}>
                Progress: {Math.round(((currentQuestion + 1) / quiz.questions.length) * 100)}%
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="quiz-progress">
            <div 
              className="quiz-progress-bar"
              style={{ width: `${((currentQuestion + 1) / quiz.questions.length) * 100}%` }}
            />
          </div>

          {/* Question */}
          <div style={{ 
            background: '#222', 
            border: '1px solid #333',
            borderRadius: '8px',
            padding: '1.5rem',
            marginBottom: '1.5rem'
          }}>
            <h3 style={{ 
              fontSize: '1.1rem',
              fontWeight: '600',
              color: '#fff',
              marginBottom: '1.5rem',
              lineHeight: '1.5'
            }}>
              {quiz.questions[currentQuestion].question}
            </h3>
            
            {/* Options */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {quiz.questions[currentQuestion].options.map((option, index) => (
                <label 
                  key={index} 
                  className={`quiz-option ${answers[currentQuestion] === index ? 'selected' : ''}`}
                  style={{ cursor: 'pointer' }}
                >
                  <input
                    type="radio"
                    name={`question-${currentQuestion}`}
                    value={index}
                    checked={answers[currentQuestion] === index}
                    onChange={() => {
                      const newAnswers = [...answers]
                      newAnswers[currentQuestion] = index
                      setAnswers(newAnswers)
                    }}
                    style={{ display: 'none' }}
                  />
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.75rem',
                    width: '100%'
                  }}>
                    <div style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      border: `2px solid ${answers[currentQuestion] === index ? '#4f46e5' : '#666'}`,
                      background: answers[currentQuestion] === index ? '#4f46e5' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      {answers[currentQuestion] === index && (
                        <div style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          background: 'white'
                        }} />
                      )}
                    </div>
                    <span style={{ color: '#fff', flex: 1 }}>{option}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <button
              onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
              disabled={currentQuestion === 0}
              className="btn btn-secondary"
            >
              Previous
            </button>
            
            <div style={{ textAlign: 'center', color: '#ccc', fontSize: '0.9rem' }}>
              Answered: {answers.filter(a => a !== null).length} / {quiz.questions.length}
            </div>
            
            {currentQuestion === quiz.questions.length - 1 ? (
              <button
                onClick={submitQuiz}
                className="btn btn-primary"
                style={{
                  background: '#10b981'
                }}
              >
                Submit Quiz
              </button>
            ) : (
              <button
                onClick={() => setCurrentQuestion(Math.min(quiz.questions.length - 1, currentQuestion + 1))}
                className="btn btn-primary"
              >
                Next
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fade-in">
      {/* Header */}
      <div className="card">
        <h1 style={{ marginBottom: '0.5rem' }}>AI Quiz Generator</h1>
        <p style={{ color: '#ccc', margin: 0 }}>
          Create personalized quizzes and track your learning progress
        </p>
      </div>

      {/* Main Quiz Card */}
      <div className="card">
        {/* Tabs */}
        <div className="quiz-tabs">
          <button
            onClick={() => setActiveTab('create')}
            className={`quiz-tab ${activeTab === 'create' ? 'active' : ''}`}
          >
            Create Quiz
          </button>
          <button
            onClick={() => setActiveTab('results')}
            disabled={!results && quizHistory.length === 0}
            className={`quiz-tab ${activeTab === 'results' ? 'active' : ''}`}
          >
            Results & History ({quizHistory.length})
          </button>
        </div>

        {/* Create Quiz Tab */}
        {activeTab === 'create' && (
          <div>
            <h2 style={{ marginBottom: '1.5rem' }}>Generate AI Quiz</h2>
            
            <form onSubmit={generateQuiz} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div className="form-group">
                <label className="form-label">Quiz Topic *</label>
                <input
                  type="text"
                  name="topic"
                  value={formData.topic}
                  onChange={handleInputChange}
                  placeholder="e.g., JavaScript ES6, React Hooks, Python Basics, Machine Learning"
                  className="form-input"
                  style={{
                    borderColor: errors.topic ? '#ef4444' : '#444'
                  }}
                  disabled={loading}
                />
                {errors.topic && (
                  <div style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                    {errors.topic}
                  </div>
                )}
                <div style={{ fontSize: '0.8rem', color: '#888', marginTop: '0.25rem' }}>
                  Be specific for better questions (e.g., "JavaScript Array Methods" instead of "JavaScript")
                </div>
              </div>
              
              <div className="form-group">
                <label className="form-label">Difficulty Level</label>
                <select
                  name="difficulty"
                  value={formData.difficulty}
                  onChange={handleInputChange}
                  className="form-input"
                  disabled={loading}
                >
                  <option value="easy">Easy - Basic concepts and fundamentals</option>
                  <option value="medium">Medium - Intermediate knowledge</option>
                  <option value="hard">Hard - Advanced topics and edge cases</option>
                </select>
              </div>
              
              <div className="form-group">
                <label className="form-label">Number of Questions</label>
                <select
                  name="questionCount"
                  value={formData.questionCount}
                  onChange={handleInputChange}
                  className="form-input"
                  disabled={loading}
                >
                  <option value={3}>3 Questions (~2 minutes)</option>
                  <option value={5}>5 Questions (~3-4 minutes)</option>
                  <option value={10}>10 Questions (~6-8 minutes)</option>
                </select>
              </div>
              
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={loading}
                style={{
                  padding: '1rem 2rem',
                  fontSize: '1rem'
                }}
              >
                Generate Quiz with AI
              </button>
            </form>
          </div>
        )}

        {/* Results & History Tab */}
        {activeTab === 'results' && (
          <div>
            {/* Latest Result */}
            {results && (
              <div style={{ marginBottom: '2rem' }}>
                <h2 style={{ marginBottom: '1rem' }}>Latest Quiz Result</h2>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                  <div style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    background: results.passed ? '#10b981' : '#ef4444',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '2rem',
                    margin: '0 auto 1rem'
                  }}>
                    {results.passed ? '🎉' : '📚'}
                  </div>
                  <h3 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
                    {results.passed ? 'Congratulations!' : 'Keep Learning!'}
                  </h3>
                  <p style={{ fontSize: '1.25rem', color: '#ccc', marginBottom: '1rem' }}>
                    You scored {results.score}% ({results.correct}/{results.total} correct)
                  </p>
                  <div style={{ 
                    display: 'inline-block',
                    padding: '0.5rem 1rem',
                    background: results.passed ? '#10b981' : '#ef4444',
                    color: 'white',
                    borderRadius: '20px',
                    fontSize: '0.9rem',
                    fontWeight: '500'
                  }}>
                    {results.topic} • {results.difficulty}
                  </div>
                </div>
              </div>
            )}

            {/* Statistics Overview */}
            <div style={{ marginBottom: '2rem' }}>
              <h2 style={{ marginBottom: '1rem' }}>Your Learning Statistics</h2>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem',
                marginBottom: '1.5rem'
              }}>
                <div style={{
                  background: '#222',
                  border: '1px solid #333',
                  borderRadius: '8px',
                  padding: '1.5rem',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#4f46e5', marginBottom: '0.5rem' }}>
                    {quizHistory.length}
                  </div>
                  <div style={{ color: '#ccc', fontSize: '0.9rem' }}>Total Quizzes</div>
                </div>
                
                <div style={{
                  background: '#222',
                  border: '1px solid #333',
                  borderRadius: '8px',
                  padding: '1.5rem',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#10b981', marginBottom: '0.5rem' }}>
                    {calculateAverageScore()}%
                  </div>
                  <div style={{ color: '#ccc', fontSize: '0.9rem' }}>Average Score</div>
                </div>
                
                <div style={{
                  background: '#222',
                  border: '1px solid #333',
                  borderRadius: '8px',
                  padding: '1.5rem',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f59e0b', marginBottom: '0.5rem' }}>
                    {quizHistory.filter(q => q.passed).length}
                  </div>
                  <div style={{ color: '#ccc', fontSize: '0.9rem' }}>Quizzes Passed</div>
                </div>
              </div>

              {/* Performance by Difficulty */}
              <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Performance by Difficulty</h3>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: '1rem'
              }}>
                {['easy', 'medium', 'hard'].map(difficulty => {
                  const stats = getScoreByDifficulty(difficulty)
                  return (
                    <div key={difficulty} style={{
                      background: '#2a2a2a',
                      border: '1px solid #444',
                      borderRadius: '6px',
                      padding: '1rem',
                      textAlign: 'center'
                    }}>
                      <div style={{ fontWeight: '500', color: '#fff', marginBottom: '0.5rem', textTransform: 'capitalize' }}>
                        {difficulty}
                      </div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#4f46e5', marginBottom: '0.25rem' }}>
                        {stats.average}%
                      </div>
                      <div style={{ color: '#888', fontSize: '0.8rem' }}>
                        {stats.count} quiz{stats.count !== 1 ? 'es' : ''}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Quiz History */}
            {quizHistory.length > 0 && (
              <div>
                <h2 style={{ marginBottom: '1rem' }}>Recent Quiz History</h2>
                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                  {quizHistory.slice(0, 10).map((quiz, index) => (
                    <div key={quiz.id || index} style={{
                      background: '#222',
                      border: '1px solid #333',
                      borderRadius: '8px',
                      padding: '1rem',
                      marginBottom: '0.75rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '0.5rem'
                    }}>
                      <div style={{ flex: 1, minWidth: '200px' }}>
                        <div style={{ fontWeight: '500', color: '#fff', marginBottom: '0.25rem' }}>
                          {quiz.topic}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#ccc' }}>
                          {quiz.difficulty} • {quiz.questionCount} questions • {new Date(quiz.date).toLocaleDateString()}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{
                            fontSize: '1.25rem',
                            fontWeight: 'bold',
                            color: quiz.passed ? '#10b981' : '#ef4444'
                          }}>
                            {quiz.score}%
                          </div>
                          <div style={{ fontSize: '0.7rem', color: '#888' }}>
                            {quiz.correct}/{quiz.total}
                          </div>
                        </div>
                        <div style={{
                          padding: '0.25rem 0.75rem',
                          borderRadius: '12px',
                          fontSize: '0.7rem',
                          fontWeight: '500',
                          background: quiz.passed ? '#10b981' : '#ef4444',
                          color: 'white'
                        }}>
                          {quiz.passed ? 'PASSED' : 'FAILED'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {quizHistory.length > 10 && (
                  <div style={{ textAlign: 'center', marginTop: '1rem', color: '#888', fontSize: '0.9rem' }}>
                    Showing 10 of {quizHistory.length} total quizzes
                  </div>
                )}
              </div>
            )}

            {/* No History Message */}
            {quizHistory.length === 0 && !results && (
              <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📊</div>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: '#fff' }}>No Quiz History Yet</h3>
                <p style={{ color: '#ccc', marginBottom: '1.5rem' }}>
                  Take your first quiz to start tracking your learning progress and see detailed statistics.
                </p>
                <button
                  onClick={() => setActiveTab('create')}
                  className="btn btn-primary"
                >
                  Create Your First Quiz
                </button>
              </div>
            )}

            {/* Action Buttons */}
            {(results || quizHistory.length > 0) && (
              <div style={{ 
                textAlign: 'center',
                marginTop: '2rem',
                paddingTop: '2rem',
                borderTop: '1px solid #333'
              }}>
                <div style={{ 
                  display: 'flex',
                  gap: '1rem',
                  justifyContent: 'center',
                  flexWrap: 'wrap'
                }}>
                  <button onClick={resetQuiz} className="btn btn-primary">
                    Create New Quiz
                  </button>
                  {results && (
                    <button 
                      onClick={() => {
                        setQuiz(results.quiz || {
                          questions: results.results?.map(r => ({
                            question: r.question,
                            options: r.options,
                            correctAnswer: r.correctAnswer
                          })) || []
                        })
                        setAnswers(new Array(results.total).fill(null))
                        setCurrentQuestion(0)
                        setShowingQuiz(true)
                      }} 
                      className="btn btn-secondary"
                      disabled={!results.results}
                    >
                      Retake Last Quiz
                    </button>
                  )}
                  <button 
                    onClick={() => {
                      localStorage.removeItem('learnify_quiz_history')
                      setQuizHistory([])
                      showToast('Quiz history cleared', 'info')
                    }}
                    className="btn btn-secondary"
                    disabled={quizHistory.length === 0}
                    style={{ 
                      background: '#ef4444',
                      borderColor: '#dc2626'
                    }}
                  >
                    Clear History
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default Quiz;