// utils/helpers.js
const generateFallbackContent = {
  roadmap: (topic, level, duration) => {
    const durationMap = { short: '4-6 weeks', medium: '8-12 weeks', long: '16-20 weeks' };
    const modules = getModulesForTopic(topic, level);
    
    return {
      title: `${topic} Learning Path - ${level} Level`,
      description: `Comprehensive ${level}-level roadmap for ${topic}`,
      estimatedDuration: durationMap[duration],
      modules,
      skills: [`${topic} fundamentals`, 'Problem solving', 'Best practices'],
      prerequisites: level === 'beginner' ? ['Basic computer skills'] : [`Basic ${topic} knowledge`]
    };
  },

  quiz: (topic, difficulty, questionCount) => {
    const questions = [];
    for (let i = 1; i <= questionCount; i++) {
      questions.push({
        id: i,
        question: `What is an important concept in ${topic}? (Question ${i})`,
        options: ['Core principle', 'Secondary feature', 'Optional component', 'Advanced technique'],
        correct: 0,
        explanation: `The core principle is essential for understanding ${topic}.`
      });
    }
    
    return {
      title: `${topic} ${difficulty} Quiz`,
      description: `Test your ${topic} knowledge`,
      timeLimit: questionCount * 60,
      passingScore: 70,
      questions
    };
  },

  chatResponse: (message, context) => {
    const { mode = 'general' } = context;
    const responses = {
      general: "I can help you with learning and technology topics. While my AI systems are experiencing some connectivity issues, I can still provide guidance and resources.",
      tutor: "As your tutor, I'll help you understand concepts step-by-step. Even with some technical limitations, I can guide your learning approach.",
      code: "I can help with programming questions. While my advanced analysis is temporarily unavailable, I can share general programming principles."
    };
    
    return responses[mode] + " What specific aspect would you like to explore?";
  }
};

const getModulesForTopic = (topic, level) => {
  const topicModules = {
    javascript: {
      beginner: [
        { title: 'JavaScript Basics', description: 'Variables, data types, functions', duration: '2-3 weeks', lessons: ['Variables', 'Data Types', 'Functions', 'Control Flow'] },
        { title: 'DOM Manipulation', description: 'Working with web pages', duration: '2-3 weeks', lessons: ['DOM Selection', 'Events', 'Dynamic Content', 'Forms'] },
        { title: 'Modern JavaScript', description: 'ES6+ features', duration: '2-3 weeks', lessons: ['Arrow Functions', 'Destructuring', 'Promises', 'Modules'] }
      ]
    },
    python: {
      beginner: [
        { title: 'Python Fundamentals', description: 'Basic syntax and concepts', duration: '2-3 weeks', lessons: ['Syntax', 'Data Types', 'Control Flow', 'Functions'] },
        { title: 'Data Structures', description: 'Lists, dictionaries, sets', duration: '2-3 weeks', lessons: ['Lists', 'Dictionaries', 'Sets', 'Tuples'] },
        { title: 'File Handling', description: 'Working with files', duration: '1-2 weeks', lessons: ['File I/O', 'CSV', 'JSON', 'Error Handling'] }
      ]
    }
  };

  return topicModules[topic.toLowerCase()]?.[level] || [
    { title: `${topic} Fundamentals`, description: `Core ${topic} concepts`, duration: '2-3 weeks', lessons: ['Basics', 'Core Concepts', 'Practice', 'Projects'] }
  ];
};

module.exports = { generateFallbackContent };