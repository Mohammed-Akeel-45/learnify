
// services/ai.js - Updated for unified chat experience
const Groq = require('groq-sdk');
const config = require('../config/config');


class AIService {
  constructor() {
    this.groq = null;
    this.isInitialized = false;
    this.initializeGroq();
  }

  initializeGroq() {
    try {
      const apiKey = process.env.GROQ_API_KEY;
      
      if (!apiKey) {
        console.error('❌ GROQ_API_KEY not found in environment variables');
        return;
      }

      this.groq = new Groq({ apiKey });
      this.isInitialized = true;
      console.log('✅ GROQ AI initialized successfully');
      
      this.testConnection();
    } catch (error) {
      console.error('❌ GROQ initialization failed:', error.message);
      this.isInitialized = false;
    }
  }

  async testConnection() {
    try {
      await this.groq.chat.completions.create({
        messages: [{ role: "user", content: "Hello" }],
        model: "moonshotai/kimi-k2-instruct-0905",
        max_tokens: 10
      });
      console.log('✅ GROQ connection test successful');
    } catch (error) {
      console.error('❌ GROQ connection test failed:', error.message);
      this.isInitialized = false;
    }
  }

  // Unified chat response - handles all types of questions
  async generateChatResponse(message, context = {}) {
    console.log(`💬 Chat request: ${message.substring(0, 50)}...`);
    
    if (!this.isInitialized) {
      console.log('⚠️ AI not initialized, using fallback');
      return this.generateFallbackChatResponse(message);
    }

    try {
      const { previousMessages = [] } = context;
      
      // Create a comprehensive system prompt that handles all types of questions
      const systemPrompt = this.createUnifiedSystemPrompt();
      
      // Build conversation history
      const conversationHistory = this.buildConversationHistory(previousMessages);
      
      const messages = [
        { role: "system", content: systemPrompt },
        ...conversationHistory,
        { role: "user", content: message }
      ];

      const completion = await this.groq.chat.completions.create({
        messages,
        model: "moonshotai/kimi-k2-instruct-0905",
        temperature: 0.7,
        max_tokens: 2000
      });

      const response = completion.choices[0].message.content;
      console.log('✅ Chat response generated successfully');
      return response;

    } catch (error) {
      console.error('❌ AI chat response failed:', error.message);
      return this.generateFallbackChatResponse(message);
    }
  }

  createUnifiedSystemPrompt() {
    return `You are an intelligent AI assistant for Learnify, an educational platform. You are designed to help users with a wide variety of questions and topics, similar to Claude AI.

Your capabilities include:

**Programming & Technology:**
- Help with coding in any programming language (JavaScript, Python, Java, C++, React, Node.js, etc.)
- Debug code and explain errors
- Provide code examples and best practices
- Explain algorithms, data structures, and software concepts
- Help with web development, databases, and system design

**Academic Subjects:**
- Mathematics (algebra, calculus, statistics, etc.)
- Science (physics, chemistry, biology)
- Computer Science theory
- Engineering concepts
- Business and economics

**Learning & Education:**
- Break down complex topics into understandable parts
- Create study plans and learning strategies
- Explain concepts with analogies and examples
- Help with homework and assignments
- Provide practice problems and solutions

**General Knowledge:**
- Answer questions on history, geography, literature
- Explain current events and trends
- Help with writing and communication
- Provide research assistance
- General problem-solving

**Your Approach:**
- Always provide accurate, helpful, and educational responses
- Adapt your explanation level based on the complexity of the question
- Use examples and practical applications when helpful
- If you're unsure about something, say so honestly
- For coding questions, provide clean, commented code examples
- For theoretical questions, explain concepts clearly and thoroughly
- Be conversational but professional
- Encourage learning and curiosity

**Important Guidelines:**
- If someone asks about something potentially harmful, politely decline and suggest safer alternatives
- For medical, legal, or financial advice, remind users to consult qualified professionals
- Always aim to educate and help users understand, not just provide answers
- Be patient and supportive, especially with beginners

Respond naturally and conversationally, adapting to whatever type of question the user asks.`;
  }

  buildConversationHistory(previousMessages) {
    if (!previousMessages || previousMessages.length === 0) return [];
    
    return previousMessages.slice(-6).map(msg => {
      if (msg.userMessage && msg.aiResponse) {
        return [
          { role: "user", content: msg.userMessage },
          { role: "assistant", content: msg.aiResponse }
        ];
      }
      return [];
    }).flat().filter(msg => msg.content);
  }

  generateFallbackChatResponse(message) {
    return `I understand you're asking about "${message}". While I'm experiencing some connectivity issues with my AI services right now, I'm still here to help!

For immediate assistance, I recommend:
- Breaking down your question into specific parts
- Checking official documentation for technical topics
- Looking for examples and tutorials online

Could you provide more details about what you'd like to learn? I'll do my best to guide you in the right direction.

(AI services will be fully restored soon for better responses)`;
  }

  // Keep the existing quiz generation method unchanged
  async generateQuiz(topic, difficulty, questionCount) {
    console.log(`🎯 Generating quiz: ${topic}, ${difficulty}, ${questionCount} questions`);
    
    if (!this.isInitialized) {
      console.log('⚠️ AI not initialized, using fallback');
      return this.generateFallbackQuiz(topic, difficulty, questionCount);
    }

    try {
      const prompt = `Create a ${difficulty} level quiz about "${topic}" with exactly ${questionCount} multiple choice questions.

Requirements:
- Each question should test practical knowledge of ${topic}
- Provide 4 realistic answer options per question
- Include clear explanations for why the correct answer is right
- Make questions specific to ${topic}, not generic
- Ensure ${difficulty} difficulty level is appropriate

Return ONLY valid JSON in this exact format (no other text):
{
  "title": "${topic} ${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)} Quiz",
  "description": "Test your ${difficulty} level knowledge of ${topic}",
  "questions": [
    {
      "question": "Specific question about ${topic}?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct": 0,
      "explanation": "Detailed explanation of why this is correct"
    }
  ]
}`;

      const completion = await this.groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: "You are an expert quiz creator. Generate accurate, educational quizzes with specific questions. Always return valid JSON only, no additional text."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        model: "moonshotai/kimi-k2-instruct-0905",
        temperature: 0.7,
        max_tokens: 3000
      });

      const responseText = completion.choices[0].message.content.trim();
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      
      if (!jsonMatch) {
        throw new Error('No valid JSON found in AI response');
      }

      const quizData = JSON.parse(jsonMatch[0]);
      
      if (!quizData.questions || !Array.isArray(quizData.questions) || quizData.questions.length !== questionCount) {
        throw new Error('Invalid quiz structure from AI');
      }

      const processedQuiz = {
        title: quizData.title || `${topic} ${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)} Quiz`,
        description: quizData.description || `Test your ${difficulty} level knowledge of ${topic}`,
        timeLimit: questionCount * 60,
        passingScore: 70,
        questions: quizData.questions.map((q, index) => ({
          id: index + 1,
          question: q.question,
          options: q.options,
          correct: q.correct,
          explanation: q.explanation || 'No explanation provided'
        }))
      };

      console.log('✅ Quiz generated successfully with AI');
      return processedQuiz;

    } catch (error) {
      console.error('❌ AI quiz generation failed:', error.message);
      return this.generateFallbackQuiz(topic, difficulty, questionCount);
    }
  }

  generateFallbackQuiz(topic, difficulty, questionCount) {
    console.log('🔄 Using fallback quiz generation');
    
    const topicQuestions = this.getTopicSpecificQuestions(topic, difficulty);
    
    const questions = [];
    for (let i = 0; i < questionCount; i++) {
      const questionTemplate = topicQuestions[i % topicQuestions.length];
      questions.push({
        id: i + 1,
        question: questionTemplate.question,
        options: questionTemplate.options,
        correct: questionTemplate.correct,
        explanation: questionTemplate.explanation
      });
    }

    return {
      title: `${topic} ${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)} Quiz`,
      description: `Test your ${difficulty} level knowledge of ${topic}`,
      timeLimit: questionCount * 60,
      passingScore: 70,
      questions
    };
  }

  getTopicSpecificQuestions(topic, difficulty) {
    const topicLower = topic.toLowerCase();
    
    if (topicLower.includes('javascript')) {
      return [
        {
          question: "What is the correct way to declare a variable in modern JavaScript?",
          options: ["var x = 5;", "let x = 5;", "const x = 5;", "Both let and const"],
          correct: 3,
          explanation: "Both 'let' and 'const' are modern ways to declare variables in JavaScript."
        },
        {
          question: "What does the '===' operator do in JavaScript?",
          options: ["Assigns a value", "Checks equality without type conversion", "Checks equality with type conversion", "Compares references"],
          correct: 1,
          explanation: "The '===' operator performs strict equality comparison without type conversion."
        }
      ];
    }
    
    return [
      {
        question: `What is a fundamental concept when learning ${topic}?`,
        options: ["Understanding the basics", "Memorizing syntax", "Skipping theory", "Avoiding practice"],
        correct: 0,
        explanation: "Understanding fundamental concepts provides a solid foundation for learning."
      }
    ];
  }

  // ---- generateRoadmap ----
async generateRoadmap(topic, level, duration) {
  console.log(`🗺️ Generating roadmap for: ${topic}`);

  if (!this.isInitialized) {
    return this.generateFallbackRoadmap(topic, level, duration);
  }

  try {
    const durationMap = {
      short: '4-6 weeks',
      medium: '8-12 weeks',
      long: '16-20 weeks'
    };

    const prompt = `Create a comprehensive learning roadmap for "${topic}" at ${level} level.
Duration: ${durationMap[duration]}
Generate a structured learning path with:

3-5 major modules
Each module should have: title, description, duration (in weeks), and 4-6 key lessons
Prerequisites and skills to be gained
Practical projects for each module

Return ONLY valid JSON in this exact format:
{
"title": "Complete ${topic} Learning Path",
"description": "A comprehensive ${level}-level roadmap for mastering ${topic}",
"estimatedDuration": "${durationMap[duration]}",
"modules": [
{
"title": "Module name",
"description": "What you'll learn",
"duration": "2-3 weeks",
"lessons": ["Lesson 1", "Lesson 2", "Lesson 3", "Lesson 4"],
"project": "Practical project description"
}
],
"prerequisites": ["Prerequisite 1", "Prerequisite 2"],
"skills": ["Skill 1", "Skill 2", "Skill 3"]
}`;

    const completion = await this.groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are an expert curriculum designer. Create detailed, practical learning roadmaps. Return only valid JSON."
        },
        { role: "user", content: prompt }
      ],
      model: "moonshotai/kimi-k2-instruct-0905",
      temperature: 0.7,
      max_tokens: 3000
    });

    const responseText = completion.choices[0].message.content.trim();
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);

    if (!jsonMatch) throw new Error('No valid JSON in response');

    const roadmapData = JSON.parse(jsonMatch[0]);

    console.log('✅ Roadmap generated successfully');
    return roadmapData;

  } catch (error) {
    console.error('❌ AI roadmap generation failed:', error.message);
    return this.generateFallbackRoadmap(topic, level, duration);
  }
}

// ---- Fallback Roadmap ----
generateFallbackRoadmap(topic, level, duration) {
  const durationMap = {
    short: '4-6 weeks',
    medium: '8-12 weeks',
    long: '16-20 weeks'
  };

  return {
    title: `${topic} Learning Path - ${level} Level`,
    description: `A structured ${level}-level roadmap for learning ${topic}`,
    estimatedDuration: durationMap[duration],
    modules: [
      {
        title: `${topic} Fundamentals`,
        description: 'Core concepts and basic principles',
        duration: '2-3 weeks',
        lessons: ['Introduction', 'Basic Concepts', 'Core Principles', 'Practice'],
        project: 'Build a simple project using fundamentals'
      },
      {
        title: `Intermediate ${topic}`,
        description: 'Advanced concepts and techniques',
        duration: '3-4 weeks',
        lessons: ['Advanced Topics', 'Best Practices', 'Real-world Applications', 'Optimization'],
        project: 'Create a medium-complexity application'
      },
      {
        title: `Mastering ${topic}`,
        description: 'Expert-level skills and patterns',
        duration: '2-3 weeks',
        lessons: ['Design Patterns', 'Architecture', 'Performance', 'Production Ready'],
        project: 'Build a production-ready application'
      }
    ],
    prerequisites: level === 'beginner'
      ? ['Basic computer skills']
      : [`Understanding of ${topic} basics`],
    skills: [`${topic} development`, 'Problem solving', 'Best practices', 'Project development']
  };
}

// ---- generateCourseContent ----
async generateCourseContent(moduleTitle, moduleDescription, level) {
  console.log(`📚 Generating course content for: ${moduleTitle}`);

  if (!this.isInitialized) {
    return this.generateFallbackCourseContent(moduleTitle, moduleDescription);
  }

  try {
    const prompt = `Create detailed course content for: "${moduleTitle}"
Description: ${moduleDescription}
Level: ${level}
Generate a comprehensive course with:

5-8 lessons covering the module thoroughly
Each lesson should have: title, content (detailed explanation), examples, and practice exercises
Include key takeaways for each lesson

Return ONLY valid JSON:
{
"title": "${moduleTitle}",
"description": "${moduleDescription}",
"lessons": [
{
"title": "Lesson title",
"content": "Detailed lesson content with explanations",
"examples": ["Example 1", "Example 2"],
"exercises": ["Exercise 1", "Exercise 2"],
"keyTakeaways": ["Takeaway 1", "Takeaway 2"]
}
]
}`;

    const completion = await this.groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are an expert course content creator. Generate detailed, educational content. Return only valid JSON."
        },
        { role: "user", content: prompt }
      ],
      model: "moonshotai/kimi-k2-instruct-0905",
      temperature: 0.7,
      max_tokens: 4000
    });

    const responseText = completion.choices[0].message.content.trim();
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);

    if (!jsonMatch) throw new Error('No valid JSON in response');

    const courseContent = JSON.parse(jsonMatch[0]);

    console.log('✅ Course content generated successfully');
    return courseContent;

  } catch (error) {
    console.error('❌ AI course generation failed:', error.message);
    return this.generateFallbackCourseContent(moduleTitle, moduleDescription);
  }
}

// ---- Fallback Course Content ----
generateFallbackCourseContent(title, description) {
  return {
    title,
    description,
    lessons: [
      {
        title: 'Introduction',
        content: `Welcome to ${title}. ${description}`,
        examples: ['Getting started', 'Basic example'],
        exercises: ['Set up your environment', 'Complete the intro challenge'],
        keyTakeaways: ['Understanding the basics', 'Getting familiar with concepts']
      },
      {
        title: 'Core Concepts',
        content: 'Deep dive into the fundamental concepts.',
        examples: ['Practical example 1', 'Practical example 2'],
        exercises: ['Practice exercise 1', 'Practice exercise 2'],
        keyTakeaways: ['Master core concepts', 'Apply what you learned']
      }
    ]
  };
}


  async checkAIService() {
    if (!this.isInitialized) {
      return { status: 'unavailable', provider: 'groq', error: 'API key not configured' };
    }
    
    try {
      await this.groq.chat.completions.create({
        messages: [{ role: "user", content: "test" }],
        model: "moonshotai/kimi-k2-instruct-0905",
        max_tokens: 5
      });
      
      return { status: 'connected', provider: 'groq' };
    } catch (error) {
      return { status: 'error', provider: 'groq', error: error.message };
    }
  }
}

module.exports = new AIService();