import { apiFetch } from '../api.js';
import { showToast } from '../toast.js';

let currentView = 'list'; // 'list' | 'setup' | 'taking' | 'results'
let currentQuiz = null;
let userAnswers = {};

export function renderQuiz(container) {
  currentView = 'list';
  currentQuiz = null;
  userAnswers = {};
  renderQuizList(container);
}

function renderQuizList(container) {
  container.innerHTML = `
    <div class="section-header">
      <h2>Quizzes</h2>
      <button class="btn btn-primary" id="new-quiz-btn">+ Generate Quiz</button>
    </div>
    <div id="quizzes-container"><div class="spinner"></div></div>
  `;

  document.getElementById('new-quiz-btn').addEventListener('click', () => renderQuizSetup(container));
  loadQuizzes(container);
}

async function loadQuizzes(container) {
  try {
    const { data } = await apiFetch('/quizzes');
    const el = document.getElementById('quizzes-container');

    if (data.length === 0) {
      el.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">❓</div>
          <h3>No Quizzes Yet</h3>
          <p>Generate a quiz on any topic to test your knowledge!</p>
        </div>
      `;
      return;
    }

    el.innerHTML = `<div class="quiz-list">${data.map(q => `
      <div class="quiz-list-item glass-card" data-id="${q._id}">
        <h3>${q.title}</h3>
        <div class="quiz-meta">
          <span class="badge badge-${q.difficulty}">${q.difficulty}</span>
          <span>${q.totalQuestions} questions</span>
        </div>
        ${q.completed
          ? `<div class="quiz-score-display">${q.score}%</div>`
          : '<span style="color:var(--accent-orange);font-size:13px;font-weight:500;">⏳ In Progress</span>'
        }
      </div>
    `).join('')}</div>`;

    el.querySelectorAll('.quiz-list-item').forEach(item => {
      item.addEventListener('click', async () => {
        const quiz = data.find(q => q._id === item.dataset.id);
        if (quiz) {
          if (quiz.completed) {
            renderQuizResults(container, quiz);
          } else {
            currentQuiz = quiz;
            userAnswers = {};
            renderQuizTaking(container);
          }
        }
      });
    });
  } catch (err) {
    document.getElementById('quizzes-container').innerHTML = `<p style="color:var(--accent-red);">${err.message}</p>`;
  }
}

function renderQuizSetup(container) {
  container.innerHTML = `
    <button class="back-btn" id="back-btn">← Back to Quizzes</button>
    <div class="quiz-setup glass-card">
      <h2>🧠 Generate a Quiz</h2>
      <p style="color:var(--text-secondary);font-size:13px;margin-bottom:20px;">AI will generate questions to test your knowledge on any topic.</p>
      <form id="quiz-form">
        <div class="form-group">
          <label for="quiz-topic">Topic</label>
          <input type="text" id="quiz-topic" placeholder="e.g., JavaScript, Data Structures" required />
        </div>
        <div class="form-group">
          <label for="quiz-count">Number of Questions</label>
          <input type="number" id="quiz-count" min="3" max="20" value="5" required />
        </div>
        <div class="form-group">
          <label for="quiz-difficulty">Difficulty</label>
          <select id="quiz-difficulty">
            <option value="easy">Easy</option>
            <option value="medium" selected>Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>
        <button type="submit" class="btn btn-primary btn-full" id="gen-quiz-btn">🚀 Generate Quiz</button>
        <div id="quiz-gen-error" class="form-error"></div>
      </form>
    </div>
  `;

  document.getElementById('back-btn').addEventListener('click', () => renderQuizList(container));

  document.getElementById('quiz-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('gen-quiz-btn');
    btn.disabled = true;
    btn.textContent = '⏳ Generating...';
    document.getElementById('quiz-gen-error').textContent = '';

    try {
      const { data } = await apiFetch('/quizzes/generate', {
        method: 'POST',
        body: JSON.stringify({
          topic: document.getElementById('quiz-topic').value,
          numQuestions: parseInt(document.getElementById('quiz-count').value),
          difficulty: document.getElementById('quiz-difficulty').value
        })
      });

      showToast('Quiz generated!', 'success');
      currentQuiz = data;
      userAnswers = {};
      renderQuizTaking(container);
    } catch (err) {
      document.getElementById('quiz-gen-error').textContent = err.message;
      btn.disabled = false;
      btn.textContent = '🚀 Generate Quiz';
    }
  });
}

function renderQuizTaking(container) {
  const quiz = currentQuiz;
  const letters = ['A', 'B', 'C', 'D'];

  container.innerHTML = `
    <button class="back-btn" id="back-btn">← Back to Quizzes</button>
    <div class="quiz-container">
      <div class="quiz-header glass-card">
        <h2 style="font-size:18px;">${quiz.title}</h2>
        <span class="quiz-progress-text" id="quiz-answered">0/${quiz.questions.length} answered</span>
      </div>
      <div id="questions-container">
        ${quiz.questions.map((q, qi) => `
          <div class="question-card glass-card" data-qi="${qi}">
            <div class="question-number">Question ${qi + 1}</div>
            <h3>${q.question}</h3>
            <div class="options-list">
              ${q.options.map((opt, oi) => `
                <button class="option-btn" data-qi="${qi}" data-oi="${oi}">
                  <span class="option-letter">${letters[oi]}</span>
                  <span>${opt}</span>
                </button>
              `).join('')}
            </div>
          </div>
        `).join('')}
      </div>
      <button class="btn btn-primary btn-full" id="submit-quiz-btn" style="margin-top:20px;" disabled>Submit Quiz</button>
    </div>
  `;

  document.getElementById('back-btn').addEventListener('click', () => renderQuizList(container));

  container.querySelectorAll('.option-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const qi = parseInt(btn.dataset.qi);
      const oi = parseInt(btn.dataset.oi);

      // Deselect other options in this question
      container.querySelectorAll(`.option-btn[data-qi="${qi}"]`).forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');

      userAnswers[qi] = oi;
      updateProgress();
    });
  });

  function updateProgress() {
    const answered = Object.keys(userAnswers).length;
    document.getElementById('quiz-answered').textContent = `${answered}/${quiz.questions.length} answered`;
    document.getElementById('submit-quiz-btn').disabled = answered < quiz.questions.length;
  }

  document.getElementById('submit-quiz-btn').addEventListener('click', submitQuiz.bind(null, container));
}

async function submitQuiz(container) {
  const quiz = currentQuiz;
  const btn = document.getElementById('submit-quiz-btn');
  btn.disabled = true;
  btn.textContent = '⏳ Submitting...';

  const answers = quiz.questions.map((q, qi) => ({
    questionId: q._id,
    answer: userAnswers[qi] !== undefined ? userAnswers[qi] : -1
  }));

  try {
    const { data } = await apiFetch(`/quizzes/${quiz._id}/submit`, {
      method: 'POST',
      body: JSON.stringify({ answers })
    });

    showToast(`Quiz completed! Score: ${data.results.score}%`, data.results.score >= 70 ? 'success' : 'info');
    renderQuizResults(container, data.quiz, data.results);
  } catch (err) {
    showToast(err.message, 'error');
    btn.disabled = false;
    btn.textContent = 'Submit Quiz';
  }
}

function renderQuizResults(container, quiz, results = null) {
  const letters = ['A', 'B', 'C', 'D'];

  if (!results) {
    const correct = quiz.questions.filter(q => q.userAnswer === q.correctAnswer).length;
    results = {
      score: quiz.score,
      totalQuestions: quiz.totalQuestions,
      correctAnswers: correct,
      wrongAnswers: quiz.totalQuestions - correct
    };
  }

  container.innerHTML = `
    <button class="back-btn" id="back-btn">← Back to Quizzes</button>
    <div class="quiz-results glass-card">
      <h2>Quiz Results</h2>
      <p style="color:var(--text-secondary);">${quiz.title}</p>
      <div class="score-circle">${results.score}%</div>
      <div class="results-stats">
        <div><h4 style="color:var(--accent-green);">${results.correctAnswers}</h4><p>Correct</p></div>
        <div><h4 style="color:var(--accent-red);">${results.wrongAnswers}</h4><p>Wrong</p></div>
        <div><h4>${results.totalQuestions}</h4><p>Total</p></div>
      </div>
    </div>

    <h3 style="margin:20px 0 12px;">Review Answers</h3>
    ${quiz.questions.map((q, qi) => {
      const isCorrect = q.userAnswer === q.correctAnswer;
      return `
        <div class="question-card glass-card">
          <div class="question-number">Question ${qi + 1}</div>
          <h3>${q.question}</h3>
          <div class="options-list">
            ${q.options.map((opt, oi) => {
              let cls = '';
              if (oi === q.correctAnswer) cls = 'correct';
              else if (oi === q.userAnswer && !isCorrect) cls = 'wrong';
              return `
                <div class="option-btn ${cls}" style="cursor:default;">
                  <span class="option-letter">${letters[oi]}</span>
                  <span>${opt}</span>
                </div>
              `;
            }).join('')}
          </div>
          ${q.explanation ? `<div class="explanation-text">💡 ${q.explanation}</div>` : ''}
        </div>
      `;
    }).join('')}
  `;

  document.getElementById('back-btn').addEventListener('click', () => renderQuizList(container));
}
