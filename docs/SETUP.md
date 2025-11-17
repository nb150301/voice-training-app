# Voice Training App - Complete Setup Guide

Step-by-step instructions for setting up development environment and running Voice Training App locally.

## Prerequisites Check

Before starting, ensure your system has:

1. **Docker Desktop** - For PostgreSQL and Redis containers
   - Download: https://www.docker.com/products/docker-desktop
   - Verify: `docker --version` should return 20.10+

2. **Node.js 18+** - For frontend development
   - Download: https://nodejs.org
   - Verify: `node --version` should return 18.x or higher

3. **Go 1.21+** - For backend development
   - Download: https://go.dev/dl
   - Verify: `go version` should return go1.21 or higher

4. **PostgreSQL Client** - For database migrations
   - macOS: `brew install postgresql`
   - Ubuntu/Debian: `sudo apt-get install postgresql-client`
   - Windows: Included in PostgreSQL installer
   - Verify: `psql --version` should return psql 12+

5. **Git** - For version control
   - Download: https://git-scm.com
   - Verify: `git --version` should return 2.x+

## Installation Steps

### 1. Start Docker Desktop

**macOS/Windows:**
1. Open Docker Desktop application
2. Wait for "Docker is running" message in menu bar
3. Verify: `docker ps` should work without errors

**Linux:**
```bash
# Start Docker daemon
sudo systemctl start docker

# Verify
docker ps
```

### 2. Clone Repository

```bash
# Choose location for project
cd ~/projects

# Clone repo
git clone <your-repo-url>
cd voice-training-app

# Verify directory structure
ls -la
# Should see: README.md, Makefile, docker-compose.yml, backend/, frontend/, docs/
```

### 3. Create Environment Variables

```bash
# Copy example to actual .env
cp .env.example .env

# Edit .env with your settings
cat .env
```

**Expected .env content:**
```
DATABASE_URL=postgres://dev:dev_password@localhost:5432/voice_training?sslmode=disable
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-32-byte-random-secret-here
PORT=8080
FRONTEND_URL=http://localhost:5173
```

**Generate a secure JWT_SECRET:**
```bash
# macOS/Linux
openssl rand -base64 32

# Or use Python
python3 -c "import secrets; print(secrets.token_urlsafe(32))"

# Copy output to JWT_SECRET in .env
```

### 4. Install Dependencies

```bash
# Install frontend dependencies
cd frontend
npm install
cd ..

# Backend dependencies auto-managed by Go
```

### 5. Start Development Environment

```bash
# Terminal 1: Start Docker services and run migrations
make dev

# This will:
# - Start PostgreSQL container
# - Start Redis container
# - Run database migrations
# - Show: "Development environment ready!"

# If first time, wait for PostgreSQL initialization (30-60 seconds)
```

### 6. Start Backend Server

```bash
# Terminal 2: Start Go backend
make backend

# Expected output:
# Server starting on port 8080

# Health check in new terminal:
curl http://localhost:8080/health
# Should return: {"status":"ok"}
```

### 7. Start Frontend Server

```bash
# Terminal 3: Start React frontend
make frontend

# Expected output:
# VITE v4.x.x  ready in XXX ms
#
# ➜  Local:   http://localhost:5173/
# ➜  press h to show help

# Open http://localhost:5173 in browser
```

## Verify Installation

1. **Frontend is running:** http://localhost:5173 shows login page
2. **Backend is running:** http://localhost:8080/health returns `{"status":"ok"}`
3. **Database is running:** `docker ps` shows postgres and redis containers

### Test Complete Flow

1. **Register account:**
   - Visit http://localhost:5173/register
   - Enter email: `test@example.com`
   - Enter password: `TestPassword123!`
   - Click "Register"
   - Should redirect to login page

2. **Login:**
   - Enter same email and password
   - Click "Login"
   - Should redirect to dashboard

3. **View Profile:**
   - Dashboard shows email and user stats
   - All features working!

## Development Workflow

### Start Development (Every Day)

```bash
# Terminal 1: Start services (only once)
make dev

# Terminal 2: Start backend
make backend

# Terminal 3: Start frontend
make frontend
```

### Make Code Changes

**Frontend (React):**
- Edit files in `frontend/src/`
- Changes auto-reload in browser (hot reload)
- No restart needed

**Backend (Go):**
- Edit files in `backend/`
- Install Air for auto-reload: `go install github.com/cosmtrek/air@latest`
- Change to `air` command instead of `make backend`
- Or restart `make backend` manually

### Database Access

```bash
# Connect to PostgreSQL
PGPASSWORD=dev_password psql -h localhost -U dev -d voice_training

# List all tables
\dt

# View all users
SELECT * FROM users;

# View user details
SELECT id, email, created_at, level, total_xp FROM users WHERE email = 'test@example.com';

# Clear all data (careful!)
DELETE FROM sessions;
DELETE FROM users;

# Exit psql
\q
```

### View Container Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f postgres
docker-compose logs -f redis

# Last N lines
docker-compose logs -f --tail=50 postgres
```

### Stop Development

```bash
# Stop all services (keeps data)
make docker-down

# Or in different terminal
docker-compose down

# Remove all data (careful!)
docker-compose down -v
```

## Common Issues During Setup

### Issue: "Cannot connect to Docker daemon"

**Cause:** Docker Desktop not running

**Solution:**
1. Open Docker Desktop application
2. Wait for "Docker is running" status
3. Retry `docker ps`

### Issue: "Port 5173 already in use"

**Cause:** Another process using the port

**Solution:**
```bash
# Find process
lsof -i :5173

# Kill it
kill -9 <PID>

# Or use different port
cd frontend
npm run dev -- --port 5174
```

### Issue: "psql: could not connect to server"

**Cause:** PostgreSQL not ready or wrong host

**Solution:**
```bash
# Check container is running
docker ps | grep postgres

# Check logs
docker logs voice-training-postgres

# If using Docker on Linux, try host.docker.internal
PGPASSWORD=dev_password psql -h host.docker.internal -U dev -d voice_training

# Wait 30 seconds for initialization
sleep 30
make migrate
```

### Issue: "Failed to connect to database" on backend start

**Cause:** Wrong DATABASE_URL or PostgreSQL not ready

**Solution:**
```bash
# Verify DATABASE_URL format
cat .env | grep DATABASE_URL

# Test connection with psql
PGPASSWORD=dev_password psql -h localhost -U dev -d voice_training -c "SELECT 1;"

# If fails, wait for PostgreSQL initialization
docker logs voice-training-postgres | tail -20

# Restart PostgreSQL
docker-compose restart postgres

# Wait and retry
sleep 10
make backend
```

### Issue: "npm install" takes very long

**Cause:** npm registry slow or network issues

**Solution:**
```bash
# Use different registry
npm config set registry https://registry.npmjs.org/

# Clear cache
npm cache clean --force

# Retry
cd frontend
npm install
```

### Issue: "JWT_SECRET not set"

**Cause:** Missing JWT_SECRET in .env

**Solution:**
```bash
# Generate random secret
openssl rand -base64 32

# Add to .env
echo "JWT_SECRET=<paste-generated-secret>" >> .env

# Restart backend
make backend
```

## IDE Setup

### VS Code (Recommended)

**Extensions to install:**
1. **Go** (golang.go)
2. **REST Client** (humao.rest-client)
3. **Thunder Client** or **Postman** (alternative REST tools)
4. **PostgreSQL** (ckolkman.vscode-postgres)
5. **Docker** (ms-azuretools.vscode-docker)

**Recommended settings (.vscode/settings.json):**
```json
{
  "go.lintOnSave": "package",
  "go.useLanguageServer": true,
  "[go]": {
    "editor.formatOnSave": true,
    "editor.defaultFormatter": "golang.go"
  },
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode",
    "editor.formatOnSave": true
  }
}
```

### JetBrains IDEs (GoLand, WebStorm)

**Built-in support for:**
- Go debugging
- React/TypeScript
- Docker
- PostgreSQL database client

**Setup:**
1. Open project in IDE
2. Configure Go SDK: Settings → Go → SDK → Download if needed
3. Run Makefile targets: Right-click Makefile → Run target
4. Built-in terminal: View → Terminal

## Next Steps

After successful setup:

1. **Read documentation:**
   - `README.md` - Project overview
   - `docs/API.md` - API endpoints
   - `docs/ARCHITECTURE.md` - Project structure

2. **Make first changes:**
   - Edit `frontend/src/pages/Login.tsx` - Change button text
   - Edit `backend/cmd/server/main.go` - Change PORT
   - Verify hot reload works

3. **Run tests:**
   - Backend: `cd backend && go test ./...`
   - Frontend: `cd frontend && npm test`

4. **Explore database:**
   - Connect with psql (see Database Access above)
   - View users table
   - Try queries

5. **Review code:**
   - Backend: `backend/internal/api/auth_handler.go`
   - Frontend: `frontend/src/pages/Login.tsx`
   - Understand authentication flow

## Useful Makefile Commands

```bash
make help           # Show all available commands
make dev            # Start Docker services + migrations
make docker-up      # Start Docker services only
make docker-down    # Stop Docker services
make migrate        # Run database migrations
make backend        # Start Go backend server
make frontend       # Start React dev server
make test           # Run all tests
make clean          # Remove build artifacts
```

## Command Reference

### Backend Commands
```bash
cd backend

# Run server
go run cmd/server/main.go

# Run tests
go test ./...

# Run tests with coverage
go test ./... -cover

# Format code
gofmt -w .

# Check for issues
go vet ./...

# Download dependencies
go mod download

# Clean up dependencies
go mod tidy
```

### Frontend Commands
```bash
cd frontend

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint

# Run tests (when configured)
npm test
```

### Database Commands
```bash
# Connect to database
PGPASSWORD=dev_password psql -h localhost -U dev -d voice_training

# Backup database
PGPASSWORD=dev_password pg_dump -h localhost -U dev -d voice_training > backup.sql

# Restore from backup
PGPASSWORD=dev_password psql -h localhost -U dev -d voice_training < backup.sql

# View data
SELECT * FROM users;
SELECT * FROM sessions;
```

### Docker Commands
```bash
# List running containers
docker ps

# View logs
docker-compose logs -f [service]

# Stop services
docker-compose down

# Remove all data
docker-compose down -v

# Restart service
docker-compose restart [service]
```

## Troubleshooting Checklist

- [ ] Docker Desktop is running (check menu bar icon)
- [ ] Node.js version is 18+ (`node --version`)
- [ ] Go version is 1.21+ (`go version`)
- [ ] .env file exists with JWT_SECRET
- [ ] `docker ps` shows postgres and redis containers
- [ ] `curl http://localhost:8080/health` returns success
- [ ] Frontend loads at http://localhost:5173
- [ ] Can register new account
- [ ] Can login with registered account

## Getting Help

1. **Check Troubleshooting Guide:** `docs/TROUBLESHOOTING.md`
2. **Review Logs:** `docker-compose logs -f`
3. **Verify Environment:** `cat .env`, `docker ps`
4. **Ask Questions:** Reach out to development team
5. **Search Issues:** Check GitHub Issues for similar problems

## Next Phase Setup

When ready to move to Phase 2 (Audio Capture):
- Will need microphone permissions
- Will install Web Audio API libraries
- Will add audio recording components
- See `/plans/20251116-2219-voice-training-app/phase-02-*.md` for details
