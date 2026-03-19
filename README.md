# ✦ Antoniqueee AI

A production-ready fullstack AI chat application built with Next.js, Node.js/Express, MongoDB, Socket.IO, and Gemini.

![Stack](https://img.shields.io/badge/Next.js-14-black?logo=next.js)
![Stack](https://img.shields.io/badge/Node.js-18+-green?logo=node.js)
![Stack](https://img.shields.io/badge/MongoDB-Atlas-green?logo=mongodb)
![Stack](https://img.shields.io/badge/OpenAI-GPT--3.5-blue?logo=openai)
![Stack](https://img.shields.io/badge/Socket.IO-4.x-white?logo=socket.io)

---

## ✨ Features

- 🤖 **Realtime AI Chat** — Streaming responses via Server-Sent Events + Socket.IO
- 🔐 **Google OAuth** — One-click sign-in with Google
- 📧 **Email/Password Auth** — Traditional authentication with JWT
- 💬 **Chat History** — All conversations saved & searchable
- 🌙 **Dark/Light Mode** — Full theme support
- 📱 **Fully Responsive** — Mobile-first design
- ⚡ **Streaming Responses** — Word-by-word AI output like ChatGPT
- 🗂️ **Session Management** — Organize chats with auto-generated titles
- ⚙️ **User Settings** — Theme, language, font size, notifications
- 🔒 **Secure** — Helmet, rate limiting, JWT middleware

---

## 🗂️ Project Structure

```
antoniqueee-ai/
├── frontend/                    # Next.js React Application
│   ├── components/
│   │   ├── ChatBubble.js        # Message bubbles + markdown rendering
│   │   ├── ChatInput.js         # Auto-resize textarea with send/stop
│   │   └── Navbar.js            # Responsive navigation bar
│   ├── hooks/
│   │   └── useChat.js           # Chat state + Socket.IO hook
│   ├── pages/
│   │   ├── index.js             # Main chat interface
│   │   ├── login.js             # Login / Register page
│   │   ├── history.js           # Chat history browser
│   │   ├── settings.js          # User settings
│   │   └── auth/callback.js     # Google OAuth callback
│   ├── services/
│   │   └── api.js               # Axios API helper + auth utils
│   └── styles/
│       └── globals.css          # Design system + CSS variables
│
├── backend/                     # Node.js + Express API
│   ├── config/
│   │   └── passport.js          # Google OAuth strategy
│   ├── controllers/
│   │   ├── authController.js    # Login, register, OAuth handlers
│   │   ├── chatController.js    # Chat + streaming endpoints
│   │   └── historyController.js # Session & message history
│   ├── middlewares/
│   │   └── authMiddleware.js    # JWT verification
│   ├── models/
│   │   ├── User.js              # User schema
│   │   ├── Session.js           # Chat session schema
│   │   └── Message.js           # Message schema
│   ├── routes/
│   │   ├── auth.js              # /api/auth/*
│   │   ├── chat.js              # /api/chat/*
│   │   └── history.js           # /api/history/*
│   ├── services/
│   │   └── aiService.js         # OpenAI GPT integration + streaming
│   ├── server.js                # Express + Socket.IO server entry
│   ├── package.json
│   └── .env.example
│
├── database/
│   ├── schema.sql               # PostgreSQL schema (alternative)
│   └── seed.js                  # MongoDB seed script
│
├── package.json                 # Root monorepo scripts
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js >= 18.0.0
- MongoDB (local or Atlas)
- OpenAI API Key
- Google OAuth Credentials (optional, for Google sign-in)

### 1. Clone & Install

```bash
git clone https://github.com/yourusername/antoniqueee-ai.git
cd antoniqueee-ai

# Install all dependencies
npm run install:all
```

### 2. Configure Backend

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env`:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/antoniqueee_ai
JWT_SECRET=your_32_char_secret_key_here
OPENAI_API_KEY=sk-your_openai_key
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
FRONTEND_URL=http://localhost:3000
```

### 3. Configure Frontend

```bash
cd frontend
cp .env.example .env.local
```

Edit `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
```

### 4. Seed Database (Optional)

```bash
node database/seed.js
```

This creates:
- Admin: `anton@antoniqueee.ai` / `admin123`
- Demo: `demo@example.com` / `demo123`

### 5. Run Development Servers

```bash
# From root - run both simultaneously
npm run dev

# Or separately:
npm run dev:backend   # http://localhost:5000
npm run dev:frontend  # http://localhost:3000
```

---

## 🔑 Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable **Google+ API** or **People API**
4. Go to **Credentials** → **Create OAuth 2.0 Client ID**
5. Add authorized redirect URIs:
   - `http://localhost:5000/api/auth/google/callback` (dev)
   - `https://yourdomain.com/api/auth/google/callback` (prod)
6. Copy Client ID and Secret to `backend/.env`

---

## 📡 API Reference

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register with email/password |
| POST | `/api/auth/login` | Login with email/password |
| GET | `/api/auth/google` | Initiate Google OAuth |
| GET | `/api/auth/google/callback` | Google OAuth callback |
| GET | `/api/auth/me` | Get current user |
| PUT | `/api/auth/settings` | Update user settings |
| POST | `/api/auth/logout` | Logout |

### Chat
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/chat` | Send message (non-streaming) |
| POST | `/api/chat/stream` | Send message (SSE streaming) |
| POST | `/api/chat/session` | Create new session |
| DELETE | `/api/chat/session/:id` | Delete session |

### History
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/history` | Get all sessions |
| GET | `/api/history/:sessionId` | Get session messages |
| GET | `/api/history/stats` | Get user stats |
| DELETE | `/api/history` | Clear all history |

---

## 🌐 Deployment

### Frontend → Vercel
```bash
cd frontend
npx vercel --prod
```
Set env vars in Vercel dashboard.

### Backend → Render
1. Connect GitHub repo to Render
2. Set root to `backend/`
3. Build command: `npm install`
4. Start command: `npm start`
5. Add environment variables

### Database → MongoDB Atlas
1. Create free cluster at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Whitelist your IP (or `0.0.0.0/0` for all)
3. Get connection string and set `MONGODB_URI`

---

## 🗺️ Roadmap

- [x] 1. Frontend + Backend scaffold
- [x] 2. Database models (User, Session, Message)
- [x] 3. Auth (Google OAuth + JWT)
- [x] 4. AI service layer (OpenAI GPT)
- [x] 5. Realtime chat interface
- [x] 6. History storage & retrieval
- [x] 7. Responsive design & UX
- [ ] 8. End-to-end testing (Jest + Playwright)
- [ ] 9. Deployment (Vercel + Render)
- [ ] 10. Analytics dashboard
- [ ] 11. Token usage tracking
- [ ] 12. File/image upload support
- [ ] 13. Multiple AI model support
- [ ] 14. Conversation export (PDF/Markdown)

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, React 18, CSS Modules |
| Styling | CSS Variables, Custom Design System |
| State | React Hooks + Zustand |
| Realtime | Socket.IO Client |
| Backend | Node.js + Express 4 |
| Auth | Passport.js, JWT, Google OAuth 2.0 |
| Database | MongoDB + Mongoose |
| AI | OpenAI GPT-3.5-turbo / GPT-4 |
| Streaming | Server-Sent Events (SSE) |
| Security | Helmet, Rate Limiting, bcryptjs |

---

Built with ❤️ by **Pangestu Anton**
