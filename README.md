# TaskFlow — Team Task Manager

A full-stack team task management application with role-based access control, project management, task tracking, and a real-time dashboard.

![TaskFlow](https://img.shields.io/badge/Stack-React%20%2B%20Node.js%20%2B%20Express-6366f1)
![License](https://img.shields.io/badge/License-MIT-green)

---

🚀 Live Demo
Live URL: https://taskflow-production-4ff2.up.railway.app
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


