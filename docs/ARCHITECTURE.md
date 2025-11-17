# Voice Training App - Architecture & Project Structure

Complete overview of project structure, architectural decisions, design patterns, and component interactions.

## Project Structure

```
voice-training-app/
├── backend/                          # Go backend server
│   ├── cmd/
│   │   └── server/
│   │       └── main.go              # Server entry point, routing setup
│   ├── internal/
│   │   ├── api/
│   │   │   ├── auth_handler.go      # Register, Login, Logout, Me endpoints
│   │   │   └── responses.go         # Response models and builders
│   │   ├── auth/
│   │   │   ├── jwt.go               # JWT token generation/validation
│   │   │   └── password.go          # Bcrypt hashing and verification
│   │   ├── database/
│   │   │   ├── db.go                # PostgreSQL connection pool
│   │   │   └── migrations.go        # Migration utilities
│   │   ├── middleware/
│   │   │   ├── auth.go              # JWT validation middleware
│   │   │   └── cors.go              # CORS configuration
│   │   └── models/
│   │       ├── user.go              # User struct, requests/responses
│   │       ├── session.go           # Session struct
│   │       └── responses.go         # API response wrapper
│   ├── migrations/
│   │   └── 001_initial_schema.sql   # Database schema (users, sessions tables)
│   ├── go.mod                       # Go dependencies
│   ├── go.sum                       # Go dependency checksums
│   ├── .air.toml                    # Air hot-reload configuration
│   └── Makefile                     # Build and run commands
│
├── frontend/                         # React frontend (Vite)
│   ├── src/
│   │   ├── components/
│   │   │   ├── ProtectedRoute.tsx   # Route protection based on auth state
│   │   │   └── ...                  # Additional UI components
│   │   ├── pages/
│   │   │   ├── Login.tsx            # Login page (email/password form)
│   │   │   ├── Register.tsx         # Registration page
│   │   │   ├── Dashboard.tsx        # Main dashboard after login
│   │   │   └── NotFound.tsx         # 404 page
│   │   ├── lib/
│   │   │   ├── api.ts               # Axios client with interceptors
│   │   │   └── types.ts             # TypeScript type definitions
│   │   ├── stores/
│   │   │   ├── authStore.ts         # Zustand auth state management
│   │   │   └── uiStore.ts           # UI state (theme, notifications)
│   │   ├── hooks/
│   │   │   ├── useAuth.ts           # Custom hook for auth state
│   │   │   └── useApi.ts            # Custom hook for API calls
│   │   ├── assets/
│   │   │   ├── images/              # Images and SVGs
│   │   │   └── fonts/               # Custom fonts
│   │   ├── App.tsx                  # Root app component with routing
│   │   ├── main.tsx                 # React DOM render
│   │   ├── App.css                  # Global styles
│   │   └── index.css                # Base CSS reset
│   ├── public/
│   │   ├── favicon.ico
│   │   └── index.html
│   ├── package.json                 # npm dependencies and scripts
│   ├── tsconfig.json                # TypeScript configuration
│   ├── vite.config.ts               # Vite build configuration
│   └── .eslintrc.json               # Linting rules
│
├── docs/                            # Documentation (this directory)
│   ├── ARCHITECTURE.md              # System architecture
│   ├── API.md                       # API endpoints reference
│   ├── SETUP.md                     # Setup instructions
│   ├── TROUBLESHOOTING.md           # Common issues and solutions
│   └── DEVELOPMENT.md               # Development guidelines
│
├── shared/                          # Shared utilities (future)
│   ├── types/
│   │   └── index.ts                 # Shared TypeScript types
│   └── utils/
│       └── validation.ts            # Shared validation logic
│
├── plans/                           # Implementation plans
│   ├── 20251116-2219-voice-training-app/
│   │   ├── plan.md                  # Overall project plan
│   │   ├── phase-01-*.md            # Phase-specific implementations
│   │   ├── phase-02-*.md
│   │   └── research/                # Research documents
│
├── docker-compose.yml               # Docker services (PostgreSQL, Redis)
├── Makefile                         # Development commands
├── README.md                        # Main project README
├── .env.example                     # Environment variables template
├── .env                             # Actual environment variables (git-ignored)
├── .gitignore                       # Git ignore patterns
└── go.mod / go.sum                  # Go module at root (if needed)
```

---

## Technology Stack

### Backend
- **Language:** Go 1.21+
- **Framework:** Gin Web Framework
- **Database:** PostgreSQL 15
- **Cache:** Redis 7
- **Authentication:** JWT (HS256) with httpOnly cookies
- **Password Hashing:** bcrypt (cost 12)
- **HTTP Client:** net/http
- **CORS:** gin-contrib/cors
- **Config:** godotenv for environment variables

### Frontend
- **Framework:** React 18.2
- **Language:** TypeScript 5.3
- **Build Tool:** Vite
- **Styling:** Tailwind CSS 3.3
- **State Management:** Zustand 4.4
- **Routing:** React Router v7.9
- **HTTP Client:** Axios 1.13
- **UI Components:** Custom (future: shadcn/ui)

### Infrastructure
- **Containerization:** Docker & Docker Compose
- **Orchestration:** Docker Compose (local dev)
- **Database:** PostgreSQL (relational)
- **Cache:** Redis (sessions, rate limiting)
- **Future:** Kubernetes, Cloudflare Workers

---

## Architecture Patterns

### Backend Architecture

#### 1. Layered Architecture
```
HTTP Request
    ↓
Middleware (Auth, CORS, Logging)
    ↓
Router (API)
    ↓
Handler Layer (api/auth_handler.go)
    ↓
Business Logic Layer (internal/auth/)
    ↓
Data Layer (database/)
    ↓
PostgreSQL Database
```

#### 2. Handler Pattern
Each endpoint has dedicated handler:
```go
// POST /api/v1/auth/login
func Login(c *gin.Context) {
  // 1. Parse request
  // 2. Validate input
  // 3. Query database
  // 4. Business logic
  // 5. Return response
}
```

#### 3. Middleware Chain
```go
router.Use(cors.New(...))              // CORS
router.Use(middleware.ErrorHandler())  // Error handling

auth := v1.Group("/auth")
auth.GET("/me", middleware.AuthRequired(), api.Me)
                  ↑
            Validates JWT token
```

#### 4. Dependency Injection
```go
// Database connection injected globally
database.Connect()
database.DB.QueryRow(...)  // Used throughout handlers
```

### Frontend Architecture

#### 1. Component Architecture
```
App
├── Router (React Router)
│   ├── Login Page
│   ├── Register Page
│   ├── Dashboard (Protected)
│   │   ├── Header
│   │   ├── Sidebar
│   │   └── Content Area
│   └── NotFound
└── State (Zustand stores)
    ├── authStore (JWT, user info)
    └── uiStore (theme, notifications)
```

#### 2. Protected Routes
```typescript
<Route
  path="/dashboard"
  element={
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  }
/>
```

ProtectedRoute checks Zustand store for token and redirects to login if not authenticated.

#### 3. API Client Pattern
```typescript
const api = axios.create({
  baseURL: 'http://localhost:8080/api/v1',
  withCredentials: true,  // Send cookies
});

api.interceptors.request.use(...)   // Add headers
api.interceptors.response.use(...)  // Handle errors
```

#### 4. State Management
```typescript
// authStore.ts
interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  login: (email, password) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>(...)
```

---

## Data Flow

### Registration Flow
```
User Input (Email, Password)
    ↓
Frontend: POST /api/v1/auth/register
    ↓
Backend Register Handler
    ├─ Validate email format
    ├─ Check if email exists
    ├─ Hash password with bcrypt
    ├─ Insert into users table
    └─ Return user object
    ↓
Frontend: Save user, redirect to login
```

### Login Flow
```
User Input (Email, Password)
    ↓
Frontend: POST /api/v1/auth/login
    ↓
Backend Login Handler
    ├─ Find user by email
    ├─ Verify password hash
    ├─ Generate JWT token (expires 24h)
    ├─ Set httpOnly cookie
    └─ Return token in response
    ↓
Frontend: Save token to Zustand, redirect to dashboard
    ↓
Browser: httpOnly cookie sent automatically with requests
```

### Protected Route Access
```
User visits /dashboard
    ↓
ProtectedRoute Component
    ├─ Check Zustand: isAuthenticated
    ├─ If false: redirect to /login
    └─ If true: render Dashboard
    ↓
Dashboard API Call
    ├─ GET /api/v1/auth/me
    ├─ Include Authorization header (or httpOnly cookie)
    └─ Return current user data
    ↓
Display user info on dashboard
```

---

## Database Schema (Phase 1)

### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  -- Gamification (future phases)
  streak_count INT DEFAULT 0,
  last_practice_date DATE,
  total_xp INT DEFAULT 0,
  level INT DEFAULT 1
);

CREATE INDEX idx_users_email ON users(email);
```

### Sessions Table
```sql
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  duration INT,  -- seconds
  exercises_completed INT DEFAULT 0,
  xp_earned INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_sessions_user_created ON sessions(user_id, created_at DESC);
```

---

## API Contracts

### Request/Response Models

**RegisterRequest**
```typescript
{
  email: string;      // RFC 5322 email
  password: string;   // Minimum 8 characters
}
```

**LoginRequest**
```typescript
{
  email: string;
  password: string;
}
```

**User Response**
```typescript
{
  id: string;              // UUID
  email: string;
  createdAt: ISO8601;
  updatedAt: ISO8601;
  streakCount: number;
  totalXP: number;
  level: number;
}
```

**APIResponse Wrapper**
```typescript
{
  success: boolean;
  data?: any;
  error?: string;
}
```

---

## Security Architecture

### Authentication
- **Method:** JWT (JSON Web Tokens)
- **Algorithm:** HS256 (HMAC with SHA-256)
- **Storage:** httpOnly cookies (XSS protection)
- **Expiration:** 24 hours
- **Signature:** Verified on each request

### Password Security
- **Hashing:** bcrypt with cost 12
- **Cost 12:** ~100ms per hash (secure + practical)
- **Never stored:** Plain passwords never stored in database

### CORS Protection
- **Allowed Origins:** http://localhost:5173 (frontend only)
- **Credentials:** Allowed (for cookies)
- **Methods:** GET, POST, PUT, PATCH, DELETE
- **Headers:** Origin, Content-Type, Authorization

### SQL Injection Prevention
- **Parameterized Queries:** All database queries use $1, $2 placeholders
- **No String Concatenation:** Never interpolate user input

### Input Validation
- **Email Format:** RFC 5322 validation
- **Password Length:** Minimum enforcement
- **Type Checking:** TypeScript + Go type system

---

## Error Handling

### Backend Error Responses
```json
{
  "success": false,
  "error": "Descriptive error message"
}
```

**HTTP Status Codes:**
- 200: Success
- 201: Created
- 400: Bad Request (validation)
- 401: Unauthorized (auth failed)
- 404: Not Found
- 409: Conflict (duplicate)
- 500: Internal Server Error

### Frontend Error Handling
```typescript
api.interceptors.response.use(
  response => response.data,
  error => {
    // Handle different error types
    if (error.response?.status === 401) {
      // Clear auth and redirect to login
      useAuthStore.getState().logout();
    }
    throw error;
  }
);
```

---

## Environment Configuration

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

---

## Development Workflow

### Local Development
```bash
# Terminal 1: Start services
make dev

# Terminal 2: Backend server
make backend

# Terminal 3: Frontend dev server
make frontend
```

### Code Changes
- **Backend:** Air watches backend/ and hot-reloads on save
- **Frontend:** Vite watches src/ and hot-updates on save

### Testing
```bash
# Backend unit tests
cd backend && go test ./...

# Frontend type checking
cd frontend && npm run build
```

---

## Performance Considerations

### Backend Performance
- **Connection Pool:** PostgreSQL with pgx (max 25 connections)
- **Query Optimization:** Indexes on email column for fast lookups
- **Response Time:** <100ms per endpoint target
- **Concurrency:** Go goroutines handle multiple requests

### Frontend Performance
- **Bundle Size:** ~200KB (React + Zustand + Axios)
- **Code Splitting:** Future optimization for Phase 6+
- **Lazy Loading:** Route-based lazy loading
- **Caching:** Browser cache for static assets

### Database Performance
- **Indexes:** email (users table), user_id (sessions table)
- **Connection Pooling:** Reuse connections
- **Query Pattern:** SELECT, INSERT optimized for Phase 1 needs

---

## Scalability Architecture

### Current (Phase 1)
- Single backend instance
- Single database instance
- Local Docker Compose

### Future (Phases 2-7)
- **Horizontal Scaling:** Multiple backend instances behind load balancer
- **Database:** Managed PostgreSQL (Fly.io, Render)
- **Caching:** Redis for session storage, rate limiting
- **Static Assets:** Cloudflare Pages for frontend
- **File Storage:** Cloudflare R2 for audio recordings
- **Edge Computing:** Cloudflare Workers for custom logic

---

## Monitoring & Logging

### Phase 1 (Current)
- Console logging in backend
- Browser DevTools for frontend debugging
- Docker logs via `docker-compose logs`

### Future Phases
- Structured JSON logging
- Log aggregation (Datadog, Loggly)
- Error tracking (Sentry)
- Performance monitoring (New Relic)
- Health checks and uptime monitoring

---

## Testing Strategy

### Backend Testing
- Unit tests for auth, database, models
- Integration tests for API endpoints
- All 31 Phase 1 tests passing

### Frontend Testing
- Component tests with React Testing Library
- Integration tests for user flows
- E2E tests with Cypress/Playwright

### Manual Testing
1. Start `make dev`
2. Visit http://localhost:5173
3. Register new account
4. Login with credentials
5. View protected dashboard
6. Logout

---

## Deployment Architecture (Future)

### Frontend Deployment
**Platform:** Cloudflare Pages
- Automatic build from Git
- Global CDN distribution
- Automatic SSL/TLS
- Performance analytics

### Backend Deployment
**Platform:** Fly.io or Render
- Multi-region deployment
- Automatic scaling
- PostgreSQL managed backup
- Health check monitoring

### Database Deployment
**Platform:** Managed PostgreSQL (Fly.io, Render, AWS RDS)
- Automatic backups every 24h
- Point-in-time recovery
- Read replicas for scaling
- SSL encryption in transit

### File Storage
**Platform:** Cloudflare R2
- Audio recording storage
- Backup storage
- CDN delivery
- Cost-effective pricing

---

## Future Architecture Changes

### Phase 2 (Audio Processing)
- WebSocket support for real-time audio streaming
- Message queue for async processing
- Worker process for audio analysis

### Phase 3 (Voice Analysis)
- Go audio processing library integration
- Cache results in Redis
- Batch processing with Job Queue

### Phase 4+ (Gamification)
- WebSocket for real-time leaderboard updates
- Event streaming architecture
- Analytics pipeline

---

## Key Design Decisions

### Why JWT + httpOnly Cookies?
- JWT: Stateless, scalable, standard
- httpOnly: Secure from XSS attacks
- Both: Best of both worlds for authentication

### Why Zustand for State?
- Lightweight (2KB vs Redux 15KB)
- Simple API (no boilerplate)
- Fast re-renders with selective subscription
- Perfect for Phase 1 simplicity

### Why PostgreSQL + Redis?
- PostgreSQL: Durable, ACID, scaling
- Redis: Fast session storage, future: caching, rate limiting
- Together: Reliable + performant

### Why Gin Framework?
- Fast HTTP routing
- Middleware support
- Built-in validation
- Active community
