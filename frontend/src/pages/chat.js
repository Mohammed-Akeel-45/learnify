import { apiFetch } from '../api.js';
import { showToast } from '../toast.js';

export function renderChat(container) {
  container.innerHTML = `
    <div class="chat-container">
      <div class="section-header">
        <h2>AI Assistant</h2>
        <button class="btn btn-sm btn-secondary" id="clear-chat-btn">Clear History</button>
      </div>
      <div class="chat-messages" id="chat-messages">
        <div class="chat-message assistant">
          <div class="chat-avatar">AI</div>
          <div class="chat-bubble">Hello! I'm your Learnify AI Assistant. Ask me anything about your studies, concepts, or learning strategies.</div>
        </div>
      </div>
      <div class="chat-input-area">
        <input type="text" id="chat-input" placeholder="Type your message..." autocomplete="off" />
        <button id="chat-send-btn">Send</button>
      </div>
    </div>
  `;

  loadHistory();

  document.getElementById('chat-send-btn').addEventListener('click', sendMessage);
  document.getElementById('chat-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
  });

  document.getElementById('clear-chat-btn').addEventListener('click', async () => {
    try {
      await apiFetch('/chat/history', { method: 'DELETE' });
      const messagesEl = document.getElementById('chat-messages');
      messagesEl.innerHTML = `
        <div class="chat-message assistant">
          <div class="chat-avatar">AI</div>
          <div class="chat-bubble">Chat history cleared. How can I help you?</div>
        </div>
      `;
      showToast('Chat history cleared', 'success');
    } catch (err) { showToast(err.message, 'error'); }
  });
}

async function loadHistory() {
  try {
    const { data } = await apiFetch('/chat/history');
    if (data.length > 0) {
      const messagesEl = document.getElementById('chat-messages');
      messagesEl.innerHTML = data.map(m => `
        <div class="chat-message ${m.role}">
          <div class="chat-avatar">${m.role === 'user' ? 'You' : 'AI'}</div>
          <div class="chat-bubble">${escapeHtml(m.content)}</div>
        </div>
      `).join('');
      messagesEl.scrollTop = messagesEl.scrollHeight;
    }
  } catch (err) {
    // Not logged in or error — use default welcome
  }
}

async function sendMessage() {
  const input = document.getElementById('chat-input');
  const message = input.value.trim();
  if (!message) return;

  input.value = '';
  const messagesEl = document.getElementById('chat-messages');

  // Add user message
  messagesEl.innerHTML += `
    <div class="chat-message user">
      <div class="chat-avatar">You</div>
      <div class="chat-bubble">${escapeHtml(message)}</div>
    </div>
  `;

  // Add loading indicator
  const loadingId = 'loading-' + Date.now();
  messagesEl.innerHTML += `
    <div class="chat-message assistant" id="${loadingId}">
      <div class="chat-avatar">AI</div>
      <div class="chat-bubble" style="opacity:0.6;">Thinking...</div>
    </div>
  `;
  messagesEl.scrollTop = messagesEl.scrollHeight;

  try {
    const { data } = await apiFetch('/chat', {
      method: 'POST',
      body: JSON.stringify({ message })
    });

    const loadingEl = document.getElementById(loadingId);
    if (loadingEl) {
      loadingEl.querySelector('.chat-bubble').style.opacity = '1';
      loadingEl.querySelector('.chat-bubble').textContent = data.assistantMessage.content;
    }
  } catch (err) {
    const loadingEl = document.getElementById(loadingId);
    if (loadingEl) {
      loadingEl.querySelector('.chat-bubble').textContent = 'Sorry, I encountered an error. Please try again.';
      loadingEl.querySelector('.chat-bubble').style.color = 'var(--accent-red)';
    }
  }

  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
