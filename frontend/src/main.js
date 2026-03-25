import { apiFetch, setToken, setUser, getUser, removeToken, removeUser, getToken } from './api.js';
import { showToast } from './toast.js';
import { renderDashboard } from './pages/dashboard.js';
import { renderRoadmap } from './pages/roadmap.js';
import { renderCourses } from './pages/courses.js';
import { renderQuiz } from './pages/quiz.js';
import { renderChat } from './pages/chat.js';
import { renderAbout } from './pages/about.js';
import { renderContact } from './pages/contact.js';

// ============ ROUTER ============
const routes = {
  'dashboard': { title: 'Dashboard', render: renderDashboard, auth: true },
  'roadmap': { title: 'Roadmap', render: renderRoadmap, auth: true },
  'courses': { title: 'Courses', render: renderCourses, auth: true },
  'quiz': { title: 'Quiz', render: renderQuiz, auth: true },
  'ai-assistant': { title: 'AI Assistant', render: renderChat, auth: true },
  'about': { title: 'About Us', render: renderAbout, auth: false },
  'contact': { title: 'Contact Us', render: renderContact, auth: false }
};

function navigate(page) {
  const route = routes[page];
  if (!route) return navigate('dashboard');

  // Check auth for protected routes
  if (route.auth && !getToken()) {
    showToast('Please login to access this page', 'info');
    openAuthModal();
    return;
  }

  const container = document.getElementById('page-content');
  container.innerHTML = '';
  document.getElementById('page-title').textContent = route.title;

  // Update active nav link
  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.toggle('active', link.dataset.page === page);
  });

  // Render page
  route.render(container);

  // Close mobile sidebar
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebar-overlay').classList.remove('show');
}

function hashRoute() {
  const hash = window.location.hash.replace('#/', '') || 'dashboard';
  navigate(hash);
}

// ============ AUTH ============
function openAuthModal() {
  document.getElementById('auth-modal').classList.add('show');
}

function closeAuthModal() {
  document.getElementById('auth-modal').classList.remove('show');
  document.getElementById('login-error').textContent = '';
  document.getElementById('register-error').textContent = '';
}

function updateUIForAuth() {
  const user = getUser();
  const authBtn = document.getElementById('auth-btn');
  const avatarEl = document.getElementById('user-avatar');
  const dropdownInfo = document.getElementById('dropdown-user-info');

  if (user) {
    avatarEl.textContent = user.name.charAt(0).toUpperCase();
    dropdownInfo.innerHTML = `
      <span class="dropdown-name">${user.name}</span>
      <span class="dropdown-email">${user.email}</span>
    `;
    authBtn.textContent = 'Logout';
    authBtn.onclick = logout;
  } else {
    avatarEl.textContent = '?';
    dropdownInfo.innerHTML = `
      <span class="dropdown-name">Guest</span>
      <span class="dropdown-email">Not logged in</span>
    `;
    authBtn.textContent = 'Login';
    authBtn.onclick = openAuthModal;
  }
}

function logout() {
  removeToken();
  removeUser();
  updateUIForAuth();
  showToast('Logged out successfully', 'info');
  navigate('about');
  document.getElementById('dropdown-menu').classList.remove('show');
}

// ============ INIT ============
function init() {
  // Hash routing
  window.addEventListener('hashchange', hashRoute);

  // Profile dropdown
  document.getElementById('profile-btn').addEventListener('click', (e) => {
    e.stopPropagation();
    document.getElementById('dropdown-menu').classList.toggle('show');
  });

  document.addEventListener('click', () => {
    document.getElementById('dropdown-menu').classList.remove('show');
  });

  // Hamburger menu
  document.getElementById('hamburger').addEventListener('click', () => {
    document.getElementById('sidebar').classList.add('open');
    document.getElementById('sidebar-overlay').classList.add('show');
  });

  document.getElementById('sidebar-close').addEventListener('click', () => {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('sidebar-overlay').classList.remove('show');
  });

  document.getElementById('sidebar-overlay').addEventListener('click', () => {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('sidebar-overlay').classList.remove('show');
  });

  // Auth modal
  document.getElementById('auth-modal-close').addEventListener('click', closeAuthModal);
  document.getElementById('auth-modal').addEventListener('click', (e) => {
    if (e.target === document.getElementById('auth-modal')) closeAuthModal();
  });

  // Auth tabs
  document.querySelectorAll('.auth-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      if (tab.dataset.tab === 'login') {
        document.getElementById('login-form').style.display = 'block';
        document.getElementById('register-form').style.display = 'none';
      } else {
        document.getElementById('login-form').style.display = 'none';
        document.getElementById('register-form').style.display = 'block';
      }
    });
  });

  // Login form
  document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    document.getElementById('login-error').textContent = '';

    try {
      const { data } = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: document.getElementById('login-email').value,
          password: document.getElementById('login-password').value
        })
      });

      setToken(data.token);
      setUser({ _id: data._id, name: data.name, email: data.email });
      closeAuthModal();
      updateUIForAuth();
      showToast(`Welcome back, ${data.name}!`, 'success');
      navigate('dashboard');
    } catch (err) {
      document.getElementById('login-error').textContent = err.message;
    }
  });

  // Register form
  document.getElementById('register-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    document.getElementById('register-error').textContent = '';

    try {
      const { data } = await apiFetch('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          name: document.getElementById('register-name').value,
          email: document.getElementById('register-email').value,
          password: document.getElementById('register-password').value
        })
      });

      setToken(data.token);
      setUser({ _id: data._id, name: data.name, email: data.email });
      closeAuthModal();
      updateUIForAuth();
      showToast(`Welcome, ${data.name}!`, 'success');
      navigate('dashboard');
    } catch (err) {
      document.getElementById('register-error').textContent = err.message;
    }
  });

  // Nav links
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const page = link.dataset.page;
      window.location.hash = `#/${page}`;
    });
  });

  // Initial state
  updateUIForAuth();

  // Route to current hash or default
  if (!window.location.hash) {
    window.location.hash = getToken() ? '#/dashboard' : '#/about';
  } else {
    hashRoute();
  }
}

// Start app
document.addEventListener('DOMContentLoaded', init);
