const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const { body, validationResult } = require('express-validator');
const { User, Course, Quiz, QuizAttempt, ChatSession, Roadmap } = require('./models');
const { auth } = require('./middleware');
const aiService = require('./services/ai');
const { sendEmail } = require('./services/email');

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
    dest: 'uploads/',
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only PDF files are allowed'), false);
        }
    }
});

// Auth routes (existing - keeping as is)
router.post('/auth/register', [
    body('name').notEmpty().withMessage('Name required'),
    body('email').isEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 6 }).withMessage('Password min 6 chars')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { name, email, password } = req.body;
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({ name, email, password: hashedPassword });

        const token = jwt.sign(
            { userId: user.id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(201).json({
            message: 'User registered successfully',
            token,
            user: { id: user.id, name: user.name, email: user.email }
        });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.post('/auth/login', [
    body('email').isEmail().withMessage('Valid email required'),
    body('password').notEmpty().withMessage('Password required')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { email, password } = req.body;
        const user = await User.findOne({ where: { email } });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { userId: user.id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            message: 'Login successful',
            token,
            user: { id: user.id, name: user.name, email: user.email }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Enhanced Course Routes
router.get('/courses', async (req, res) => {
    try {
        const { difficulty, category, search } = req.query;
        let where = { isPublished: true };

        if (difficulty) where.difficulty = difficulty;
        if (category) where.category = category;
        if (search) {
            where[Op.or] = [
                { title: { [Op.iLike]: `%${search}%` } },
                { description: { [Op.iLike]: `%${search}%` } }
            ];
        }

        const courses = await Course.findAll({
            where,
            attributes: ['id', 'title', 'description', 'difficulty', 'duration', 'lessons', 'category', 'tags'],
            order: [['createdAt', 'DESC']]
        });

        res.json(courses);
    } catch (error) {
        console.error('Get courses error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.get('/courses/:id', async (req, res) => {
    try {
        const course = await Course.findByPk(req.params.id);
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }
        res.json(course);
    } catch (error) {
        console.error('Get course error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Enhanced Roadmap Generation
router.post('/courses/generate-roadmap', auth, [
    body('topic').notEmpty().withMessage('Topic is required'),
    body('level').isIn(['beginner', 'intermediate', 'advanced']).withMessage('Invalid level'),
    body('duration').isIn(['short', 'medium', 'long']).withMessage('Invalid duration')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { topic, level, duration, focusAreas } = req.body;
        const userId = req.userId;

        // Generate roadmap using AI service
        const roadmapData = await aiService.generateRoadmap(topic, level, duration);

        // Save roadmap to database
        const roadmap = await Roadmap.create({
            userId,
            title: roadmapData.title,
            description: roadmapData.description,
            topic,
            level,
            duration,
            estimatedDuration: roadmapData.estimatedDuration,
            data: roadmapData, // Store full roadmap data
            status: 'active'
        });

        res.json({
            id: roadmap.id,
            ...roadmapData,
            createdAt: roadmap.createdAt
        });
    } catch (error) {
        console.error('Roadmap generation error:', error);
        // Return fallback roadmap
        const fallbackRoadmap = aiService.getFallbackRoadmap(req.body.topic, req.body.level, req.body.duration);
        res.json(fallbackRoadmap);
    }
});

// Course content generation from roadmap
router.post('/courses/generate-content', auth, [
    body('roadmapId').isInt().withMessage('Valid roadmap ID required'),
    body('moduleIndex').isInt().withMessage('Valid module index required')
], async (req, res) => {
    try {
        const { roadmapId, moduleIndex } = req.body;
        const userId = req.userId;

        // Get roadmap
        const roadmap = await Roadmap.findOne({
            where: { id: roadmapId, userId }
        });

        if (!roadmap) {
            return res.status(404).json({ message: 'Roadmap not found' });
        }

        // Generate course content
        const courseContent = await aiService.generateCourseContent(roadmap.data, moduleIndex);

        // Create course entry
        const course = await Course.create({
            title: courseContent.moduleTitle,
            description: roadmap.data.modules[moduleIndex].description,
            difficulty: roadmap.data.modules[moduleIndex].difficulty,
            content: courseContent,
            roadmapId,
            moduleIndex,
            isPublished: true,
            createdBy: userId
        });

        res.json({
            courseId: course.id,
            ...courseContent
        });
    } catch (error) {
        console.error('Course content generation error:', error);
        res.status(500).json({ message: 'Error generating course content' });
    }
});

// Get user roadmaps
router.get('/roadmaps', auth, async (req, res) => {
    try {
        const userId = req.userId;
        const roadmaps = await Roadmap.findAll({
            where: { userId },
            order: [['createdAt', 'DESC']]
        });
        res.json(roadmaps);
    } catch (error) {
        console.error('Get roadmaps error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Enhanced Quiz Generation
router.post('/quiz/generate', auth, [
    body('topic').notEmpty().withMessage('Topic is required'),
    body('difficulty').isIn(['easy', 'medium', 'hard']).withMessage('Invalid difficulty'),
    body('questionCount').isInt({ min: 3, max: 20 }).withMessage('Question count must be between 3-20')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { topic, difficulty = 'medium', questionCount = 5, focusAreas = [] } = req.body;
        const userId = req.userId;

        // Generate quiz using AI service
        const quizData = await aiService.generateQuiz(topic, difficulty, questionCount, focusAreas);

        // Save quiz to database
        const quiz = await Quiz.create({
            title: quizData.title,
            description: quizData.description,
            topic,
            difficulty,
            questions: quizData.questions,
            timeLimit: quizData.timeLimit,
            passingScore: quizData.passingScore,
            isPublished: true,
            createdBy: userId
        });

        res.json({
            id: quiz.id,
            title: quizData.title,
            description: quizData.description,
            difficulty,
            timeLimit: quizData.timeLimit,
            passingScore: quizData.passingScore,
            questions: quizData.questions.map(q => ({
                ...q,
                // Don't send correct answer to frontend
                correct: undefined
            }))
        });
    } catch (error) {
        console.error('Quiz generation error:', error);
        // Return fallback quiz
        const fallbackQuiz = aiService.getFallbackQuiz(req.body.topic, req.body.difficulty, req.body.questionCount);
        res.json(fallbackQuiz);
    }
});

// Submit quiz answers
router.post('/quiz/submit', auth, [
    body('quizId').isInt().withMessage('Valid quiz ID required'),
    body('answers').isArray().withMessage('Answers array required')
], async (req, res) => {
    try {
        const { quizId, answers, timeSpent } = req.body;
        const userId = req.userId;

        const quiz = await Quiz.findByPk(quizId);
        if (!quiz) {
            return res.status(404).json({ message: 'Quiz not found' });
        }

        // Calculate score
        const questions = quiz.questions;
        let correct = 0;
        const results = [];

        questions.forEach((question, index) => {
            const userAnswer = answers[index];
            const isCorrect = userAnswer === question.correct;
            if (isCorrect) correct++;

            results.push({
                questionId: question.id,
                question: question.question,
                userAnswer: userAnswer,
                correctAnswer: question.correct,
                options: question.options,
                isCorrect,
                explanation: question.explanation
            });
        });

        const score = Math.round((correct / questions.length) * 100);
        const passed = score >= quiz.passingScore;

        // Save attempt
        await QuizAttempt.create({
            userId,
            quizId,
            answers,
            score,
            timeSpent,
            passed,
            results,
            completedAt: new Date()
        });

        res.json({
            score,
            correct,
            total: questions.length,
            passed,
            passingScore: quiz.passingScore,
            results
        });
    } catch (error) {
        console.error('Quiz submit error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get quiz history
router.get('/quiz/history', auth, async (req, res) => {
    try {
        const userId = req.userId;
        const attempts = await QuizAttempt.findAll({
            where: { userId },
            include: [{
                model: Quiz,
                attributes: ['title', 'topic', 'difficulty']
            }],
            order: [['completedAt', 'DESC']],
            limit: 50
        });
        res.json(attempts);
    } catch (error) {
        console.error('Quiz history error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Enhanced Chat Routes
router.post('/chat/message', auth, [
    body('message').notEmpty().withMessage('Message is required')
], async (req, res) => {
    try {
        const { message, context, sessionId, mode = 'general' } = req.body;
        const userId = req.userId;

        const chatContext = {
            mode,
            sessionId: sessionId || `session_${Date.now()}`,
            userId,
            ...context
        };

        // Get recent messages for context
        if (sessionId) {
            const recentMessages = await ChatSession.findAll({
                where: { userId, sessionId },
                order: [['createdAt', 'DESC']],
                limit: 5
            });
            chatContext.previousMessages = recentMessages.reverse();
        }

        // Generate AI response
        const response = await aiService.generateAIResponse(message, chatContext);

        // Save chat session
        const chatSession = await ChatSession.create({
            userId,
            sessionId: chatContext.sessionId,
            userMessage: message,
            aiResponse: response,
            mode,
            provider: 'groq',
            context: context || null
        });

        res.json({
            response,
            provider: 'groq',
            sessionId: chatContext.sessionId,
            messageId: chatSession.id,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Chat error:', error);
        
        // Enhanced fallback based on message content
        const fallbackResponse = generateSmartFallback(req.body.message, req.body.mode);
        
        res.json({
            response: fallbackResponse,
            provider: 'fallback',
            sessionId: req.body.sessionId || `session_${Date.now()}`,
            timestamp: new Date().toISOString()
        });
    }
});

// Enhanced chat history
router.get('/chat/history', auth, async (req, res) => {
    try {
        const userId = req.userId;
        const { sessionId, limit = 50 } = req.query;

        let where = { userId };
        if (sessionId) where.sessionId = sessionId;

        const history = await ChatSession.findAll({
            where,
            order: [['createdAt', 'DESC']],
            limit: parseInt(limit),
            attributes: ['id', 'sessionId', 'userMessage', 'aiResponse', 'mode', 'provider', 'createdAt']
        });

        // Group by session
        const groupedHistory = {};
        history.forEach(chat => {
            if (!groupedHistory[chat.sessionId]) {
                groupedHistory[chat.sessionId] = [];
            }
            groupedHistory[chat.sessionId].push(chat);
        });

        res.json({ 
            history: sessionId ? history.reverse() : groupedHistory,
            totalSessions: Object.keys(groupedHistory).length
        });
    } catch (error) {
        console.error('Chat history error:', error);
        res.status(500).json({ message: 'Error fetching chat history' });
    }
});

// PDF Upload and Processing (placeholder - implement based on your needs)
router.post('/pdf/upload', auth, upload.single('pdf'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'PDF file is required' });
        }

        // TODO: Implement PDF processing
        // const pdfData = await processPDF(req.file);
        
        res.json({ 
            id: Date.now(), // Temporary ID
            filename: req.file.originalname,
            message: 'PDF uploaded successfully (processing not implemented)',
            pageCount: 1 // Placeholder
        });
    } catch (error) {
        console.error('PDF upload error:', error);
        res.status(500).json({ message: 'Error processing PDF' });
    }
});

// User Dashboard Data
router.get('/dashboard/stats', auth, async (req, res) => {
    try {
        const userId = req.userId;

        const [
            courseCount,
            quizCount,
            avgScore,
            totalStudyTime,
            recentQuizzes,
            recentCourses
        ] = await Promise.all([
            Course.count({ where: { createdBy: userId } }),
            QuizAttempt.count({ where: { userId } }),
            QuizAttempt.findOne({
                where: { userId },
                attributes: [[sequelize.fn('AVG', sequelize.col('score')), 'avgScore']]
            }),
            ChatSession.sum('timeSpent', { where: { userId } }) || 0,
            QuizAttempt.findAll({
                where: { userId },
                include: [{ model: Quiz, attributes: ['title', 'topic'] }],
                order: [['completedAt', 'DESC']],
                limit: 5
            }),
            Course.findAll({
                where: { createdBy: userId },
                order: [['createdAt', 'DESC']],
                limit: 5
            })
        ]);

        res.json({
            stats: {
                courses: courseCount,
                quizzes: quizCount,
                averageScore: Math.round(avgScore?.dataValues?.avgScore || 0),
                studyTime: Math.round(totalStudyTime / 3600) + 'h' // Convert to hours
            },
            recentActivity: {
                quizzes: recentQuizzes,
                courses: recentCourses
            }
        });
    } catch (error) {
        console.error('Dashboard stats error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Contact route
router.post('/contact', [
    body('name').notEmpty().withMessage('Name required'),
    body('email').isEmail().withMessage('Valid email required'),
    body('message').notEmpty().withMessage('Message required')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { name, email, subject, message } = req.body;

        try {
            await sendEmail({
                to: process.env.ADMIN_EMAIL,
                subject: `Contact Form: ${subject || 'New Message'}`,
                html: `
                    <h3>New Contact Form Submission</h3>
                    <p><strong>Name:</strong> ${name}</p>
                    <p><strong>Email:</strong> ${email}</p>
                    <p><strong>Subject:</strong> ${subject || 'No subject'}</p>
                    <p><strong>Message:</strong></p>
                    <p>${message}</p>
                `
            });
        } catch (emailError) {
            console.error('Email send error:', emailError);
        }

        res.json({ message: 'Message sent successfully!' });
    } catch (error) {
        console.error('Contact error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Utility function for smart fallback responses
function generateSmartFallback(message, mode = 'general') {
    const lowerMessage = message.toLowerCase();
    
    // Topic detection
    const topics = {
        javascript: 'JavaScript is a versatile programming language used for web development, both frontend and backend.',
        python: 'Python is known for its simplicity and readability, making it great for beginners and data science.',
        react: 'React is a JavaScript library for building user interfaces using components and virtual DOM.',
        css: 'CSS controls the visual presentation of web pages, including layout, colors, and animations.',
        html: 'HTML provides the structure and content of web pages using markup elements.',
        nodejs: 'Node.js allows JavaScript to run on servers, enabling full-stack development.',
        database: 'Databases store and organize data efficiently, with SQL and NoSQL being main types.'
    };

    // Find relevant topic
    let relevantTopic = null;
    let topicInfo = null;
    
    for (const [topic, info] of Object.entries(topics)) {
        if (lowerMessage.includes(topic)) {
            relevantTopic = topic;
            topicInfo = info;
            break;
        }
    }

    // Mode-specific responses
    const modeResponses = {
        tutor: [
            "As your learning tutor, I'd like to help you understand this concept step-by-step.",
            "This is a great learning opportunity. Let me break down the fundamentals for you.",
            "From a teaching perspective, this topic involves several key concepts we should explore."
        ],
        code: [
            "This involves some important programming concepts. Let me help you understand the approach.",
            "From a development standpoint, there are several ways to tackle this problem.",
            "This is a common coding challenge. Let me guide you through the solution process."
        ],
        general: [
            "That's an interesting question about technology and learning.",
            "I'd be happy to help you explore this topic further.",
            "This touches on some important concepts in programming and technology."
        ]
    };

    let response = modeResponses[mode] ? 
        modeResponses[mode][Math.floor(Math.random() * modeResponses[mode].length)] :
        modeResponses.general[0];

    // Add topic-specific information if found
    if (relevantTopic && topicInfo) {
        response += ` ${topicInfo}`;
    }

    // Add helpful closing
    response += " While I'm experiencing some technical difficulties with my AI systems, I'd recommend checking the official documentation or community forums for the most current information.";

    return response;
}

module.exports = router;

//routes.js