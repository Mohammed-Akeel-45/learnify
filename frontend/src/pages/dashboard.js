import { apiFetch } from '../api.js';

export function renderDashboard(container) {
  container.innerHTML = `
    <div class="dashboard-welcome">
      <h1>Welcome back! 👋</h1>
      <p>Track your learning progress and continue where you left off.</p>
    </div>
    <div class="stats-grid" id="stats-grid">
      <div class="stat-card glass-card">
        <div class="stat-icon" style="background: rgba(102,126,234,0.15)">📚</div>
        <div class="stat-info"><h3 id="stat-courses">-</h3><p>Total Courses</p></div>
      </div>
      <div class="stat-card glass-card">
        <div class="stat-icon" style="background: rgba(79,201,120,0.15)">✅</div>
        <div class="stat-info"><h3 id="stat-quizzes">-</h3><p>Quizzes Completed</p></div>
      </div>
      <div class="stat-card glass-card">
        <div class="stat-icon" style="background: rgba(247,151,30,0.15)">🗺️</div>
        <div class="stat-info"><h3 id="stat-roadmaps">-</h3><p>Roadmaps</p></div>
      </div>
      <div class="stat-card glass-card">
        <div class="stat-icon" style="background: rgba(0,210,255,0.15)">📊</div>
        <div class="stat-info"><h3 id="stat-avg-score">-</h3><p>Avg Quiz Score</p></div>
      </div>
    </div>
    <div class="stats-grid">
      <div class="glass-card" style="padding:24px;">
        <h3 style="margin-bottom:12px;font-size:16px;">Course Progress</h3>
        <div id="course-progress-list"><div class="spinner"></div></div>
      </div>
      <div class="glass-card" style="padding:24px;">
        <h3 style="margin-bottom:12px;font-size:16px;">Recent Quizzes</h3>
        <div id="recent-quizzes-list"><div class="spinner"></div></div>
      </div>
    </div>
  `;

  loadStats();
}

async function loadStats() {
  try {
    const { data } = await apiFetch('/auth/me');
    document.getElementById('stat-courses').textContent = data.stats.totalCourses;
    document.getElementById('stat-quizzes').textContent = data.stats.completedQuizzes;
    document.getElementById('stat-roadmaps').textContent = data.stats.totalRoadmaps;
    document.getElementById('stat-avg-score').textContent = data.stats.avgQuizScore + '%';

    // Load courses for progress
    const coursesRes = await apiFetch('/courses');
    const courseList = document.getElementById('course-progress-list');
    if (coursesRes.data.length === 0) {
      courseList.innerHTML = '<p style="color:var(--text-muted);font-size:13px;">No courses yet. Generate a roadmap to get started!</p>';
    } else {
      courseList.innerHTML = coursesRes.data.slice(0, 5).map(c => `
        <div style="margin-bottom:12px;">
          <div style="display:flex;justify-content:space-between;margin-bottom:4px;font-size:13px;">
            <span>${c.title.length > 30 ? c.title.substring(0, 30) + '...' : c.title}</span>
            <span style="color:var(--accent-blue);font-weight:600;">${c.progress}%</span>
          </div>
          <div class="progress-bar"><div class="progress-fill" style="width:${c.progress}%"></div></div>
        </div>
      `).join('');
    }

    // Load recent quizzes
    const quizzesRes = await apiFetch('/quizzes');
    const quizList = document.getElementById('recent-quizzes-list');
    if (quizzesRes.data.length === 0) {
      quizList.innerHTML = '<p style="color:var(--text-muted);font-size:13px;">No quizzes taken yet. Try generating one!</p>';
    } else {
      quizList.innerHTML = quizzesRes.data.slice(0, 5).map(q => `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--border-glass);">
          <div>
            <div style="font-size:13px;font-weight:500;">${q.title.length > 25 ? q.title.substring(0, 25) + '...' : q.title}</div>
            <div style="font-size:11px;color:var(--text-muted);">${q.difficulty} • ${q.totalQuestions} questions</div>
          </div>
          <div style="font-weight:700;color:${q.completed ? 'var(--accent-green)' : 'var(--text-muted)'};">
            ${q.completed ? q.score + '%' : 'Pending'}
          </div>
        </div>
      `).join('');
    }
  } catch (err) {
    document.getElementById('course-progress-list').innerHTML = '<p style="color:var(--text-muted);font-size:13px;">Login to see your progress</p>';
    document.getElementById('recent-quizzes-list').innerHTML = '<p style="color:var(--text-muted);font-size:13px;">Login to see your quizzes</p>';
    document.getElementById('stat-courses').textContent = '0';
    document.getElementById('stat-quizzes').textContent = '0';
    document.getElementById('stat-roadmaps').textContent = '0';
    document.getElementById('stat-avg-score').textContent = '0%';
  }
}
