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
  // Try to parse JSON from the response
  try {
    return JSON.parse(text);
  } catch {
    // Try to extract JSON from markdown code fences
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1].trim());
    }
    throw new Error('Failed to parse AI response as JSON');
  }
}

/**
 * Generate course content for a roadmap
 */
async function generateCourseContent(roadmap) {
  const weeksDescription = roadmap.weeks.map(w =>
    `Week ${w.weekNumber}: ${w.title} - Topics: ${w.topics.join(', ')}`
  ).join('\n');

  const prompt = `You are an expert course creator. Generate detailed course content for the following learning roadmap:

Title: ${roadmap.title}
${weeksDescription}

Return ONLY a valid JSON object (no markdown, no code fences) with this exact format:
{
  "title": "${roadmap.title}",
  "description": "Course description",
  "modules": [
    {
      "title": "Module title (corresponding to a week)",
      "weekNumber": 1,
      "lessons": [
        {
          "title": "Lesson title",
          "content": "Detailed lesson content with explanations, examples, and key concepts. Make it at least 3-4 paragraphs with practical examples.",
          "duration": "30 mins"
        }
      ]
    }
  ]
}

Each week should have 3-5 lessons. Make content educational, detailed, and practical.`;

  const completion = await groq.chat.completions.create({
    messages: [{ role: 'user', content: prompt }],
    model: 'llama-3.3-70b-versatile',
    temperature: 0.7,
    max_tokens: 8000
  });

  const text = completion.choices[0]?.message?.content || '';
  try {
    return JSON.parse(text);
  } catch {
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1].trim());
    }
    throw new Error('Failed to parse course content from AI');
  }
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
  generateCourseContent,
  generateQuiz,
  chatWithAI
};
