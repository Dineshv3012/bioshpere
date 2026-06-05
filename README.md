# 🌐 BlogSphere

> A production-ready, full-stack blogging platform built with **FastAPI** + **React.js** — featuring AI writing tools, nested comments, real-time notifications, admin analytics, and a premium glassmorphism dark UI.

---

## ✨ Features

### 👤 Users
- JWT authentication (register, login, refresh, verify email, reset password)
- Profile pages with cover photo, bio, social links
- Follow / unfollow system
- Bookmarks
- Real-time notifications

### 📝 Blog
- Rich text editor (Tiptap) with headings, lists, code blocks, images, links
- Publish, draft, schedule posts
- Category + tag system
- Image upload via Cloudinary

### 💬 Comments
- Nested comments (3 levels deep)
- Like, edit, delete, reply, report
- Pagination

### 🤖 AI Tools (Google Gemini)
- AI Blog Title Generator
- AI Summary/Excerpt Generator
- AI Tag Generator
- SEO Suggestions
- Grammar Correction

### 🛡️ Admin Panel
- Platform statistics (users, posts, comments, views)
- User management (ban/unban)
- Post management (delete)
- Analytics charts (Recharts)

---

## 🗂️ Project Structure

```
blogsphere/
├── backend/           # FastAPI Python backend
│   ├── app/
│   │   ├── config.py
│   │   ├── database.py
│   │   ├── models/         # SQLAlchemy ORM models
│   │   ├── schemas/        # Pydantic schemas
│   │   ├── routers/        # API route handlers
│   │   └── utils/          # Auth, email, Cloudinary helpers
│   ├── main.py
│   ├── seed.py
│   └── requirements.txt
│
└── frontend/          # React.js frontend
    ├── src/
    │   ├── api/           # Axios API client
    │   ├── components/    # Navbar, PostCard, CommentSection, RichTextEditor…
    │   ├── context/       # Zustand auth store
    │   ├── pages/         # Home, Login, Register, BlogPost, Dashboard…
    │   └── index.css      # Tailwind + custom styles
    ├── tailwind.config.js
    └── vite.config.js
```

---

## 🚀 Getting Started

### Prerequisites
- **Python 3.10+**
- **Node.js 18+**
- **PostgreSQL 14+**
- **Redis** (optional, for rate limiting)

---

### 1. Database Setup

```sql
CREATE DATABASE blogsphere;
CREATE USER blogsphere_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE blogsphere TO blogsphere_user;
```

---

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your credentials

# Start the server
uvicorn main:app --reload --port 8000

# (Optional) Seed the database
python seed.py
```

The API will be available at `http://localhost:8000`
Interactive docs: `http://localhost:8000/api/docs`

---

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env:  VITE_API_URL=http://localhost:8000/api

# Start dev server
npm run dev
```

The app will be available at `http://localhost:5173`

---

## ⚙️ Environment Variables

### Backend `.env`

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL async URL |
| `SECRET_KEY` | JWT signing secret (change in production!) |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |
| `SMTP_HOST` | SMTP server host |
| `SMTP_USER` | SMTP username/email |
| `SMTP_PASSWORD` | SMTP app password |
| `GEMINI_API_KEY` | Google Gemini AI key |
| `FRONTEND_URL` | Frontend URL for CORS & email links |

### Frontend `.env`

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Backend API base URL |

---

## 🌐 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login (returns JWT) |
| POST | `/api/auth/refresh` | Refresh access token |
| GET  | `/api/auth/me` | Get current user |
| GET  | `/api/posts` | List posts (paginated, filterable) |
| GET  | `/api/posts/trending` | Get trending posts |
| GET  | `/api/posts/feed` | Get following feed |
| GET  | `/api/posts/slug/{slug}` | Get post by slug |
| POST | `/api/posts` | Create post |
| PUT  | `/api/posts/{id}` | Update post |
| DELETE | `/api/posts/{id}` | Delete post |
| POST | `/api/posts/{id}/like` | Toggle like |
| POST | `/api/posts/{id}/bookmark` | Toggle bookmark |
| GET  | `/api/comments/post/{id}` | Get post comments |
| POST | `/api/comments` | Add comment |
| PUT  | `/api/comments/{id}` | Edit comment |
| DELETE | `/api/comments/{id}` | Delete comment |
| POST | `/api/comments/{id}/like` | Like comment |
| GET  | `/api/users/{username}` | Get user profile |
| PUT  | `/api/users/{id}` | Update profile |
| POST | `/api/follow/{userId}` | Follow/unfollow |
| GET  | `/api/categories` | List categories |
| GET  | `/api/notifications` | Get notifications |
| POST | `/api/ai/generate-titles` | AI title generation |
| POST | `/api/ai/generate-summary` | AI summary |
| POST | `/api/ai/generate-tags` | AI tags |
| POST | `/api/ai/seo-suggestions` | AI SEO help |
| POST | `/api/ai/grammar-check` | AI grammar fix |
| GET  | `/api/admin/stats` | Admin statistics |
| GET  | `/api/admin/users` | Admin user list |
| POST | `/api/admin/users/{id}/ban` | Ban user |
| GET  | `/api/admin/posts` | Admin post list |

---

## 🚢 Deployment

### Backend → Render

1. Push `backend/` to a GitHub repo
2. Create a new **Web Service** on Render
3. Set build command: `pip install -r requirements.txt`
4. Set start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Add all environment variables in the Render dashboard

### Frontend → Vercel

1. Push `frontend/` to a GitHub repo
2. Import the project into Vercel
3. Set **Framework Preset** to Vite
4. Add environment variable: `VITE_API_URL=https://your-render-app.onrender.com/api`
5. Deploy!

### Database → Supabase / Render PostgreSQL

- Create a PostgreSQL instance on Supabase or Render
- Set `DATABASE_URL` in your backend environment

---

## 🎨 Design System

| Token | Value |
|-------|-------|
| Primary Blue | `#2563EB` |
| Deep Blue | `#1E3A8A` |
| Sky Accent | `#38BDF8` |
| Background | `#0F172A` |
| Card | `rgba(30, 41, 59, 0.6)` |
| Border | `rgba(255,255,255,0.06)` |

**Fonts:** DM Sans (body) · JetBrains Mono (code)
**Effects:** Glassmorphism · Gradient text · Framer Motion animations

---

## 🔑 Default Seed Credentials

After running `python seed.py`:

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@blogsphere.com` | `Admin@123456` |
| Author | `john@blogsphere.com` | `John@123456` |

> ⚠️ Change these immediately in any production environment!

---

## 📄 License

MIT — free to use and modify for personal or commercial projects.

---

Built with ❤️ using **FastAPI** · **React** · **PostgreSQL** · **Tailwind CSS** · **Framer Motion** · **Google Gemini AI**
