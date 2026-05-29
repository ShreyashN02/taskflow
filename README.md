# TaskFlow — Team Task Manager

A full-stack team task management application with role-based access control, project management, task tracking, and a real-time dashboard.

![TaskFlow](https://img.shields.io/badge/Stack-React%20%2B%20Node.js%20%2B%20Express-6366f1)
![License](https://img.shields.io/badge/License-MIT-green)

---

## 🚀 Live Demo

> **Live URL:** `https://your-app.railway.app` *(replace after deploying)*

---

## ✨ Features

### Authentication
- JWT-based signup & login
- Persistent sessions via localStorage
- Protected routes on both frontend and backend

### Projects
- Create projects with name, description, and color
- View all projects you belong to with progress indicators
- Delete projects (admin only)

### Role-Based Access Control
| Action | Admin | Member |
|--------|-------|--------|
| Create/delete project | ✅ | ❌ |
| Add/remove members | ✅ | ❌ |
| Create tasks | ✅ | ✅ |
| Edit/delete any task | ✅ | own only |
| Change task status | ✅ | ✅ |
| View project | ✅ | ✅ |

### Task Management
- Create tasks with title, description, assignee, priority, status, due date
- Kanban board view (To Do → In Progress → Review → Done)
- List/table view with inline status changes
- Task detail page with comment thread
- Priority levels: Low / Medium / High / Urgent

### Dashboard
- Greeting with user's name
- Stats: total projects, tasks, completion rate, overdue count
- Pie chart of task distribution by status
- My assigned tasks (sorted by due date)
- Overdue tasks alert section

---

## 🛠 Tech Stack

**Backend**
- Node.js + Express
- lowdb (JSON file database — zero-native-dependency, Railway compatible)
- JWT authentication (jsonwebtoken)
- bcryptjs for password hashing
- express-validator for input validation
- helmet + cors for security

**Frontend**
- React 18 + React Router v6
- Vite build tool
- Recharts for dashboard charts
- date-fns for date formatting
- Axios with interceptors

---

## 📁 Project Structure

```
taskflow/
├── backend/
│   ├── src/
│   │   ├── index.js          # Express server + static file serving
│   │   ├── db.js             # lowdb database setup
│   │   ├── middleware/
│   │   │   └── auth.js       # JWT auth + role middleware
│   │   └── routes/
│   │       ├── auth.js       # POST /api/auth/signup, /login, GET /me
│   │       ├── projects.js   # CRUD /api/projects + members
│   │       ├── tasks.js      # CRUD /api/tasks + comments
│   │       ├── dashboard.js  # GET /api/dashboard
│   │       └── users.js      # GET /api/users/search
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── App.jsx           # Router + auth guards
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── utils/
│   │   │   └── api.js        # Axios instance with interceptors
│   │   └── pages/
│   │       ├── Login.jsx
│   │       ├── Signup.jsx
│   │       ├── Dashboard.jsx
│   │       ├── Projects.jsx
│   │       ├── ProjectDetail.jsx  # Board + List + Members tabs
│   │       └── TaskDetail.jsx     # Task info + comments
│   └── package.json
├── railway.json              # Railway deployment config
└── README.md
```

---

## 🏃 Running Locally

### Prerequisites
- Node.js 18+
- npm

### 1. Clone the repo
```bash
git clone https://github.com/yourusername/taskflow.git
cd taskflow
```

### 2. Backend setup
```bash
cd backend
cp .env.example .env
# Edit .env and set a strong JWT_SECRET
npm install
npm run dev      # Runs on http://localhost:5000
```

### 3. Frontend setup
```bash
cd frontend
npm install
npm run dev      # Runs on http://localhost:5173
```

The Vite dev server proxies `/api` requests to `localhost:5000`, so no CORS issues locally.

---

## 🚂 Deploying to Railway

### Option A — One-Service Deployment (Recommended)

The backend serves the built frontend as static files — one Railway service for everything.

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/yourusername/taskflow.git
   git push -u origin main
   ```

2. **Create Railway project**
   - Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub repo
   - Select your `taskflow` repository

3. **Set environment variables** in Railway dashboard:
   ```
   PORT=5000
   JWT_SECRET=your_very_long_random_secret_string_here
   NODE_ENV=production
   DATA_DIR=/app/data
   ```

4. **Railway auto-detects** `railway.json` and runs:
   - Build: `cd frontend && npm install && npm run build && cd ../backend && npm install`
   - Start: `cd backend && npm start`

5. **Add a volume** (optional but recommended for persistence):
   - In Railway dashboard → your service → Volumes → Add Volume
   - Mount path: `/app/data`
   - This persists the JSON database across deploys

6. **Get your URL** from Railway dashboard → Settings → Domains → Generate Domain

### Option B — Separate Services

Deploy backend and frontend as two separate Railway services:

**Backend service:**
- Root directory: `backend`
- Build: `npm install`
- Start: `npm start`
- Env vars: `PORT`, `JWT_SECRET`, `FRONTEND_URL=https://your-frontend.railway.app`

**Frontend service:**
- Root directory: `frontend`
- Build: `npm install && npm run build`
- Start: `npx serve dist -p $PORT`
- Env vars: `VITE_API_URL=https://your-backend.railway.app/api`

---

## 📡 REST API Reference

### Auth
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/signup` | Register new user | — |
| POST | `/api/auth/login` | Login | — |
| GET | `/api/auth/me` | Get current user | ✅ |

### Projects
| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| GET | `/api/projects` | List user's projects | Member+ |
| POST | `/api/projects` | Create project | Member+ |
| GET | `/api/projects/:id` | Get project + members | Member+ |
| PUT | `/api/projects/:id` | Update project | Admin |
| DELETE | `/api/projects/:id` | Delete project | Admin |
| POST | `/api/projects/:id/members` | Add member | Admin |
| PUT | `/api/projects/:id/members/:userId` | Change role | Admin |
| DELETE | `/api/projects/:id/members/:userId` | Remove member | Admin |

### Tasks
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/tasks/project/:projectId` | Get project tasks | Member+ |
| POST | `/api/tasks` | Create task | Member+ |
| GET | `/api/tasks/:id` | Get task detail | Member+ |
| PUT | `/api/tasks/:id` | Update task | Member+ |
| DELETE | `/api/tasks/:id` | Delete task | Admin/Creator |
| POST | `/api/tasks/:id/comments` | Add comment | Member+ |

### Dashboard
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/dashboard` | Get dashboard stats | ✅ |

---

## 🔐 Validation Rules

- **Name**: required, non-empty
- **Email**: valid email format, normalized
- **Password**: minimum 6 characters, bcrypt-hashed
- **Task priority**: enum `low | medium | high | urgent`
- **Task status**: enum `todo | in_progress | review | done`
- **Member role**: enum `admin | member`
- All IDs validated to be valid project members before assignment

---

## 🧠 Design Decisions

1. **lowdb over SQLite/PostgreSQL** — Zero native compilation dependencies means it works on Railway's free tier without needing a separate database service. For production scale, swap `src/db.js` for a Prisma/PostgreSQL adapter.

2. **JWT stateless auth** — No session store needed; tokens expire in 7 days and are validated against the user DB on each request.

3. **Monorepo single-service** — Backend serves the built frontend as static files. Simpler Railway setup, one URL, no CORS config needed in production.

4. **Role per project** — A user can be Admin in one project and Member in another. Roles are stored in `projectMembers` join table.

---

## 📝 License

MIT © 2024
