import { apiFetch } from '../api.js';
import { showToast } from '../toast.js';

export function renderCourses(container) {
  container.innerHTML = `
    <div class="section-header">
      <h2>My Courses</h2>
    </div>
    <div id="courses-container"><div class="spinner"></div></div>
  `;
  loadCourses(container);
}

async function loadCourses(container) {
  try {
    const { data } = await apiFetch('/courses');
    const el = document.getElementById('courses-container');

    if (data.length === 0) {
      el.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon"></div>
          <h3>No Courses Yet</h3>
          <p>Generate a roadmap and approve it to create a course!</p>
          <a href="#/roadmap" class="btn btn-primary">Go to Roadmaps</a>
        </div>
      `;
      return;
    }

    el.innerHTML = `<div class="courses-grid">${data.map(c => `
      <div class="course-card glass-card" data-id="${c._id}">
        <h3>${c.title}</h3>
        <p>${c.description || 'AI-generated learning course'}</p>
        <div style="font-size:12px;color:var(--text-muted);margin-bottom:12px;">
          ${c.totalLessons} lessons • ${c.modules ? c.modules.length : 0} modules
        </div>
        <div class="course-progress">
          <div class="progress-bar" style="flex:1;"><div class="progress-fill" style="width:${c.progress}%"></div></div>
          <span>${c.progress}%</span>
        </div>
      </div>
    `).join('')}</div>`;

    el.querySelectorAll('.course-card').forEach(card => {
      card.addEventListener('click', () => {
        const course = data.find(c => c._id === card.dataset.id);
        if (course) renderCourseDetail(container, course);
      });
    });
  } catch (err) {
    document.getElementById('courses-container').innerHTML = `<p style="color:var(--accent-red);">${err.message}</p>`;
  }
}

function renderCourseDetail(container, course) {
  container.innerHTML = `
    <button class="back-btn" id="back-btn">← Back to Courses</button>
    <div class="course-detail-header glass-card">
      <h1>${course.title}</h1>
      <p>${course.description || ''}</p>
      <div style="display:flex;gap:16px;align-items:center;margin-top:12px;">
        <div class="course-progress" style="flex:1;max-width:300px;">
          <div class="progress-bar" style="flex:1;"><div class="progress-fill" style="width:${course.progress}%"></div></div>
          <span>${course.progress}%</span>
        </div>
        <span style="font-size:12px;color:var(--text-muted);">${course.completedLessons}/${course.totalLessons} lessons</span>
      </div>
    </div>

    <div id="modules-container">
      ${course.modules.map((mod, mi) => `
        <div class="module-accordion glass-card">
          <div class="module-header" data-module="${mi}">
            <h3> ${mod.title}</h3>
            <span class="chevron">▼</span>
          </div>
          <div class="module-lessons" id="module-lessons-${mi}">
            ${mod.lessons.map((lesson, li) => `
              <div class="lesson-item" data-course="${course._id}" data-module="${mi}" data-lesson="${li}">
                <div class="lesson-checkbox ${lesson.completed ? 'completed' : ''}"></div>
                <div>
                  <div class="lesson-title">${lesson.title}</div>
                  <div class="lesson-duration"> ${lesson.duration || '30 mins'}</div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `).join('')}
    </div>

    <div id="lesson-viewer" class="lesson-content-viewer glass-card" style="display:none;">
      <h2 id="lesson-viewer-title"></h2>
      <div class="content-body" id="lesson-viewer-content"></div>
    </div>
  `;

  document.getElementById('back-btn').addEventListener('click', () => renderCourses(container));

  // Accordion toggles
  container.querySelectorAll('.module-header').forEach(header => {
    header.addEventListener('click', () => {
      const mi = header.dataset.module;
      const lessons = document.getElementById(`module-lessons-${mi}`);
      const chevron = header.querySelector('.chevron');
      lessons.classList.toggle('show');
      chevron.classList.toggle('open');
    });
  });

  // Lesson click — show content + toggle completion
  container.querySelectorAll('.lesson-item').forEach(item => {
    item.addEventListener('click', async () => {
      const mi = parseInt(item.dataset.module);
      const li = parseInt(item.dataset.lesson);
      const lesson = course.modules[mi].lessons[li];

      // Show lesson content
      const viewer = document.getElementById('lesson-viewer');
      viewer.style.display = 'block';
      document.getElementById('lesson-viewer-title').textContent = lesson.title;
      document.getElementById('lesson-viewer-content').textContent = lesson.content;
      viewer.scrollIntoView({ behavior: 'smooth' });
    });

    // Checkbox click (stop propagation)
    const checkbox = item.querySelector('.lesson-checkbox');
    checkbox.addEventListener('click', async (e) => {
      e.stopPropagation();
      const courseId = item.dataset.course;
      const mi = item.dataset.module;
      const li = item.dataset.lesson;

      try {
        const { data } = await apiFetch(`/courses/${courseId}/lesson/${mi}/${li}/complete`, { method: 'PUT' });
        showToast('Progress updated!', 'success');
        renderCourseDetail(container, data);
      } catch (err) { showToast(err.message, 'error'); }
    });
  });

  // Open first module by default
  const firstLessons = document.getElementById('module-lessons-0');
  const firstChevron = container.querySelector('.module-header .chevron');
  if (firstLessons) { firstLessons.classList.add('show'); firstChevron.classList.add('open'); }
}
