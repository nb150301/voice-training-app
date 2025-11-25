# Voice Training App - Codebase Summary

## Table of Contents
1. [Overview](#overview)
2. [Repository Statistics](#repository-statistics)
3. [Directory Structure](#directory-structure)
4. [Backend Components](#backend-components)
5. [Frontend Components](#frontend-components)
6. [Key Files](#key-files)
7. [Dependencies](#dependencies)
8. [Entry Points](#entry-points)
9. [Data Flow](#data-flow)

---

## Overview

Voice Training App is a full-stack web application built with a modern tech stack:
- **Backend**: Go (Gin framework) with PostgreSQL and Redis
- **Frontend**: React 18 with TypeScript, Vite, and Tailwind CSS
- **Architecture**: RESTful API with JWT authentication
- **Infrastructure**: Docker Compose for local development

**Codebase Size** (from repomix analysis):
- Total Files: 74 files
- Total Tokens: ~151,716 tokens
- Total Characters: ~623,053 chars
- Lines of Code: ~18,000 lines

---

## Repository Statistics

### Language Distribution
- **TypeScript/TSX**: ~65% (Frontend components, pages, hooks, utilities)
- **Go**: ~25% (Backend API, auth, database, audio processing)
- **SQL**: ~3% (Database migrations)
- **Configuration**: ~7% (JSON, YAML, Markdown)

### Top Files by Size (tokens)
1. `frontend/src/components/CollaborativePractice.tsx` - 7,510 tokens
2. `frontend/src/components/AISongAnalysis.tsx` - 7,276 tokens
3. `frontend/src/components/CommunityFeed.tsx` - 7,184 tokens
4. `frontend/src/components/VocalHealthMonitor.tsx` - 7,067 tokens
5. `frontend/src/components/OnboardingFlow.tsx` - 6,782 tokens

### Code Organization
- **Modular Architecture**: Clear separation between frontend and backend
- **Component-Based**: React components organized by feature
- **Layered Backend**: API handlers → Business logic → Data access
- **Type Safety**: TypeScript for frontend, Go's type system for backend

---

## Directory Structure

```
voice-training-app/
├── backend/                     # Go backend server
│   ├── cmd/
│   │   └── server/
│   │       └── main.go          # Server entry point
│   ├── internal/                # Internal packages
│   │   ├── api/                 # HTTP handlers
│   │   │   ├── auth_handler.go  # Authentication endpoints
│   │   │   └── recordings_handler.go  # Recording endpoints
│   │   ├── audio/               # Audio processing
│   │   │   └── processor.go     # FFmpeg, pitch detection
│   │   ├── auth/                # Authentication logic
│   │   │   └── jwt.go           # JWT token generation/validation
│   │   ├── database/            # Database connection
│   │   │   └── db.go            # PostgreSQL pool management
│   │   ├── middleware/          # HTTP middleware
│   │   │   └── auth.go          # JWT authentication middleware
│   │   └── models/              # Data models
│   │       ├── user.go          # User model and DTOs
│   │       └── recording.go     # Recording model
│   ├── migrations/              # SQL schema migrations
│   │   ├── 001_initial_schema.sql    # Users, sessions tables
│   │   └── 002_recordings.sql        # Recordings table
│   ├── uploads/                 # Audio file storage
│   │   ├── recordings/          # Original uploads
│   │   └── processed/           # Transcoded WAV files
│   ├── go.mod                   # Go module dependencies
│   └── .air.toml                # Hot-reload configuration
│
├── frontend/                    # React frontend
│   ├── public/                  # Static assets
│   │   └── vite.svg
│   ├── src/
│   │   ├── assets/              # Images, fonts
│   │   │   └── react.svg
│   │   ├── components/          # React components
│   │   │   ├── ProtectedRoute.tsx        # Auth route guard
│   │   │   ├── AudioRecorder.tsx         # Audio recording UI
│   │   │   ├── RealtimePitchMeter.tsx    # Live pitch visualization
│   │   │   ├── PitchHistoryGraph.tsx     # Historical pitch chart
│   │   │   ├── PitchStatistics.tsx       # Statistical dashboard
│   │   │   ├── PitchFeedback.tsx         # Real-time feedback
│   │   │   ├── TargetPitchSettings.tsx   # Target configuration
│   │   │   ├── AdvancedAnalytics.tsx     # Comprehensive analytics
│   │   │   ├── Achievements.tsx          # Achievement system
│   │   │   ├── SocialProfile.tsx         # User profiles
│   │   │   ├── CommunityFeed.tsx         # Activity stream
│   │   │   ├── CollaborativePractice.tsx # Group sessions
│   │   │   ├── MLRecommendations.tsx     # AI suggestions
│   │   │   ├── AIVoiceCoach.tsx          # AI coaching
│   │   │   ├── AISongAnalysis.tsx        # Music analysis
│   │   │   ├── VocalHealthMonitor.tsx    # Health tracking
│   │   │   ├── OnboardingFlow.tsx        # User onboarding
│   │   │   ├── LearningPath.tsx          # Adaptive paths
│   │   │   ├── PracticeModes.tsx         # Practice variations
│   │   │   ├── ExerciseBuilder.tsx       # Custom exercises
│   │   │   └── UserProfileManager.tsx    # Profile management
│   │   ├── hooks/               # Custom React hooks
│   │   │   ├── useAudioRecorder.ts       # Recording logic
│   │   │   ├── useRealtimePitch.ts       # Pitch detection
│   │   │   └── useAudioVisualizer.ts     # Waveform rendering
│   │   ├── lib/                 # Utility libraries
│   │   │   ├── api.ts           # Axios HTTP client
│   │   │   ├── pitch.ts         # Pitch conversion utils
│   │   │   ├── pitchDetection.ts         # Client-side detection
│   │   │   ├── audioProcessor.ts         # Audio processing
│   │   │   ├── feedback.ts      # Feedback logic
│   │   │   └── temporalFilters.ts        # Smoothing algorithms
│   │   ├── pages/               # Page components
│   │   │   ├── Login.tsx        # Login page
│   │   │   ├── Register.tsx     # Registration page
│   │   │   ├── Dashboard.tsx    # Enhanced main dashboard
│   │   │   └── Dashboard-simple.tsx      # Simplified dashboard
│   │   ├── stores/              # State management
│   │   │   └── authStore.ts     # Zustand auth store
│   │   ├── App.tsx              # Root application component
│   │   ├── main.tsx             # React DOM entry point
│   │   ├── App.css              # Global styles
│   │   └── index.css            # Tailwind directives
│   ├── index.html               # HTML entry point
│   ├── package.json             # npm dependencies
│   ├── tsconfig.json            # TypeScript configuration
│   ├── vite.config.ts           # Vite build configuration
│   ├── tailwind.config.js       # Tailwind CSS configuration
│   └── eslint.config.js         # ESLint configuration
│
├── docs/                        # Documentation
│   ├── INDEX.md                 # Documentation index
│   ├── API.md                   # API reference
│   ├── ARCHITECTURE.md          # System architecture
│   ├── DEVELOPMENT.md           # Development guidelines
│   ├── SETUP.md                 # Setup instructions
│   ├── TROUBLESHOOTING.md       # Problem solving
│   ├── project-overview-pdr.md  # Project overview & PDR
│   ├── codebase-summary.md      # This file
│   ├── code-standards.md        # Coding standards
│   └── system-architecture.md   # Architecture details
│
├── .claude/                     # Claude Code configuration
│   └── .env.example             # Environment template
│
├── docker-compose.yml           # Docker services config
├── Makefile                     # Development commands
├── README.md                    # Main project README
├── .env.example                 # Environment variables template
├── .gitignore                   # Git ignore patterns
├── .repomixignore              # Repomix ignore patterns
└── CLAUDE.md                    # Claude Code instructions
```

---

## Backend Components

### Entry Point
**File**: `backend/cmd/server/main.go`
- Initializes Gin router
- Loads environment variables
- Connects to PostgreSQL and Redis
- Configures CORS middleware
- Registers API routes
- Starts HTTP server on port 8080

### API Handlers (`backend/internal/api/`)

#### `auth_handler.go`
Handles user authentication endpoints:
- `Register()` - Create new user account
  - Validates email format
  - Checks for existing email
  - Hashes password with bcrypt (cost 12)
  - Inserts user into database
  - Returns user object

- `Login()` - Authenticate user
  - Queries user by email
  - Verifies password hash
  - Generates JWT token
  - Sets httpOnly cookie
  - Returns token in response

- `Me()` - Get current user
  - Validates JWT from middleware
  - Fetches user by ID
  - Returns user profile

- `Logout()` - Clear session
  - Clears httpOnly cookie
  - Returns success response

#### `recordings_handler.go`
Manages audio recording operations:
- `UploadRecording()` - Handle audio file upload
  - Accepts multipart form data
  - Validates file type and size
  - Saves to uploads/recordings/
  - Processes with FFmpeg
  - Detects pitch with FFT
  - Stores metadata in database

- `GetRecordings()` - List user recordings
  - Fetches recordings by user_id
  - Returns paginated results
  - Includes pitch data

- `DeleteRecording()` - Remove recording
  - Deletes file from filesystem
  - Removes database entry

### Audio Processing (`backend/internal/audio/`)

#### `processor.go`
Audio transcoding and pitch detection:
- **Constants**:
  - SampleRate: 44100 Hz
  - MinPitchHz: 50.0 Hz (low bass)
  - MaxPitchHz: 500.0 Hz (high voice)
  - FFTSize: 8192 (FFT window)

- **TranscodeToWAV()** - Convert audio to WAV
  - Uses FFmpeg subprocess
  - Outputs 44.1kHz mono WAV
  - Saves to uploads/processed/

- **DetectPitch()** - Analyze pitch from WAV
  - Reads WAV file samples
  - Applies Hamming window
  - Performs FFT (Fast Fourier Transform)
  - Finds dominant frequency in voice range
  - Returns pitch in Hz

- **ProcessAudioFile()** - Complete pipeline
  - Transcodes input to WAV
  - Detects pitch
  - Returns WAV path and pitch value

### Authentication (`backend/internal/auth/`)

#### `jwt.go`
JWT token management:
- **Claims struct** - Token payload
  - UserID: string (UUID)
  - Email: string
  - RegisteredClaims: expiration, issued at

- **GenerateToken()** - Create JWT
  - Uses HS256 algorithm
  - 24-hour expiration
  - Signed with JWT_SECRET

- **ValidateToken()** - Verify JWT
  - Parses token string
  - Validates signature
  - Checks expiration
  - Returns claims

### Database (`backend/internal/database/`)

#### `db.go`
PostgreSQL connection management:
- **Connect()** - Initialize connection pool
  - Parses DATABASE_URL
  - Creates pgx connection pool
  - Pings database for health check
  - Stores in global DB variable

- **Close()** - Cleanup connections
  - Closes connection pool

### Middleware (`backend/internal/middleware/`)

#### `auth.go`
JWT authentication middleware:
- **AuthRequired()** - Protect routes
  - Checks Authorization header
  - Falls back to cookie
  - Validates JWT token
  - Extracts user_id and email
  - Sets in Gin context
  - Returns 401 if invalid

### Models (`backend/internal/models/`)

#### `user.go`
User data structures:
- **User struct** - Database model
  - ID (UUID)
  - Email (string)
  - PasswordHash (string)
  - Timestamps
  - StreakCount, TotalXP, Level (gamification)

- **RegisterRequest** - Registration DTO
- **LoginRequest** - Login DTO
- **APIResponse** - Response wrapper

#### `recording.go`
Recording data structures:
- **Recording struct**
  - ID (UUID)
  - UserID (UUID, foreign key)
  - FilePath (string)
  - OriginalFilename (string)
  - Duration (float)
  - FileSize (int64)
  - PitchHz (float, nullable)
  - Timestamps

### Migrations (`backend/migrations/`)

#### `001_initial_schema.sql`
Initial database schema:
- **users table**
  - Primary key: UUID
  - Unique email index
  - Gamification fields (streak, XP, level)

- **sessions table**
  - Foreign key to users
  - Practice session metadata
  - Index on user_id and created_at

#### `002_recordings.sql`
Recordings table:
- Foreign key to users (cascade delete)
- File metadata (path, size, duration)
- Pitch analysis result
- Indexes for queries

---

## Frontend Components

### Entry Points

#### `frontend/src/main.tsx`
React application bootstrap:
- Imports React and ReactDOM
- Renders root App component
- Mounts to `#root` element

#### `frontend/src/App.tsx`
Root application component:
- **BrowserRouter** - Client-side routing
- **Routes** - Route definitions
  - `/login` → Login page
  - `/register` → Register page
  - `/dashboard` → Enhanced dashboard (protected)
  - `/dashboard-simple` → Simple dashboard (protected)
  - `/` → Redirects to dashboard

- **ProtectedRoute** - Auth guard wrapper

### Pages (`frontend/src/pages/`)

#### `Login.tsx`
User login interface:
- Email/password form
- Form validation
- API call to /auth/login
- Stores JWT in authStore
- Redirects to dashboard
- Error handling and display

#### `Register.tsx`
User registration interface:
- Email/password/confirm form
- Client-side validation
- API call to /auth/register
- Auto-login after registration
- Error handling

#### `Dashboard.tsx`
Enhanced main dashboard:
- User profile section
- Audio recorder component
- Real-time pitch meter
- Pitch history graph
- Statistics dashboard
- Advanced analytics
- Community features
- AI recommendations
- Vocal health monitoring

#### `Dashboard-simple.tsx`
Simplified dashboard:
- Basic user info
- Recording functionality
- Simple statistics
- Fallback for compatibility

### Components (`frontend/src/components/`)

#### Core Components

**ProtectedRoute.tsx**
- Checks authentication state
- Redirects to /login if not authenticated
- Wraps protected page components

**AudioRecorder.tsx**
- MediaRecorder API integration
- Record button with timer
- Stop recording and upload
- Progress indicator
- Error handling
- Recording list display

#### Visualization Components

**RealtimePitchMeter.tsx**
- Live pitch display during recording
- Visual meter with color zones
- Target pitch indicator
- Smooth animations

**PitchHistoryGraph.tsx**
- Line chart of pitch over time
- Time range selector (7/30/90 days)
- Zoom and pan controls
- Target zone overlay

**PitchStatistics.tsx**
- Statistical summary (mean, median, mode)
- Standard deviation
- Min/max values
- Distribution histogram

**AdvancedAnalytics.tsx**
- Comprehensive progress dashboard
- Multi-dimensional charts
- Trend analysis
- Goal tracking

#### Feedback & Settings

**PitchFeedback.tsx**
- Real-time feedback messages
- Color-coded guidance
- Improvement suggestions

**TargetPitchSettings.tsx**
- Configure target pitch range
- Preset options (deep voice, average, high)
- Custom range input
- Visual preview

#### Social Features

**SocialProfile.tsx**
- User profile cards
- Avatar display
- Stats showcase
- Follow/unfollow buttons

**CommunityFeed.tsx**
- Activity stream
- Progress posts
- Achievement celebrations
- Social interactions

**CollaborativePractice.tsx**
- Group practice rooms
- Real-time synchronization
- Peer encouragement
- Shared progress

#### AI & Personalization

**MLRecommendations.tsx**
- AI-powered exercise suggestions
- Personalized learning paths
- Progress-based adaptation

**AIVoiceCoach.tsx**
- Contextual coaching tips
- Voice analysis insights
- Technique recommendations

**AISongAnalysis.tsx**
- Music/song pitch analysis
- Practice material suggestions
- Difficulty assessment

**VocalHealthMonitor.tsx**
- Usage pattern tracking
- Rest recommendations
- Strain detection
- Recovery guidance

#### Gamification

**Achievements.tsx**
- Achievement badge display
- Progress towards unlocks
- Milestone celebrations

**OnboardingFlow.tsx**
- New user tutorial
- Feature introduction
- Initial goal setting
- Voice baseline assessment

#### Advanced Features

**LearningPath.tsx**
- Adaptive curriculum
- Skill tree visualization
- Prerequisite management

**PracticeModes.tsx**
- Different practice types
- Guided vs free practice
- Challenge modes

**ExerciseBuilder.tsx**
- Custom exercise creation
- Template library
- Sharing and remixing

**UserProfileManager.tsx**
- Profile editing
- Avatar upload
- Privacy settings
- Account management

### Hooks (`frontend/src/hooks/`)

#### `useAudioRecorder.ts`
Custom hook for audio recording:
- MediaRecorder initialization
- Start/stop recording
- Audio stream management
- Blob creation
- Cleanup on unmount

#### `useRealtimePitch.ts`
Real-time pitch detection hook:
- Web Audio API setup
- AnalyserNode configuration
- FFT-based pitch detection
- Continuous pitch updates
- Animation frame management

#### `useAudioVisualizer.ts`
Audio waveform visualization:
- Canvas rendering
- Waveform drawing
- Color gradients
- Animation loop

### Libraries (`frontend/src/lib/`)

#### `api.ts`
Axios HTTP client configuration:
- Base URL from environment
- withCredentials for cookies
- Request interceptors (add headers)
- Response interceptors (error handling)
- Auto-logout on 401

#### `pitch.ts`
Pitch conversion utilities:
- hzToNote() - Convert Hz to musical note
- noteToHz() - Convert note to Hz
- getPitchColor() - Color code by range
- formatPitch() - Display formatting

#### `pitchDetection.ts`
Client-side pitch detection:
- Autocorrelation algorithm
- YIN algorithm implementation
- Real-time processing
- Confidence scoring

#### `audioProcessor.ts`
Audio processing utilities:
- Audio buffer manipulation
- Filtering and smoothing
- Format conversions
- Gain control

#### `feedback.ts`
Feedback generation logic:
- Analyze pitch deviation
- Generate contextual messages
- Determine feedback color/tone

#### `temporalFilters.ts`
Signal smoothing algorithms:
- Moving average filter
- Exponential smoothing
- Median filter
- Kalman filter (advanced)

### State Management (`frontend/src/stores/`)

#### `authStore.ts`
Zustand authentication store:
- **State**:
  - token: string | null
  - user: User | null
  - isAuthenticated: boolean

- **Actions**:
  - login(email, password)
  - register(email, password)
  - logout()
  - setUser(user)

- **Persistence**:
  - Token stored in localStorage
  - Auto-rehydration on load

---

## Key Files

### Configuration Files

#### `package.json` (Frontend)
Dependencies:
- **Production**:
  - react: ^19.2.0
  - react-dom: ^19.2.0
  - react-router-dom: ^7.9.6
  - axios: ^1.13.2
  - zustand: ^5.0.8
  - recharts: ^3.4.1

- **Dev Dependencies**:
  - vite: ^7.2.2
  - typescript: ~5.9.3
  - @tailwindcss/vite: ^4.1.17
  - eslint: ^9.39.1

#### `go.mod` (Backend)
Dependencies:
- github.com/gin-gonic/gin: v1.11.0
- github.com/gin-contrib/cors: v1.7.6
- github.com/golang-jwt/jwt/v5: v5.3.0
- github.com/jackc/pgx/v5: v5.7.6
- github.com/joho/godotenv: v1.5.1
- golang.org/x/crypto: v0.44.0
- github.com/mjibson/go-dsp: (for FFT)

#### `docker-compose.yml`
Services:
- **postgres**: PostgreSQL 15-alpine
  - Port: 5432
  - Database: voice_training
  - User: dev / dev_password

- **redis**: Redis 7-alpine
  - Port: 6379
  - Persistence: AOF

#### `Makefile`
Development commands:
- `make dev` - Start Docker + migrations
- `make backend` - Run Go server
- `make frontend` - Run React dev server
- `make migrate` - Run SQL migrations
- `make test` - Run all tests
- `make clean` - Clean build artifacts

#### `vite.config.ts`
Vite configuration:
- React plugin
- Port: 5173
- Proxy: /api → http://localhost:8080
- Hot module replacement

#### `tailwind.config.js`
Tailwind CSS configuration:
- Content: src/**/*.{js,ts,jsx,tsx}
- Theme extensions
- Custom colors and utilities

#### `tsconfig.json`
TypeScript configuration:
- Strict mode enabled
- Target: ES2020
- Module: ESNext
- JSX: react-jsx
- Path aliases (@/)

### Documentation Files

All in `docs/` directory:
- **INDEX.md** - Documentation hub
- **API.md** - Complete API reference
- **ARCHITECTURE.md** - System design
- **DEVELOPMENT.md** - Coding standards
- **SETUP.md** - Getting started
- **TROUBLESHOOTING.md** - Common issues
- **project-overview-pdr.md** - Product requirements
- **codebase-summary.md** - This file
- **code-standards.md** - Style guide
- **system-architecture.md** - Architecture details

---

## Dependencies

### Backend Dependencies (Go)

#### Core Framework
- **gin-gonic/gin**: Fast HTTP web framework
- **gin-contrib/cors**: CORS middleware

#### Authentication
- **golang-jwt/jwt/v5**: JWT token generation/validation
- **golang.org/x/crypto**: bcrypt password hashing

#### Database
- **jackc/pgx/v5**: PostgreSQL driver and connection pooling

#### Audio Processing
- **mjibson/go-dsp**: FFT and digital signal processing
- **mjibson/go-dsp/wav**: WAV file parsing
- FFmpeg (external binary)

#### Utilities
- **joho/godotenv**: Environment variable loading

### Frontend Dependencies (React)

#### Core Framework
- **react**: UI library (v19.2.0)
- **react-dom**: DOM rendering
- **react-router-dom**: Client-side routing

#### State & Data
- **zustand**: Lightweight state management
- **axios**: HTTP client

#### Visualization
- **recharts**: Chart library for React

#### Styling
- **tailwindcss**: Utility-first CSS framework
- **@tailwindcss/vite**: Vite integration

#### Development
- **vite**: Build tool and dev server
- **typescript**: Type safety
- **eslint**: Code linting

---

## Entry Points

### Backend Entry Point
**File**: `backend/cmd/server/main.go`

**Flow**:
1. Load environment variables (.env)
2. Connect to PostgreSQL (database.Connect())
3. Initialize Gin router
4. Configure CORS middleware
5. Register routes:
   - GET /health
   - POST /api/v1/auth/register
   - POST /api/v1/auth/login
   - GET /api/v1/auth/me (protected)
   - POST /api/v1/auth/logout
   - POST /api/v1/recordings/upload (protected)
   - GET /api/v1/recordings (protected)
6. Start server on :8080

### Frontend Entry Point
**File**: `frontend/src/main.tsx`

**Flow**:
1. Import React and ReactDOM
2. Import root App component
3. Import global styles (index.css)
4. Render App into #root element
5. Enable StrictMode

**HTML Entry**: `frontend/index.html`
- Contains #root div
- Vite script tag
- Meta tags for viewport, charset

---

## Data Flow

### User Registration Flow
```
User Input → Register.tsx
    ↓
API call: POST /api/v1/auth/register
    ↓
auth_handler.go: Register()
    ├─ Validate email format
    ├─ Check email doesn't exist (DB query)
    ├─ Hash password (bcrypt cost 12)
    ├─ Insert user into database
    └─ Return user object (201 Created)
    ↓
Frontend: Auto-login → Dashboard
```

### Login Flow
```
User Input → Login.tsx
    ↓
API call: POST /api/v1/auth/login
    ↓
auth_handler.go: Login()
    ├─ Query user by email
    ├─ Verify password hash
    ├─ Generate JWT token (auth.GenerateToken())
    ├─ Set httpOnly cookie
    └─ Return token (200 OK)
    ↓
Frontend: authStore.setUser()
    ↓
Redirect to /dashboard
```

### Audio Recording Flow
```
User clicks Record → AudioRecorder.tsx
    ↓
useAudioRecorder hook
    ├─ Request microphone permission
    ├─ Create MediaRecorder
    ├─ Start recording
    └─ Capture audio chunks
    ↓
User clicks Stop
    ↓
Create Blob from chunks
    ↓
Upload: POST /api/v1/recordings/upload
    ↓
recordings_handler.go: UploadRecording()
    ├─ Save file to uploads/recordings/
    ├─ Transcode to WAV (FFmpeg)
    ├─ Detect pitch (FFT analysis)
    ├─ Store in database (file path, pitch)
    └─ Return recording metadata
    ↓
Frontend: Update recordings list
    ↓
Display in PitchHistoryGraph, PitchStatistics
```

### Real-Time Pitch Detection Flow
```
Recording active → useRealtimePitch hook
    ↓
Web Audio API
    ├─ Create AudioContext
    ├─ Create AnalyserNode
    ├─ Connect to microphone stream
    └─ Get frequency data
    ↓
pitchDetection.ts: detectPitch()
    ├─ Autocorrelation algorithm
    ├─ Find fundamental frequency
    └─ Return pitch in Hz
    ↓
RealtimePitchMeter.tsx
    └─ Update visual meter
```

### Protected Route Access
```
User visits /dashboard
    ↓
ProtectedRoute component
    ├─ Check authStore.isAuthenticated
    ├─ If false → redirect to /login
    └─ If true → render Dashboard
    ↓
Dashboard API calls
    ├─ GET /api/v1/auth/me
    │   ├─ Authorization: Bearer <token>
    │   ├─ middleware.AuthRequired()
    │   ├─ Validate JWT
    │   └─ Return user data
    └─ GET /api/v1/recordings
        ├─ Authorization header
        ├─ Query recordings by user_id
        └─ Return recordings array
```

---

## Conclusion

Voice Training App is a well-structured, modern full-stack application with:
- **Clear separation of concerns**: Backend API, frontend UI
- **Type safety**: TypeScript frontend, Go backend
- **Modular architecture**: Components, hooks, utilities
- **Comprehensive features**: Auth, audio recording, pitch detection, visualization
- **Developer-friendly**: Hot reload, documentation, standardized structure
- **Scalable design**: Connection pooling, state management, component reusability

The codebase follows industry best practices with clear naming conventions, proper error handling, and extensive documentation.

---

**Generated from repomix analysis**
**Total Files**: 74
**Total Lines**: ~18,000
**Last Updated**: 2025-11-24
