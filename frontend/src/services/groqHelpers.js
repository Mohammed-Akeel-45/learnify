
// Helper functions for GROQ API integration
const generateRoadmap = async (topic, level) => {
    const prompt = `Create a comprehensive learning roadmap for "${topic}" at ${level} level. Include:
    - Course title and description
    - Estimated duration
    - 3-5 learning modules with titles, descriptions, lessons, and difficulty levels
    - Required skills and prerequisites
    - Learning objectives
    
    Format as JSON with this structure:
    {
        "title": "Course Title",
        "description": "Course description",
        "estimatedDuration": "6-8 weeks",
        "modules": [
            {
                "title": "Module Name",
                "description": "Module description", 
                "lessons": ["Lesson 1", "Lesson 2"],
                "duration": "1-2 weeks",
                "difficulty": "Beginner"
            }
        ],
        "skills": ["Skill 1", "Skill 2"],
        "prerequisites": ["Prerequisite 1"]
    }`;

    // Use your existing GROQ service
    const completion = await groqService.generateResponse(prompt, null);
    return JSON.parse(completion);
};

const generateAdvancedQuiz = async (topic, options) => {
    const { difficulty, questionCount, focus } = options;
    
    const prompt = `Generate a ${difficulty} difficulty quiz about "${topic}" with ${questionCount} questions.
    Focus area: ${focus}
    
    Each question should include:
    - Clear, specific question text
    - 4 multiple choice options
    - Correct answer index (0-3)
    - Detailed explanation
    
    Format as JSON:
    {
        "title": "Quiz Title",
        "difficulty": "${difficulty}",
        "topic": "${topic}",
        "questions": [
            {
                "question": "Question text",
                "options": ["Option A", "Option B", "Option C", "Option D"],
                "correct": 0,
                "explanation": "Explanation of correct answer"
            }
        ]
    }`;

    const completion = await groqService.generateResponse(prompt, null);
    return JSON.parse(completion);
};