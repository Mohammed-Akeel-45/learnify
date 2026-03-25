import { apiFetch } from '../api.js';
import { showToast } from '../toast.js';

let currentView = 'list'; // 'list' | 'detail' | 'generate'
let currentRoadmap = null;

export function renderRoadmap(container) {
  currentView = 'list';
  currentRoadmap = null;
  renderRoadmapList(container);
}

function renderRoadmapList(container) {
  container.innerHTML = `
    <div class="section-header">
      <h2>Your Roadmaps</h2>
      <button class="btn btn-primary" id="new-roadmap-btn">+ Generate Roadmap</button>
    </div>
    <div id="roadmaps-container"><div class="spinner"></div></div>
  `;

  document.getElementById('new-roadmap-btn').addEventListener('click', () => renderGenerateForm(container));
  loadRoadmaps(container);
}

async function loadRoadmaps(container) {
  try {
    const { data } = await apiFetch('/roadmaps');
    const el = document.getElementById('roadmaps-container');

    if (data.length === 0) {
      el.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🗺️</div>
          <h3>No Roadmaps Yet</h3>
          <p>Generate your first learning roadmap powered by AI!</p>
        </div>
      `;
      return;
    }

    el.innerHTML = `<div class="roadmap-list">${data.map(r => `
      <div class="roadmap-list-item glass-card" data-id="${r._id}">
        <div style="display:flex;justify-content:space-between;align-items:start;">
          <h3>${r.title}</h3>
          <span class="badge badge-${r.status}">${r.status}</span>
        </div>
        <p>${r.description || 'No description'}</p>
        <div class="roadmap-meta">
          <span>📅 ${r.totalWeeks} weeks</span>
          <span>📖 ${r.topic}</span>
          <span>🕐 ${new Date(r.createdAt).toLocaleDateString()}</span>
        </div>
      </div>
    `).join('')}</div>`;

    el.querySelectorAll('.roadmap-list-item').forEach(item => {
      item.addEventListener('click', () => {
        const roadmap = data.find(r => r._id === item.dataset.id);
        if (roadmap) renderRoadmapDetail(container, roadmap);
      });
    });
  } catch (err) {
    document.getElementById('roadmaps-container').innerHTML = `<p style="color:var(--accent-red);">${err.message}</p>`;
  }
}

function renderGenerateForm(container) {
  container.innerHTML = `
    <button class="back-btn" id="back-btn">← Back to Roadmaps</button>
    <div class="roadmap-form glass-card">
      <h2>🗺️ Generate Learning Roadmap</h2>
      <p style="color:var(--text-secondary);font-size:13px;margin-bottom:20px;">Tell us what you want to learn and we'll create a personalized roadmap using AI.</p>
      <form id="roadmap-gen-form">
        <div class="form-group">
          <label for="roadmap-topic">What do you want to learn?</label>
          <input type="text" id="roadmap-topic" placeholder="e.g., React.js, Machine Learning, Python" required />
        </div>
        <div class="form-group">
          <label for="roadmap-weeks">How many weeks?</label>
          <input type="number" id="roadmap-weeks" min="1" max="52" value="4" required />
        </div>
        <div class="form-group">
          <label for="roadmap-info">Additional preferences (optional)</label>
          <textarea id="roadmap-info" placeholder="e.g., I'm a beginner, focus on practical projects..."></textarea>
        </div>
        <button type="submit" class="btn btn-primary btn-full" id="gen-btn">🚀 Generate Roadmap</button>
        <div id="gen-error" class="form-error"></div>
      </form>
    </div>
  `;

  document.getElementById('back-btn').addEventListener('click', () => renderRoadmapList(container));

  document.getElementById('roadmap-gen-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('gen-btn');
    btn.disabled = true;
    btn.textContent = '⏳ Generating...';
    document.getElementById('gen-error').textContent = '';

    try {
      const { data } = await apiFetch('/roadmaps/generate', {
        method: 'POST',
        body: JSON.stringify({
          topic: document.getElementById('roadmap-topic').value,
          totalWeeks: parseInt(document.getElementById('roadmap-weeks').value),
          additionalInfo: document.getElementById('roadmap-info').value
        })
      });

      showToast('Roadmap generated successfully!', 'success');
      renderRoadmapDetail(container, data);
    } catch (err) {
      document.getElementById('gen-error').textContent = err.message;
      btn.disabled = false;
      btn.textContent = '🚀 Generate Roadmap';
    }
  });
}

function renderRoadmapDetail(container, roadmap) {
  currentRoadmap = roadmap;
  container.innerHTML = `
    <button class="back-btn" id="back-btn">← Back to Roadmaps</button>
    <div class="glass-card" style="padding:24px;margin-bottom:20px;">
      <div style="display:flex;justify-content:space-between;align-items:start;flex-wrap:wrap;gap:8px;">
        <div>
          <h2 style="font-size:22px;margin-bottom:4px;">${roadmap.title}</h2>
          <p style="color:var(--text-secondary);font-size:13px;">${roadmap.description || ''}</p>
        </div>
        <span class="badge badge-${roadmap.status}">${roadmap.status}</span>
      </div>
      <div class="roadmap-meta" style="margin-top:12px;">
        <span>📖 ${roadmap.topic}</span>
        <span>📅 ${roadmap.totalWeeks} weeks</span>
      </div>
    </div>

    <div class="roadmap-timeline" id="roadmap-timeline">
      ${roadmap.weeks.map(w => `
        <div class="week-card glass-card">
          <h3>Week ${w.weekNumber}: ${w.title}</h3>
          ${w.objectives ? `<h4>Objectives</h4><ul style="margin-left:16px;font-size:13px;color:var(--text-secondary);">${w.objectives.map(o => `<li style="margin-bottom:4px;">${o}</li>`).join('')}</ul>` : ''}
          <div class="week-topics">
            ${w.topics.map(t => `<span class="topic-tag">${t}</span>`).join('')}
          </div>
          ${w.resources ? `<div style="margin-top:8px;"><h4>Resources</h4><ul style="margin-left:16px;font-size:12px;color:var(--text-muted);">${w.resources.map(r => `<li>${r}</li>`).join('')}</ul></div>` : ''}
        </div>
      `).join('')}
    </div>

    <div class="roadmap-actions" style="margin-top:20px;">
      ${roadmap.status === 'draft' ? `
        <button class="btn btn-success" id="approve-btn">✅ Approve Roadmap</button>
        <button class="btn btn-secondary" id="regenerate-btn">🔄 Regenerate</button>
      ` : `
        <button class="btn btn-primary" id="generate-course-btn">📚 Generate Course</button>
      `}
      <button class="btn btn-danger" id="delete-roadmap-btn">🗑️ Delete</button>
    </div>

    <div id="regen-section" style="display:none;" class="regenerate-section">
      <h4>What would you like to change?</h4>
      <div class="form-group" style="margin-bottom:10px;">
        <textarea id="regen-feedback" placeholder="e.g., Add more practical projects, reduce theory..."></textarea>
      </div>
      <button class="btn btn-primary btn-sm" id="regen-submit-btn">Regenerate</button>
    </div>
  `;

  document.getElementById('back-btn').addEventListener('click', () => renderRoadmapList(container));

  if (roadmap.status === 'draft') {
    document.getElementById('approve-btn').addEventListener('click', () => approveRoadmap(container, roadmap._id));
    document.getElementById('regenerate-btn').addEventListener('click', () => {
      document.getElementById('regen-section').style.display = 'block';
    });
    const regenSubmit = document.getElementById('regen-submit-btn');
    if (regenSubmit) {
      regenSubmit.addEventListener('click', () => regenerateRoadmap(container, roadmap._id));
    }
  } else {
    document.getElementById('generate-course-btn').addEventListener('click', () => generateCourseFromRoadmap(container, roadmap._id));
  }

  document.getElementById('delete-roadmap-btn').addEventListener('click', () => deleteRoadmap(container, roadmap._id));
}

async function approveRoadmap(container, id) {
  try {
    const { data } = await apiFetch(`/roadmaps/${id}/approve`, { method: 'POST' });
    showToast('Roadmap approved!', 'success');
    renderRoadmapDetail(container, data);
  } catch (err) { showToast(err.message, 'error'); }
}

async function regenerateRoadmap(container, id) {
  const btn = document.getElementById('regen-submit-btn');
  btn.disabled = true;
  btn.textContent = '⏳ Regenerating...';

  try {
    const feedback = document.getElementById('regen-feedback').value;
    const { data } = await apiFetch(`/roadmaps/${id}/regenerate`, {
      method: 'PUT',
      body: JSON.stringify({ feedback })
    });
    showToast('Roadmap regenerated!', 'success');
    renderRoadmapDetail(container, data);
  } catch (err) {
    showToast(err.message, 'error');
    btn.disabled = false;
    btn.textContent = 'Regenerate';
  }
}

async function generateCourseFromRoadmap(container, roadmapId) {
  const btn = document.getElementById('generate-course-btn');
  btn.disabled = true;
  btn.textContent = '⏳ Generating course...';

  try {
    await apiFetch(`/courses/generate/${roadmapId}`, { method: 'POST' });
    showToast('Course generated! Go to Courses tab to start learning.', 'success');
    btn.textContent = '✅ Course Generated!';
  } catch (err) {
    showToast(err.message, 'error');
    btn.disabled = false;
    btn.textContent = '📚 Generate Course';
  }
}

async function deleteRoadmap(container, id) {
  if (!confirm('Are you sure you want to delete this roadmap?')) return;
  try {
    await apiFetch(`/roadmaps/${id}`, { method: 'DELETE' });
    showToast('Roadmap deleted', 'success');
    renderRoadmapList(container);
  } catch (err) { showToast(err.message, 'error'); }
}
