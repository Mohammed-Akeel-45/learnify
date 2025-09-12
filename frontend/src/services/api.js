class ApiService {
    constructor() {
        this.baseURL = 'http://localhost:5000/api';
        this.token = localStorage.getItem('token');
    }

    setToken(token) {
        this.token = token;
        localStorage.setItem('token', token);
    }

    getHeaders(contentType = 'application/json') {
        const headers = {
            'Content-Type': contentType
        };

        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        return headers;
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            headers: this.getHeaders(),
            ...options
        };

        try {
            console.log(`Making request to: ${url}`);
            const response = await fetch(url, config);
            
            if (!response.ok) {
                const error = await response.json().catch(() => ({ message: 'Request failed' }));
                throw new Error(error.message || `HTTP ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error(`API Error (${endpoint}):`, error);
            throw error;
        }
    }

    // Auth methods
    async login(email, password) {
        const data = await this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
        this.setToken(data.token);
        return data;
    }

    async register(userData) {
        const data = await this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
        this.setToken(data.token);
        return data;
    }

    async logout() {
        localStorage.removeItem('token');
        this.token = null;
    }

    // Course methods
    async getCourses() {
        return this.request('/courses');
    }

    async getCourse(id) {
        return this.request(`/courses/${id}`);
    }

    // Quiz methods
    async generateQuiz(topic, difficulty = 'medium', questionCount = 5) {
        return this.request('/quiz/generate', {
            method: 'POST',
            body: JSON.stringify({ topic, difficulty, questionCount })
        });
    }

    async submitQuiz(quizId, answers) {
        return this.request('/quiz/submit', {
            method: 'POST',
            body: JSON.stringify({ quizId, answers })
        });
    }

    // Chat methods
    async sendChatMessage(message, context = null, sessionId = null) {
        return this.request('/chat/message', {
            method: 'POST',
            body: JSON.stringify({ message, context, sessionId })
        });
    }

    async getChatHistory(sessionId = null) {
        const params = sessionId ? `?sessionId=${sessionId}` : '';
        return this.request(`/chat/history${params}`);
    }

    // Contact method
    async sendContactMessage(formData) {
        return this.request('/contact', {
            method: 'POST',
            body: JSON.stringify(formData)
        });
    }

    // Utility method to check if user is logged in
    isLoggedIn() {
        return !!this.token;
    }

    // Get current user info (you might want to add an endpoint for this)
    getCurrentUser() {
        if (!this.token) return null;
        
        try {
            // Decode JWT payload (basic decoding, don't use for security)
            const payload = JSON.parse(atob(this.token.split('.')[1]));
            return {
                id: payload.userId,
                email: payload.email,
                exp: payload.exp
            };
        } catch (error) {
            console.error('Error decoding token:', error);
            return null;
        }
    }
}

// Create and export a singleton instance
const apiService = new ApiService();
export default apiService;

// Also make it available globally for non-module usage
window.apiService = apiService;