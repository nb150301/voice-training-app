# Voice Training App - Troubleshooting Guide

Comprehensive guide for resolving common issues during development and deployment.

## Table of Contents
1. [Docker Issues](#docker-issues)
2. [Database Issues](#database-issues)
3. [Backend Server Issues](#backend-server-issues)
4. [Frontend Issues](#frontend-issues)
5. [Network & CORS Issues](#network--cors-issues)
6. [Authentication Issues](#authentication-issues)
7. [Performance Issues](#performance-issues)
8. [Environment Issues](#environment-issues)

---

## Docker Issues

### Docker Desktop Not Running
**Symptom:** `Cannot connect to Docker daemon` error

**Solution:**
1. Open Docker Desktop application (macOS: Applications → Docker)
2. Wait for "Docker is running" status in menu bar
3. Verify: `docker ps` should return without errors
4. Retry your command

**Prevention:** Add Docker Desktop to startup applications for auto-launch.

---

### Docker Container Won't Start
**Symptom:** `Error response from daemon` or containers in "Exited" state

**Solution:**
```bash
# Check Docker status
docker ps -a

# View error logs
docker logs voice-training-postgres
docker logs voice-training-redis

# Restart Docker daemon
docker-compose restart

# If still failing, rebuild
docker-compose down
docker-compose up -d
```

**Common Causes:**
- Insufficient disk space: Free up 5GB+ for Docker
- Port conflicts: See [Port Already in Use](#port-already-in-use)
- Memory constraints: Docker Desktop needs 4GB+ RAM available

---

### PostgreSQL Container Issues
**Symptom:** `psql: could not connect to server` or migration failures

**Solution:**
```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# View PostgreSQL logs
docker logs voice-training-postgres

# Check connection string in .env
cat .env | grep DATABASE_URL

# If DATABASE_URL is wrong, fix it
# Correct format: postgres://dev:dev_password@localhost:5432/voice_training?sslmode=disable

# Restart PostgreSQL
docker-compose down
docker-compose up -d postgres

# Wait 10 seconds for init
sleep 10

# Verify connectivity
PGPASSWORD=dev_password psql -h localhost -U dev -d voice_training -c "SELECT 1;"
```

**Expected Output:** `1`

---

### Redis Container Issues
**Symptom:** `redis: connection refused` or cache not working

**Solution:**
```bash
# Check Redis status
docker ps | grep redis

# View Redis logs
docker logs voice-training-redis

# Test Redis connection
docker exec voice-training-redis redis-cli ping

# Expected output: PONG

# Restart Redis
docker-compose restart redis

# Verify connectivity (should return PONG)
docker exec voice-training-redis redis-cli PING
```

---

### Port Already in Use
**Symptom:** `Address already in use` error on port 8080 or 5173

**Solution:**
```bash
# Check what's using port 8080
lsof -i :8080

# Check what's using port 5173
lsof -i :5173

# Kill process (replace PID with process ID)
kill -9 <PID>

# Or kill all node processes
killall node

# Or kill all Go processes
killall main

# Verify ports are free
lsof -i :8080 | grep -v COMMAND  # Should return nothing

# Alternative: Change ports in .env
# For backend: PORT=8081
# For frontend: VITE_PORT=5174
```

---

## Database Issues

### Migration Fails
**Symptom:** `psql: error: Connection refused` or `ERROR: duplicate key value`

**Solution:**
```bash
# 1. Ensure Docker is running
docker ps

# 2. Check PostgreSQL is healthy
docker logs voice-training-postgres | tail -20

# 3. Wait for PostgreSQL initialization (first run takes 30s)
sleep 30

# 4. Test connection
PGPASSWORD=dev_password psql -h localhost -U dev -d voice_training -c "\dt"

# 5. Run migrations manually
PGPASSWORD=dev_password psql -h localhost -U dev -d voice_training -f backend/migrations/001_initial_schema.sql

# 6. Check migration result
PGPASSWORD=dev_password psql -h localhost -U dev -d voice_training -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';"
```

**Expected Output:** Should list `users` and `sessions` tables.

---

### Cannot Connect to PostgreSQL
**Symptom:** `psql: error: could not translate host name "localhost" to address`

**Solution:**
```bash
# 1. Verify PostgreSQL is running
docker ps | grep postgres

# 2. Check .env file DATABASE_URL
cat .env

# Example correct format:
# DATABASE_URL=postgres://dev:dev_password@localhost:5432/voice_training?sslmode=disable

# 3. Test with explicit parameters
PGPASSWORD=dev_password psql \
  -h localhost \
  -U dev \
  -d voice_training \
  -p 5432 \
  -c "SELECT version();"

# If using Docker network, try docker host IP
# On Docker Desktop: host.docker.internal

# 4. For Docker container connections, update DATABASE_URL
# DATABASE_URL=postgres://dev:dev_password@host.docker.internal:5432/voice_training?sslmode=disable
```

---

### Database Locked / Stuck Transactions
**Symptom:** Queries timeout or hang indefinitely

**Solution:**
```bash
# Connect to PostgreSQL
PGPASSWORD=dev_password psql -h localhost -U dev -d voice_training

# View active queries
SELECT pid, query, state FROM pg_stat_activity;

# Kill stuck transaction (replace pid)
SELECT pg_terminate_backend(pid);

# Or terminate all connections to specific database
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE datname = 'voice_training' AND pid <> pg_backend_pid();

# Restart PostgreSQL if needed
docker-compose restart postgres
```

---

### Data Lost After Docker Restart
**Symptom:** All user data gone after `docker-compose down`

**Solution:**
Docker volumes persist data by default. If data is lost:

```bash
# Check volume status
docker volume ls | grep voice-training

# Inspect volume
docker volume inspect voice-training_postgres_data

# Backup existing data before stopping
docker-compose exec postgres pg_dump -U dev voice_training > backup.sql

# Restore from backup
PGPASSWORD=dev_password psql -h localhost -U dev -d voice_training < backup.sql

# To persist volumes permanently, keep Docker containers running or backup regularly
```

---

## Backend Server Issues

### Backend Won't Start
**Symptom:** `Failed to connect to database` or `ListenAndServe error`

**Solution:**
```bash
# 1. Check Go installation
go version  # Should be 1.21+

# 2. Verify .env file exists
cd backend
cat ../.env

# Required variables:
# DATABASE_URL=postgres://dev:dev_password@localhost:5432/voice_training?sslmode=disable
# REDIS_URL=redis://localhost:6379
# JWT_SECRET=your-32-byte-random-secret-here
# PORT=8080

# 3. Check database is running
docker ps | grep postgres

# 4. Test database connection
PGPASSWORD=dev_password psql -h localhost -U dev -d voice_training -c "SELECT 1;"

# 5. Install dependencies
go mod download
go mod tidy

# 6. Run with verbose output
PORT=8080 go run cmd/server/main.go 2>&1
```

---

### JWT_SECRET Not Set
**Symptom:** `Failed to generate token` on login

**Solution:**
```bash
# 1. Check .env for JWT_SECRET
cat .env | grep JWT_SECRET

# 2. If missing, generate a 32-byte secret
# Using OpenSSL:
openssl rand -base64 32

# Using Python:
python3 -c "import secrets; print(secrets.token_urlsafe(32))"

# 3. Add to .env
echo "JWT_SECRET=<generated-secret>" >> .env

# 4. Restart backend
make backend
```

---

### Backend Running on Wrong Port
**Symptom:** Frontend can't reach backend at localhost:8080

**Solution:**
```bash
# 1. Check PORT env variable
echo $PORT

# 2. Set correct port
export PORT=8080

# 3. Verify backend is listening
netstat -an | grep 8080  # or on macOS: lsof -i :8080

# 4. Check logs for actual port
make backend | grep "Server starting on port"

# 5. If using different port, update frontend .env
# VITE_API_URL=http://localhost:8081
```

---

### High Memory/CPU Usage
**Symptom:** Backend process consuming >200MB RAM or >50% CPU

**Solution:**
```bash
# Check current resource usage
ps aux | grep "go run"

# Profile memory usage
go tool pprof http://localhost:6060/debug/pprof/heap

# Check for goroutine leaks
go tool pprof http://localhost:6060/debug/pprof/goroutine

# Restart backend to reset
make backend
```

---

## Frontend Issues

### Frontend Won't Start
**Symptom:** `npm ERR!` or `Error: Cannot find module`

**Solution:**
```bash
# 1. Check Node version
node --version  # Should be 18+

# 2. Delete node_modules and reinstall
cd frontend
rm -rf node_modules package-lock.json
npm install

# 3. Check npm registry (if very slow)
npm config get registry
npm config set registry https://registry.npmjs.org/

# 4. Clear npm cache
npm cache clean --force

# 5. Check for TypeScript errors
npm run build

# 6. Run dev server
npm run dev
```

---

### Port 5173 Already in Use
**Symptom:** `Error: listen EADDRINUSE: address already in use :::5173`

**Solution:**
```bash
# Method 1: Kill process using port
lsof -i :5173
kill -9 <PID>

# Method 2: Use different port
npm run dev -- --port 5174

# Method 3: Update Vite config
# Edit vite.config.ts
# server: { port: 5174 }
```

---

### Build Errors
**Symptom:** `npm run build` fails with TypeScript errors

**Solution:**
```bash
# 1. Check for type errors
npx tsc --noEmit

# 2. Fix import paths
# All imports should use absolute paths from src/
# Example: import api from '@/lib/api'

# 3. Check for missing types
npm install --save-dev @types/node

# 4. Clear build artifacts
rm -rf dist
npm run build
```

---

### API Requests Failing
**Symptom:** 404 or Network errors in browser console

**Solution:**
```bash
# 1. Check backend is running
curl http://localhost:8080/health

# 2. Verify frontend .env
cat frontend/.env

# VITE_API_URL must be set correctly
# Should be: http://localhost:8080

# 3. Check browser console for CORS errors
# Error: "Access to XMLHttpRequest has been blocked by CORS policy"
# Solution: Ensure backend FRONTEND_URL matches actual frontend URL

# 4. Verify credentials in API calls
# axios.create({ withCredentials: true })

# 5. Check network tab in browser DevTools
# Request should include Authorization header or Cookie
```

---

### CORS Errors
**Symptom:** Browser console: "Access to XMLHttpRequest blocked by CORS"

**Solution:**
```bash
# 1. Check frontend URL matches FRONTEND_URL in backend .env
cat .env | grep FRONTEND_URL

# Expected: FRONTEND_URL=http://localhost:5173

# 2. Verify CORS headers in response
curl -i http://localhost:8080/health

# Should include: Access-Control-Allow-Origin: http://localhost:5173

# 3. Restart backend after changing FRONTEND_URL
make backend

# 4. Test with curl
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:5173" \
  -d '{"email":"test@example.com","password":"password"}'
```

---

### Hot Reload Not Working
**Symptom:** Changes not reflected after saving file

**Solution:**
```bash
# Frontend (Vite):
# Hot reload should work automatically
# If not:
cd frontend
npm run dev  # Restart Vite

# Backend (Go + Air):
# 1. Install Air
go install github.com/cosmtrek/air@latest

# 2. Check .air.toml config
cat backend/.air.toml

# 3. Run with Air
cd backend
air

# 4. If Air not installed, manual reload needed
```

---

## Network & CORS Issues

### Localhost Unreachable
**Symptom:** `Failed to fetch` or `Connection refused`

**Solution:**
```bash
# 1. Verify services are running
docker ps
curl http://localhost:8080/health
curl http://localhost:5173

# 2. Check firewall
# macOS: System Preferences > Security & Privacy > Firewall
# Allow Node.js and Go processes

# 3. Try from different network
# Ensure no VPN/proxy interfering

# 4. Use 127.0.0.1 instead of localhost
# http://127.0.0.1:8080
```

---

### Cookie Not Being Sent
**Symptom:** Login succeeds but subsequent requests fail (not authenticated)

**Solution:**
```bash
# 1. Verify httpOnly cookie is set
# Browser DevTools > Application > Cookies > localhost:5173
# Should see "token" cookie

# 2. Ensure withCredentials is true
// In axios config:
axios.create({ withCredentials: true })

// In fetch:
fetch(url, { credentials: 'include' })

// In curl:
curl -b cookie-jar -c cookie-jar http://localhost:8080/api/v1/auth/me

# 3. Check SameSite attribute
# Should be: SameSite=Lax or SameSite=None; Secure
# (Lax for local dev, None for cross-origin)

# 4. Clear cookies and retry
# Browser: DevTools > Application > Cookies > Delete "token"
```

---

## Authentication Issues

### Login Fails with "Invalid email or password"
**Symptom:** Correct credentials rejected at login

**Solution:**
```bash
# 1. Verify user exists in database
PGPASSWORD=dev_password psql -h localhost -U dev -d voice_training

# In psql:
SELECT * FROM users;

# 2. Check password hash
# Password should be hashed with bcrypt cost 12
SELECT id, email, password_hash FROM users WHERE email = 'test@example.com';

# 3. Manually test password verification
# Go to backend and test:
cd backend
# Create test file: test_password.go
# Use bcrypt to verify

# 4. Ensure no whitespace in credentials
# Check for leading/trailing spaces in email field

# 5. Try registering new account
# Visit http://localhost:5173/register
```

---

### Token Expired
**Symptom:** 401 Unauthorized after 24 hours

**Solution:**
```bash
# Current token expiration: 24 hours
# To extend: Edit backend/internal/auth/jwt.go

# Line: ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour))
# Change 24 to desired hours (e.g., 720 for 30 days)

# Recompile and restart backend
make backend

# For new logins, token will have new expiration
```

---

### Protected Route Redirects to Login
**Symptom:** Can't access /dashboard even when logged in

**Solution:**
```bash
# 1. Check if token exists
# Browser DevTools > Application > Cookies
# "token" cookie should be present

# 2. Verify token in localStorage if also stored there
localStorage.getItem('token')

# 3. Check token validity
# Use jwt.io to decode and verify:
// Copy token from cookie or localStorage
// Paste at jwt.io to inspect exp claim

# 4. Clear localStorage and cookies, re-login
localStorage.clear()
document.cookie = "token=; Max-Age=0"

# 5. Check ProtectedRoute component
# frontend/src/components/ProtectedRoute.tsx
# Should properly validate token before rendering
```

---

### Me Endpoint Returns 404
**Symptom:** User found at login but /auth/me returns "User not found"

**Solution:**
```bash
# 1. Check user_id in token
# Go to jwt.io, decode token, verify user_id matches database

# 2. Verify user exists in database
PGPASSWORD=dev_password psql -h localhost -U dev -d voice_training

# In psql:
SELECT id, email FROM users WHERE id = '<user_id_from_token>';

# 3. Check middleware is extracting user_id correctly
# backend/internal/middleware/auth.go
# user_id should be extracted from claims.UserID

# 4. Check JWT_SECRET matches between token generation and validation
# Different secret = invalid token

# 5. Restart backend to reload environment variables
make backend
```

---

## Performance Issues

### Slow Registration/Login
**Symptom:** Register/login takes >2 seconds

**Solution:**
```bash
# 1. Check bcrypt cost
# Current: 12 (recommended)
# Benchmark on your machine:
# time go run cmd/server/main.go  # Should start quickly

# 2. Check database query performance
PGPASSWORD=dev_password psql -h localhost -U dev -d voice_training

# In psql:
EXPLAIN ANALYZE SELECT * FROM users WHERE email = 'test@example.com';

# 3. Check for missing indexes
SELECT * FROM pg_indexes WHERE tablename = 'users';

# Should have index on email column

# 4. Monitor network latency
# Ensure backend and database on same machine (localhost)

# 5. Check backend logs for slow queries
# Enable query logging in database/db.go
```

---

### Frontend Page Load Slow
**Symptom:** Dashboard takes >3 seconds to load

**Solution:**
```bash
# 1. Check bundle size
npm run build

# 2. Analyze with source-map-explorer
npm install source-map-explorer
npm run source-map

# 3. Check Network tab in DevTools
# Identify large assets or slow API calls

# 4. Verify API response times
# Backend /auth/me should respond <100ms

# 5. Check for unnecessary re-renders
# React DevTools Profiler > Record
# Look for components re-rendering excessively

# 6. Optimize state management
# Ensure Zustand store isn't bloated
```

---

## Environment Issues

### .env File Not Found
**Symptom:** `No .env file found, using environment variables`

**Solution:**
```bash
# 1. Create .env from example
cp .env.example .env

# 2. Verify content
cat .env

# Should contain:
# DATABASE_URL=postgres://dev:dev_password@localhost:5432/voice_training?sslmode=disable
# REDIS_URL=redis://localhost:6379
# JWT_SECRET=<your-secret>
# PORT=8080
# FRONTEND_URL=http://localhost:5173

# 3. Ensure .env is in project root, not in backend/
ls -la | grep .env  # Should be in current directory

# 4. Source .env before running
# For Go: godotenv package auto-loads
# For Node: config package or dotenv
```

---

### Environment Variables Not Being Loaded
**Symptom:** Backend still uses default values even with .env

**Solution:**
```bash
# 1. Check .env file path
# Backend loads from: ../. env (relative to cmd/server/main.go)
# Ensure .env is at project root, not backend/

# 2. Verify godotenv loads file
grep "godotenv.Load" backend/cmd/server/main.go

# 3. Set variables directly instead
export DATABASE_URL="postgres://..."
export JWT_SECRET="..."
go run cmd/server/main.go

# 4. Check for environment variable caching
# Restart terminal/IDE
# Environment variables cached on load

# 5. Verify no variable conflicts
# Check if DATABASE_URL set globally
echo $DATABASE_URL
```

---

### Different Behavior on Linux vs macOS
**Symptom:** Works on macOS but fails on Linux

**Solution:**
```bash
# Common issues:

# 1. Path separators
# Use /forward/slashes not \backslashes
# Both work on macOS/Linux, only forward work universally

# 2. Host networking
# macOS Docker Desktop: localhost works
# Linux native Docker: use host.docker.internal or 172.17.0.1

# Update DATABASE_URL for Linux:
# DATABASE_URL=postgres://dev:dev_password@host.docker.internal:5432/voice_training?sslmode=disable

# 3. Permission issues
# Ensure files readable: chmod 644 .env
# Ensure directories readable: chmod 755 backend/

# 4. Line endings
# Convert CRLF to LF
dos2unix .env *.sh
```

---

## Debugging Tips

### Enable Verbose Logging
**Backend:**
```go
// Add to backend/cmd/server/main.go
gin.SetMode(gin.DebugMode)  // More verbose output

// Add query logging
database.DB.SetLogger(...)
```

**Frontend:**
```typescript
// Add to frontend/src/lib/api.ts
api.interceptors.response.use(
  response => {
    console.log('API Response:', response);
    return response;
  },
  error => {
    console.error('API Error:', error);
    throw error;
  }
);
```

### View Container Logs
```bash
docker-compose logs -f              # All services
docker-compose logs -f postgres      # Specific service
docker-compose logs -f --tail=50    # Last 50 lines
```

### Connect to Database Manually
```bash
PGPASSWORD=dev_password psql \
  -h localhost \
  -U dev \
  -d voice_training \
  -c "SELECT * FROM users LIMIT 5;"
```

### Use Browser DevTools
1. Open browser console (F12)
2. Check Console tab for JS errors
3. Check Network tab for failed requests
4. Check Application tab for cookies/storage
5. Check Source tab to debug JavaScript

---

## Still Having Issues?

1. Check logs: `docker-compose logs`
2. Check services running: `docker ps`
3. Verify environment: `cat .env`
4. Clean and restart: `docker-compose down && docker-compose up -d`
5. Check GitHub Issues for similar problems
6. Contact development team with full error message
