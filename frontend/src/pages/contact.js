import { apiFetch } from '../api.js';
import { showToast } from '../toast.js';

export function renderContact(container) {
  container.innerHTML = `
    <div class="contact-container">
      <div class="about-hero glass-card" style="padding:32px;">
        <h1 style="font-size:28px;">✉️ Contact Us</h1>
        <p>Have questions, suggestions, or feedback? We'd love to hear from you!</p>
      </div>
      <div class="contact-form glass-card" style="margin-top:20px;">
        <h2>Send us a Message</h2>
        <form id="contact-form">
          <div class="form-group">
            <label for="contact-name">Your Name</label>
            <input type="text" id="contact-name" placeholder="John Doe" required />
          </div>
          <div class="form-group">
            <label for="contact-email">Your Email</label>
            <input type="email" id="contact-email" placeholder="your@email.com" required />
          </div>
          <div class="form-group">
            <label for="contact-subject">Subject</label>
            <input type="text" id="contact-subject" placeholder="How can we help?" required />
          </div>
          <div class="form-group">
            <label for="contact-message">Message</label>
            <textarea id="contact-message" placeholder="Tell us more..." required></textarea>
          </div>
          <button type="submit" class="btn btn-primary btn-full" id="contact-submit-btn">Send Message</button>
          <div id="contact-status" class="form-success"></div>
        </form>
      </div>
    </div>
  `;

  document.getElementById('contact-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('contact-submit-btn');
    btn.disabled = true;
    btn.textContent = 'Sending...';

    try {
      const { message } = await apiFetch('/contact', {
        method: 'POST',
        body: JSON.stringify({
          name: document.getElementById('contact-name').value,
          email: document.getElementById('contact-email').value,
          subject: document.getElementById('contact-subject').value,
          message: document.getElementById('contact-message').value
        })
      });

      document.getElementById('contact-status').textContent = message;
      document.getElementById('contact-form').reset();
      showToast('Message sent!', 'success');
    } catch (err) {
      document.getElementById('contact-status').textContent = '';
      showToast(err.message, 'error');
    }

    btn.disabled = false;
    btn.textContent = 'Send Message';
  });
}
