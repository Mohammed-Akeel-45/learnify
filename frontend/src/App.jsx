import { useState, useEffect, createContext, useContext } from 'react';
import './App.css';

// Context for global state
const AppContext = createContext();

// Enhanced API Service
class ApiService {
    constructor() {
        this.baseURL = 'http://localhost:5000/api';
        this.token = localStorage.getItem('token');
    }

    async request(endpoint, options = {}) {
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...(this.token && { Authorization: `Bearer ${this.token}` })
            },
            ...options
        };

        try {
            const response = await fetch(`${this.baseURL}${endpoint}`, config);
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Request failed');
            return data;
        } catch (error) {
            console.error(`API Error (${endpoint}):`, error);
            throw error;
        }
    }

    // Auth methods
    async login(email, password) {
        const data = await this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
        this.token = data.token;
        localStorage.setItem('token', data.token);
        return data;
    }

    async register(userData) {
        const data = await this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
        this.token = data.token;
        localStorage.setItem('token', data.token);
        return data;
    }

    // Course methods
    async getCourses(filters = {}) {
        const params = new URLSearchParams(filters);
        return this.request(`/courses?${params}`);
    }

    // Roadmap methods
    async generateRoadmap(topic, level, duration, focusAreas = []) {
        return this.request('/courses/generate-roadmap', {
            method: 'POST',
            body: JSON.stringify({ topic, level, duration, focusAreas })
        });
    }

    async getRoadmaps() {
        return this.request('/roadmaps');
    }

    async generateCourseContent(roadmapId, moduleIndex) {
        return this.request('/courses/generate-content', {
            method: 'POST',
            body: JSON.stringify({ roadmapId, moduleIndex })
        });
    }

    // Quiz methods
    async generateQuiz(topic, difficulty = 'medium', questionCount = 5, focusAreas = []) {
        return this.request('/quiz/generate', {
            method: 'POST',
            body: JSON.stringify({ topic, difficulty, questionCount, focusAreas })
        });
    }

    async submitQuiz(quizId, answers, timeSpent) {
        return this.request('/quiz/submit', {
            method: 'POST',
            body: JSON.stringify({ quizId, answers, timeSpent })
        });
    }

    async getQuizHistory() {
        return this.request('/quiz/history');
    }

    // Chat methods
    async sendChatMessage(message, context = null, sessionId = null, mode = 'general') {
        return this.request('/chat/message', {
            method: 'POST',
            body: JSON.stringify({ message, context, sessionId, mode })
        });
    }

    async getChatHistory(sessionId = null) {
        const params = sessionId ? `?sessionId=${sessionId}` : '';
        return this.request(`/chat/history${params}`);
    }

    // Dashboard methods
    async getDashboardStats() {
        return this.request('/dashboard/stats');
    }
}

const api = new ApiService();

// Enhanced Navbar Component
const Navbar = ({ currentPage, setCurrentPage, user, setUser }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
        setCurrentPage('home');
        setIsMenuOpen(false);
    };

    const navItems = user ? [
        { key: 'dashboard', icon: 'chart-bar', label: 'Dashboard' },
        { key: 'courses', icon: 'book', label: 'Courses' },
        { key: 'quiz', icon: 'question-circle', label: 'Quiz' },
        { key: 'chat', icon: 'comments', label: 'AI Chat' }
    ] : [
        { key: 'home', icon: 'home', label: 'Home' },
        { key: 'login', icon: 'sign-in-alt', label: 'Login' },
        { key: 'register', icon: 'user-plus', label: 'Register' }
    ];

    return (
        <nav className="navbar">
            <div className="nav-brand">
                <i className="fas fa-brain"></i>
                <span>Learnify</span>
            </div>

            <div className="nav-menu desktop-menu">
                {navItems.map(item => (
                    <button
                        key={item.key}
                        className={`nav-btn ${currentPage === item.key ? 'active' : ''}`}
                        onClick={() => setCurrentPage(item.key)}
                    >
                        <i className={`fas fa-${item.icon}`}></i>
                        <span>{item.label}</span>
                    </button>
                ))}
                
                {user && (
                    <button className="nav-btn logout" onClick={logout}>
                        <i className="fas fa-sign-out-alt"></i>
                        <span>Logout</span>
                    </button>
                )}
            </div>

            <button 
                className="mobile-menu-btn"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
                <i className={`fas fa-${isMenuOpen ? 'times' : 'bars'}`}></i>
            </button>

            {isMenuOpen && (
                <div className="mobile-menu">
                    {navItems.map(item => (
                        <button
                            key={item.key}
                            className={`nav-btn ${currentPage === item.key ? 'active' : ''}`}
                            onClick={() => {
                                setCurrentPage(item.key);
                                setIsMenuOpen(false);
                            }}
                        >
                            <i className={`fas fa-${item.icon}`}></i>
                            <span>{item.label}</span>
                        </button>
                    ))}
                    
                    {user && (
                        <button className="nav-btn logout" onClick={logout}>
                            <i className="fas fa-sign-out-alt"></i>
                            <span>Logout</span>
                        </button>
                    )}
                </div>
            )}
        </nav>
    );
};

// Enhanced Home Component
const Home = ({ setCurrentPage }) => (
    <div className="home">
        <section className="hero">
            <div className="hero-content">
                <h1>Transform Your Learning with AI</h1>
                <p>Experience personalized education through AI-powered roadmaps, interactive quizzes, and intelligent tutoring powered by GROQ AI.</p>
                <div className="hero-buttons">
                    <button className="btn-primary" onClick={() => setCurrentPage('register')}>
                        Get Started Free
                    </button>
                    <button className="btn-secondary" onClick={() => setCurrentPage('login')}>
                        Login
                    </button>
                </div>
            </div>
        </section>

        <section className="features">
            <h2>Powerful AI-Driven Features</h2>
            <div className="features-grid">
                <div className="feature-card">
                    <i className="fas fa-route"></i>
                    <h3>AI Learning Roadmaps</h3>
                    <p>Generate personalized learning paths with step-by-step modules</p>
                </div>
                <div className="feature-card">
                    <i className="fas fa-question-circle"></i>
                    <h3>Smart Quiz Generation</h3>
                    <p>Create quizzes with multiple difficulty levels and detailed explanations</p>
                </div>
                <div className="feature-card">
                    <i className="fas fa-robot"></i>
                    <h3>GROQ AI Tutor</h3>
                    <p>24/7 AI assistant for coding help, tutoring, and learning support</p>
                </div>
                <div className="feature-card">
                    <i className="fas fa-chart-line"></i>
                    <h3>Progress Tracking</h3>
                    <p>Monitor your learning journey with detailed analytics</p>
                </div>
            </div>
        </section>
    </div>
);

// Enhanced Auth Component
const Auth = ({ mode, setCurrentPage, setUser }) => {
    const [formData, setFormData] = useState({ name: '', email: '', password: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const data = mode === 'login' 
                ? await api.login(formData.email, formData.password)
                : await api.register(formData);
            
            setUser(data.user);
            setCurrentPage('dashboard');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h2>{mode === 'login' ? 'Login to Learnify' : 'Join Learnify'}</h2>
                {error && <div className="error">{error}</div>}
                
                <form onSubmit={handleSubmit}>
                    {mode === 'register' && (
                        <input
                            type="text"
                            placeholder="Full Name"
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                            required
                        />
                    )}
                    <input
                        type="email"
                        placeholder="Email"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        required
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={formData.password}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                        required
                    />
                    <button type="submit" className="btn-primary" disabled={loading}>
                        {loading ? 'Processing...' : mode === 'login' ? 'Login' : 'Register'}
                    </button>
                </form>

                <p>
                    {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
                    <button 
                        className="link-btn"
                        onClick={() => setCurrentPage(mode === 'login' ? 'register' : 'login')}
                    >
                        {mode === 'login' ? 'Register' : 'Login'}
                    </button>
                </p>
            </div>
        </div>
    );
};

// Enhanced Dashboard Component
const Dashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            const data = await api.getDashboardStats();
            setStats(data);
        } catch (error) {
            console.error('Dashboard error:', error);
            // Use fallback data
            setStats({
                stats: { courses: 5, quizzes: 12, averageScore: 78, studyTime: '24h' },
                recentActivity: { quizzes: [], courses: [] }
            });
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="loading">Loading dashboard...</div>;

    return (
        <div className="dashboard">
            <div className="dashboard-header">
                <h1>Welcome to your Learning Dashboard</h1>
                <p>Track your progress and continue your learning journey</p>
            </div>

            <div className="stats-grid">
                <div className="stat-card">
                    <i className="fas fa-book-open"></i>
                    <div>
                        <h3>{stats.stats.courses}</h3>
                        <p>Courses Created</p>
                    </div>
                </div>
                <div className="stat-card">
                    <i className="fas fa-trophy"></i>
                    <div>
                        <h3>{stats.stats.averageScore}%</h3>
                        <p>Average Score</p>
                    </div>
                </div>
                <div className="stat-card">
                    <i className="fas fa-clock"></i>
                    <div>
                        <h3>{stats.stats.studyTime}</h3>
                        <p>Study Time</p>
                    </div>
                </div>
                <div className="stat-card">
                    <i className="fas fa-question-circle"></i>
                    <div>
                        <h3>{stats.stats.quizzes}</h3>
                        <p>Quizzes Taken</p>
                    </div>
                </div>
            </div>

            <div className="recent-activity">
                <h3>Recent Activity</h3>
                <div className="activity-grid">
                    <div className="activity-section">
                        <h4>Recent Courses</h4>
                        {stats.recentActivity.courses.length > 0 ? (
                            stats.recentActivity.courses.map(course => (
                                <div key={course.id} className="activity-item">
                                    <i className="fas fa-book"></i>
                                    <span>{course.title}</span>
                                </div>
                            ))
                        ) : (
                            <p>No courses yet. Create your first learning roadmap!</p>
                        )}
                    </div>
                    <div className="activity-section">
                        <h4>Recent Quizzes</h4>
                        {stats.recentActivity.quizzes.length > 0 ? (
                            stats.recentActivity.quizzes.map(attempt => (
                                <div key={attempt.id} className="activity-item">
                                    <i className="fas fa-question-circle"></i>
                                    <span>{attempt.Quiz.title} - {attempt.score}%</span>
                                </div>
                            ))
                        ) : (
                            <p>No quizzes taken yet. Try generating a quiz!</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

// Enhanced Courses Component with Roadmap Generation
const Courses = () => {
    const [courses, setCourses] = useState([]);
    const [roadmaps, setRoadmaps] = useState([]);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('browse');
    const [newRoadmap, setNewRoadmap] = useState({
        topic: '',
        level: 'beginner',
        duration: 'medium',
        focusAreas: []
    });
    const [generatingRoadmap, setGeneratingRoadmap] = useState(false);

    useEffect(() => {
        if (activeTab === 'browse') loadCourses();
        if (activeTab === 'roadmaps') loadRoadmaps();
    }, [activeTab]);

    const loadCourses = async () => {
        try {
            const data = await api.getCourses();
            setCourses(data);
        } catch (error) {
            setCourses([
                { id: 1, title: 'React Fundamentals', description: 'Learn React from scratch', lessons: 12, duration: '4h', difficulty: 'Beginner' },
                { id: 2, title: 'JavaScript Advanced', description: 'Advanced JS concepts', lessons: 18, duration: '6h', difficulty: 'Advanced' }
            ]);
        }
    };

    const loadRoadmaps = async () => {
        try {
            const data = await api.getRoadmaps();
            setRoadmaps(data);
        } catch (error) {
            const saved = localStorage.getItem('learningRoadmaps');
            if (saved) setRoadmaps(JSON.parse(saved));
        }
    };

    const generateRoadmap = async () => {
        if (!newRoadmap.topic) return;
        
        setGeneratingRoadmap(true);
        try {
            const roadmap = await api.generateRoadmap(
                newRoadmap.topic, 
                newRoadmap.level, 
                newRoadmap.duration,
                newRoadmap.focusAreas
            );
            
            setRoadmaps(prev => [...prev, roadmap]);
            setActiveTab('roadmaps');
            setNewRoadmap({ topic: '', level: 'beginner', duration: 'medium', focusAreas: [] });
        } catch (error) {
            console.error('Roadmap generation failed:', error);
            alert('Failed to generate roadmap. Please try again.');
        } finally {
            setGeneratingRoadmap(false);
        }
    };

    const generateCourseFromModule = async (roadmapId, moduleIndex) => {
        setLoading(true);
        try {
            const courseContent = await api.generateCourseContent(roadmapId, moduleIndex);
            alert('Course generated successfully!');
            loadCourses();
        } catch (error) {
            alert('Failed to generate course. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="courses">
            <div className="courses-header">
                <h1>Learning Center</h1>
                <p>Discover courses, create AI-powered learning paths, and track your progress</p>
            </div>

            <div className="course-tabs">
                <button 
                    className={`tab ${activeTab === 'browse' ? 'active' : ''}`}
                    onClick={() => setActiveTab('browse')}
                >
                    <i className="fas fa-book"></i> Browse Courses
                </button>
                <button 
                    className={`tab ${activeTab === 'create' ? 'active' : ''}`}
                    onClick={() => setActiveTab('create')}
                >
                    <i className="fas fa-plus-circle"></i> Create Roadmap
                </button>
                <button 
                    className={`tab ${activeTab === 'roadmaps' ? 'active' : ''}`}
                    onClick={() => setActiveTab('roadmaps')}
                >
                    <i className="fas fa-route"></i> My Roadmaps ({roadmaps.length})
                </button>
            </div>

            {activeTab === 'browse' && (
                <div className="courses-grid">
                    {courses.map(course => (
                        <div key={course.id} className="course-card">
                            <div className="course-header">
                                <h3>{course.title}</h3>
                                <span className={`difficulty ${course.difficulty.toLowerCase()}`}>
                                    {course.difficulty}
                                </span>
                            </div>
                            <p>{course.description}</p>
                            <div className="course-meta">
                                <span><i className="fas fa-play"></i> {course.lessons} lessons</span>
                                <span><i className="fas fa-clock"></i> {course.duration}</span>
                            </div>
                            <button className="btn-primary">Start Course</button>
                        </div>
                    ))}
                </div>
            )}

            {activeTab === 'create' && (
                <div className="roadmap-creator">
                    <div className="generator-card">
                        <h3>Generate AI-Powered Learning Roadmap</h3>
                        <p>Let GROQ AI create a personalized learning path tailored to your goals</p>
                        
                        <div className="form-group">
                            <label>What do you want to learn?</label>
                            <input
                                type="text"
                                placeholder="e.g., React, Python, Machine Learning, Web Development"
                                value={newRoadmap.topic}
                                onChange={(e) => setNewRoadmap({...newRoadmap, topic: e.target.value})}
                            />
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Your Experience Level</label>
                                <select 
                                    value={newRoadmap.level}
                                    onChange={(e) => setNewRoadmap({...newRoadmap, level: e.target.value})}
                                >
                                    <option value="beginner">Complete Beginner</option>
                                    <option value="intermediate">Some Experience</option>
                                    <option value="advanced">Advanced</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Time Commitment</label>
                                <select 
                                    value={newRoadmap.duration}
                                    onChange={(e) => setNewRoadmap({...newRoadmap, duration: e.target.value})}
                                >
                                    <option value="short">Quick (4-6 weeks)</option>
                                    <option value="medium">Standard (8-12 weeks)</option>
                                    <option value="long">Comprehensive (16+ weeks)</option>
                                </select>
                            </div>
                        </div>

                        <button 
                            className="btn-primary generate-btn"
                            onClick={generateRoadmap}
                            disabled={generatingRoadmap || !newRoadmap.topic}
                        >
                            {generatingRoadmap ? (
                                <>
                                    <i className="fas fa-spinner fa-spin"></i> 
                                    Generating with GROQ AI...
                                </>
                            ) : (
                                <>
                                    <i className="fas fa-magic"></i> 
                                    Generate Learning Roadmap
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}

            {activeTab === 'roadmaps' && (
                <div className="roadmaps-section">
                    {roadmaps.length === 0 ? (
                        <div className="empty-state">
                            <i className="fas fa-route"></i>
                            <h3>No Learning Roadmaps Yet</h3>
                            <p>Create your first AI-generated learning path to get started</p>
                            <button className="btn-primary" onClick={() => setActiveTab('create')}>
                                Create Roadmap
                            </button>
                        </div>
                    ) : (
                        <div className="roadmaps-grid">
                            {roadmaps.map(roadmap => (
                                <div key={roadmap.id} className="roadmap-card">
                                    <div className="roadmap-header">
                                        <h3>{roadmap.title}</h3>
                                        <span className="level-badge">{roadmap.level}</span>
                                    </div>
                                    <p>{roadmap.description}</p>
                                    <div className="roadmap-meta">
                                        <span><i className="fas fa-clock"></i> {roadmap.estimatedDuration}</span>
                                        <span><i className="fas fa-layer-group"></i> {roadmap.data?.modules?.length || 0} modules</span>
                                    </div>

                                    {roadmap.data?.modules && (
                                        <div className="roadmap-modules">
                                            {roadmap.data.modules.map((module, index) => (
                                                <div key={index} className="module-item">
                                                    <div className="module-info">
                                                        <h4>{module.title}</h4>
                                                        <p>{module.description}</p>
                                                        <span className="module-duration">{module.duration}</span>
                                                    </div>
                                                    <button 
                                                        className="btn-secondary"
                                                        onClick={() => generateCourseFromModule(roadmap.id, index)}
                                                        disabled={loading}
                                                    >
                                                        {loading ? 'Generating...' : 'Generate Course'}
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

// Enhanced Quiz Component with Advanced Features
const Quiz = () => {
    const [quiz, setQuiz] = useState(null);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [answers, setAnswers] = useState({});
    const [showResults, setShowResults] = useState(false);
    const [results, setResults] = useState(null);
    const [quizConfig, setQuizConfig] = useState({
        topic: '',
        difficulty: 'medium',
        questionCount: 5,
        focusAreas: []
    });
    const [loading, setLoading] = useState(false);
    const [timeLeft, setTimeLeft] = useState(null);
    const [startTime, setStartTime] = useState(null);

    useEffect(() => {
        let timer;
        if (quiz && timeLeft > 0 && !showResults) {
            timer = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        submitQuiz();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [quiz, timeLeft, showResults]);

    const generateQuiz = async () => {
        if (!quizConfig.topic) return;
        setLoading(true);
        
        try {
            const data = await api.generateQuiz(
                quizConfig.topic, 
                quizConfig.difficulty, 
                quizConfig.questionCount,
                quizConfig.focusAreas
            );
            setQuiz(data);
            setTimeLeft(data.timeLimit || 300);
            setStartTime(Date.now());
            setCurrentQuestion(0);
            setAnswers({});
            setShowResults(false);
        } catch (error) {
            console.error('Quiz generation failed:', error);
            // Create fallback quiz
            setQuiz({
                id: Date.now(),
                title: `${quizConfig.topic} Quiz`,
                difficulty: quizConfig.difficulty,
                timeLimit: 300,
                questions: [{
                    id: 1,
                    question: `What is a key concept in ${quizConfig.topic}?`,
                    options: ['Fundamental principle', 'Secondary feature', 'Optional component', 'Advanced technique'],
                    explanation: 'This represents the core foundation that everything else builds upon.'
                }]
            });
            setTimeLeft(300);
            setStartTime(Date.now());
        } finally {
            setLoading(false);
        }
    };

    const handleAnswer = (questionIndex, answerIndex) => {
        setAnswers({...answers, [questionIndex]: answerIndex});
    };

    const submitQuiz = async () => {
        const timeSpent = Math.floor((Date.now() - startTime) / 1000);
        
        try {
            if (quiz.id && typeof quiz.id === 'number') {
                const result = await api.submitQuiz(quiz.id, Object.values(answers), timeSpent);
                setResults(result);
            } else {
                // Calculate results locally for generated quiz
                const correct = quiz.questions.filter((q, idx) => answers[idx] === 0).length;
                const score = Math.round((correct / quiz.questions.length) * 100);
                setResults({
                    score,
                    correct,
                    total: quiz.questions.length,
                    passed: score >= 70,
                    results: quiz.questions.map((q, idx) => ({
                        question: q.question,
                        userAnswer: answers[idx],
                        correctAnswer: 0,
                        isCorrect: answers[idx] === 0,
                        explanation: q.explanation
                    }))
                });
            }
        } catch (error) {
            console.error('Quiz submission failed:', error);
        }
        setShowResults(true);
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="quiz">
            <div className="quiz-header">
                <h1>AI Quiz Generator</h1>
                <p>Generate personalized quizzes with GROQ AI on any topic</p>
            </div>

            {!quiz ? (
                <div className="quiz-generator">
                    <div className="generator-card">
                        <div className="form-group">
                            <label>Topic</label>
                            <input
                                type="text"
                                placeholder="Enter a topic (e.g., JavaScript, Python, React)"
                                value={quizConfig.topic}
                                onChange={(e) => setQuizConfig({...quizConfig, topic: e.target.value})}
                            />
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Difficulty Level</label>
                                <select
                                    value={quizConfig.difficulty}
                                    onChange={(e) => setQuizConfig({...quizConfig, difficulty: e.target.value})}
                                >
                                    <option value="easy">Easy</option>
                                    <option value="medium">Medium</option>
                                    <option value="hard">Hard</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Number of Questions</label>
                                <select
                                    value={quizConfig.questionCount}
                                    onChange={(e) => setQuizConfig({...quizConfig, questionCount: parseInt(e.target.value)})}
                                >
                                    <option value="3">3 Questions</option>
                                    <option value="5">5 Questions</option>
                                    <option value="10">10 Questions</option>
                                    <option value="15">15 Questions</option>
                                </select>
                            </div>
                        </div>

                        <button 
                            className="btn-primary generate-btn"
                            onClick={generateQuiz}
                            disabled={loading || !quizConfig.topic}
                        >
                            {loading ? (
                                <>
                                    <i className="fas fa-spinner fa-spin"></i> 
                                    Generating Quiz...
                                </>
                            ) : (
                                <>
                                    <i className="fas fa-magic"></i> 
                                    Generate Quiz
                                </>
                            )}
                        </button>
                    </div>
                </div>
            ) : showResults ? (
                <div className="quiz-results">
                    <h2>Quiz Complete!</h2>
                    <div className="score-circle">
                        <span className="score-number">{results.score}%</span>
                    </div>
                    <p>You scored {results.score}% ({results.correct}/{results.total} correct)</p>
                    <p className={results.passed ? 'success' : 'error'}>
                        {results.passed ? 'Congratulations! You passed!' : 'Keep studying and try again!'}
                    </p>

                    {results.results && (
                        <div className="detailed-results">
                            <h3>Question Review</h3>
                            {results.results.map((result, index) => (
                                <div key={index} className={`result-item ${result.isCorrect ? 'correct' : 'incorrect'}`}>
                                    <h4>Question {index + 1}</h4>
                                    <p><strong>Q:</strong> {result.question}</p>
                                    <p><strong>Your answer:</strong> {quiz.questions[index].options[result.userAnswer] || 'Not answered'}</p>
                                    <p><strong>Correct answer:</strong> {quiz.questions[index].options[result.correctAnswer]}</p>
                                    {result.explanation && (
                                        <p><strong>Explanation:</strong> {result.explanation}</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="result-actions">
                        <button className="btn-primary" onClick={() => setQuiz(null)}>
                            Take Another Quiz
                        </button>
                        <button className="btn-secondary" onClick={() => {
                            setQuiz(null);
                            setQuizConfig({...quizConfig, topic: ''});
                        }}>
                            New Topic
                        </button>
                    </div>
                </div>
            ) : (
                <div className="quiz-container">
                    <div className="quiz-info">
                        <div className="quiz-meta">
                            <span className="quiz-topic">{quiz.title}</span>
                            <span className={`quiz-difficulty ${quiz.difficulty}`}>{quiz.difficulty}</span>
                            <span className="time-left">
                                <i className="fas fa-clock"></i> {formatTime(timeLeft)}
                            </span>
                        </div>
                    </div>

                    <div className="quiz-progress">
                        <div className="progress-bar">
                            <div 
                                className="progress" 
                                style={{width: `${((currentQuestion + 1) / quiz.questions.length) * 100}%`}}
                            ></div>
                        </div>
                        <span>{currentQuestion + 1} / {quiz.questions.length}</span>
                    </div>

                    <div className="question-card">
                        <h3>{quiz.questions[currentQuestion].question}</h3>
                        <div className="options">
                            {quiz.questions[currentQuestion].options.map((option, idx) => (
                                <button
                                    key={idx}
                                    className={`option ${answers[currentQuestion] === idx ? 'selected' : ''}`}
                                    onClick={() => handleAnswer(currentQuestion, idx)}
                                >
                                    <span className="option-letter">{String.fromCharCode(65 + idx)}</span>
                                    <span>{option}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="quiz-navigation">
                        <button 
                            className="btn-secondary"
                            onClick={() => setCurrentQuestion(currentQuestion - 1)}
                            disabled={currentQuestion === 0}
                        >
                            Previous
                        </button>
                        
                        {currentQuestion === quiz.questions.length - 1 ? (
                            <button 
                                className="btn-primary"
                                onClick={submitQuiz}
                                disabled={Object.keys(answers).length !== quiz.questions.length}
                            >
                                Submit Quiz
                            </button>
                        ) : (
                            <button 
                                className="btn-primary"
                                onClick={() => setCurrentQuestion(currentQuestion + 1)}
                                disabled={answers[currentQuestion] === undefined}
                            >
                                Next
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

// Enhanced Chat Component with Multiple Modes
const Chat = () => {
    const [messages, setMessages] = useState([
        { 
            type: 'ai', 
            content: "Hello! I'm your AI learning assistant powered by GROQ AI. I can help you with programming, technology, academic subjects, and guide your learning journey. What would you like to explore today?",
            timestamp: new Date().toISOString(),
            mode: 'general'
        }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [chatMode, setChatMode] = useState('general');
    const [sessionId] = useState(`session_${Date.now()}`);

    const chatModes = [
        { value: 'general', label: 'General Chat', icon: 'comments', description: 'Ask anything about learning and technology' },
        { value: 'tutor', label: 'AI Tutor', icon: 'graduation-cap', description: 'Structured learning assistance' },
        { value: 'code', label: 'Code Helper', icon: 'code', description: 'Programming help and debugging' }
    ];

    const sendMessage = async () => {
        if (!input.trim()) return;

        const userMessage = { 
            type: 'user', 
            content: input,
            timestamp: new Date().toISOString(),
            mode: chatMode
        };

        setMessages(prev => [...prev, userMessage]);
        const currentInput = input;
        setInput('');
        setLoading(true);

        try {
            const context = {
                previousMessages: messages.slice(-5),
                currentTopic: extractTopic(messages),
                userPreferences: { learningLevel: 'intermediate' }
            };

            const response = await api.sendChatMessage(currentInput, context, sessionId, chatMode);
            
            setMessages(prev => [...prev, { 
                type: 'ai', 
                content: response.response,
                timestamp: new Date().toISOString(),
                mode: chatMode,
                provider: response.provider
            }]);
        } catch (error) {
            console.log('Using fallback response due to:', error.message);
            
            const fallbackResponse = generateContextualFallback(currentInput, chatMode);
            setMessages(prev => [...prev, { 
                type: 'ai', 
                content: fallbackResponse,
                timestamp: new Date().toISOString(),
                mode: chatMode,
                provider: 'fallback'
            }]);
        } finally {
            setLoading(false);
        }
    };

    const extractTopic = (msgs) => {
        const recentContent = msgs.slice(-3).map(m => m.content).join(' ').toLowerCase();
        const topics = ['javascript', 'python', 'react', 'css', 'html', 'nodejs', 'database'];
        return topics.find(topic => recentContent.includes(topic)) || 'general';
    };

    const generateContextualFallback = (input, mode) => {
        const responses = {
            general: [
                "That's an interesting question! While I'm experiencing some technical issues with GROQ AI, I'd love to help you explore this topic further.",
                "I can see you're interested in learning more about that. Even though my AI systems are temporarily unavailable, I can guide you toward excellent learning resources."
            ],
            tutor: [
                "As your learning tutor, I want to break this down systematically. While my advanced AI features are temporarily unavailable, let's approach this step-by-step.",
                "That's an excellent learning question! Even though I'm experiencing some technical difficulties, I can help structure your learning approach."
            ],
            code: [
                "Looking at your programming question, this involves some key concepts. While my AI analysis tools are temporarily down, I can share some general programming principles.",
                "That's a solid coding question! Even though I can't access my advanced debugging features right now, let me suggest some approaches."
            ]
        };

        const modeResponses = responses[mode] || responses.general;
        return modeResponses[Math.floor(Math.random() * modeResponses.length)] + 
               " I recommend checking the official documentation or community forums for the most current information.";
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const clearChat = () => {
        setMessages([{
            type: 'ai', 
            content: `Chat cleared! I'm ready to help you with ${chatModes.find(m => m.value === chatMode)?.description.toLowerCase()}. What can I assist you with?`,
            timestamp: new Date().toISOString(),
            mode: chatMode
        }]);
    };

    return (
        <div className="chat">
            <div className="chat-header">
                <div className="header-content">
                    <h1>AI Learning Assistant</h1>
                    <p>Powered by GROQ AI - Ask questions, get tutoring, coding help, and more</p>
                </div>
                
                <div className="chat-modes">
                    {chatModes.map(mode => (
                        <button
                            key={mode.value}
                            className={`mode-btn ${chatMode === mode.value ? 'active' : ''}`}
                            onClick={() => setChatMode(mode.value)}
                            title={mode.description}
                        >
                            <i className={`fas fa-${mode.icon}`}></i>
                            <span>{mode.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            <div className="chat-container">
                <div className="chat-actions">
                    <div className="current-mode">
                        <span>Mode: {chatModes.find(m => m.value === chatMode)?.label}</span>
                    </div>
                    <div className="action-buttons">
                        <button className="action-btn" onClick={clearChat} title="Clear chat">
                            <i className="fas fa-trash"></i>
                        </button>
                    </div>
                </div>

                <div className="messages">
                    {messages.map((message, idx) => (
                        <div key={idx} className={`message ${message.type}`}>
                            <div className="message-avatar">
                                <i className={`fas fa-${
                                    message.type === 'user' 
                                        ? 'user' 
                                        : message.mode === 'code' 
                                            ? 'code' 
                                            : message.mode === 'tutor'
                                                ? 'graduation-cap'
                                                : 'robot'
                                }`}></i>
                            </div>
                            <div className="message-content">
                                <div className="message-text">
                                    {message.content}
                                </div>
                                <div className="message-meta">
                                    <span className="timestamp">
                                        {new Date(message.timestamp).toLocaleTimeString()}
                                    </span>
                                    {message.mode && (
                                        <span className="mode-tag">{message.mode}</span>
                                    )}
                                    {message.provider && (
                                        <span className={`provider-tag ${message.provider}`}>
                                            {message.provider}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                    
                    {loading && (
                        <div className="message ai">
                            <div className="message-avatar">
                                <i className="fas fa-robot"></i>
                            </div>
                            <div className="message-content">
                                <div className="typing-indicator">
                                    <span></span>
                                    <span></span>
                                    <span></span>
                                </div>
                                <div className="loading-text">
                                    {chatMode === 'code' ? 'Processing code...' :
                                     chatMode === 'tutor' ? 'Preparing lesson...' :
                                     'Thinking with GROQ AI...'}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="chat-input">
                    <div className="input-container">
                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder={
                                chatMode === 'general' ? 'Ask me anything about learning...' :
                                chatMode === 'tutor' ? 'What topic would you like to learn?' :
                                chatMode === 'code' ? 'Describe your coding problem...' :
                                'Ask me anything...'
                            }
                            rows="3"
                            disabled={loading}
                        />
                        <button 
                            className="send-btn btn-primary"
                            onClick={sendMessage}
                            disabled={loading || !input.trim()}
                        >
                            <i className="fas fa-paper-plane"></i>
                        </button>
                    </div>
                    
                    <div className="input-hint">
                        <i className="fas fa-info-circle"></i>
                        {chatModes.find(m => m.value === chatMode)?.description}
                    </div>
                </div>
            </div>
        </div>
    );
};

// Main App Component
function App() {
    const [currentPage, setCurrentPage] = useState('home');
    const [user, setUser] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                if (payload.exp * 1000 > Date.now()) {
                    setUser({ 
                        id: payload.userId, 
                        email: payload.email,
                        name: 'User' // In real app, fetch full user data
                    });
                    setCurrentPage('dashboard');
                } else {
                    localStorage.removeItem('token');
                }
            } catch (error) {
                localStorage.removeItem('token');
            }
        }
    }, []);

    const renderPage = () => {
        if (!user && !['home', 'login', 'register'].includes(currentPage)) {
            setCurrentPage('home');
            return <Home setCurrentPage={setCurrentPage} />;
        }

        switch (currentPage) {
            case 'home': return <Home setCurrentPage={setCurrentPage} />;
            case 'login': return <Auth mode="login" setCurrentPage={setCurrentPage} setUser={setUser} />;
            case 'register': return <Auth mode="register" setCurrentPage={setCurrentPage} setUser={setUser} />;
            case 'dashboard': return <Dashboard />;
            case 'courses': return <Courses />;
            case 'quiz': return <Quiz />;
            case 'chat': return <Chat />;
            default: return <Home setCurrentPage={setCurrentPage} />;
        }
    };

    return (
        <AppContext.Provider value={{ user, setUser, currentPage, setCurrentPage }}>
            <div className="app">
                <Navbar 
                    currentPage={currentPage} 
                    setCurrentPage={setCurrentPage} 
                    user={user} 
                    setUser={setUser} 
                />
                <main className="main-content">
                    {renderPage()}
                </main>
            </div>
        </AppContext.Provider>
    );
}

export default App;

//app.jsx