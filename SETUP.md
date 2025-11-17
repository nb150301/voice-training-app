# Setup Instructions

## Prerequisites Check

Before starting, ensure you have:

1. ✅ **Docker Desktop** - Running (check Docker icon in menu bar)
2. ✅ **Node.js 18+** - `node --version`
3. ✅ **Go 1.21+** - `go version`
4. ✅ **PostgreSQL client** - `psql --version`

## Start Docker Desktop

**IMPORTANT:** Docker Desktop must be running before proceeding!

1. Open Docker Desktop application
2. Wait for "Docker Desktop is running" message
3. Verify: `docker ps` should work without errors

## Quick Setup (5 minutes)

```bash
# 1. Start development environment
make dev

# This will:
# - Start PostgreSQL and Redis containers
# - Run database migrations
# - Setup is complete!
```

## Start Development Servers

Open 2 terminals:

### Terminal 1: Backend (Go + Gin)
```bash
make backend
# or
cd backend && go run cmd/server/main.go
```

**Backend will be available at:** http://localhost:8080

### Terminal 2: Frontend (React + Vite)
```bash
make frontend
# or
cd frontend && npm run dev
```

**Frontend will be available at:** http://localhost:5173

## Verify Installation

1. Open browser: http://localhost:5173
2. You should see the Voice Training login page
3. Backend health check: http://localhost:8080/health

## Common Issues

### "Cannot connect to Docker daemon"
**Solution:** Start Docker Desktop application

### "Port already in use"
```bash
# Kill process on port 8080
lsof -i :8080
kill -9 <PID>

# Kill process on port 5173
lsof -i :5173
kill -9 <PID>
```

### "psql command not found"
**macOS:**
```bash
brew install postgresql
```

**Ubuntu/Debian:**
```bash
sudo apt-get install postgresql-client
```

### Database migration fails
```bash
# Ensure Docker is running
docker ps

# Restart PostgreSQL container
docker-compose restart postgres

# Wait 10 seconds, then retry
make migrate
```

## Next Steps

Once everything is running:

1. Register a new account at http://localhost:5173/register
2. Login with your credentials
3. View your dashboard
4. Start voice training!

## Development Workflow

```bash
# Start everything
make dev

# In separate terminals:
make backend   # Go server with hot-reload via Air (when installed)
make frontend  # React dev server with hot-reload

# Stop Docker services
make docker-down

# View logs
docker logs voice-training-postgres
docker logs voice-training-redis

# Database access
PGPASSWORD=dev_password psql -h localhost -U dev -d voice_training
```

## Install Air for Go Hot-Reload (Optional)

```bash
go install github.com/cosmtrek/air@latest

# Then in backend directory:
cd backend
air
```

This provides automatic server restart when Go code changes.
