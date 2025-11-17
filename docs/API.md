# Voice Training App - API Documentation

**API Base URL:** `http://localhost:8080/api/v1`

## Overview

Complete REST API for Voice Training App authentication and user management. All endpoints follow RESTful conventions with JSON request/response formats. Authentication uses JWT tokens stored in httpOnly cookies.

## Authentication

### Bearer Token
Include JWT token in `Authorization` header or use httpOnly cookie (automatically sent by browser).

```
Authorization: Bearer <jwt_token>
```

### JWT Token Structure
- Expires: 24 hours after issuance
- Algorithm: HS256
- Contains: userID, email, issued_at, expires_at

## Base Response Format

All responses follow this structure:

**Success:**
```json
{
  "success": true,
  "data": {
    "user": { ... }
  }
}
```

**Error:**
```json
{
  "success": false,
  "error": "Error message describing what went wrong"
}
```

## Endpoints

### 1. Register
Create new user account.

**Endpoint:** `POST /auth/register`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "user@example.com",
      "createdAt": "2025-11-16T23:00:00Z",
      "updatedAt": "2025-11-16T23:00:00Z",
      "streakCount": 0,
      "totalXP": 0,
      "level": 1
    }
  }
}
```

**Error Responses:**
- `400 Bad Request`: Invalid email/password format
- `409 Conflict`: Email already registered

**curl Example:**
```bash
curl -X POST http://localhost:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

---

### 2. Login
Authenticate user and receive JWT token.

**Endpoint:** `POST /auth/login`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**HTTP Headers Set:**
- Cookie: `token=<jwt_token>; HttpOnly; Path=/; SameSite=Lax`

**Error Responses:**
- `400 Bad Request`: Invalid request format
- `401 Unauthorized`: Invalid email or password

**curl Example:**
```bash
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

---

### 3. Get Current User
Retrieve authenticated user info.

**Endpoint:** `GET /auth/me`

**Authentication:** Required (Bearer token or cookie)

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "user@example.com",
      "createdAt": "2025-11-16T23:00:00Z",
      "updatedAt": "2025-11-16T23:00:00Z",
      "streakCount": 0,
      "totalXP": 0,
      "level": 1
    }
  }
}
```

**Error Responses:**
- `401 Unauthorized`: Missing or invalid token
- `404 Not Found`: User not found

**curl Example (with token cookie):**
```bash
curl -X GET http://localhost:8080/api/v1/auth/me \
  -b cookies.txt
```

**curl Example (with Bearer token):**
```bash
curl -X GET http://localhost:8080/api/v1/auth/me \
  -H "Authorization: Bearer <jwt_token>"
```

---

### 4. Logout
Clear authentication cookie and invalidate session.

**Endpoint:** `POST /auth/logout`

**Response (200 OK):**
```json
{
  "success": true,
  "data": null
}
```

**HTTP Headers Set:**
- Cookie: `token=; Max-Age=-1; HttpOnly; Path=/`

**curl Example:**
```bash
curl -X POST http://localhost:8080/api/v1/auth/logout \
  -b cookies.txt
```

---

## Health Check

**Endpoint:** `GET /health`

**Response (200 OK):**
```json
{
  "status": "ok"
}
```

**curl Example:**
```bash
curl http://localhost:8080/health
```

---

## HTTP Status Codes

| Code | Meaning | Scenario |
|------|---------|----------|
| 200 | OK | Successful GET/POST request |
| 201 | Created | User successfully registered |
| 400 | Bad Request | Invalid JSON, missing fields, validation errors |
| 401 | Unauthorized | Invalid credentials, missing/expired token |
| 404 | Not Found | User doesn't exist |
| 409 | Conflict | Email already registered |
| 500 | Internal Server Error | Database or server error |

---

## Error Codes & Messages

| Error | HTTP Code | Cause | Resolution |
|-------|-----------|-------|-----------|
| Invalid request | 400 | Malformed JSON or missing fields | Check request format and required fields |
| Email already registered | 409 | Email exists in database | Use different email or login |
| Invalid email or password | 401 | Wrong credentials | Verify email and password |
| User not authenticated | 401 | Missing/invalid token | Include valid token in Authorization header or cookie |
| User not found | 404 | User ID doesn't exist | Register new account |
| Database error | 500 | PostgreSQL connection issue | Check DATABASE_URL, ensure Docker is running |
| Failed to generate token | 500 | JWT_SECRET not configured | Set JWT_SECRET in .env |

---

## Data Types & Formats

### User Object
```typescript
{
  id: string;              // UUID v4
  email: string;           // RFC 5322 email format
  createdAt: ISO8601;      // 2025-11-16T23:00:00Z
  updatedAt: ISO8601;      // 2025-11-16T23:00:00Z
  streakCount: number;     // >= 0
  totalXP: number;         // >= 0
  level: number;           // >= 1
}
```

### JWT Claims
```typescript
{
  user_id: string;         // UUID of user
  email: string;           // User email
  exp: number;             // Unix timestamp (24h from issued)
  iat: number;             // Unix timestamp (issued at)
}
```

---

## CORS Configuration

**Allowed Origins:** `http://localhost:5173` (frontend dev server)

**Allowed Methods:** GET, POST, PUT, PATCH, DELETE, OPTIONS

**Allowed Headers:** Origin, Content-Type, Accept, Authorization

**Credentials:** Allowed (for httpOnly cookies)

---

## Rate Limiting

Not yet implemented (planned for Phase 6+).

---

## Pagination

Not yet implemented. Future phases will add pagination for leaderboards, exercise history.

---

## WebSocket Support

Not yet implemented. Audio streaming planned for Phase 2+.

---

## SDK Examples

### JavaScript/Axios (Frontend)
```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8080/api/v1',
  withCredentials: true, // Send httpOnly cookie
});

// Register
const register = async (email, password) => {
  const res = await api.post('/auth/register', { email, password });
  return res.data;
};

// Login
const login = async (email, password) => {
  const res = await api.post('/auth/login', { email, password });
  return res.data;
};

// Get current user
const getMe = async () => {
  const res = await api.get('/auth/me');
  return res.data;
};

// Logout
const logout = async () => {
  const res = await api.post('/auth/logout');
  return res.data;
};
```

### Go (Backend)
```go
import (
  "bytes"
  "encoding/json"
  "http"
)

func register(email, password string) {
  payload := map[string]string{
    "email": email,
    "password": password,
  }
  body, _ := json.Marshal(payload)
  resp, _ := http.Post(
    "http://localhost:8080/api/v1/auth/register",
    "application/json",
    bytes.NewBuffer(body),
  )
  defer resp.Body.Close()
}
```

### cURL Examples
See individual endpoint sections above.

---

## Testing the API

**Automated Test Suite:** `cd backend && go test ./...` (31/31 tests passing)

**Manual Testing:**
1. Start backend: `make backend`
2. Start frontend: `make frontend`
3. Register at `http://localhost:5173/register`
4. Login at `http://localhost:5173/login`
5. View profile at `http://localhost:5173/dashboard`

---

## Changelog

### v1.0 (Phase 1)
- Initial authentication endpoints
- JWT token management
- User registration and login
- Protected routes middleware
