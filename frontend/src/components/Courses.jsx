// Enhanced Courses Component
const Courses = () => {
    const [courses, setCourses] = useState([]);
    const [roadmaps, setRoadmaps] = useState([]);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('browse'); // 'browse', 'create', 'roadmaps'
    const [newCourse, setNewCourse] = useState({
        topic: '',
        level: 'beginner',
        duration: 'medium'
    });
    const [generatingRoadmap, setGeneratingRoadmap] = useState(false);

    useEffect(() => {
        loadCourses();
        loadRoadmaps();
    }, []);

    const loadCourses = async () => {
        try {
            const data = await api.getCourses();
            setCourses(data);
        } catch (error) {
            // Use mock data as fallback
            setCourses([
                { id: 1, title: 'React Fundamentals', description: 'Learn React from scratch', lessons: 12, duration: '4h', difficulty: 'Beginner', progress: 75 },
                { id: 2, title: 'JavaScript Advanced', description: 'Advanced JS concepts', lessons: 18, duration: '6h', difficulty: 'Advanced', progress: 45 },
                { id: 3, title: 'CSS Mastery', description: 'Master modern CSS', lessons: 10, duration: '3h', difficulty: 'Intermediate', progress: 90 }
            ]);
        }
    };

    const loadRoadmaps = async () => {
        // Load existing roadmaps from localStorage or API
        const saved = localStorage.getItem('learningRoadmaps');
        if (saved) {
            setRoadmaps(JSON.parse(saved));
        }
    };

    const generateRoadmap = async () => {
        if (!newCourse.topic) return;
        
        setGeneratingRoadmap(true);
        try {
            const roadmap = await api.generateRoadmap(newCourse.topic, newCourse.level);
            const newRoadmap = {
                id: Date.now(),
                ...roadmap,
                createdAt: new Date().toISOString(),
                progress: 0
            };
            
            const updatedRoadmaps = [...roadmaps, newRoadmap];
            setRoadmaps(updatedRoadmaps);
            localStorage.setItem('learningRoadmaps', JSON.stringify(updatedRoadmaps));
            
            setActiveTab('roadmaps');
        } catch (error) {
            // Fallback roadmap generation
            const mockRoadmap = {
                id: Date.now(),
                topic: newCourse.topic,
                level: newCourse.level,
                title: `${newCourse.topic} Learning Path`,
                description: `Comprehensive learning path for ${newCourse.topic}`,
                estimatedDuration: newCourse.duration === 'short' ? '2-4 weeks' : 
                                 newCourse.duration === 'medium' ? '6-8 weeks' : '3-4 months',
                modules: [
                    {
                        title: `${newCourse.topic} Fundamentals`,
                        description: `Learn the basics of ${newCourse.topic}`,
                        lessons: ['Introduction', 'Core Concepts', 'Basic Syntax', 'First Project'],
                        duration: '1-2 weeks',
                        difficulty: 'Beginner'
                    },
                    {
                        title: `Intermediate ${newCourse.topic}`,
                        description: `Build upon the fundamentals`,
                        lessons: ['Advanced Features', 'Best Practices', 'Common Patterns', 'Real-world Examples'],
                        duration: '2-3 weeks',
                        difficulty: 'Intermediate'
                    },
                    {
                        title: `Advanced ${newCourse.topic}`,
                        description: `Master advanced concepts`,
                        lessons: ['Expert Techniques', 'Performance Optimization', 'Advanced Patterns', 'Capstone Project'],
                        duration: '2-3 weeks',
                        difficulty: 'Advanced'
                    }
                ],
                skills: [`${newCourse.topic} Development`, 'Problem Solving', 'Project Building'],
                prerequisites: newCourse.level === 'beginner' ? ['Basic computer skills'] : [`Basic ${newCourse.topic}`],
                createdAt: new Date().toISOString(),
                progress: 0
            };
            
            const updatedRoadmaps = [...roadmaps, mockRoadmap];
            setRoadmaps(updatedRoadmaps);
            localStorage.setItem('learningRoadmaps', JSON.stringify(updatedRoadmaps));
            setActiveTab('roadmaps');
        } finally {
            setGeneratingRoadmap(false);
        }
    };

    const generateCourseFromRoadmap = async (roadmap, moduleIndex) => {
        try {
            setLoading(true);
            const courseContent = await api.generateCourseContent(roadmap.id, moduleIndex);
            
            // Add generated course to courses list
            const newCourse = {
                id: Date.now(),
                title: roadmap.modules[moduleIndex].title,
                description: roadmap.modules[moduleIndex].description,
                content: courseContent,
                difficulty: roadmap.modules[moduleIndex].difficulty,
                lessons: roadmap.modules[moduleIndex].lessons.length,
                duration: roadmap.modules[moduleIndex].duration,
                roadmapId: roadmap.id,
                moduleIndex
            };
            
            setCourses(prev => [...prev, newCourse]);
            alert('Course generated successfully!');
        } catch (error) {
            alert('Error generating course. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="courses">
            <div className="courses-header">
                <h1>Learning Center</h1>
                <p>Discover courses, create learning paths, and track your progress</p>
            </div>

            {/* Tab Navigation */}
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
                    <i className="fas fa-plus-circle"></i> Create Learning Path
                </button>
                <button 
                    className={`tab ${activeTab === 'roadmaps' ? 'active' : ''}`}
                    onClick={() => setActiveTab('roadmaps')}
                >
                    <i className="fas fa-route"></i> My Roadmaps ({roadmaps.length})
                </button>
            </div>

            {/* Browse Courses Tab */}
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
                            {course.progress !== undefined && (
                                <div className="course-progress">
                                    <div className="progress-bar">
                                        <div className="progress" style={{width: `${course.progress}%`}}></div>
                                    </div>
                                    <span className="progress-text">{course.progress}% Complete</span>
                                </div>
                            )}
                            <button className="btn-primary">
                                {course.progress ? 'Continue Learning' : 'Start Course'}
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Create Learning Path Tab */}
            {activeTab === 'create' && (
                <div className="roadmap-creator">
                    <div className="creator-card">
                        <h3>Generate AI-Powered Learning Roadmap</h3>
                        <p>Let AI create a personalized learning path tailored to your goals</p>
                        
                        <div className="form-group">
                            <label>What do you want to learn?</label>
                            <input
                                type="text"
                                placeholder="e.g., React, Python, Machine Learning, Web Development"
                                value={newCourse.topic}
                                onChange={(e) => setNewCourse({...newCourse, topic: e.target.value})}
                            />
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Your Level</label>
                                <select 
                                    value={newCourse.level}
                                    onChange={(e) => setNewCourse({...newCourse, level: e.target.value})}
                                >
                                    <option value="beginner">Complete Beginner</option>
                                    <option value="intermediate">Some Experience</option>
                                    <option value="advanced">Advanced</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Time Commitment</label>
                                <select 
                                    value={newCourse.duration}
                                    onChange={(e) => setNewCourse({...newCourse, duration: e.target.value})}
                                >
                                    <option value="short">Quick (2-4 weeks)</option>
                                    <option value="medium">Standard (6-8 weeks)</option>
                                    <option value="long">Comprehensive (3-4 months)</option>
                                </select>
                            </div>
                        </div>

                        <button 
                            className="btn-primary generate-btn"
                            onClick={generateRoadmap}
                            disabled={generatingRoadmap || !newCourse.topic}
                        >
                            {generatingRoadmap ? (
                                <><i className="fas fa-spinner fa-spin"></i> Generating Roadmap...</>
                            ) : (
                                <><i className="fas fa-magic"></i> Generate Learning Roadmap</>
                            )}
                        </button>
                    </div>
                </div>
            )}

            {/* My Roadmaps Tab */}
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
                                        <span><i className="fas fa-layer-group"></i> {roadmap.modules?.length} modules</span>
                                    </div>

                                    <div className="roadmap-progress">
                                        <div className="progress-bar">
                                            <div className="progress" style={{width: `${roadmap.progress}%`}}></div>
                                        </div>
                                        <span>{roadmap.progress}% Complete</span>
                                    </div>

                                    <div className="roadmap-modules">
                                        {roadmap.modules?.map((module, index) => (
                                            <div key={index} className="module-item">
                                                <div className="module-info">
                                                    <h4>{module.title}</h4>
                                                    <p>{module.description}</p>
                                                    <span className="module-duration">{module.duration}</span>
                                                </div>
                                                <button 
                                                    className="btn-secondary"
                                                    onClick={() => generateCourseFromRoadmap(roadmap, index)}
                                                    disabled={loading}
                                                >
                                                    {loading ? 'Generating...' : 'Generate Course'}
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};