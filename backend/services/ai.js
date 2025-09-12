// services/ai.js - Enhanced AI Service with GROQ Integration
const Groq = require('groq-sdk');

class AIService {
    constructor() {
        this.groq = new Groq({
            apiKey: process.env.GROQ_API_KEY // Add this to your .env file
        });
        
        this.models = {
            fast: "llama-3.1-8b-instant",      // For quick responses
            balanced: "llama-3.1-70b-versatile", // For complex tasks
            creative: "mixtral-8x7b-32768"      // For creative content
        };
    }

    async generateResponse(prompt, context = null, model = 'balanced') {
        try {
            const systemPrompt = this.getSystemPrompt(context);
            
            const completion = await this.groq.chat.completions.create({
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: prompt }
                ],
                model: this.models[model],
                temperature: 0.7,
                max_tokens: 2048,
            });

            return completion.choices[0]?.message?.content || "I apologize, but I couldn't generate a response.";
        } catch (error) {
            console.error('GROQ API Error:', error);
            throw new Error('AI service temporarily unavailable');
        }
    }

    getSystemPrompt(context) {
        const basePrompt = `You are Learnify AI, an expert learning assistant specializing in programming, technology, and academic subjects. You provide clear, practical, and educational responses.`;
        
        if (!context) return basePrompt;
        
        const contextPrompts = {
            tutor: `${basePrompt} Focus on structured learning, break down complex topics step-by-step, and provide practical examples.`,
            code: `${basePrompt} Help with programming questions, provide clean code examples, explain concepts clearly, and suggest best practices.`,
            quiz: `${basePrompt} Create educational quiz questions that test understanding rather than memorization. Include clear explanations.`,
            general: basePrompt
        };
        
        return contextPrompts[context.mode] || basePrompt;
    }

    async generateRoadmap(topic, level = 'beginner', duration = 'medium') {
        const prompt = `Create a comprehensive learning roadmap for "${topic}" at ${level} level.
        Duration preference: ${duration}
        
        Provide a detailed JSON response with:
        {
            "title": "Learning roadmap title",
            "description": "Brief description of what learners will achieve",
            "estimatedDuration": "Time estimate based on duration preference",
            "difficulty": "${level}",
            "modules": [
                {
                    "title": "Module name",
                    "description": "What this module covers",
                    "lessons": ["Lesson 1", "Lesson 2", "Lesson 3"],
                    "duration": "Module duration",
                    "difficulty": "Module difficulty level",
                    "learningObjectives": ["Objective 1", "Objective 2"],
                    "practicalProjects": ["Project description"]
                }
            ],
            "prerequisites": ["Required knowledge"],
            "skillsGained": ["Skill 1", "Skill 2"],
            "careerPaths": ["Possible career directions"],
            "resources": {
                "documentation": ["Official docs"],
                "tools": ["Recommended tools"],
                "communities": ["Learning communities"]
            }
        }
        
        Make it practical and actionable for ${level} learners.`;

        try {
            const response = await this.generateResponse(prompt, { mode: 'tutor' }, 'balanced');
            return JSON.parse(this.extractJSON(response));
        } catch (error) {
            console.error('Roadmap generation error:', error);
            return this.getFallbackRoadmap(topic, level, duration);
        }
    }

    async generateQuiz(topic, difficulty = 'medium', questionCount = 5, focusAreas = []) {
        const focusText = focusAreas.length > 0 ? `Focus on: ${focusAreas.join(', ')}` : '';
        
        const prompt = `Generate a ${difficulty} difficulty quiz about "${topic}" with exactly ${questionCount} questions.
        ${focusText}
        
        Requirements:
        - Questions should test practical understanding, not just memorization
        - Include diverse question types (concepts, application, problem-solving)
        - Provide detailed explanations for correct answers
        - Make incorrect options plausible but clearly wrong
        
        Return as JSON:
        {
            "title": "${topic} Quiz",
            "description": "Quiz description",
            "difficulty": "${difficulty}",
            "timeLimit": 300,
            "passingScore": 70,
            "questions": [
                {
                    "id": 1,
                    "question": "Clear, specific question",
                    "type": "multiple-choice",
                    "options": ["Option A", "Option B", "Option C", "Option D"],
                    "correct": 0,
                    "explanation": "Detailed explanation of why this is correct",
                    "difficulty": "${difficulty}",
                    "tags": ["tag1", "tag2"]
                }
            ]
        }`;

        try {
            const response = await this.generateResponse(prompt, { mode: 'quiz' }, 'balanced');
            return JSON.parse(this.extractJSON(response));
        } catch (error) {
            console.error('Quiz generation error:', error);
            return this.getFallbackQuiz(topic, difficulty, questionCount);
        }
    }

    async generateCourseContent(roadmapData, moduleIndex) {
        const module = roadmapData.modules[moduleIndex];
        const prompt = `Generate comprehensive course content for the module "${module.title}" from the ${roadmapData.title} learning path.
        
        Module details:
        - Description: ${module.description}
        - Lessons: ${module.lessons.join(', ')}
        - Difficulty: ${module.difficulty}
        - Duration: ${module.duration}
        
        Create detailed content with:
        {
            "moduleTitle": "${module.title}",
            "lessons": [
                {
                    "title": "Lesson title",
                    "content": "Detailed lesson content with explanations and examples",
                    "codeExamples": ["Code snippet 1", "Code snippet 2"],
                    "exercises": [
                        {
                            "title": "Exercise title",
                            "description": "What to do",
                            "solution": "Solution explanation"
                        }
                    ],
                    "keyPoints": ["Important point 1", "Important point 2"],
                    "duration": "Estimated time"
                }
            ],
            "assessments": [
                {
                    "type": "quiz",
                    "questions": 3,
                    "topics": ["Topic covered"]
                }
            ],
            "resources": ["Additional resources"],
            "nextSteps": "What comes next"
        }`;

        try {
            const response = await this.generateResponse(prompt, { mode: 'tutor' }, 'balanced');
            return JSON.parse(this.extractJSON(response));
        } catch (error) {
            console.error('Course content generation error:', error);
            return this.getFallbackCourseContent(module);
        }
    }

    async generateAIResponse(message, context = {}) {
        let prompt = message;
        
        // Add context awareness
        if (context.previousMessages?.length > 0) {
            const recentMessages = context.previousMessages.slice(-3)
                .map(msg => `${msg.type}: ${msg.content}`)
                .join('\n');
            prompt = `Previous conversation:\n${recentMessages}\n\nCurrent question: ${message}`;
        }

        if (context.currentTopic) {
            prompt = `Context: We're discussing ${context.currentTopic}.\n${prompt}`;
        }

        const systemContext = {
            mode: context.mode || 'general',
            userLevel: context.userPreferences?.learningLevel || 'intermediate'
        };

        return await this.generateResponse(prompt, systemContext, 'fast');
    }

    // Utility methods
    extractJSON(text) {
        try {
            // Try to find JSON in the response
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return jsonMatch[0];
            }
            return text;
        } catch (error) {
            throw new Error('Could not extract JSON from AI response');
        }
    }

    getFallbackRoadmap(topic, level, duration) {
        const durationMap = {
            short: '4-6 weeks',
            medium: '8-12 weeks',
            long: '16-20 weeks'
        };

        return {
            title: `${topic} Learning Roadmap`,
            description: `Complete learning path for ${topic} from ${level} to advanced level`,
            estimatedDuration: durationMap[duration] || '8-12 weeks',
            difficulty: level,
            modules: [
                {
                    title: `${topic} Fundamentals`,
                    description: `Core concepts and basics of ${topic}`,
                    lessons: ['Introduction', 'Basic Concepts', 'Syntax and Structure', 'First Project'],
                    duration: '2-3 weeks',
                    difficulty: 'Beginner',
                    learningObjectives: [`Understand ${topic} basics`, 'Write simple programs'],
                    practicalProjects: [`Simple ${topic} project`]
                },
                {
                    title: `Intermediate ${topic}`,
                    description: `Building on the fundamentals with advanced features`,
                    lessons: ['Advanced Features', 'Best Practices', 'Common Patterns', 'Real-world Applications'],
                    duration: '3-4 weeks',
                    difficulty: 'Intermediate',
                    learningObjectives: [`Apply ${topic} professionally`, 'Solve complex problems'],
                    practicalProjects: [`Intermediate ${topic} application`]
                },
                {
                    title: `Advanced ${topic} & Specialization`,
                    description: `Master level concepts and specialization areas`,
                    lessons: ['Expert Techniques', 'Performance Optimization', 'Architecture Patterns', 'Capstone Project'],
                    duration: '3-5 weeks',
                    difficulty: 'Advanced',
                    learningObjectives: [`Master ${topic}`, 'Lead technical projects'],
                    practicalProjects: [`Advanced ${topic} system`]
                }
            ],
            prerequisites: level === 'beginner' ? ['Basic computer literacy'] : [`Basic ${topic} knowledge`],
            skillsGained: [`${topic} Development`, 'Problem Solving', 'Software Architecture'],
            careerPaths: ['Software Developer', 'Technical Lead', 'Solution Architect'],
            resources: {
                documentation: [`Official ${topic} documentation`],
                tools: ['VS Code', 'Git', 'Package managers'],
                communities: [`${topic} community forums`, 'Stack Overflow']
            }
        };
    }

    getFallbackQuiz(topic, difficulty, questionCount) {
        const questions = [];
        for (let i = 0; i < questionCount; i++) {
            questions.push({
                id: i + 1,
                question: `What is a key concept in ${topic}?`,
                type: 'multiple-choice',
                options: [
                    'Fundamental principle',
                    'Secondary feature',
                    'Optional component',
                    'Deprecated method'
                ],
                correct: 0,
                explanation: `The fundamental principle is the core concept that everything else builds upon in ${topic}.`,
                difficulty: difficulty,
                tags: [topic.toLowerCase(), 'concepts']
            });
        }

        return {
            title: `${topic} Quiz`,
            description: `Test your knowledge of ${topic} concepts`,
            difficulty: difficulty,
            timeLimit: questionCount * 60, // 1 minute per question
            passingScore: 70,
            questions: questions
        };
    }

    getFallbackCourseContent(module) {
        return {
            moduleTitle: module.title,
            lessons: module.lessons.map((lesson, index) => ({
                title: lesson,
                content: `This lesson covers ${lesson.toLowerCase()} in detail. You'll learn the key concepts and practical applications.`,
                codeExamples: [`// Example code for ${lesson}`],
                exercises: [{
                    title: `Practice ${lesson}`,
                    description: `Complete exercises related to ${lesson}`,
                    solution: 'Work through the examples step by step'
                }],
                keyPoints: [`Key concept from ${lesson}`, `Important technique in ${lesson}`],
                duration: '30-45 minutes'
            })),
            assessments: [{
                type: 'quiz',
                questions: 5,
                topics: [module.title]
            }],
            resources: ['Official documentation', 'Additional tutorials'],
            nextSteps: 'Continue to the next module when ready'
        };
    }
}

module.exports = new AIService();