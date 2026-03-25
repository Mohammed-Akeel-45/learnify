const API_BASE = '/api';

function getToken() {
  return localStorage.getItem('learnify_token');
}

function setToken(token) {
  localStorage.setItem('learnify_token', token);
}

function removeToken() {
  localStorage.removeItem('learnify_token');
}

function setUser(user) {
  localStorage.setItem('learnify_user', JSON.stringify(user));
}

function getUser() {
  const u = localStorage.getItem('learnify_user');
  return u ? JSON.parse(u) : null;
}

function removeUser() {
  localStorage.removeItem('learnify_user');
}

async function apiFetch(endpoint, options = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || 'Something went wrong');
  }

  return data;
}

export { apiFetch, getToken, setToken, removeToken, setUser, getUser, removeUser };
