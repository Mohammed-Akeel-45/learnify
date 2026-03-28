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
 * Generate course content for a roadmap — processes one week at a time
 * to stay within Groq token limits and avoid truncated responses.
 */
async function generateCourseContent(roadmap) {
  const modules = [];

  for (const week of roadmap.weeks) {
    const prompt = `You are an expert course creator. Generate lesson content for ONE module of a course.

Course: ${roadmap.title}
Module: Week ${week.weekNumber} — ${week.title}
Topics to cover: ${week.topics.join(', ')}

Return ONLY a valid JSON object (no markdown, no code fences) in this exact format:
{
  "title": "${week.title}",
  "weekNumber": ${week.weekNumber},
  "lessons": [
    {
      "title": "Lesson title",
      "content": "Lesson content with clear explanations and examples. 2-3 paragraphs.",
      "duration": "30 mins"
    }
  ]
}

Generate exactly 3 lessons for this module. Keep each lesson content concise but educational.`;

    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      max_tokens: 4096
    });

    const text = completion.choices[0]?.message?.content || '';
    let moduleData;
    try {
      moduleData = JSON.parse(text);
    } catch {
      const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        moduleData = JSON.parse(jsonMatch[1].trim());
      } else {
        console.error(`Failed to parse module for week ${week.weekNumber}. Raw:`, text.substring(0, 200));
        // Create a fallback module so course generation doesn't completely fail
        moduleData = {
          title: week.title,
          weekNumber: week.weekNumber,
          lessons: week.topics.map(t => ({
            title: t,
            content: `Study the topic: ${t}. This is part of ${week.title} in the ${roadmap.title} course.`,
            duration: '30 mins'
          }))
        };
      }
    }

    modules.push(moduleData);
  }

  return {
    title: roadmap.title,
    description: roadmap.description || `A comprehensive course on ${roadmap.topic}`,
    modules
  };
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
