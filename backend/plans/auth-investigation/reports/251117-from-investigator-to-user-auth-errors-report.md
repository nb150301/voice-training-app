# Auth Registration & Login Investigation Report

**Date:** 2025-11-17
**Investigator:** System Debugging Agent
**Severity:** HIGH - Blocking all user authentication

---

## Executive Summary

**Root Cause Identified:** CORS configuration mismatch between frontend and backend ports.

- Frontend running on: `http://localhost:5174`
- Backend CORS allowing: `http://localhost:5173` (hardcoded in .env)
- Result: All OPTIONS preflight requests return **403 Forbidden**
- Impact: Registration and login completely broken

**Business Impact:** Zero users can register or login. Complete auth system failure.

---

## Technical Analysis

### Evidence from Backend Logs (bash fe6e10)

```
[GIN] 2025/11/17 - 16:23:54 | 403 |    3.854333ms |             ::1 | OPTIONS  "/api/v1/auth/login"
[GIN] 2025/11/17 - 16:24:08 | 403 |      33.542µs |             ::1 | OPTIONS  "/api/v1/auth/register"
[GIN] 2025/11/17 - 16:24:12 | 403 |     144.667µs |             ::1 | OPTIONS  "/api/v1/auth/register"
```

**All OPTIONS requests (CORS preflight) receiving 403 Forbidden.**

### Frontend Port Detection (bash 82b5d3)

```
Port 5173 is in use, trying another one...
➜  Local:   http://localhost:5174/
```

**Vite auto-switched to port 5174 because 5173 was occupied.**

### CORS Configuration Analysis

**File:** `/Users/admin/nguyen/code/claudekit-engineer/src/voice-training-app/backend/cmd/server/main.go`

```go
// Line 31-34
frontendURL := os.Getenv("FRONTEND_URL")
if frontendURL == "" {
    frontendURL = "http://localhost:5173"
}

// Line 36-42
router.Use(cors.New(cors.Config{
    AllowOrigins:     []string{frontendURL},
    AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
    AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
    ExposeHeaders:    []string{"Content-Length"},
    AllowCredentials: true,
}))
```

**Environment Variable:** `.env` file sets `FRONTEND_URL=http://localhost:5173`

### CORS Test Results

**Test 1: Port 5174 (current frontend)**
```bash
curl -X OPTIONS http://localhost:8080/api/v1/auth/register \
  -H "Origin: http://localhost:5174"
# Result: HTTP/1.1 403 Forbidden ❌
```

**Test 2: Port 5173 (configured backend)**
```bash
curl -X OPTIONS http://localhost:8080/api/v1/auth/register \
  -H "Origin: http://localhost:5173"
# Result: HTTP/1.1 204 No Content ✅
```

### System Health Check

- Backend health: `{"status":"ok"}` ✅
- Backend running: Port 8080 ✅
- Frontend running: Port 5174 ✅
- Database connection: Not tested (psql not available)
- Auth endpoints registered: ✅
  - POST `/api/v1/auth/register`
  - POST `/api/v1/auth/login`
  - POST `/api/v1/auth/logout`
  - GET `/api/v1/auth/me`

---

## Root Cause Chain

1. Vite dev server started on port 5173 (default)
2. Port 5173 already in use by another process
3. Vite auto-incremented to port 5174
4. Backend `.env` still configured for port 5173
5. CORS middleware blocks all cross-origin requests from 5174
6. Browser receives 403 on preflight OPTIONS requests
7. Actual POST requests never sent
8. User sees "An error occurred during registration/login"

---

## Actionable Recommendations

### Immediate Fix (Priority: CRITICAL)

**Option A: Update .env file** (Recommended)
```bash
# Change in /Users/admin/nguyen/code/claudekit-engineer/src/voice-training-app/.env
FRONTEND_URL=http://localhost:5174
```
Then restart backend server.

**Option B: Free port 5173**
```bash
# Find process using port 5173
lsof -ti:5173 | xargs kill -9
```
Then restart frontend (will use 5173).

**Option C: Allow multiple origins** (Best for dev)
```go
// In cmd/server/main.go, replace line 37
AllowOrigins: []string{
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
},
```

### Long-term Improvements

1. **Dynamic Port Detection**
   - Frontend should detect its actual port and pass to API calls
   - Or use relative URLs if deploying on same domain

2. **Environment-aware CORS**
   ```go
   if gin.Mode() == gin.DebugMode {
       AllowOrigins: []string{"http://localhost:*"}  // Wildcard for dev
   } else {
       AllowOrigins: []string{frontendURL}  // Strict for prod
   }
   ```
   Note: gin-contrib/cors doesn't support wildcards in localhost. Use regex or multiple ports.

3. **Better Error Messages**
   - Add CORS error logging in backend
   - Frontend should detect and display CORS errors clearly

4. **Health Check Enhancement**
   - Include CORS check in `/health` endpoint
   - Report configured allowed origins

---

## Supporting Evidence

### Backend Routes Registered
```
POST   /api/v1/auth/register
POST   /api/v1/auth/login
POST   /api/v1/auth/logout
GET    /api/v1/auth/me
```

### Error Pattern
- All errors are OPTIONS requests (preflight)
- No POST requests in logs (never reach server)
- Response time very fast (33µs-3.8ms) = rejected at middleware level

### Why Auth Worked in Phase 1
- Likely frontend was consistently on port 5173
- Or no port conflicts occurred during Phase 1 development
- Phase 2 development introduced another service on port 5173

---

## Unresolved Questions

1. What process is occupying port 5173?
   ```bash
   lsof -i:5173
   ```

2. Is database connection working?
   - Health check passes but doesn't verify DB
   - Need to test actual registration flow after CORS fix

3. Are there any auth logic errors hidden by CORS issue?
   - Will need to retest after fixing CORS

4. Should we use Docker to avoid port conflicts?
   - Consider containerizing for consistent dev environment

---

## Recommended Next Steps

1. **IMMEDIATE:** Apply Option C (allow multiple origins in CORS config)
2. **VERIFY:** Test registration with actual user data
3. **VERIFY:** Test login with created user
4. **MONITOR:** Check backend logs for any DB or auth logic errors
5. **DOCUMENT:** Update setup docs to mention port flexibility
6. **CONSIDER:** Docker setup for consistent ports across team

---

**Status:** Ready for fix implementation
**Confidence:** 100% - Root cause confirmed via testing
**Estimated Fix Time:** 2 minutes (code change + restart)