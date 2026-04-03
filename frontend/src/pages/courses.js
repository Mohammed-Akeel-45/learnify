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

    el.innerHTML = `<div class="courses-grid">${data.map(c => {
      const generatedCount = countGeneratedLessons(c);
      return `
        <div class="course-card glass-card" data-id="${c._id}">
          <h3>${c.title}</h3>
          <p>${c.description || 'AI-generated learning course'}</p>
          <div style="font-size:12px;color:var(--text-muted);margin-bottom:12px;">
            ${c.totalLessons} lessons · ${c.modules ? c.modules.length : 0} chapters · ${generatedCount} generated
          </div>
          <div class="course-progress">
            <div class="progress-bar" style="flex:1;"><div class="progress-fill" style="width:${c.progress}%"></div></div>
            <span>${c.progress}%</span>
          </div>
        </div>
      `;
    }).join('')}</div>`;

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

function countGeneratedLessons(course) {
  let count = 0;
  if (course.modules) {
    course.modules.forEach(m => {
      if (m.lessons) {
        m.lessons.forEach(l => {
          if (l.contentGenerated || (l.content && l.content.length > 50)) count++;
        });
      }
    });
  }
  return count;
}

/**
 * Format plain text content into rich HTML
 */
function formatContent(text) {
  if (!text) return '<p>No content available.</p>';

  const lines = text.split('\n');
  let html = '';
  let inList = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) {
      if (inList) { html += '</ul>'; inList = false; }
      continue;
    }

    // Bullet points
    if (/^[•\-\*]\s+/.test(line)) {
      if (!inList) { html += '<ul class="content-bullets">'; inList = true; }
      html += `<li>${line.replace(/^[•\-\*]\s+/, '')}</li>`;
      continue;
    }

    // Numbered items
    if (/^\d+[\.\)]\s+/.test(line)) {
      if (!inList) { html += '<ul class="content-bullets content-numbered">'; inList = true; }
      html += `<li>${line.replace(/^\d+[\.\)]\s+/, '')}</li>`;
      continue;
    }

    if (inList) { html += '</ul>'; inList = false; }

    // Section headers
    if (/^(KEY TAKEAWAYS|EXAMPLE|PRACTICAL EXAMPLE|SUMMARY|INTRODUCTION|CONCLUSION|CORE CONCEPTS|COMMON PITFALLS)/i.test(line) ||
      (line.endsWith(':') && line.length < 80 && !line.includes('.'))) {
      const cleanTitle = line.replace(/:$/, '');
      html += `<h4 class="content-section-title">${cleanTitle}</h4>`;
      continue;
    }

    html += `<p>${line}</p>`;
  }

  if (inList) html += '</ul>';
  return html;
}

/**
 * Build flat index of all lessons
 */
function buildLessonIndex(course) {
  const lessons = [];
  course.modules.forEach((mod, mi) => {
    mod.lessons.forEach((lesson, li) => {
      lessons.push({ moduleIndex: mi, lessonIndex: li, lesson, moduleTitle: mod.title });
    });
  });
  return lessons;
}

function renderCourseDetail(container, course) {
  const lessonIndex = buildLessonIndex(course);

  function renderView(flatIdx) {
    const current = lessonIndex[flatIdx];
    const lesson = current.lesson;
    const mi = current.moduleIndex;
    const li = current.lessonIndex;
    const hasContent = lesson.contentGenerated || (lesson.content && lesson.content.length > 50);

    container.innerHTML = `
      <!-- Top bar -->
      <div class="course-top-bar">
        <button class="back-btn" id="back-btn">← Back to Courses</button>
        <div class="course-top-info">
          <h2 class="course-top-title">${course.title}</h2>
          <div class="course-top-progress">
            <div class="progress-bar" style="flex:1;max-width:200px;">
              <div class="progress-fill" style="width:${course.progress}%"></div>
            </div>
            <span>${course.progress}% · ${course.completedLessons}/${course.totalLessons}</span>
          </div>
        </div>
      </div>

      <div class="course-layout">
        <!-- Left Sidebar - Chapter Navigation -->
        <aside class="course-sidebar" id="course-sidebar">
          <div class="course-sidebar-header">
            <h3>Chapters</h3>
            <button class="course-sidebar-close" id="sidebar-panel-close">✕</button>
          </div>
          <div class="course-sidebar-chapters">
            ${course.modules.map((mod, modIdx) => {
      const isCurrentModule = modIdx === mi;
      return `
                <div class="chapter-group ${isCurrentModule ? 'chapter-open' : ''}">
                  <div class="chapter-header" data-chapter="${modIdx}">
                    <span class="chapter-chevron">${isCurrentModule ? '▾' : '▸'}</span>
                    <span class="chapter-title">Ch ${modIdx + 1}: ${mod.title}</span>
                  </div>
                  <div class="chapter-topics ${isCurrentModule ? 'show' : ''}">
                    ${mod.lessons.map((l, lIdx) => {
        const fIdx = lessonIndex.findIndex(x => x.moduleIndex === modIdx && x.lessonIndex === lIdx);
        const isActive = modIdx === mi && lIdx === li;
        const generated = l.contentGenerated || (l.content && l.content.length > 50);
        return `
                        <div class="topic-item ${isActive ? 'active' : ''} ${l.completed ? 'completed' : ''}" data-flat="${fIdx}">
                          <span class="topic-status">${l.completed ? '✓' : generated ? '●' : '○'}</span>
                          <span class="topic-name">${l.title}</span>
                        </div>
                      `;
      }).join('')}
                  </div>
                </div>
              `;
    }).join('')}
          </div>

          ${(course.recommendedBooks && course.recommendedBooks.length > 0) ? `
            <div class="course-books-section">
              <h4>Recommended Books</h4>
              ${course.recommendedBooks.map(b => `
                <div class="book-card">
                  <div class="book-title">${b.title}</div>
                  <div class="book-author">by ${b.author}</div>
                  ${b.reason ? `<div class="book-reason">${b.reason}</div>` : ''}
                </div>
              `).join('')}
            </div>
          ` : ''}
        </aside>

        <!-- Mobile toggle for sidebar -->
        <button class="course-sidebar-toggle" id="sidebar-panel-toggle">☰ Chapters</button>

        <!-- Right Content - Lesson Reader -->
        <main class="course-reader">
          <div class="reader-header">
            <div class="reader-breadcrumb">Chapter ${mi + 1} · Lesson ${li + 1}</div>
            <h1 class="reader-title">${lesson.title}</h1>
            <div class="reader-meta">
              <span>⏱ ${lesson.duration || '30 mins'}</span>
              ${hasContent
        ? `<span class="reader-status ${lesson.completed ? 'status-complete' : 'status-generated'}">
                    ${lesson.completed ? '✓ Completed' : '● Content Ready'}
                  </span>`
        : `<span class="reader-status status-pending">○ Not Generated</span>`
      }
            </div>
          </div>

          ${hasContent ? `
            <!-- Content exists — show it -->
            <div class="reader-content">
              ${formatContent(lesson.content)}
            </div>

            <div class="reader-actions">
              <button class="btn btn-secondary btn-nav" id="prev-lesson" ${flatIdx === 0 ? 'disabled' : ''}>
                ← Previous
              </button>
              <button class="btn ${lesson.completed ? 'btn-completed' : 'btn-primary'} btn-mark" id="mark-complete">
                ${lesson.completed ? '✓ Completed' : 'Mark Complete'}
              </button>
              <button class="btn btn-secondary btn-nav" id="next-lesson" ${flatIdx === lessonIndex.length - 1 ? 'disabled' : ''}>
                Next →
              </button>
            </div>
            <div class="reader-secondary-actions">
              <button class="btn btn-sm btn-secondary" id="regenerate-content"> Regenerate</button>
              <button class="btn btn-sm btn-danger" id="delete-content">Delete Content</button>
            </div>
          ` : `
            <!-- No content — show generate prompt -->
            <div class="reader-empty">
              <div class="reader-empty-icon"></div>
              <h3>Content Not Generated Yet</h3>
              <p>Click the button below to generate in-depth learning content for this lesson. The AI will create a comprehensive explanation with examples and key takeaways.</p>
              <button class="btn btn-primary btn-lg" id="generate-content">
              Generate Content
              </button>
            </div>

            <div class="reader-actions">
              <button class="btn btn-secondary btn-nav" id="prev-lesson" ${flatIdx === 0 ? 'disabled' : ''}>
                ← Previous
              </button>
              <div></div>
              <button class="btn btn-secondary btn-nav" id="next-lesson" ${flatIdx === lessonIndex.length - 1 ? 'disabled' : ''}>
                Next →
              </button>
            </div>
          `}
        </main>
      </div>
    `;

    // --- EVENT LISTENERS ---

    // Back
    document.getElementById('back-btn').addEventListener('click', () => renderCourses(container));

    // Chapter accordion
    container.querySelectorAll('.chapter-header').forEach(header => {
      header.addEventListener('click', () => {
        const group = header.parentElement;
        const topics = group.querySelector('.chapter-topics');
        const chevron = header.querySelector('.chapter-chevron');
        const isOpen = group.classList.contains('chapter-open');
        if (isOpen) {
          group.classList.remove('chapter-open');
          topics.classList.remove('show');
          chevron.textContent = '▸';
        } else {
          group.classList.add('chapter-open');
          topics.classList.add('show');
          chevron.textContent = '▾';
        }
      });
    });

    // Topic click — navigate
    container.querySelectorAll('.topic-item').forEach(item => {
      item.addEventListener('click', () => {
        const fIdx = parseInt(item.dataset.flat);
        renderView(fIdx);
      });
    });

    // Prev / Next
    const prevBtn = document.getElementById('prev-lesson');
    const nextBtn = document.getElementById('next-lesson');
    if (prevBtn) prevBtn.addEventListener('click', () => { if (flatIdx > 0) renderView(flatIdx - 1); });
    if (nextBtn) nextBtn.addEventListener('click', () => { if (flatIdx < lessonIndex.length - 1) renderView(flatIdx + 1); });

    // Generate content (on-demand)
    const generateBtn = document.getElementById('generate-content');
    if (generateBtn) {
      generateBtn.addEventListener('click', async () => {
        generateBtn.disabled = true;
        generateBtn.innerHTML = '<span class="spinner-inline"></span> Generating...';
        try {
          const { data } = await apiFetch(`/courses/${course._id}/lesson/${mi}/${li}/generate`, { method: 'POST' });
          showToast('Content generated!', 'success');
          Object.assign(course, data);
          rebuildIndex();
          renderView(flatIdx);
        } catch (err) {
          showToast(err.message, 'error');
          generateBtn.disabled = false;
          generateBtn.innerHTML = 'Generate Content';
        }
      });
    }

    // Regenerate content
    const regenBtn = document.getElementById('regenerate-content');
    if (regenBtn) {
      regenBtn.addEventListener('click', async () => {
        if (!confirm('Regenerate content? This will replace the current content.')) return;
        regenBtn.disabled = true;
        regenBtn.textContent = 'Generating...';
        try {
          const { data } = await apiFetch(`/courses/${course._id}/lesson/${mi}/${li}/generate`, { method: 'POST' });
          showToast('Content regenerated!', 'success');
          Object.assign(course, data);
          rebuildIndex();
          renderView(flatIdx);
        } catch (err) {
          showToast(err.message, 'error');
          regenBtn.disabled = false;
          regenBtn.textContent = 'Regenerate';
        }
      });
    }

    // Delete content
    const deleteBtn = document.getElementById('delete-content');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', async () => {
        if (!confirm('Delete this lesson content? You can regenerate it later.')) return;
        try {
          const { data } = await apiFetch(`/courses/${course._id}/lesson/${mi}/${li}/content`, { method: 'DELETE' });
          showToast('Content deleted', 'info');
          Object.assign(course, data);
          rebuildIndex();
          renderView(flatIdx);
        } catch (err) {
          showToast(err.message, 'error');
        }
      });
    }

    // Mark complete
    const markBtn = document.getElementById('mark-complete');
    if (markBtn) {
      markBtn.addEventListener('click', async () => {
        try {
          const { data } = await apiFetch(`/courses/${course._id}/lesson/${mi}/${li}/complete`, { method: 'PUT' });
          showToast('Progress updated!', 'success');
          Object.assign(course, data);
          rebuildIndex();
          renderView(flatIdx);
        } catch (err) {
          showToast(err.message, 'error');
        }
      });
    }

    // Mobile sidebar toggle
    const sidebarToggle = document.getElementById('sidebar-panel-toggle');
    const sidebarClose = document.getElementById('sidebar-panel-close');
    if (sidebarToggle) {
      sidebarToggle.addEventListener('click', () => {
        document.getElementById('course-sidebar').classList.add('open');
      });
    }
    if (sidebarClose) {
      sidebarClose.addEventListener('click', () => {
        document.getElementById('course-sidebar').classList.remove('open');
      });
    }

    // Scroll to top
    container.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function rebuildIndex() {
    lessonIndex.length = 0;
    buildLessonIndex(course).forEach(l => lessonIndex.push(l));
  }

  // Start at first lesson without content, or first incomplete, or first
  let startIdx = lessonIndex.findIndex(l => !l.lesson.contentGenerated && !(l.lesson.content && l.lesson.content.length > 50));
  if (startIdx === -1) startIdx = lessonIndex.findIndex(l => !l.lesson.completed);
  if (startIdx === -1) startIdx = 0;
  renderView(startIdx);
}
