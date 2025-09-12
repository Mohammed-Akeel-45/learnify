// models/index.js - MySQL Database Models
const { Sequelize, DataTypes } = require('sequelize');
const { sequelize } = require('../database');

// User Model
const User = sequelize.define('User', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
            len: [2, 100]
        }
    },
    email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true
        }
    },
    password: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
            len: [6, 255]
        }
    },
    profile: {
        type: DataTypes.JSON,
        defaultValue: {}
    },
    preferences: {
        type: DataTypes.JSON,
        defaultValue: {
            learningLevel: 'beginner',
            interests: [],
            notifications: true
        }
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    lastLoginAt: {
        type: DataTypes.DATE,
        allowNull: true
    }
}, {
    timestamps: true,
    tableName: 'users',
    indexes: [
        { fields: ['email'] },
        { fields: ['isActive'] }
    ]
});

// Course Model
const Course = sequelize.define('Course', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    title: {
        type: DataTypes.STRING(200),
        allowNull: false,
        validate: {
            len: [3, 200]
        }
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    difficulty: {
        type: DataTypes.ENUM('Beginner', 'Intermediate', 'Advanced'),
        allowNull: false,
        defaultValue: 'Beginner'
    },
    category: {
        type: DataTypes.STRING(100),
        defaultValue: 'General'
    },
    tags: {
        type: DataTypes.JSON, // MySQL JSON field for tags array
        defaultValue: []
    },
    duration: {
        type: DataTypes.STRING(50),
        comment: 'e.g., "4h", "2 weeks"'
    },
    lessons: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    content: {
        type: DataTypes.JSON, // Store structured course content
        defaultValue: {}
    },
    roadmapId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'roadmaps',
            key: 'id'
        }
    },
    moduleIndex: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    isPublished: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    createdBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    viewCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    rating: {
        type: DataTypes.DECIMAL(3, 2),
        defaultValue: 0.0
    }
}, {
    timestamps: true,
    tableName: 'courses',
    indexes: [
        { fields: ['difficulty'] },
        { fields: ['category'] },
        { fields: ['isPublished'] },
        { fields: ['createdBy'] },
        { fields: ['roadmapId'] }
    ]
});

// Quiz Model
const Quiz = sequelize.define('Quiz', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    title: {
        type: DataTypes.STRING(200),
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    topic: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    difficulty: {
        type: DataTypes.ENUM('easy', 'medium', 'hard'),
        allowNull: false,
        defaultValue: 'medium'
    },
    questions: {
        type: DataTypes.JSON, // MySQL JSON field for questions array
        allowNull: false,
        defaultValue: []
    },
    timeLimit: {
        type: DataTypes.INTEGER,
        defaultValue: 300,
        comment: 'Time limit in seconds'
    },
    passingScore: {
        type: DataTypes.INTEGER,
        defaultValue: 70,
        comment: 'Passing score percentage'
    },
    tags: {
        type: DataTypes.JSON,
        defaultValue: []
    },
    isPublished: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    createdBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    attemptCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    averageScore: {
        type: DataTypes.DECIMAL(5, 2),
        defaultValue: 0.0
    }
}, {
    timestamps: true,
    tableName: 'quizzes',
    indexes: [
        { fields: ['topic'] },
        { fields: ['difficulty'] },
        { fields: ['isPublished'] },
        { fields: ['createdBy'] }
    ]
});

// Quiz Attempt Model
const QuizAttempt = sequelize.define('QuizAttempt', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    quizId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'quizzes',
            key: 'id'
        }
    },
    answers: {
        type: DataTypes.JSON, // Store user answers as JSON
        allowNull: false
    },
    score: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    timeSpent: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        comment: 'Time spent in seconds'
    },
    passed: {
        type: DataTypes.BOOLEAN,
        allowNull: false
    },
    results: {
        type: DataTypes.JSON, // Detailed results per question
        defaultValue: {}
    },
    completedAt: {
        type: DataTypes.DATE,
        allowNull: false
    }
}, {
    timestamps: true,
    tableName: 'quiz_attempts',
    indexes: [
        { fields: ['userId'] },
        { fields: ['quizId'] },
        { fields: ['completedAt'] },
        { fields: ['userId', 'quizId'] }
    ]
});

// Roadmap Model
const Roadmap = sequelize.define('Roadmap', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    title: {
        type: DataTypes.STRING(200),
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    topic: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    level: {
        type: DataTypes.ENUM('beginner', 'intermediate', 'advanced'),
        allowNull: false
    },
    duration: {
        type: DataTypes.ENUM('short', 'medium', 'long'),
        allowNull: false
    },
    estimatedDuration: {
        type: DataTypes.STRING(50),
        comment: 'e.g., "8-12 weeks"'
    },
    data: {
        type: DataTypes.JSON, // Complete roadmap structure
        allowNull: false
    },
    progress: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        comment: 'Progress percentage'
    },
    status: {
        type: DataTypes.ENUM('active', 'completed', 'paused', 'archived'),
        defaultValue: 'active'
    },
    completedModules: {
        type: DataTypes.JSON, // Array of completed module indices
        defaultValue: []
    },
    currentModule: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    }
}, {
    timestamps: true,
    tableName: 'roadmaps',
    indexes: [
        { fields: ['userId'] },
        { fields: ['topic'] },
        { fields: ['level'] },
        { fields: ['status'] }
    ]
});

// Chat Session Model
const ChatSession = sequelize.define('ChatSession', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    sessionId: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    userMessage: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    aiResponse: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    mode: {
        type: DataTypes.ENUM('general', 'tutor', 'code', 'pdf'),
        defaultValue: 'general'
    },
    provider: {
        type: DataTypes.STRING(50),
        defaultValue: 'groq'
    },
    context: {
        type: DataTypes.JSON,
        defaultValue: {}
    },
    metadata: {
        type: DataTypes.JSON,
        defaultValue: {}
    },
    rating: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: '1-5 user rating for response quality'
    }
}, {
    timestamps: true,
    tableName: 'chat_sessions',
    indexes: [
        { fields: ['userId'] },
        { fields: ['sessionId'] },
        { fields: ['mode'] },
        { fields: ['createdAt'] }
    ]
});

// User Progress Model
const UserProgress = sequelize.define('UserProgress', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    resourceType: {
        type: DataTypes.ENUM('course', 'quiz', 'roadmap'),
        allowNull: false
    },
    resourceId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    progress: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        comment: 'Progress percentage'
    },
    timeSpent: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        comment: 'Time spent in seconds'
    },
    lastAccessed: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    completed: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    completedAt: {
        type: DataTypes.DATE,
        allowNull: true
    },
    data: {
        type: DataTypes.JSON, // Additional progress data
        defaultValue: {}
    }
}, {
    timestamps: true,
    tableName: 'user_progress',
    indexes: [
        { fields: ['userId'] },
        { fields: ['resourceType', 'resourceId'] },
        { fields: ['userId', 'resourceType', 'resourceId'], unique: true }
    ]
});

// Define Associations
User.hasMany(Course, { foreignKey: 'createdBy', as: 'createdCourses' });
User.hasMany(Quiz, { foreignKey: 'createdBy', as: 'createdQuizzes' });
User.hasMany(QuizAttempt, { foreignKey: 'userId' });
User.hasMany(Roadmap, { foreignKey: 'userId' });
User.hasMany(ChatSession, { foreignKey: 'userId' });
User.hasMany(UserProgress, { foreignKey: 'userId' });

Course.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
Course.belongsTo(Roadmap, { foreignKey: 'roadmapId' });

Quiz.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
Quiz.hasMany(QuizAttempt, { foreignKey: 'quizId' });

QuizAttempt.belongsTo(User, { foreignKey: 'userId' });
QuizAttempt.belongsTo(Quiz, { foreignKey: 'quizId' });

Roadmap.belongsTo(User, { foreignKey: 'userId' });
Roadmap.hasMany(Course, { foreignKey: 'roadmapId' });

ChatSession.belongsTo(User, { foreignKey: 'userId' });

UserProgress.belongsTo(User, { foreignKey: 'userId' });

// Export models and sequelize instance
module.exports = {
    sequelize,
    User,
    Course,
    Quiz,
    QuizAttempt,
    Roadmap,
    ChatSession,
    UserProgress,
    
    // Database connection function
    connectDB: async () => {
        try {
            await sequelize.authenticate();
            console.log('Database connected successfully');
            
            // Sync models in development
            if (process.env.NODE_ENV === 'development') {
                await sequelize.sync({ alter: true });
                console.log('Database models synchronized');
                
                // Create initial data
                await createInitialData();
            }
        } catch (error) {
            console.error('Database connection failed:', error);
            process.exit(1);
        }
    }
};

// Create initial demo data
const createInitialData = async () => {
    try {
        // Check if data exists
        const userCount = await User.count();
        if (userCount > 0) {
            console.log('Initial data already exists, skipping...');
            return;
        }
        
        console.log('Creating initial demo data...');
        
        // Create demo courses
        const demoCourses = [
            {
                title: 'JavaScript Fundamentals',
                description: 'Learn the basics of JavaScript programming',
                difficulty: 'Beginner',
                category: 'Programming',
                tags: ['javascript', 'programming', 'web-development'],
                duration: '4-6 hours',
                lessons: 12,
                isPublished: true,
                content: {
                    modules: [
                        {
                            title: 'Introduction to JavaScript',
                            lessons: ['Variables', 'Data Types', 'Functions', 'Control Structures']
                        }
                    ]
                }
            },
            {
                title: 'React Basics',
                description: 'Introduction to React framework',
                difficulty: 'Intermediate',
                category: 'Frontend',
                tags: ['react', 'javascript', 'frontend'],
                duration: '6-8 hours',
                lessons: 15,
                isPublished: true
            },
            {
                title: 'Python for Data Science',
                description: 'Learn Python programming for data analysis',
                difficulty: 'Intermediate',
                category: 'Data Science',
                tags: ['python', 'data-science', 'analytics'],
                duration: '8-10 hours',
                lessons: 18,
                isPublished: true
            }
        ];
        
        await Course.bulkCreate(demoCourses);
        
        // Create demo quizzes
        const demoQuizzes = [
            {
                title: 'JavaScript Basics Quiz',
                description: 'Test your JavaScript fundamentals',
                topic: 'JavaScript',
                difficulty: 'medium',
                timeLimit: 300,
                passingScore: 70,
                isPublished: true,
                questions: [
                    {
                        id: 1,
                        question: 'What is the correct way to declare a variable in JavaScript?',
                        options: ['let variableName;', 'var variableName;', 'const variableName;', 'All of the above'],
                        correct: 3,
                        explanation: 'All three (let, var, const) are valid ways to declare variables in JavaScript.',
                        tags: ['variables', 'syntax']
                    },
                    {
                        id: 2,
                        question: 'Which method is used to add an element to the end of an array?',
                        options: ['push()', 'pop()', 'shift()', 'unshift()'],
                        correct: 0,
                        explanation: 'The push() method adds elements to the end of an array.',
                        tags: ['arrays', 'methods']
                    }
                ]
            }
        ];
        
        await Quiz.bulkCreate(demoQuizzes);
        
        console.log(`Created ${demoCourses.length} demo courses and ${demoQuizzes.length} demo quizzes`);
        
    } catch (error) {
        console.error('Error creating initial data:', error.message);
    }
};