const Groq = require('groq-sdk');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

/**
 * Generate a learning roadmap using Groq AI
 */
async function generateRoadmap(topic, totalWeeks, additionalInfo = '') {
  const prompt = `You are an expert learning instructor. Create a detailed learning roadmap for the topic: "${topic}" spread across ${totalWeeks} week(s).
${additionalInfo ? `Additional requirements: ${additionalInfo}` : ''}

Return ONLY a valid JSON object (no markdown, no code fences) in this exact format:
{
  "title": "Roadmap title",
  "description": "Brief description of the learning path",
  "weeks": [
    {
      "weekNumber": 1,
      "title": "Week title",
      "topics": ["Topic 1", "Topic 2", "Topic 3"],
      "objectives": ["Objective 1", "Objective 2"],
      "resources": ["Resource 1", "Resource 2"]
    }
  ]
}

Make it comprehensive, practical, and progressively structured from beginner to advanced concepts.`;

  const completion = await groq.chat.completions.create({
    messages: [{ role: 'user', content: prompt }],
    model: 'llama-3.3-70b-versatile',
    temperature: 0.7,
    max_tokens: 4096
  });

  const text = completion.choices[0]?.message?.content || '';
  try {
    return JSON.parse(text);
  } catch {
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1].trim());
    }
    throw new Error('Failed to parse AI response as JSON');
  }
}

/**
 * Generate course STRUCTURE only (fast) — no lesson content.
 * Creates modules with lesson titles from roadmap topics.
 * Also generates book recommendations.
 */
async function generateCourseStructure(roadmap) {
  const prompt = `You are an expert course architect. Create a structured course outline from this learning roadmap.

Course Topic: ${roadmap.title}
Description: ${roadmap.description || ''}

Weeks/Modules:
${roadmap.weeks.map(w => `Week ${w.weekNumber}: ${w.title} — Topics: ${w.topics.join(', ')}`).join('\n')}

Return ONLY a valid JSON object (no markdown, no code fences) in this exact format:
{
  "title": "${roadmap.title}",
  "description": "A compelling 1-2 sentence course description",
  "modules": [
    {
      "title": "Module title",
      "weekNumber": 1,
      "lessons": [
        { "title": "Clear, specific lesson title" },
        { "title": "Another lesson title" }
      ]
    }
  ],
  "recommendedBooks": [
    {
      "title": "Book Title",
      "author": "Author Name",
      "reason": "Why this book is great for this topic"
    }
  ]
}

RULES:
- Each module should have 3-5 lessons with clear, specific titles
- Lesson titles should be descriptive (e.g. "Understanding Variables and Data Types in C++", not just "Variables")
- Include exactly 4 recommended books (well-known, highly rated)
- Do NOT include lesson content — only titles`;

  const completion = await groq.chat.completions.create({
    messages: [{ role: 'user', content: prompt }],
    model: 'llama-3.3-70b-versatile',
    temperature: 0.7,
    max_tokens: 4096
  });

  const text = completion.choices[0]?.message?.content || '';
  let result;
  try {
    result = JSON.parse(text);
  } catch {
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      result = JSON.parse(jsonMatch[1].trim());
    } else {
      // Fallback: build structure from roadmap directly
      result = {
        title: roadmap.title,
        description: roadmap.description || `A comprehensive course on ${roadmap.title}`,
        modules: roadmap.weeks.map(w => ({
          title: w.title,
          weekNumber: w.weekNumber,
          lessons: w.topics.map(t => ({ title: t }))
        })),
        recommendedBooks: []
      };
    }
  }

  // Ensure lessons have empty content and contentGenerated = false
  if (result.modules) {
    result.modules.forEach(mod => {
      if (mod.lessons) {
        mod.lessons = mod.lessons.map(l => ({
          title: l.title,
          content: '',
          contentGenerated: false,
          duration: l.duration || '30 mins'
        }));
      }
    });
  }

  if (!Array.isArray(result.recommendedBooks)) {
    result.recommendedBooks = [];
  }

  return result;
}

/**
 * Generate in-depth content for a SINGLE lesson (on-demand).
 * Called when user clicks "Generate Content" on a specific lesson.
 */
async function generateLessonContent(courseTitle, moduleTitle, lessonTitle) {
  const prompt = `You are an expert educator creating in-depth learning content. Write a comprehensive lesson on the following topic:

Course: ${courseTitle}
Module: ${moduleTitle}
Lesson: ${lessonTitle}

Write a thorough, well-structured lesson that a student can learn from. Your response should be PLAIN TEXT (not JSON), formatted as follows:

1. Start with a clear INTRODUCTION explaining what this topic is and why it matters (1-2 paragraphs)

2. CORE CONCEPTS — explain the main ideas step by step with clear language (2-3 paragraphs)

3. PRACTICAL EXAMPLE — provide a concrete, real-world example or code snippet that demonstrates the concept. If it's a programming topic, include actual code. If it's a theoretical topic, use a real-world analogy or case study.

4. COMMON PITFALLS — mention 2-3 common mistakes or misconceptions beginners make

5. KEY TAKEAWAYS — end with bullet points (use • character) summarizing the most important points

Make the content educational, beginner-friendly but thorough. Use clear section headers followed by colons (e.g., "Introduction:", "Example:", "Key Takeaways:"). Write at least 500 words.`;

  const completion = await groq.chat.completions.create({
    messages: [{ role: 'user', content: prompt }],
    model: 'llama-3.3-70b-versatile',
    temperature: 0.7,
    max_tokens: 4096
  });

  const content = completion.choices[0]?.message?.content || '';
  if (!content || content.length < 50) {
    throw new Error('AI generated insufficient content. Please try again.');
  }

  return content;
}

/**
 * Generate quiz questions using Groq AI
 */
async function generateQuiz(topic, numQuestions, difficulty) {
  const prompt = `You are a quiz master. Generate a ${difficulty} difficulty quiz on the topic: "${topic}" with exactly ${numQuestions} multiple choice questions.

Return ONLY a valid JSON object (no markdown, no code fences) in this exact format:
{
  "title": "Quiz title",
  "questions": [
    {
      "question": "The question text?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": 0,
      "explanation": "Brief explanation of why the answer is correct"
    }
  ]
}

correctAnswer is the 0-based index of the correct option. Make questions challenging but fair for ${difficulty} level. Each question MUST have exactly 4 options.`;

  const completion = await groq.chat.completions.create({
    messages: [{ role: 'user', content: prompt }],
    model: 'llama-3.3-70b-versatile',
    temperature: 0.8,
    max_tokens: 4096
  });

  const text = completion.choices[0]?.message?.content || '';
  try {
    return JSON.parse(text);
  } catch {
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1].trim());
    }
    throw new Error('Failed to parse quiz from AI');
  }
}

/**
 * Chat with AI assistant
 */
async function chatWithAI(messages) {
  const systemMessage = {
    role: 'system',
    content: 'You are Learnify AI Assistant, a helpful and knowledgeable learning companion. You help students with their studies, explain concepts, answer questions, suggest learning strategies, and provide motivation. Be friendly, encouraging, and thorough in your explanations. Use examples when helpful.'
  };

  const completion = await groq.chat.completions.create({
    messages: [systemMessage, ...messages],
    model: 'llama-3.3-70b-versatile',
    temperature: 0.7,
    max_tokens: 2048
  });

  return completion.choices[0]?.message?.content || 'I apologize, I could not generate a response. Please try again.';
}

module.exports = {
  generateRoadmap,
  generateCourseStructure,
  generateLessonContent,
  generateQuiz,
  chatWithAI
};
