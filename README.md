# Voice Training App

A Duolingo-style voice training application to help users improve their voice (deeper tone for males) through daily practice sessions with gamification and progress tracking.

**Status:** Phase 1 Complete | Full Authentication & Infrastructure ✓

## Tech Stack

- **Frontend:** React 18 + TypeScript + Vite + Tailwind CSS + Zustand
- **Backend:** Go 1.21+ + Gin Framework
- **Database:** PostgreSQL 15
- **Cache:** Redis 7
- **Authentication:** JWT with httpOnly cookies

## Prerequisites

- Node.js 18+
- Go 1.21+
- Docker Desktop (for PostgreSQL and Redis)
- PostgreSQL client tools (for migrations)

## Quick Start

### 1. Install Docker Desktop

Make sure Docker Desktop is installed and running. You can download it from:
- https://www.docker.com/products/docker-desktop

### 2. Clone and Setup

```bash
# Clone the repository
git clone <your-repo-url>
cd voice-training-app

# Copy environment variables
cp .env.example .env

# Install frontend dependencies
cd frontend
npm install
cd ..
```

### 3. Start Development Environment

**Option A: Using Makefile (Recommended)**

```bash
# Start Docker services and run migrations
make dev

# In separate terminals:
make backend   # Terminal 1: Start Go server (port 8080)
make frontend  # Terminal 2: Start React dev server (port 5173)
```

**Option B: Manual Setup**

```bash
# Terminal 1: Start Docker services
docker-compose up -d

# Wait for PostgreSQL to be ready, then run migrations
PGPASSWORD=dev_password psql -h localhost -U dev -d voice_training -f backend/migrations/001_initial_schema.sql

# Terminal 2: Start backend
cd backend
go run cmd/server/main.go

# Terminal 3: Start frontend
cd frontend
npm run dev
```

### 4. Access the Application

- Frontend: http://localhost:5173
- Backend API: http://localhost:8080
- Health Check: http://localhost:8080/health

## Project Structure

```
voice-training-app/
├── frontend/              # React frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/         # Page components (Login, Register, Dashboard)
│   │   ├── lib/           # API client and utilities
│   │   ├── stores/        # Zustand state management
│   │   └── App.tsx        # Main app component
│   ├── package.json
│   └── vite.config.ts
├── backend/               # Go backend
│   ├── cmd/server/        # Server entry point
│   ├── internal/
│   │   ├── api/           # HTTP handlers
│   │   ├── auth/          # JWT authentication
│   │   ├── database/      # Database connection
│   │   ├── middleware/    # Gin middleware
│   │   └── models/        # Data models
│   ├── migrations/        # SQL migrations
│   └── go.mod
├── docker-compose.yml     # Docker services configuration
├── Makefile               # Development commands
├── .env.example           # Environment variables template
└── README.md
```

## API Endpoints

### Authentication

- `POST /api/v1/auth/register` - Create new account
  ```json
  {
    "email": "user@example.com",
    "password": "password123"
  }
  ```

- `POST /api/v1/auth/login` - Login
  ```json
  {
    "email": "user@example.com",
    "password": "password123"
  }
  ```
  Response: JWT token in httpOnly cookie + response body

- `GET /api/v1/auth/me` - Get current user (protected)
  Requires: Authorization header or httpOnly cookie

- `POST /api/v1/auth/logout` - Logout
  Clears httpOnly cookie

## Development

### Running Migrations

```bash
make migrate
```

Or manually:
```bash
PGPASSWORD=dev_password psql -h localhost -U dev -d voice_training -f backend/migrations/001_initial_schema.sql
```

### Testing

```bash
# Backend tests
cd backend
go test ./...

# Frontend tests
cd frontend
npm test
```

### Database Access

```bash
# Connect to PostgreSQL
PGPASSWORD=dev_password psql -h localhost -U dev -d voice_training

# Useful queries
SELECT * FROM users;
SELECT * FROM sessions;
```

### Redis Access

```bash
# Connect to Redis
docker exec -it voice-training-redis redis-cli
```

## Environment Variables

### Backend (.env)
```
DATABASE_URL=postgres://dev:dev_password@localhost:5432/voice_training?sslmode=disable
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-32-byte-random-secret-here
PORT=8080
FRONTEND_URL=http://localhost:5173
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:8080
```

## Security

- Passwords are hashed with bcrypt (cost 12)
- JWT tokens stored in httpOnly cookies (XSS protection)
- CORS configured for frontend origin only
- Input validation on all endpoints
- Parameterized SQL queries (SQL injection protection)

## Phase 1 Completion Summary

**Implemented Features:**
- ✅ Complete authentication system (Register, Login, Logout, Me)
- ✅ JWT token management with httpOnly cookies
- ✅ PostgreSQL database with users/sessions schema
- ✅ Redis caching infrastructure setup
- ✅ React frontend with routing (Login, Register, Dashboard pages)
- ✅ Protected routes and state management (Zustand)
- ✅ API error handling and validation
- ✅ Docker Compose for local development
- ✅ Database migrations and schema setup
- ✅ Development tooling (Makefile, Air hot-reload)
- ✅ All tests passing (31/31)

**Database Schema:**
- `users` table: id, email, password_hash, streak_count, last_practice_date, total_xp, level, timestamps
- `sessions` table: id, user_id, duration, exercises_completed, xp_earned, created_at

## Next Steps (Future Phases)

| Phase | Description | Status |
|-------|-------------|--------|
| 2 | Audio capture and processing (MediaRecorder API) | Not Started |
| 3 | Voice analysis engine (pitch + formant detection) | Not Started |
| 4 | Exercise system (10+ voice training exercises) | Not Started |
| 5 | Gamification (streaks, XP, achievements, leaderboard) | Not Started |
| 6 | UI/UX enhancements and polish | Not Started |
| 7 | Testing, deployment, monitoring | Not Started |

## Troubleshooting

### Docker won't start
1. Make sure Docker Desktop is running
2. Check Docker daemon: `docker ps`
3. Restart Docker Desktop if needed

### Database connection errors
1. Check if PostgreSQL is running: `docker ps`
2. Verify DATABASE_URL in .env
3. Check logs: `docker logs voice-training-postgres`

### CORS errors
1. Verify FRONTEND_URL in backend/.env matches your frontend URL
2. Check browser console for specific CORS error
3. Restart backend server after changing .env

### Port already in use
```bash
# Check what's using port 8080 or 5173
lsof -i :8080
lsof -i :5173

# Kill the process if needed
kill -9 <PID>
```

## License

MIT

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request
