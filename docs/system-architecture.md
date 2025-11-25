# Voice Training App - System Architecture

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [System Components](#system-components)
3. [Frontend Architecture](#frontend-architecture)
4. [Backend Architecture](#backend-architecture)
5. [Database Architecture](#database-architecture)
6. [Authentication & Security](#authentication--security)
7. [Audio Processing Pipeline](#audio-processing-pipeline)
8. [Data Flow Diagrams](#data-flow-diagrams)
9. [Integration Points](#integration-points)
10. [Deployment Architecture](#deployment-architecture)

---

## Architecture Overview

Voice Training App follows a modern **three-tier architecture** with clear separation between presentation, business logic, and data layers.

### High-Level Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                       Client Tier                            │
│  ┌──────────────────────────────────────────────────────┐   │
│  │    React Frontend (Vite + TypeScript + Tailwind)     │   │
│  │  - SPA with React Router                             │   │
│  │  - Zustand State Management                          │   │
│  │  - Web Audio API for recording                       │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↓ HTTPS/WebSocket
┌─────────────────────────────────────────────────────────────┐
│                    Application Tier                          │
│  ┌──────────────────────────────────────────────────────┐   │
│  │         Go Backend (Gin Framework)                    │   │
│  │  - RESTful API                                        │   │
│  │  - JWT Authentication                                 │   │
│  │  - Audio Processing (FFmpeg + FFT)                   │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↓ TCP/IP
┌─────────────────────────────────────────────────────────────┐
│                       Data Tier                              │
│  ┌────────────────────────┐  ┌──────────────────────────┐   │
│  │   PostgreSQL 15        │  │     Redis 7              │   │
│  │  - User data           │  │  - Session cache         │   │
│  │  - Recordings          │  │  - Rate limiting         │   │
│  │  - Analytics           │  │  - Real-time data        │   │
│  └────────────────────────┘  └──────────────────────────┘   │
│  ┌────────────────────────────────────────────────────────┐ │
│  │           File Storage (Local/Cloud)                   │ │
│  │  - Audio recordings (original + processed)            │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Architecture Style
- **Pattern**: Client-Server with RESTful API
- **Communication**: HTTP/HTTPS (REST), WebSocket (future)
- **State Management**: Server-side sessions + client-side JWT
- **Data Storage**: Relational (PostgreSQL) + Cache (Redis) + File System

### Technology Stack Summary
| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | React 18 + TypeScript | UI framework |
| Bundler | Vite 7 | Build tool, dev server |
| Styling | Tailwind CSS 4 | Utility-first CSS |
| State | Zustand 5 | State management |
| Routing | React Router 7 | Client-side routing |
| Backend | Go 1.21 + Gin | HTTP server, API |
| Auth | JWT (HS256) | Token-based auth |
| Database | PostgreSQL 15 | Relational data |
| Cache | Redis 7 | Session, rate limit |
| Audio | FFmpeg + go-dsp | Processing, analysis |
| Container | Docker Compose | Local development |

---

## System Components

### Component Diagram
```
┌──────────────────────────────────────────────────────────────────┐
│                         Frontend (React)                          │
├──────────────────────────────────────────────────────────────────┤
│ Pages                    Components                   Hooks       │
│ ├─ Login                 ├─ AudioRecorder            ├─ useAuth  │
│ ├─ Register              ├─ PitchMeter               ├─ useAudio │
│ ├─ Dashboard             ├─ PitchGraph               └─ usePitch │
│ └─ ...                   ├─ Statistics                            │
│                          └─ ...                                   │
│ State (Zustand)          Lib/Utils                                │
│ └─ authStore             ├─ api.ts (Axios)                        │
│                          ├─ pitchDetection.ts                     │
│                          └─ audioProcessor.ts                     │
└──────────────────────────────────────────────────────────────────┘
                                 ↓ HTTP/HTTPS
┌──────────────────────────────────────────────────────────────────┐
│                         Backend (Go/Gin)                          │
├──────────────────────────────────────────────────────────────────┤
│ HTTP Layer               Business Logic          Data Access      │
│ ├─ Router (Gin)          ├─ Auth Package        ├─ Database      │
│ ├─ Middleware            │  └─ JWT              │  └─ pgx pool   │
│ │  ├─ CORS               ├─ Audio Package       └─ Redis         │
│  │  └─ Auth              │  ├─ Transcoding                       │
│ └─ API Handlers          │  └─ Pitch Detection                   │
│    ├─ auth_handler       └─ Models                               │
│    └─ recordings_handler    ├─ User                              │
│                             └─ Recording                          │
└──────────────────────────────────────────────────────────────────┘
                                 ↓ TCP
┌──────────────────────────────────────────────────────────────────┐
│                     Data & Storage Layer                          │
├──────────────────────────────────────────────────────────────────┤
│ PostgreSQL               Redis                  File System       │
│ ├─ users                 ├─ sessions            ├─ uploads/       │
│ ├─ sessions              └─ cache                 ├─ recordings/ │
│ └─ recordings                                     └─ processed/  │
└──────────────────────────────────────────────────────────────────┘
```

---

## Frontend Architecture

### React Application Structure
```
┌────────────────────────────────────────┐
│           Browser (User)               │
│  ┌──────────────────────────────────┐  │
│  │     HTML Entry (index.html)      │  │
│  │          ↓                        │  │
│  │     main.tsx (React.render)      │  │
│  │          ↓                        │  │
│  │        App.tsx                    │  │
│  │    (BrowserRouter + Routes)      │  │
│  └──────────────────────────────────┘  │
└────────────────────────────────────────┘
              ↓
┌────────────────────────────────────────┐
│          Routing Layer                 │
│  ┌──────────────────────────────────┐  │
│  │  /login → Login.tsx              │  │
│  │  /register → Register.tsx        │  │
│  │  /dashboard → Dashboard.tsx      │  │
│  │  (ProtectedRoute wrapper)        │  │
│  └──────────────────────────────────┘  │
└────────────────────────────────────────┘
              ↓
┌────────────────────────────────────────┐
│         Component Layer                │
│  ┌──────────────────────────────────┐  │
│  │  Page Components                 │  │
│  │  ├─ Layout & Navigation          │  │
│  │  └─ Feature Components           │  │
│  │      ├─ AudioRecorder            │  │
│  │      ├─ PitchMeter               │  │
│  │      ├─ PitchGraph               │  │
│  │      └─ Statistics               │  │
│  └──────────────────────────────────┘  │
└────────────────────────────────────────┘
              ↓
┌────────────────────────────────────────┐
│        Business Logic Layer            │
│  ┌──────────────────────────────────┐  │
│  │  Custom Hooks                    │  │
│  │  ├─ useAudioRecorder             │  │
│  │  ├─ useRealtimePitch             │  │
│  │  └─ useAudioVisualizer           │  │
│  │                                  │  │
│  │  Utilities                       │  │
│  │  ├─ pitchDetection.ts            │  │
│  │  ├─ audioProcessor.ts            │  │
│  │  └─ temporalFilters.ts           │  │
│  └──────────────────────────────────┘  │
└────────────────────────────────────────┘
              ↓
┌────────────────────────────────────────┐
│        State Management                │
│  ┌──────────────────────────────────┐  │
│  │  Zustand Stores                  │  │
│  │  └─ authStore                    │  │
│  │      ├─ token                    │  │
│  │      ├─ user                     │  │
│  │      └─ actions (login, logout)  │  │
│  └──────────────────────────────────┘  │
└────────────────────────────────────────┘
              ↓
┌────────────────────────────────────────┐
│          API Layer                     │
│  ┌──────────────────────────────────┐  │
│  │  Axios Client (api.ts)           │  │
│  │  ├─ Base URL config              │  │
│  │  ├─ Interceptors                 │  │
│  │  │  ├─ Request (add auth)        │  │
│  │  │  └─ Response (handle errors)  │  │
│  │  └─ HTTP methods                 │  │
│  └──────────────────────────────────┘  │
└────────────────────────────────────────┘
```

### State Flow (Zustand)
```
Component → Action → Store Update → Re-render

Example: Login Flow
┌──────────┐   login()   ┌───────────┐   API call   ┌─────────┐
│  Login   │ ──────────→ │ authStore │ ───────────→ │ Backend │
│ Component│             │  .login() │              │   API   │
└──────────┘             └───────────┘              └─────────┘
     ↑                          ↓                         │
     │                     set({ token,                   │
     │                       user,                        │
     │                       isAuth })                    │
     │                          │                         │
     └──────── Re-render ────────┘ ←─── 200 OK ──────────┘
```

### Component Communication
```
Parent Component
    ↓ (props)
Child Component
    ↓ (callback)
Parent Component (state update)
    ↓ (re-render)
Child Component (new props)

Example:
Dashboard
    ↓ onRecordingComplete={handleUpload}
AudioRecorder
    ↓ handleUpload(blob)
Dashboard (uploads blob)
    ↓ updates recordings state
AudioRecorder (receives new props)
```

---

## Backend Architecture

### Layered Architecture
```
┌──────────────────────────────────────────────────────┐
│                   HTTP Layer                         │
│  ┌────────────────────────────────────────────────┐  │
│  │  Gin Router                                    │  │
│  │  ├─ /health → Health check                    │  │
│  │  ├─ /api/v1/auth/*                            │  │
│  │  └─ /api/v1/recordings/*                      │  │
│  └────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────┘
                      ↓
┌──────────────────────────────────────────────────────┐
│                 Middleware Layer                      │
│  ┌────────────────────────────────────────────────┐  │
│  │  CORS Middleware → Enable cross-origin         │  │
│  │  Auth Middleware → Validate JWT               │  │
│  │  Logging Middleware → Request logging         │  │
│  │  Error Middleware → Error handling            │  │
│  └────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────┘
                      ↓
┌──────────────────────────────────────────────────────┐
│                  Handler Layer                        │
│  ┌────────────────────────────────────────────────┐  │
│  │  auth_handler.go                               │  │
│  │  ├─ Register() → Create user                   │  │
│  │  ├─ Login() → Authenticate                     │  │
│  │  ├─ Me() → Get current user                    │  │
│  │  └─ Logout() → Clear session                   │  │
│  │                                                │  │
│  │  recordings_handler.go                         │  │
│  │  ├─ UploadRecording() → Save audio            │  │
│  │  ├─ GetRecordings() → List recordings         │  │
│  │  └─ DeleteRecording() → Remove audio          │  │
│  └────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────┘
                      ↓
┌──────────────────────────────────────────────────────┐
│               Business Logic Layer                    │
│  ┌────────────────────────────────────────────────┐  │
│  │  auth/ package                                 │  │
│  │  ├─ GenerateToken() → JWT creation            │  │
│  │  ├─ ValidateToken() → JWT validation          │  │
│  │  └─ HashPassword() → bcrypt hashing           │  │
│  │                                                │  │
│  │  audio/ package                                │  │
│  │  ├─ TranscodeToWAV() → FFmpeg conversion     │  │
│  │  ├─ DetectPitch() → FFT analysis              │  │
│  │  └─ ProcessAudioFile() → Complete pipeline    │  │
│  └────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────┘
                      ↓
┌──────────────────────────────────────────────────────┐
│                 Data Access Layer                     │
│  ┌────────────────────────────────────────────────┐  │
│  │  database/ package                             │  │
│  │  └─ DB (pgxpool.Pool)                          │  │
│  │      ├─ QueryRow()                             │  │
│  │      ├─ Query()                                │  │
│  │      └─ Exec()                                 │  │
│  │                                                │  │
│  │  models/ package                               │  │
│  │  ├─ User struct                                │  │
│  │  ├─ Recording struct                           │  │
│  │  └─ APIResponse struct                         │  │
│  └────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────┘
                      ↓
┌──────────────────────────────────────────────────────┐
│                  Storage Layer                        │
│  ┌────────────────────┐  ┌──────────────────────┐    │
│  │   PostgreSQL       │  │      Redis           │    │
│  │   (persistent)     │  │      (cache)         │    │
│  └────────────────────┘  └──────────────────────┘    │
└──────────────────────────────────────────────────────┘
```

### Request Flow Example
```
HTTP Request: POST /api/v1/auth/login
    ↓
Gin Router matches route
    ↓
CORS Middleware (check origin)
    ↓
Logging Middleware (log request)
    ↓
auth_handler.Login()
    ├─ Parse JSON body
    ├─ Validate input
    ├─ Query database for user
    ├─ bcrypt.Compare(password)
    ├─ auth.GenerateToken()
    └─ Set cookie + return JSON
    ↓
Response: 200 OK + JWT token
```

---

## Database Architecture

### Entity Relationship Diagram
```
┌─────────────────────────────────────────┐
│              users                      │
├─────────────────────────────────────────┤
│ id (PK)              UUID               │
│ email                VARCHAR UNIQUE     │
│ password_hash        VARCHAR            │
│ created_at           TIMESTAMP          │
│ updated_at           TIMESTAMP          │
│ streak_count         INT                │
│ last_practice_date   DATE               │
│ total_xp             INT                │
│ level                INT                │
└─────────────────────────────────────────┘
          │ 1
          │
          │ N
┌─────────────────────────────────────────┐
│            recordings                   │
├─────────────────────────────────────────┤
│ id (PK)              UUID               │
│ user_id (FK)         UUID               │
│ file_path            VARCHAR            │
│ original_filename    VARCHAR            │
│ duration             FLOAT              │
│ file_size            BIGINT             │
│ pitch_hz             FLOAT (nullable)   │
│ created_at           TIMESTAMP          │
│ updated_at           TIMESTAMP          │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│             sessions                    │
├─────────────────────────────────────────┤
│ id (PK)              UUID               │
│ user_id (FK)         UUID               │
│ duration             INT                │
│ exercises_completed  INT                │
│ xp_earned            INT                │
│ created_at           TIMESTAMP          │
└─────────────────────────────────────────┘
```

### Indexes
```sql
-- users table
CREATE INDEX idx_users_email ON users(email);

-- recordings table
CREATE INDEX idx_recordings_user_id ON recordings(user_id);
CREATE INDEX idx_recordings_created_at ON recordings(created_at DESC);

-- sessions table
CREATE INDEX idx_sessions_user_created ON sessions(user_id, created_at DESC);
```

### Data Access Patterns

#### Read Operations
```go
// Single row
var user User
err := DB.QueryRow(ctx,
    "SELECT id, email FROM users WHERE email = $1",
    email).Scan(&user.ID, &user.Email)

// Multiple rows
rows, err := DB.Query(ctx,
    "SELECT * FROM recordings WHERE user_id = $1 ORDER BY created_at DESC LIMIT 10",
    userID)
defer rows.Close()

for rows.Next() {
    var rec Recording
    rows.Scan(&rec.ID, &rec.UserID, ...)
    recordings = append(recordings, rec)
}
```

#### Write Operations
```go
// Insert
err := DB.QueryRow(ctx,
    `INSERT INTO users (email, password_hash)
     VALUES ($1, $2)
     RETURNING id, created_at`,
    email, hash).Scan(&user.ID, &user.CreatedAt)

// Update
_, err := DB.Exec(ctx,
    "UPDATE users SET total_xp = total_xp + $1 WHERE id = $2",
    xpGained, userID)

// Delete
_, err := DB.Exec(ctx,
    "DELETE FROM recordings WHERE id = $1 AND user_id = $2",
    recordingID, userID)
```

### Connection Pooling
```go
// PostgreSQL connection pool (pgx)
config, _ := pgxpool.ParseConfig(databaseURL)
config.MaxConns = 25               // Maximum connections
config.MinConns = 5                // Minimum idle connections
config.MaxConnLifetime = time.Hour // Connection max lifetime

pool, _ := pgxpool.NewWithConfig(ctx, config)
```

---

## Authentication & Security

### JWT Authentication Flow
```
1. User Login
   ┌──────┐                 ┌─────────┐
   │Client│                 │ Backend │
   └──┬───┘                 └────┬────┘
      │ POST /auth/login          │
      │ {email, password}         │
      │ ─────────────────────────>│
      │                           │ Verify credentials
      │                           │ Generate JWT token
      │                           │ Hash: HS256
      │                           │ Payload: {user_id, email, exp}
      │                           │
      │ 200 OK                    │
      │ {token: "eyJhbG..."}      │
      │ Set-Cookie: token=...     │
      │ <─────────────────────────│
      │                           │
   Store token                    │
   (localStorage + cookie)        │

2. Protected Request
   ┌──────┐                 ┌─────────┐
   │Client│                 │ Backend │
   └──┬───┘                 └────┬────┘
      │ GET /api/v1/auth/me       │
      │ Authorization: Bearer <token>
      │ Cookie: token=<token>     │
      │ ─────────────────────────>│
      │                           │ Extract token
      │                           │ Validate signature
      │                           │ Check expiration
      │                           │ Extract user_id
      │                           │ Query database
      │                           │
      │ 200 OK                    │
      │ {user: {...}}             │
      │ <─────────────────────────│
```

### Security Layers

#### 1. Password Security
```go
// Hashing (bcrypt, cost 12)
hash, err := bcrypt.GenerateFromPassword([]byte(password), 12)

// Verification
err := bcrypt.CompareHashAndPassword(storedHash, providedPassword)
```

#### 2. JWT Token Security
```go
// Token generation
token := jwt.NewWithClaims(jwt.SigningMethodHS256, Claims{
    UserID: userID,
    Email:  email,
    RegisteredClaims: jwt.RegisteredClaims{
        ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)),
        IssuedAt:  jwt.NewNumericDate(time.Now()),
    },
})
signedToken, _ := token.SignedString([]byte(jwtSecret))

// httpOnly cookie (XSS protection)
c.SetCookie("token", signedToken, 86400, "/", "", false, true)
//                                                    ↑     ↑
//                                                 secure httpOnly
```

#### 3. CORS Configuration
```go
router.Use(cors.New(cors.Config{
    AllowOrigins:     []string{"http://localhost:5173"},  // Specific origin
    AllowMethods:     []string{"GET", "POST", "PUT", "DELETE"},
    AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
    AllowCredentials: true,  // Allow cookies
}))
```

#### 4. Input Validation
```go
// Backend validation
if !isValidEmail(req.Email) {
    return errors.New("invalid email format")
}

if len(req.Password) < 8 {
    return errors.New("password must be at least 8 characters")
}

// Parameterized queries (SQL injection prevention)
DB.QueryRow("SELECT * FROM users WHERE email = $1", email)  // ✅ Safe
DB.QueryRow("SELECT * FROM users WHERE email = '" + email + "'")  // ❌ Vulnerable
```

---

## Audio Processing Pipeline

### Recording & Analysis Flow
```
┌─────────────────────────────────────────────────────────┐
│                     Frontend                             │
│  ┌───────────────────────────────────────────────────┐  │
│  │ 1. User clicks "Record"                           │  │
│  │    ↓                                              │  │
│  │ 2. Request microphone permission                 │  │
│  │    navigator.mediaDevices.getUserMedia()         │  │
│  │    ↓                                              │  │
│  │ 3. Create MediaRecorder                          │  │
│  │    const recorder = new MediaRecorder(stream)    │  │
│  │    ↓                                              │  │
│  │ 4. Record audio chunks                           │  │
│  │    recorder.ondataavailable = (e) => {...}       │  │
│  │    ↓                                              │  │
│  │ 5. Stop and create Blob                          │  │
│  │    const audioBlob = new Blob(chunks)            │  │
│  │    ↓                                              │  │
│  │ 6. Upload to backend                             │  │
│  │    POST /api/v1/recordings/upload                │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                        ↓ HTTP multipart/form-data
┌─────────────────────────────────────────────────────────┐
│                     Backend                              │
│  ┌───────────────────────────────────────────────────┐  │
│  │ 7. Receive file upload                           │  │
│  │    c.SaveUploadedFile(file, path)                │  │
│  │    ↓                                              │  │
│  │ 8. Transcode to WAV (FFmpeg)                     │  │
│  │    ffmpeg -i input.webm                          │  │
│  │           -ar 44100                              │  │
│  │           -ac 1                                  │  │
│  │           output.wav                             │  │
│  │    ↓                                              │  │
│  │ 9. Read WAV samples                              │  │
│  │    wavData, _ := wav.New(file)                   │  │
│  │    samples, _ := wavData.ReadFloats(FFTSize)     │  │
│  │    ↓                                              │  │
│  │ 10. Apply Hamming window                         │  │
│  │     windowed := applyHammingWindow(samples)      │  │
│  │     ↓                                             │  │
│  │ 11. Perform FFT                                  │  │
│  │     fftResult := fft.FFTReal(windowed)           │  │
│  │     ↓                                             │  │
│  │ 12. Find dominant frequency                      │  │
│  │     for i := minBin; i < maxBin; i++ {           │  │
│  │         magnitude := abs(fftResult[i])           │  │
│  │         if magnitude > maxMagnitude {            │  │
│  │             maxIndex = i                         │  │
│  │         }                                         │  │
│  │     }                                             │  │
│  │     ↓                                             │  │
│  │ 13. Calculate pitch                              │  │
│  │     pitch = maxIndex * sampleRate / FFTSize      │  │
│  │     ↓                                             │  │
│  │ 14. Store in database                            │  │
│  │     INSERT INTO recordings (file_path, pitch_hz) │  │
│  │     ↓                                             │  │
│  │ 15. Return metadata                              │  │
│  │     {id, pitch_hz, created_at}                   │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                        ↓ JSON response
┌─────────────────────────────────────────────────────────┐
│                     Frontend                             │
│  ┌───────────────────────────────────────────────────┐  │
│  │ 16. Update UI                                     │  │
│  │     - Add to recordings list                      │  │
│  │     - Update pitch history graph                  │  │
│  │     - Refresh statistics                          │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### Real-Time Pitch Detection (Frontend)
```
┌─────────────────────────────────────────────┐
│          useRealtimePitch Hook              │
├─────────────────────────────────────────────┤
│ 1. Initialize Web Audio API                │
│    audioContext = new AudioContext()       │
│    ↓                                        │
│ 2. Create AnalyserNode                     │
│    analyser = audioContext.createAnalyser()│
│    ↓                                        │
│ 3. Connect microphone stream               │
│    source = audioContext                   │
│      .createMediaStreamSource(stream)      │
│    source.connect(analyser)                │
│    ↓                                        │
│ 4. Animation loop                          │
│    requestAnimationFrame(detectPitch)      │
│    ↓                                        │
│ 5. Get frequency data                      │
│    analyser.getFloatTimeDomainData(buffer) │
│    ↓                                        │
│ 6. Autocorrelation algorithm               │
│    - Find fundamental frequency            │
│    - Return pitch in Hz                    │
│    ↓                                        │
│ 7. Update state                            │
│    setPitch(detectedPitch)                 │
│    ↓                                        │
│ 8. Component re-renders                    │
│    <PitchMeter pitch={pitch} />            │
└─────────────────────────────────────────────┘
```

---

## Data Flow Diagrams

### Complete User Journey
```
┌──────────────────────────────────────────────────────────────┐
│                    1. Registration                            │
│  User → Register Form → POST /auth/register                  │
│         → Hash Password → Insert DB → Auto-Login             │
└──────────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────────┐
│                      2. Login                                 │
│  User → Login Form → POST /auth/login                        │
│         → Verify Password → Generate JWT → Set Cookie        │
│         → Store in authStore → Redirect to Dashboard         │
└──────────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────────┐
│                  3. Dashboard Access                          │
│  Dashboard Route → ProtectedRoute → Check authStore          │
│                  → GET /auth/me → Return User Data           │
│                  → Render Dashboard                           │
└──────────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────────┐
│                   4. Record Audio                             │
│  Click Record → Request Mic → MediaRecorder                  │
│               → Capture Chunks → Create Blob                 │
│               → POST /recordings/upload                       │
└──────────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────────┐
│                  5. Process Audio                             │
│  Save File → Transcode (FFmpeg) → Detect Pitch (FFT)        │
│            → Store in DB → Return Metadata                    │
└──────────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────────┐
│                 6. Visualize Progress                         │
│  GET /recordings → Fetch History → Render Graph             │
│                  → Calculate Stats → Display Dashboard       │
└──────────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────────┐
│                    7. Logout                                  │
│  Click Logout → POST /auth/logout → Clear Cookie            │
│                → Clear authStore → Redirect to Login         │
└──────────────────────────────────────────────────────────────┘
```

---

## Integration Points

### External Services & APIs

#### 1. Browser APIs
- **MediaDevices API**: Microphone access for recording
- **MediaRecorder API**: Audio capture
- **Web Audio API**: Real-time pitch detection
- **Canvas API**: Audio visualization
- **Local Storage**: Token persistence

#### 2. External Binaries
- **FFmpeg**: Audio transcoding (WebM/MP3 → WAV)
- Installed system-wide or via Docker

#### 3. Database Connections
- **PostgreSQL**: Application data (pgx driver)
- **Redis**: Caching and sessions (future)

#### 4. Future Integrations
- **Cloud Storage**: AWS S3, Cloudflare R2 for audio files
- **CDN**: Cloudflare for static assets
- **Analytics**: Google Analytics, Mixpanel
- **Error Tracking**: Sentry
- **Monitoring**: Datadog, New Relic

---

## Deployment Architecture

### Local Development
```
┌────────────────────────────────────────────┐
│           Docker Host (macOS/Linux)        │
│  ┌──────────────────────────────────────┐  │
│  │  docker-compose.yml                  │  │
│  │  ├─ postgres:15-alpine               │  │
│  │  │  └─ Port 5432                     │  │
│  │  └─ redis:7-alpine                   │  │
│  │     └─ Port 6379                     │  │
│  └──────────────────────────────────────┘  │
└────────────────────────────────────────────┘
           ↑                    ↑
           │                    │
   ┌───────┴──────┐     ┌──────┴───────┐
   │ Go Backend   │     │  React       │
   │ Port 8080    │     │  Frontend    │
   │ (Air reload) │     │  Port 5173   │
   │              │     │ (Vite HMR)   │
   └──────────────┘     └──────────────┘
```

### Production Architecture (Future)
```
┌──────────────────────────────────────────────────────────────┐
│                      Users (Global)                           │
└───────────────────────────┬──────────────────────────────────┘
                            ↓ HTTPS
┌──────────────────────────────────────────────────────────────┐
│              Cloudflare (CDN + DDoS Protection)              │
│              ├─ DNS                                          │
│              ├─ SSL/TLS Termination                          │
│              ├─ Caching                                      │
│              └─ WAF (Web Application Firewall)               │
└───────────────────────┬──────────────────────────────────────┘
                        ↓
        ┌───────────────┴────────────────┐
        │                                │
        ↓ Static Assets                 ↓ API Requests
┌─────────────────┐              ┌─────────────────────────────┐
│ Cloudflare Pages│              │    Load Balancer (Fly.io)   │
│ - React Build   │              │    ├─ Health checks         │
│ - JS/CSS/Images │              │    ├─ SSL termination       │
│ - Global CDN    │              │    └─ Round-robin           │
└─────────────────┘              └──────────┬──────────────────┘
                                            ↓
                          ┌─────────────────┴─────────────────┐
                          │                                   │
                    ┌─────▼──────┐                    ┌───────▼──────┐
                    │ Backend #1 │                    │ Backend #2   │
                    │ (Go + Gin) │                    │ (Go + Gin)   │
                    │ Region: US │                    │ Region: EU   │
                    └─────┬──────┘                    └──────┬───────┘
                          │                                  │
                          └────────────┬─────────────────────┘
                                       ↓
                    ┌──────────────────────────────────────┐
                    │    Managed PostgreSQL (Primary)      │
                    │    ├─ Auto-backups (daily)           │
                    │    ├─ Point-in-time recovery         │
                    │    └─ Read replicas (future)         │
                    └──────────────────────────────────────┘
                                       ↓
                    ┌──────────────────────────────────────┐
                    │         Redis Cluster                │
                    │    ├─ Session storage                │
                    │    ├─ Rate limiting                  │
                    │    └─ Cache layer                    │
                    └──────────────────────────────────────┘
                                       ↓
                    ┌──────────────────────────────────────┐
                    │    Cloudflare R2 (Object Storage)    │
                    │    ├─ Audio recordings               │
                    │    └─ User uploads                   │
                    └──────────────────────────────────────┘
```

### Scaling Considerations
1. **Horizontal Scaling**: Multiple backend instances behind load balancer
2. **Database Scaling**: Read replicas for read-heavy queries
3. **Cache Layer**: Redis for session and frequently accessed data
4. **CDN**: Cloudflare for static assets and edge caching
5. **Object Storage**: Separate audio files from application servers
6. **Region Distribution**: Multi-region deployment for low latency

---

## Conclusion

Voice Training App follows a well-architected, scalable design:
- **Clear layer separation**: Frontend, backend, data tiers
- **Modern tech stack**: React, Go, PostgreSQL, Redis
- **Security-first**: JWT, bcrypt, CORS, input validation
- **Performance optimized**: Connection pooling, indexes, caching
- **Scalable architecture**: Horizontal scaling, load balancing
- **Developer-friendly**: Docker, hot-reload, comprehensive docs

The architecture supports current features while enabling future growth through modular design and proven patterns.

---

**Last Updated**: 2025-11-24
**Version**: 1.0
**Status**: Production-Ready Architecture
