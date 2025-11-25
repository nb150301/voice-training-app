# Voice Training App

A Duolingo-style progressive web app for voice training with AI-powered analysis, real-time feedback, and community features. Help users improve vocal quality through structured daily practice with gamification.

**Status:** Phase 5 Complete | Advanced Features & AI Personalization ✅

## Features

✅ User authentication & profiles
✅ Audio recording & real-time pitch detection
✅ Advanced voice analysis & visualization
✅ Progress tracking & statistics
✅ Social features & community
✅ AI-powered personalized coaching
✅ Vocal health monitoring

## Tech Stack

- **Frontend:** React 19 + TypeScript + Vite + Tailwind CSS 4 + Zustand
- **Backend:** Go 1.21+ + Gin Framework
- **Database:** PostgreSQL 15 + Redis 7
- **Audio:** Web Audio API, FFmpeg, FFT Analysis
- **Authentication:** JWT with httpOnly cookies

## Documentation

📖 **[Complete Documentation](./docs/INDEX.md)** - Start here for navigation

### Quick Links
- **[Setup Guide](./docs/SETUP.md)** - Getting started
- **[API Reference](./docs/API.md)** - All endpoints
- **[Architecture](./docs/system-architecture.md)** - System design
- **[Development](./docs/DEVELOPMENT.md)** - Code standards
- **[Project Overview](./docs/project-overview-pdr.md)** - Product requirements
- **[Codebase Summary](./docs/codebase-summary.md)** - Code structure
- **[Troubleshooting](./docs/TROUBLESHOOTING.md)** - Common issues

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

## Development Progress

| Phase | Status | Key Features |
|-------|--------|-------------|
| Phase 1 | ✅ Complete | Authentication, Infrastructure, JWT |
| Phase 2 | ✅ Complete | Audio Recording, Upload, FFmpeg Processing |
| Phase 3 | ✅ Complete | Pitch Detection (FFT), Real-time Analysis, Visualization |
| Phase 4 | ✅ Complete | Social Features, Community Feed, Profiles |
| Phase 5 | ✅ Complete | AI Coaching, ML Recommendations, Health Monitoring |
| Phase 6 | 🚧 Planned | Gamification System, UI/UX Polish |
| Phase 7 | 📋 Planned | Exercise Library, Advanced Training |
| Phase 8 | 📋 Planned | Testing, Deployment, Production Launch |

See **[Project Roadmap](./docs/project-overview-pdr.md#project-roadmap)** for detailed phase breakdown.

## Troubleshooting

For detailed troubleshooting, see **[Troubleshooting Guide](./docs/TROUBLESHOOTING.md)**.

**Quick fixes:**
- Docker won't start → Ensure Docker Desktop is running
- Database errors → Check `docker ps` and DATABASE_URL
- CORS errors → Verify FRONTEND_URL in backend/.env
- Port in use → `lsof -i :8080` then `kill -9 <PID>`

## Contributing

1. Read **[Development Guidelines](./docs/DEVELOPMENT.md)**
2. Follow **[Code Standards](./docs/code-standards.md)**
3. Fork repository and create feature branch
4. Submit pull request with clear description

## Project Structure

```
voice-training-app/
├── frontend/          # React app (Vite + TypeScript)
├── backend/           # Go API server
├── docs/              # Documentation
├── docker-compose.yml # Dev environment
└── Makefile           # Dev commands
```

See **[Codebase Summary](./docs/codebase-summary.md)** for complete structure.

## License

MIT
