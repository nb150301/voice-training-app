# Voice Training App - Code Standards & Style Guide

## Table of Contents
1. [Overview](#overview)
2. [File Organization](#file-organization)
3. [Naming Conventions](#naming-conventions)
4. [Go Backend Standards](#go-backend-standards)
5. [TypeScript Frontend Standards](#typescript-frontend-standards)
6. [Component Architecture](#component-architecture)
7. [State Management](#state-management)
8. [API Design](#api-design)
9. [Testing Standards](#testing-standards)
10. [Documentation Standards](#documentation-standards)

---

## Overview

This document defines coding standards, conventions, and best practices for the Voice Training App codebase. Following these standards ensures consistency, maintainability, and code quality across the project.

### Core Principles
1. **Consistency**: Follow established patterns throughout codebase
2. **Clarity**: Write self-documenting code with clear intent
3. **Simplicity**: Prefer simple solutions over complex ones
4. **Type Safety**: Leverage TypeScript and Go type systems
5. **Testability**: Write testable code with minimal dependencies

---

## File Organization

### Backend Structure (Go)
```
backend/
├── cmd/
│   └── server/                    # Application entry points
│       └── main.go
├── internal/                      # Private application code
│   ├── api/                       # HTTP handlers (route logic)
│   ├── auth/                      # Authentication logic
│   ├── audio/                     # Audio processing
│   ├── database/                  # Database connection
│   ├── middleware/                # HTTP middleware
│   └── models/                    # Data structures and DTOs
├── migrations/                    # SQL schema migrations
└── uploads/                       # File storage
```

**Guidelines**:
- `cmd/` contains main application entry points
- `internal/` contains private packages (not importable outside module)
- Group by feature/domain (api, auth, audio)
- Keep `main.go` minimal (just initialization)

### Frontend Structure (React)
```
frontend/src/
├── components/                    # Reusable React components
├── pages/                         # Page-level components
├── hooks/                         # Custom React hooks
├── lib/                           # Utility libraries
├── stores/                        # State management (Zustand)
├── assets/                        # Images, fonts, static files
├── App.tsx                        # Root component
├── main.tsx                       # React entry point
└── index.css                      # Global styles
```

**Guidelines**:
- `components/` for reusable UI components
- `pages/` for route-level components
- `hooks/` for custom React hooks
- `lib/` for utilities without React dependencies
- `stores/` for Zustand state stores

### File Naming

#### Backend (Go)
- **Package files**: Lowercase, underscores for multi-word
  - ✅ `auth_handler.go`
  - ✅ `pitch_detection.go`
  - ❌ `AuthHandler.go`
  - ❌ `pitchDetection.go`

- **Test files**: Same name with `_test.go` suffix
  - ✅ `auth_handler_test.go`
  - ✅ `jwt_test.go`

#### Frontend (TypeScript/React)
- **Components**: PascalCase with `.tsx` extension
  - ✅ `AudioRecorder.tsx`
  - ✅ `PitchHistoryGraph.tsx`
  - ❌ `audioRecorder.tsx`
  - ❌ `pitch-history-graph.tsx`

- **Hooks**: camelCase starting with `use`, `.ts` extension
  - ✅ `useAudioRecorder.ts`
  - ✅ `useRealtimePitch.ts`

- **Utilities**: camelCase with `.ts` extension
  - ✅ `pitchDetection.ts`
  - ✅ `audioProcessor.ts`

- **Stores**: camelCase with `Store` suffix, `.ts` extension
  - ✅ `authStore.ts`
  - ✅ `userStore.ts`

---

## Naming Conventions

### Go (Backend)

#### Variables
```go
// Local variables: camelCase
var userCount int
var isAuthenticated bool

// Exported variables: PascalCase
var DefaultTimeout = 30 * time.Second

// Constants: PascalCase (exported) or camelCase (private)
const MaxFileSize = 10 * 1024 * 1024  // Exported
const maxRetries = 3                   // Private

// Acronyms: All caps or lowercase
var userID string     // Good
var userHTTPClient    // Good
var userId            // Avoid
var userHttpClient    // Avoid
```

#### Functions
```go
// Exported functions: PascalCase
func GenerateToken(userID, email string) (string, error)
func ValidateEmail(email string) bool

// Private functions: camelCase
func hashPassword(password string) (string, error)
func parseJWT(token string) (*Claims, error)

// Handlers: Noun + Action (if needed)
func Register(c *gin.Context)
func GetRecordings(c *gin.Context)
func UploadRecording(c *gin.Context)
```

#### Types
```go
// Structs: PascalCase
type User struct {
    ID        string
    Email     string
    CreatedAt time.Time
}

// Interfaces: PascalCase ending with 'er' (idiomatic)
type Reader interface {
    Read() error
}

type AudioProcessor interface {
    Process(data []byte) error
}
```

### TypeScript (Frontend)

#### Variables
```typescript
// Variables: camelCase
const userToken = 'abc123';
const isLoggedIn = true;

// Constants: CONSTANT_CASE
const MAX_UPLOAD_SIZE = 10 * 1024 * 1024;
const API_BASE_URL = 'http://localhost:8080';

// Boolean variables: is/has/should prefix
const isLoading = false;
const hasError = true;
const shouldRetry = true;
```

#### Functions
```typescript
// Functions: camelCase, verb-first
function fetchUserData() {}
function handleSubmit() {}
function calculatePitch() {}

// Event handlers: handle prefix
function handleClick() {}
function handleInputChange() {}
```

#### Components
```typescript
// Components: PascalCase
function AudioRecorder() {}
function PitchHistoryGraph() {}

// Props interfaces: ComponentName + Props
interface AudioRecorderProps {
    onRecordingComplete: (blob: Blob) => void;
}

// State interfaces: ComponentName + State
interface DashboardState {
    isRecording: boolean;
    recordings: Recording[];
}
```

#### Hooks
```typescript
// Custom hooks: camelCase starting with 'use'
function useAudioRecorder() {}
function useRealtimePitch() {}
function useAuth() {}
```

#### Types
```typescript
// Types/Interfaces: PascalCase
interface User {
    id: string;
    email: string;
    createdAt: Date;
}

type RecordingStatus = 'idle' | 'recording' | 'uploading';

// Enum: PascalCase
enum UserRole {
    Admin = 'admin',
    User = 'user'
}
```

---

## Go Backend Standards

### Code Formatting
```bash
# Auto-format all Go code
go fmt ./...
gofmt -w backend/

# Static analysis
go vet ./...
```

### Package Structure
```go
// Each file starts with package declaration
package api

// Import grouping: standard library, external, internal
import (
    // Standard library
    "context"
    "fmt"
    "net/http"

    // External packages
    "github.com/gin-gonic/gin"
    "golang.org/x/crypto/bcrypt"

    // Internal packages
    "voice-training-app/internal/database"
    "voice-training-app/internal/models"
)
```

### Error Handling
```go
// Always check errors
result, err := database.DB.QueryRow(ctx, query).Scan(&user)
if err != nil {
    // Handle error appropriately
    c.JSON(http.StatusInternalServerError, models.APIResponse{
        Success: false,
        Error:   "Database error",
    })
    return
}

// Wrap errors for context
if err := processAudio(path); err != nil {
    return fmt.Errorf("failed to process audio: %w", err)
}

// Never ignore errors
_, _ = doSomething()  // ❌ Bad
result, err := doSomething()  // ✅ Good
if err != nil {
    log.Printf("error: %v", err)
}
```

### Function Design
```go
// Single responsibility
func Register(c *gin.Context) {
    // 1. Parse and validate request
    var req models.RegisterRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(400, errorResponse("Invalid request"))
        return
    }

    // 2. Business logic (delegate to helpers)
    user, err := createUser(req.Email, req.Password)
    if err != nil {
        c.JSON(500, errorResponse("Failed to create user"))
        return
    }

    // 3. Response
    c.JSON(201, successResponse(user))
}

// Helper functions for clarity
func createUser(email, password string) (*models.User, error) {
    // Hash password
    // Insert to database
    // Return user
}
```

### Struct Tags
```go
// Use struct tags for JSON serialization
type User struct {
    ID        string    `json:"id"`
    Email     string    `json:"email"`
    CreatedAt time.Time `json:"createdAt"`
    UpdatedAt time.Time `json:"updatedAt"`

    // Omit sensitive fields
    PasswordHash string `json:"-"`
}
```

### Concurrency
```go
// Use goroutines for async operations
go func() {
    // Ensure proper error handling
    if err := processInBackground(); err != nil {
        log.Printf("background error: %v", err)
    }
}()

// Use channels for synchronization
results := make(chan Result, 10)
go producer(results)
for result := range results {
    // Process
}
```

### Documentation
```go
// Document all exported functions
// GenerateToken creates JWT token with 24h expiration.
// Returns signed token string or error if JWT_SECRET not set.
func GenerateToken(userID, email string) (string, error) {
    // Implementation
}

// Package comments
// Package auth provides JWT token generation and validation
// for user authentication.
package auth
```

---

## TypeScript Frontend Standards

### TypeScript Configuration
From `tsconfig.json`:
- Strict mode enabled
- No implicit any
- Strict null checks
- No unused variables

### Component Structure
```typescript
// Imports
import { useState, useEffect } from 'react';
import axios from 'axios';

// Types/Interfaces
interface AudioRecorderProps {
    onRecordingComplete: (blob: Blob) => void;
    maxDuration?: number;
}

// Component
function AudioRecorder({ onRecordingComplete, maxDuration = 60 }: AudioRecorderProps) {
    // State
    const [isRecording, setIsRecording] = useState(false);
    const [duration, setDuration] = useState(0);

    // Effects
    useEffect(() => {
        // Setup
        return () => {
            // Cleanup
        };
    }, []);

    // Event handlers
    const handleStart = () => {
        setIsRecording(true);
    };

    const handleStop = () => {
        setIsRecording(false);
    };

    // Render
    return (
        <div className="audio-recorder">
            <button onClick={handleStart}>Start</button>
            <button onClick={handleStop}>Stop</button>
        </div>
    );
}

export default AudioRecorder;
```

### Type Safety
```typescript
// ✅ Good: Explicit types
interface User {
    id: string;
    email: string;
    createdAt: Date;
}

const user: User = {
    id: '123',
    email: 'user@example.com',
    createdAt: new Date()
};

// ❌ Bad: Using any
const user: any = { ... };

// ✅ Good: Generic types
function fetchData<T>(url: string): Promise<T> {
    return axios.get<T>(url).then(res => res.data);
}

const user = await fetchData<User>('/api/user');

// ✅ Good: Union types
type Status = 'idle' | 'loading' | 'success' | 'error';
const status: Status = 'loading';

// ✅ Good: Optional properties
interface Recording {
    id: string;
    filePath: string;
    pitchHz?: number;  // Optional
}
```

### React Hooks
```typescript
// Custom hooks for reusable logic
function useAudioRecorder() {
    const [isRecording, setIsRecording] = useState(false);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);

    const startRecording = async () => {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        // ...
    };

    const stopRecording = () => {
        // ...
    };

    return {
        isRecording,
        audioBlob,
        startRecording,
        stopRecording
    };
}

// Usage in component
function AudioRecorder() {
    const { isRecording, startRecording, stopRecording } = useAudioRecorder();

    return (
        <button onClick={isRecording ? stopRecording : startRecording}>
            {isRecording ? 'Stop' : 'Record'}
        </button>
    );
}
```

### Props and State
```typescript
// Props: Use interfaces
interface ButtonProps {
    onClick: () => void;
    children: React.ReactNode;
    variant?: 'primary' | 'secondary';
    disabled?: boolean;
}

function Button({ onClick, children, variant = 'primary', disabled = false }: ButtonProps) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`btn btn-${variant}`}
        >
            {children}
        </button>
    );
}

// State: Explicit types
const [count, setCount] = useState<number>(0);
const [user, setUser] = useState<User | null>(null);
const [recordings, setRecordings] = useState<Recording[]>([]);
```

### Async Operations
```typescript
// ✅ Good: Async/await with error handling
async function fetchUser(id: string): Promise<User> {
    try {
        const response = await axios.get<User>(`/api/users/${id}`);
        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            throw new Error(error.response?.data?.error || 'Failed to fetch user');
        }
        throw error;
    }
}

// ✅ Good: Loading and error states
function UserProfile({ userId }: { userId: string }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchUser(userId)
            .then(setUser)
            .catch(err => setError(err.message))
            .finally(() => setLoading(false));
    }, [userId]);

    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error}</div>;
    if (!user) return <div>User not found</div>;

    return <div>{user.email}</div>;
}
```

---

## Component Architecture

### Component Types

#### 1. Page Components
Located in `pages/`, represent full routes:
```typescript
// pages/Dashboard.tsx
function Dashboard() {
    return (
        <div className="dashboard">
            <Header />
            <Sidebar />
            <MainContent>
                <AudioRecorder />
                <PitchHistoryGraph />
            </MainContent>
        </div>
    );
}
```

#### 2. Container Components
Manage state and logic:
```typescript
function AudioRecorderContainer() {
    const { isRecording, audioBlob, startRecording, stopRecording } = useAudioRecorder();
    const [uploading, setUploading] = useState(false);

    const handleUpload = async () => {
        if (!audioBlob) return;
        setUploading(true);
        try {
            await uploadRecording(audioBlob);
        } catch (error) {
            console.error(error);
        } finally {
            setUploading(false);
        }
    };

    return (
        <AudioRecorderView
            isRecording={isRecording}
            uploading={uploading}
            onStart={startRecording}
            onStop={stopRecording}
            onUpload={handleUpload}
        />
    );
}
```

#### 3. Presentational Components
Pure UI components:
```typescript
interface AudioRecorderViewProps {
    isRecording: boolean;
    uploading: boolean;
    onStart: () => void;
    onStop: () => void;
    onUpload: () => void;
}

function AudioRecorderView({ isRecording, uploading, onStart, onStop, onUpload }: AudioRecorderViewProps) {
    return (
        <div className="recorder">
            <button onClick={isRecording ? onStop : onStart}>
                {isRecording ? 'Stop' : 'Record'}
            </button>
            <button onClick={onUpload} disabled={uploading}>
                {uploading ? 'Uploading...' : 'Upload'}
            </button>
        </div>
    );
}
```

### Component Composition
```typescript
// Build complex UIs from simple components
function Dashboard() {
    return (
        <Layout>
            <Header title="Voice Training" />
            <TwoColumnLayout>
                <Sidebar>
                    <UserProfile />
                    <Navigation />
                </Sidebar>
                <MainContent>
                    <Section title="Record">
                        <AudioRecorder />
                    </Section>
                    <Section title="Progress">
                        <PitchHistoryGraph />
                        <PitchStatistics />
                    </Section>
                </MainContent>
            </TwoColumnLayout>
        </Layout>
    );
}
```

---

## State Management

### Zustand Stores
```typescript
// stores/authStore.ts
import { create } from 'zustand';

interface AuthState {
    token: string | null;
    user: User | null;
    isAuthenticated: boolean;

    // Actions
    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
    setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    // Initial state
    token: localStorage.getItem('token'),
    user: null,
    isAuthenticated: false,

    // Actions
    login: async (email, password) => {
        const response = await axios.post('/api/v1/auth/login', { email, password });
        const { token, user } = response.data;

        localStorage.setItem('token', token);
        set({ token, user, isAuthenticated: true });
    },

    logout: () => {
        localStorage.removeItem('token');
        set({ token: null, user: null, isAuthenticated: false });
    },

    setUser: (user) => {
        set({ user, isAuthenticated: true });
    }
}));

// Usage in components
function Dashboard() {
    const user = useAuthStore((state) => state.user);
    const logout = useAuthStore((state) => state.logout);

    return (
        <div>
            <p>Welcome, {user?.email}</p>
            <button onClick={logout}>Logout</button>
        </div>
    );
}
```

### Local State vs Global State

**Use Local State** (useState) when:
- State is only used in one component
- State is temporary UI state (hover, focus)
- State doesn't need to persist

**Use Global State** (Zustand) when:
- State is shared across multiple components
- State represents application-level data (auth, user)
- State should persist across page navigation

---

## API Design

### RESTful Conventions

#### Resource Naming
```
✅ Good:
GET    /api/v1/users          (collection)
GET    /api/v1/users/:id      (single resource)
POST   /api/v1/users          (create)
PUT    /api/v1/users/:id      (update)
DELETE /api/v1/users/:id      (delete)

❌ Bad:
GET /api/v1/getUsers
POST /api/v1/createUser
GET /api/v1/user/:id/get
```

#### HTTP Methods
- **GET**: Retrieve resources (idempotent, no body)
- **POST**: Create resources (not idempotent, has body)
- **PUT**: Update entire resource (idempotent)
- **PATCH**: Update partial resource
- **DELETE**: Remove resource (idempotent)

### Request/Response Format

#### Request
```typescript
// POST /api/v1/auth/register
interface RegisterRequest {
    email: string;
    password: string;
}

// Headers
Content-Type: application/json
Authorization: Bearer <token>  (for protected routes)
```

#### Response
```typescript
// Success response (200, 201)
interface APIResponse<T> {
    success: true;
    data: T;
}

// Error response (400, 401, 500)
interface APIErrorResponse {
    success: false;
    error: string;
}

// Example
{
    "success": true,
    "data": {
        "user": {
            "id": "123",
            "email": "user@example.com"
        }
    }
}
```

### Status Codes
- **200 OK**: Successful GET, PUT, PATCH, DELETE
- **201 Created**: Successful POST
- **400 Bad Request**: Invalid request data
- **401 Unauthorized**: Missing or invalid auth
- **404 Not Found**: Resource doesn't exist
- **409 Conflict**: Resource already exists
- **500 Internal Server Error**: Server error

---

## Testing Standards

### Backend Tests (Go)
```go
// auth_test.go
package auth

import (
    "testing"
)

func TestGenerateToken(t *testing.T) {
    // Arrange
    userID := "user-123"
    email := "test@example.com"

    // Act
    token, err := GenerateToken(userID, email)

    // Assert
    if err != nil {
        t.Fatalf("expected no error, got %v", err)
    }

    if token == "" {
        t.Error("expected non-empty token")
    }
}

func TestValidateToken(t *testing.T) {
    // Generate token first
    token, _ := GenerateToken("user-123", "test@example.com")

    // Validate it
    claims, err := ValidateToken(token)

    if err != nil {
        t.Fatalf("expected valid token, got error: %v", err)
    }

    if claims.UserID != "user-123" {
        t.Errorf("expected user_id=user-123, got %s", claims.UserID)
    }
}

// Table-driven tests
func TestHashPassword(t *testing.T) {
    tests := []struct {
        name     string
        password string
        wantErr  bool
    }{
        {"valid password", "password123", false},
        {"empty password", "", false},
        {"long password", strings.Repeat("a", 100), false},
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            hash, err := hashPassword(tt.password)
            if (err != nil) != tt.wantErr {
                t.Errorf("hashPassword() error = %v, wantErr %v", err, tt.wantErr)
            }
            if !tt.wantErr && hash == "" {
                t.Error("expected non-empty hash")
            }
        })
    }
}
```

### Frontend Tests (React)
```typescript
// AudioRecorder.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import AudioRecorder from './AudioRecorder';

describe('AudioRecorder', () => {
    test('renders record button', () => {
        render(<AudioRecorder onRecordingComplete={() => {}} />);
        expect(screen.getByText(/record/i)).toBeInTheDocument();
    });

    test('starts recording on button click', async () => {
        const mockGetUserMedia = jest.fn();
        global.navigator.mediaDevices = {
            getUserMedia: mockGetUserMedia
        };

        render(<AudioRecorder onRecordingComplete={() => {}} />);

        fireEvent.click(screen.getByText(/record/i));

        expect(mockGetUserMedia).toHaveBeenCalledWith({ audio: true });
    });

    test('calls onRecordingComplete with blob', async () => {
        const mockCallback = jest.fn();

        render(<AudioRecorder onRecordingComplete={mockCallback} />);

        // Simulate recording
        // ...

        expect(mockCallback).toHaveBeenCalledWith(expect.any(Blob));
    });
});
```

### Test Coverage Targets
- **Unit Tests**: 80%+ coverage for critical logic
- **Integration Tests**: All API endpoints
- **E2E Tests**: Critical user flows (registration, login, recording)

---

## Documentation Standards

### Code Comments
```typescript
// ✅ Good: Explain WHY, not WHAT
// Use exponential backoff to avoid overwhelming server during retries
const delay = Math.pow(2, retryCount) * 1000;

// ❌ Bad: Stating the obvious
// Set delay to 2 raised to retryCount times 1000
const delay = Math.pow(2, retryCount) * 1000;
```

### Function Documentation
```go
// ✅ Good: Complete documentation
// GenerateToken creates a JWT token for authenticated user.
//
// The token expires after 24 hours and includes user_id and email
// in the claims. Requires JWT_SECRET environment variable to be set.
//
// Returns signed token string or error if JWT_SECRET is not configured.
func GenerateToken(userID, email string) (string, error) {
    // Implementation
}
```

```typescript
// ✅ Good: JSDoc for complex functions
/**
 * Detects pitch from audio samples using autocorrelation algorithm.
 *
 * @param audioData - Float32Array of audio samples (mono, 44.1kHz)
 * @param sampleRate - Sample rate of audio (default: 44100)
 * @returns Detected pitch in Hz, or null if no pitch detected
 *
 * @example
 * const pitch = detectPitch(samples, 44100);
 * if (pitch) {
 *   console.log(`Detected pitch: ${pitch} Hz`);
 * }
 */
function detectPitch(audioData: Float32Array, sampleRate: number = 44100): number | null {
    // Implementation
}
```

### README Standards
Each major module should have a README:
- Purpose and overview
- Installation/setup
- Usage examples
- API reference (if applicable)
- Testing instructions
- Contributing guidelines

---

## Conclusion

Following these code standards ensures:
- **Consistency**: Predictable code structure across team
- **Maintainability**: Easy to understand and modify code
- **Quality**: Fewer bugs through type safety and testing
- **Collaboration**: Clear conventions for team development

All code should be reviewed against these standards before merging.

---

**Last Updated**: 2025-11-24
**Version**: 1.0
**Status**: Active
