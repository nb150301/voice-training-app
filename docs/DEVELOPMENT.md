# Voice Training App - Development Guidelines

Standards, best practices, and workflows for contributing to Voice Training App.

## Table of Contents
1. [Code Standards](#code-standards)
2. [Git Workflow](#git-workflow)
3. [Testing Requirements](#testing-requirements)
4. [Performance Guidelines](#performance-guidelines)
5. [Security Practices](#security-practices)
6. [Documentation Requirements](#documentation-requirements)

---

## Code Standards

### Go (Backend)

#### Formatting
- **Standard:** Use `gofmt` (Go standard formatter)
- **Tab size:** 1 tab (Go standard)
- **Line length:** No hard limit (Go practice)

```bash
# Auto-format
gofmt -w backend/

# Check for issues
go vet ./...
```

#### Naming Conventions
- **Packages:** lowercase, single word (e.g., `auth`, `api`)
- **Functions:** CamelCase, exported (capital), private lowercase
- **Variables:** camelCase for local, CONSTANT_CASE for constants
- **Interfaces:** End with `er` (e.g., `Reader`, `Writer`)

```go
// Good
func RegisterUser(email, password string) (*User, error)

// Bad
func register_user(email, password string)
func RegisterUser_Email(email string)
```

#### Error Handling
- **Always check errors:** Never ignore error return values
- **Wrap errors:** Use `fmt.Errorf("context: %w", err)` for chain
- **No panics in handlers:** Return HTTP 500 instead

```go
// Good
result, err := database.DB.QueryRow(ctx, query).Scan(&user)
if err != nil {
  c.JSON(500, Response{Error: "Database error"})
  return
}

// Bad
result := database.DB.QueryRow(ctx, query).Scan(&user)  // ignores error
result := database.DB.QueryRow(ctx, query).Scan(&user)  // panics if nil
```

#### Concurrency
- **Goroutines:** Safe to spawn in HTTP handlers (Gin manages)
- **Channels:** Use for coordination, avoid unbuffered in handlers
- **Locks:** Prefer message passing over shared memory

```go
// Good: HTTP handler spawning goroutine
func MyHandler(c *gin.Context) {
  go func() {
    // Process async
  }()
  c.JSON(200, "Processing...")
}

// Bad: Unmanaged goroutine leaks
go func() {
  forever := true
  for forever {  // Never exits!
    doSomething()
  }
}()
```

#### Comments
- **Public functions:** Comment every exported function
- **Why, not what:** Explain design decisions, not obvious code
- **Avoid obvious comments:** `i++  // increment i` is not helpful

```go
// Good
// RegisterUser creates new user with hashed password and returns UUID
func RegisterUser(email, password string) (string, error) {
  ...
}

// Bad
// Register the user
func RegisterUser(email, password string) (string, error) {
  ...
}
```

### TypeScript/React (Frontend)

#### Formatting
- **Standard:** Prettier (configured in package.json)
- **Tab size:** 2 spaces
- **Line length:** 100 characters (soft limit)

```bash
# Format
npm run format

# Check
npm run lint
```

#### Naming Conventions
- **Components:** PascalCase (e.g., `LoginForm`, `UserCard`)
- **Functions:** camelCase (e.g., `handleSubmit`, `getUserData`)
- **Hooks:** Start with `use` (e.g., `useAuth`, `useApi`)
- **Constants:** CONSTANT_CASE (e.g., `MAX_RETRIES`)

```typescript
// Good
function LoginForm() { ... }
const handleSubmit = () => { ... }
const useAuthStore = () => { ... }
const MAX_PASSWORD_LENGTH = 128;

// Bad
function loginForm() { ... }
const HandleSubmit = () => { ... }
const authStore = () => { ... }
const max_password_length = 128;
```

#### React Best Practices
- **Functional components:** No class components
- **Hooks:** Use React hooks for logic
- **Props:** Type all props with TypeScript
- **Keys:** Always provide keys in lists

```typescript
// Good
interface LoginProps {
  onSuccess: () => void;
}

function Login({ onSuccess }: LoginProps) {
  const [email, setEmail] = useState('');

  return (
    <form onSubmit={() => onSuccess()}>
      {users.map(user => (
        <div key={user.id}>{user.name}</div>
      ))}
    </form>
  );
}

// Bad
function Login(props) {  // No types
  return (
    <form>
      {users.map(user => (
        <div>{user.name}</div>  // No key!
      ))}
    </form>
  );
}
```

#### TypeScript Strictness
- **Strict mode:** Enabled in tsconfig.json
- **No `any`:** Always provide proper types
- **Optional chaining:** Use `?.` for undefined checks

```typescript
// Good
interface User {
  id: string;
  email: string;
  profile?: { avatar: string };
}

const avatar = user.profile?.avatar ?? '/default.png';

// Bad
const user: any = { ... }
const avatar = user.profile.avatar;  // May crash if undefined!
```

#### Zustand Store Pattern
```typescript
// stores/authStore.ts
interface AuthState {
  token: string | null;
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  login: async (email, password) => {
    const { token, user } = await api.post('/auth/login', { email, password });
    set({ token, user });
  },
  logout: () => {
    set({ token: null, user: null });
  },
}));

// Usage in components
function Dashboard() {
  const user = useAuthStore((state) => state.user);
  return <div>{user?.email}</div>;
}
```

---

## Git Workflow

### Branch Naming
- **Feature:** `feat/description` (e.g., `feat/audio-upload`)
- **Bug fix:** `fix/description` (e.g., `fix/cors-headers`)
- **Documentation:** `docs/description` (e.g., `docs/api-guide`)
- **Refactor:** `refactor/description` (e.g., `refactor/auth-module`)

```bash
git checkout -b feat/audio-capture
git checkout -b fix/login-validation
```

### Commit Messages
- **Format:** `type(scope): subject` (conventional commits)
- **Subject:** Lowercase, imperative, 50 chars max
- **Body:** Explain why, not what (if needed, wrap at 72 chars)

```
feat(auth): add JWT token validation

- Validate token expiration
- Extract user_id from claims
- Return 401 on invalid token

Fixes #123
```

### Commit Types
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `refactor`: Code restructuring
- `test`: Adding tests
- `chore`: Build, dependencies
- `perf`: Performance improvements

### Pull Requests
1. Create feature branch from `main`
2. Make commits with clear messages
3. Keep PR focused (one feature per PR)
4. Write PR description with:
   - What changed and why
   - Testing performed
   - Potential side effects
5. Request code review
6. Address feedback
7. Merge when approved

---

## Testing Requirements

### Backend Testing

#### Unit Tests
All new functions should have tests:

```go
// auth_test.go
func TestGenerateToken(t *testing.T) {
  token, err := GenerateToken("user-123", "test@example.com")

  if err != nil {
    t.Fatalf("Expected no error, got %v", err)
  }

  if token == "" {
    t.Error("Expected non-empty token")
  }
}

// Run tests
go test ./...

// Run with coverage
go test ./... -cover
```

#### Test Coverage
- **Minimum:** 80% for critical paths (auth, database)
- **Target:** 90% overall
- **Check coverage:**

```bash
go test ./... -coverprofile=coverage.out
go tool cover -html=coverage.out
```

#### Integration Tests
Test full request/response cycle:

```go
func TestLoginFlow(t *testing.T) {
  // Setup
  database.Connect()
  defer database.Close()

  // Register user
  registerResp := httptest.Post("/api/v1/auth/register", ...)

  // Login with same credentials
  loginResp := httptest.Post("/api/v1/auth/login", ...)

  // Assert response
  assert.Equal(t, 200, loginResp.StatusCode)
}
```

### Frontend Testing

#### Component Tests
```typescript
// Login.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import Login from './Login';

test('submits form with email and password', () => {
  render(<Login />);

  fireEvent.change(screen.getByLabelText(/email/i), {
    target: { value: 'test@example.com' },
  });

  fireEvent.click(screen.getByRole('button', /login/i));

  expect(mockApi.post).toHaveBeenCalledWith('/auth/login', {
    email: 'test@example.com',
    password: 'password',
  });
});

// Run tests
npm test
```

#### E2E Tests (Future)
```typescript
// cypress/e2e/auth.cy.ts
describe('Authentication', () => {
  it('completes full login flow', () => {
    cy.visit('http://localhost:5173');
    cy.get('[data-testid=login-email]').type('test@example.com');
    cy.get('[data-testid=login-password]').type('password');
    cy.get('[data-testid=login-submit]').click();
    cy.url().should('include', '/dashboard');
  });
});
```

### Running All Tests Before Commit
```bash
# Run all tests
make test

# Or manually
cd backend && go test ./...
cd frontend && npm test
```

---

## Performance Guidelines

### Backend Performance

#### Database Queries
- **Index lookups:** Use indexes for WHERE clauses
- **Connection pooling:** Don't create new connections per request
- **N+1 queries:** Batch related queries

```go
// Good: Indexed lookup
SELECT * FROM users WHERE email = $1;  // Index on email

// Bad: Full table scan
SELECT * FROM users WHERE password_hash = $1;  // No index

// Bad: N+1 query
for _, user := range users {
  sessions := db.Query("SELECT * FROM sessions WHERE user_id = ?", user.ID)
  // Queries database len(users) times!
}

// Good: Join or batch
SELECT u.*, s.* FROM users u
LEFT JOIN sessions s ON u.id = s.user_id;
```

#### Response Times
- **Target:** <100ms per endpoint
- **Measure:** Add middleware to log response time

```go
func ResponseTimeMiddleware() gin.HandlerFunc {
  return func(c *gin.Context) {
    start := time.Now()
    c.Next()
    duration := time.Since(start)
    log.Printf("%s %s took %dms", c.Request.Method, c.Request.URL, duration.Milliseconds())
  }
}
```

#### Memory Usage
- **Goroutines:** Monitor count with `runtime.NumGoroutine()`
- **Allocations:** Minimize in hot paths
- **Buffers:** Reuse buffers for large operations

### Frontend Performance

#### Bundle Size
- **Target:** <300KB main bundle (gzipped)
- **Measure:** `npm run build` shows bundle size

```bash
npm run build
# Output shows chunk sizes

npm install source-map-explorer
npm run build
npx source-map-explorer 'dist/**/*.js'
```

#### Rendering Performance
- **Avoid unnecessary re-renders:** Use `React.memo`, `useMemo`
- **Optimize state updates:** Use Zustand selectors
- **Code splitting:** Lazy load routes and heavy components

```typescript
// Good: Memoized component
const UserCard = React.memo(function UserCard({ user }) {
  return <div>{user.name}</div>;
});

// Good: Selective state subscription
function Dashboard() {
  const user = useAuthStore(state => state.user);  // Only re-render on user change
  const logout = useAuthStore(state => state.logout);
  return ...;
}

// Bad: Subscribes to entire store
function Dashboard() {
  const state = useAuthStore();  // Re-renders on any state change
  return ...;
}
```

---

## Security Practices

### Input Validation

**Backend:**
```go
// Validate email format
if !isValidEmail(req.Email) {
  return errors.New("invalid email format")
}

// Validate password requirements
if len(req.Password) < 8 {
  return errors.New("password must be at least 8 characters")
}
```

**Frontend:**
```typescript
// Validate before sending to backend
if (!email.includes('@')) {
  setError('Invalid email');
  return;
}

if (password.length < 8) {
  setError('Password must be at least 8 characters');
  return;
}
```

### Secrets Management

**Never commit secrets:**
```bash
# .gitignore
.env          # Local secrets
.env.local
.env.*.local
credentials.json
```

**Environment variables:**
```bash
# .env.example (safe to commit)
DATABASE_URL=postgres://user:pass@localhost/db
JWT_SECRET=<paste-secret-here>

# Don't commit actual values!
```

### CORS & CSRF Protection

**CORS Configuration:**
```go
router.Use(cors.New(cors.Config{
  AllowOrigins:     []string{"http://localhost:5173"},  // Specific origin
  AllowMethods:     []string{"GET", "POST", "PUT", "DELETE"},
  AllowCredentials: true,  // For httpOnly cookies
}))
```

**CSRF Protection:**
- ✅ Using POST for state-changing operations
- ✅ Validating origin header
- ✅ SameSite cookies
- ✅ JWT tokens (stateless)

### Password Security

**Never:**
```go
// Bad
password := req.Password  // Store plaintext
database.Insert("users", User{Password: password})
```

**Always:**
```go
// Good
hash, _ := bcrypt.GenerateFromPassword([]byte(password), 12)
database.Insert("users", User{PasswordHash: hash})

// Verify
bcrypt.CompareHashAndPassword(storedHash, incomingPassword)
```

---

## Documentation Requirements

### Code Comments
- **Public functions:** Document purpose and parameters
- **Complex logic:** Explain why, not what
- **TODO comments:** Include context and optional issue link

```go
// Good: Documents purpose and params
// GenerateToken creates JWT token with 24h expiration.
// Returns signed token string or error if JWT_SECRET not set.
func GenerateToken(userID, email string) (string, error)

// Complex logic: Explain decision
// We use cost 12 because it takes ~100ms on modern hardware,
// balancing security against user experience.
hash, _ := bcrypt.GenerateFromPassword([]byte(password), 12)

// TODO: Add password reset flow (see issue #45)
```

### Type Documentation
- **Structs:** Document each exported field
- **Interfaces:** Document expected behavior
- **Enums:** Document valid values

```go
// User represents registered user with authentication info.
type User struct {
  ID        string    // UUID primary key
  Email     string    // Unique email address
  PasswordHash string  // bcrypt hashed password (never plaintext)
  CreatedAt time.Time // Account creation timestamp
  TotalXP   int       // Total experience points earned
}
```

### API Documentation
- **Endpoints:** Document all inputs/outputs
- **Examples:** Provide curl/SDK examples
- **Errors:** Document all possible error codes
- **See:** `/docs/API.md` for format

### README Standards
- **Quick start:** Get running in <5 minutes
- **Tech stack:** List dependencies
- **Project structure:** Visual tree with descriptions
- **Troubleshooting:** Common issues and solutions

---

## Code Review Checklist

Before submitting PR, verify:

- [ ] Code follows style guide (format, naming, comments)
- [ ] All tests passing (`make test`)
- [ ] Test coverage for new code (>80%)
- [ ] No hardcoded secrets or credentials
- [ ] Error handling for all failure cases
- [ ] No breaking changes (or documented migration)
- [ ] Documentation updated (comments, API, README)
- [ ] Commit messages follow conventional commits
- [ ] No console.log or debug statements left
- [ ] Performance acceptable (<100ms endpoints)
- [ ] TypeScript strict mode passes (frontend)
- [ ] go vet passes (backend)

---

## Useful Commands

```bash
# Backend
make backend          # Run backend server
make test             # Run all tests
cd backend && go fmt  # Format code
go vet ./...          # Check for issues
go mod tidy           # Clean dependencies

# Frontend
make frontend         # Run dev server
npm test              # Run tests
npm run build         # Production build
npm run lint          # Check style

# Docker
make dev              # Start all services
make docker-up        # Start Docker services
make docker-down      # Stop Docker services
make migrate          # Run migrations

# Database
PGPASSWORD=dev_password psql -h localhost -U dev -d voice_training
```

---

## Learning Resources

- **Go:** https://go.dev/doc
- **Gin:** https://gin-gonic.com/docs/
- **React:** https://react.dev
- **TypeScript:** https://www.typescriptlang.org/docs/
- **PostgreSQL:** https://www.postgresql.org/docs/
- **Testing Go:** https://golang.org/doc/effective_go#testing
- **Testing React:** https://testing-library.com/docs/react-testing-library/intro/
