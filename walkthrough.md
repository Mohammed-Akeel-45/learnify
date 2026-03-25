# Learnify Platform — Build Walkthrough

## What Was Built

A full-stack AI-powered learning platform with **Node.js + Express + MongoDB** backend and **Vite + vanilla JS** frontend.

### Backend (12 files)
| Component | Files |
|-----------|-------|
| Server | [server.js](file:///c:/Users/choud/repo/learnify2/backend/server.js), [config/db.js](file:///c:/Users/choud/repo/learnify2/backend/config/db.js) |
| Models | [User](file:///c:/Users/choud/repo/learnify2/backend/models/User.js), [Roadmap](file:///c:/Users/choud/repo/learnify2/backend/models/Roadmap.js), [Course](file:///c:/Users/choud/repo/learnify2/backend/models/Course.js), [Quiz](file:///c:/Users/choud/repo/learnify2/backend/models/Quiz.js), [ChatMessage](file:///c:/Users/choud/repo/learnify2/backend/models/ChatMessage.js), [Contact](file:///c:/Users/choud/repo/learnify2/backend/models/Contact.js) |
| Routes | [auth](file:///c:/Users/choud/repo/learnify2/backend/routes/auth.js), [roadmaps](file:///c:/Users/choud/repo/learnify2/backend/routes/roadmaps.js), [courses](file:///c:/Users/choud/repo/learnify2/backend/routes/courses.js), [quizzes](file:///c:/Users/choud/repo/learnify2/backend/routes/quizzes.js), [chat](file:///c:/Users/choud/repo/learnify2/backend/routes/chat.js), [contact](file:///c:/Users/choud/repo/learnify2/backend/routes/contact.js) |
| AI Service | [services/groqAI.js](file:///c:/Users/choud/repo/learnify2/backend/services/groqAI.js) — Groq API integration for roadmaps, courses, quizzes, chat |
| Auth | [middleware/auth.js](file:///c:/Users/choud/repo/learnify2/backend/middleware/auth.js) — JWT verification |

### Frontend (10 files)
| Component | Files |
|-----------|-------|
| Entry | [index.html](file:///c:/Users/choud/repo/learnify2/frontend/index.html), [main.js](file:///c:/Users/choud/repo/learnify2/frontend/src/main.js) |
| Pages | [dashboard](file:///c:/Users/choud/repo/learnify2/frontend/src/pages/dashboard.js), [roadmap](file:///c:/Users/choud/repo/learnify2/frontend/src/pages/roadmap.js), [courses](file:///c:/Users/choud/repo/learnify2/frontend/src/pages/courses.js), [quiz](file:///c:/Users/choud/repo/learnify2/frontend/src/pages/quiz.js), [chat](file:///c:/Users/choud/repo/learnify2/frontend/src/pages/chat.js), [about](file:///c:/Users/choud/repo/learnify2/frontend/src/pages/about.js), [contact](file:///c:/Users/choud/repo/learnify2/frontend/src/pages/contact.js) |
| Styles | [index.css](file:///c:/Users/choud/repo/learnify2/frontend/src/styles/index.css) — 700+ line dark mode glassmorphism design system |
| Utils | [api.js](file:///c:/Users/choud/repo/learnify2/frontend/src/api.js), [toast.js](file:///c:/Users/choud/repo/learnify2/frontend/src/toast.js) |

---

## How to Run

### 1. Add your Groq API key
Edit [backend/.env](file:///c:/Users/choud/repo/learnify2/backend/.env) and set `GROQ_API_KEY`:
```
GROQ_API_KEY=gsk_your_actual_key_here
```

### 2. Start MongoDB
Ensure MongoDB is running on `localhost:27017`

### 3. Start Backend
```bash
cd backend && npm run dev
```

### 4. Start Frontend
```bash
cd frontend && npm run dev
```

Frontend runs on `http://localhost:3000`, backend on `http://localhost:5000`

---

## Verification

Browser test confirmed:
- ✅ Sidebar navigation with all 7 tabs
- ✅ Login/Register modal with glassmorphism design
- ✅ About Us page with features grid
- ✅ Profile dropdown with login/logout
- ✅ Responsive dark mode UI
- ✅ Hash-based routing between all pages

![Login Modal Screenshot](click_feedback_1774431320219.png)
![Browser Recording](verify_frontend_ui_1774431275667.webp)
