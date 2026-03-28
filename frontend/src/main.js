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
  document.getElementById('register-step1-error').textContent = '';
  document.getElementById('register-step2-error').textContent = '';
  document.getElementById('register-step3-error').textContent = '';
  
  // Reset forgot password steps
  document.getElementById('forgot-step1').style.display = 'none';
  document.getElementById('forgot-step2').style.display = 'none';
  document.getElementById('forgot-step3').style.display = 'none';
  
  // Reset register steps
  document.getElementById('register-step1').style.display = 'none';
  document.getElementById('register-step2').style.display = 'none';
  document.getElementById('register-step3').style.display = 'none';

  document.getElementById('auth-tabs-container').style.display = 'flex';
  document.getElementById('login-form').style.display = 'block';
  document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
  document.querySelector('.auth-tab[data-tab="login"]').classList.add('active');
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
      // Hide all forgot steps and register steps
      hideAllForgotSteps();
      document.getElementById('register-step1').style.display = 'none';
      document.getElementById('register-step2').style.display = 'none';
      document.getElementById('register-step3').style.display = 'none';
      
      if (tab.dataset.tab === 'login') {
        document.getElementById('login-form').style.display = 'block';
      } else {
        document.getElementById('login-form').style.display = 'none';
        document.getElementById('register-step1').style.display = 'block';
      }
    });
  });

  // ============ FORGOT PASSWORD FLOW ============

  let forgotEmail = '';
  let resetToken = '';

  function hideAllForgotSteps() {
    document.getElementById('forgot-step1').style.display = 'none';
    document.getElementById('forgot-step2').style.display = 'none';
    document.getElementById('forgot-step3').style.display = 'none';
    document.getElementById('forgot-step1-error').textContent = '';
    document.getElementById('forgot-step2-error').textContent = '';
    document.getElementById('forgot-step3-error').textContent = '';
  }

  function showForgotStep(step) {
    document.getElementById('login-form').style.display = 'none';
    document.getElementById('register-form').style.display = 'none';
    document.getElementById('auth-tabs-container').style.display = 'none';
    hideAllForgotSteps();
    document.getElementById(`forgot-step${step}`).style.display = 'block';
  }

  function backToLogin() {
    hideAllForgotSteps();
    document.getElementById('auth-tabs-container').style.display = 'flex';
    document.getElementById('login-form').style.display = 'block';
    document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
    document.querySelector('.auth-tab[data-tab="login"]').classList.add('active');
  }

  // "Forgot Password?" link
  document.getElementById('forgot-password-link').addEventListener('click', () => {
    showForgotStep(1);
  });

  // Back to login buttons
  document.getElementById('forgot-back-login1').addEventListener('click', backToLogin);

  // Step 1: Send OTP
  document.getElementById('forgot-send-otp-btn').addEventListener('click', async () => {
    const btn = document.getElementById('forgot-send-otp-btn');
    const email = document.getElementById('forgot-email').value.trim();
    if (!email) {
      document.getElementById('forgot-step1-error').textContent = 'Please enter your email';
      return;
    }

    btn.disabled = true;
    btn.textContent = 'Sending...';
    document.getElementById('forgot-step1-error').textContent = '';

    try {
      await apiFetch('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email })
      });
      forgotEmail = email;
      showToast('OTP sent to your email!', 'success');
      showForgotStep(2);
    } catch (err) {
      document.getElementById('forgot-step1-error').textContent = err.message;
    }
    btn.disabled = false;
    btn.textContent = 'Send OTP';
  });

  // Step 2: Verify OTP
  document.getElementById('forgot-verify-otp-btn').addEventListener('click', async () => {
    const btn = document.getElementById('forgot-verify-otp-btn');
    const otp = document.getElementById('forgot-otp').value.trim();
    if (!otp || otp.length !== 6) {
      document.getElementById('forgot-step2-error').textContent = 'Please enter the 6-digit OTP';
      return;
    }

    btn.disabled = true;
    btn.textContent = 'Verifying...';
    document.getElementById('forgot-step2-error').textContent = '';

    try {
      const res = await apiFetch('/auth/verify-otp', {
        method: 'POST',
        body: JSON.stringify({ email: forgotEmail, otp })
      });
      resetToken = res.resetToken;
      showToast('OTP verified!', 'success');
      showForgotStep(3);
    } catch (err) {
      document.getElementById('forgot-step2-error').textContent = err.message;
    }
    btn.disabled = false;
    btn.textContent = 'Verify OTP';
  });

  // Resend OTP
  document.getElementById('forgot-resend-otp').addEventListener('click', async () => {
    try {
      await apiFetch('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email: forgotEmail })
      });
      showToast('New OTP sent!', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  // Step 3: Reset Password
  document.getElementById('forgot-reset-btn').addEventListener('click', async () => {
    const btn = document.getElementById('forgot-reset-btn');
    const newPassword = document.getElementById('forgot-new-password').value;
    const confirmPassword = document.getElementById('forgot-confirm-password').value;

    if (!newPassword || !confirmPassword) {
      document.getElementById('forgot-step3-error').textContent = 'Please fill in both fields';
      return;
    }
    if (newPassword.length < 6) {
      document.getElementById('forgot-step3-error').textContent = 'Password must be at least 6 characters';
      return;
    }
    if (newPassword !== confirmPassword) {
      document.getElementById('forgot-step3-error').textContent = 'Passwords do not match';
      return;
    }

    btn.disabled = true;
    btn.textContent = 'Resetting...';
    document.getElementById('forgot-step3-error').textContent = '';

    try {
      const res = await apiFetch('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ resetToken, newPassword, confirmPassword })
      });
      showToast(res.message, 'success');
      // Go back to login
      backToLogin();
    } catch (err) {
      document.getElementById('forgot-step3-error').textContent = err.message;
    }
    btn.disabled = false;
    btn.textContent = 'Reset Password';
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

  // ============ REGISTER MULTI-STEP FLOW ============
  let regRegisterToken = '';
  let regVerifiedToken = '';

  // Step 1: Send OTP for Registration
  document.getElementById('register-step1').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('register-send-otp-btn');
    const name = document.getElementById('register-name').value.trim();
    const email = document.getElementById('register-email').value.trim();
    const errorEl = document.getElementById('register-step1-error');
    errorEl.textContent = '';

    btn.disabled = true;
    btn.textContent = 'Sending...';

    try {
      const res = await apiFetch('/auth/register-send-otp', {
        method: 'POST',
        body: JSON.stringify({ name, email })
      });
      regRegisterToken = res.registerToken;
      showToast('OTP sent to your email!', 'success');
      
      document.getElementById('register-step1').style.display = 'none';
      document.getElementById('register-step2').style.display = 'block';
    } catch (err) {
      errorEl.textContent = err.message;
    }
    btn.disabled = false;
    btn.textContent = 'Continue';
  });

  // Step 2: Verify OTP for Registration
  document.getElementById('register-verify-otp-btn').addEventListener('click', async () => {
    const btn = document.getElementById('register-verify-otp-btn');
    const otp = document.getElementById('register-otp').value.trim();
    const errorEl = document.getElementById('register-step2-error');
    errorEl.textContent = '';

    if (!otp || otp.length !== 6) {
      errorEl.textContent = 'Please enter the 6-digit OTP';
      return;
    }

    btn.disabled = true;
    btn.textContent = 'Verifying...';

    try {
      const res = await apiFetch('/auth/register-verify-otp', {
        method: 'POST',
        body: JSON.stringify({ otp, registerToken: regRegisterToken })
      });
      regVerifiedToken = res.verifiedRegisterToken;
      showToast('Email verified successfully!', 'success');
      
      document.getElementById('register-step2').style.display = 'none';
      document.getElementById('register-step3').style.display = 'block';
    } catch (err) {
      errorEl.textContent = err.message;
    }
    btn.disabled = false;
    btn.textContent = 'Verify Email';
  });

  // Step 3: Complete Registration
  document.getElementById('register-complete-btn').addEventListener('click', async () => {
    const btn = document.getElementById('register-complete-btn');
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('register-confirm-password').value;
    const errorEl = document.getElementById('register-step3-error');
    errorEl.textContent = '';

    if (password.length < 6) {
      errorEl.textContent = 'Password must be at least 6 characters';
      return;
    }
    if (password !== confirmPassword) {
      errorEl.textContent = 'Passwords do not match';
      return;
    }

    btn.disabled = true;
    btn.textContent = 'Registering...';

    try {
      const { data } = await apiFetch('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ password, verifiedRegisterToken: regVerifiedToken })
      });

      setToken(data.token);
      setUser({ _id: data._id, name: data.name, email: data.email });
      closeAuthModal();
      updateUIForAuth();
      showToast(`Welcome to Learnify, ${data.name}!`, 'success');
      navigate('dashboard');
    } catch (err) {
      errorEl.textContent = err.message;
    }
    btn.disabled = false;
    btn.textContent = 'Complete Registration';
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
