export function renderAbout(container) {
  container.innerHTML = `
    <div class="about-hero glass-card">
      <h1>🎓 Learnify</h1>
      <p>An AI-powered learning platform that creates personalized roadmaps, generates comprehensive courses, and tests your knowledge with adaptive quizzes — all tailored to your goals.</p>
    </div>

    <div class="section-header">
      <h2>✨ Features</h2>
    </div>
    <div class="features-grid">
      <div class="feature-card glass-card">
        <div class="feature-icon">🗺️</div>
        <h3>AI Roadmaps</h3>
        <p>Generate a personalized learning roadmap for any topic. Choose how many weeks you want, and our AI creates a structured path from beginner to advanced.</p>
      </div>
      <div class="feature-card glass-card">
        <div class="feature-icon">📚</div>
        <h3>Course Generation</h3>
        <p>Once you approve your roadmap, AI generates complete course content with modules, lessons, explanations, and practical examples.</p>
      </div>
      <div class="feature-card glass-card">
        <div class="feature-icon">❓</div>
        <h3>Smart Quizzes</h3>
        <p>Test your knowledge with AI-generated quizzes. Choose topic, difficulty, and number of questions. Get instant feedback with explanations.</p>
      </div>
      <div class="feature-card glass-card">
        <div class="feature-icon">🤖</div>
        <h3>AI Assistant</h3>
        <p>Chat with an intelligent learning companion. Ask questions, get explanations, and receive study tips anytime.</p>
      </div>
      <div class="feature-card glass-card">
        <div class="feature-icon">📊</div>
        <h3>Progress Tracking</h3>
        <p>Track your learning progress across all courses and quizzes. Visualize your growth with detailed statistics on your dashboard.</p>
      </div>
      <div class="feature-card glass-card">
        <div class="feature-icon">🔄</div>
        <h3>Iterative Learning</h3>
        <p>Don't like your roadmap? Provide feedback and regenerate it. Your learning path adapts to your preferences.</p>
      </div>
    </div>

    <div class="glass-card" style="padding:32px;text-align:center;margin-top:24px;">
      <h2 style="margin-bottom:8px;">Ready to Start Learning?</h2>
      <p style="color:var(--text-secondary);margin-bottom:20px;">Create an account and generate your first AI-powered roadmap today.</p>
      <a href="#/roadmap" class="btn btn-primary">🚀 Get Started</a>
    </div>
  `;
}
