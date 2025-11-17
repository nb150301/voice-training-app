# Voice Training App - Documentation Index

Complete guide to all project documentation. Start here for navigation.

## Quick Navigation

### For New Developers
1. **Start here:** [SETUP.md](./SETUP.md) - Complete setup guide
2. **Understand structure:** [ARCHITECTURE.md](./ARCHITECTURE.md) - Project structure & design
3. **Learn standards:** [DEVELOPMENT.md](./DEVELOPMENT.md) - Code guidelines & practices
4. **Troubleshoot:** [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - Common issues & solutions

### For API Integration
1. **API Reference:** [API.md](./API.md) - All endpoints with examples
2. **Data Models:** [ARCHITECTURE.md#database-schema](./ARCHITECTURE.md#database-schema) - Table structures
3. **Error Handling:** [API.md#error-codes--messages](./API.md#error-codes--messages) - Error responses

### For Feature Development
1. **Architecture:** [ARCHITECTURE.md](./ARCHITECTURE.md) - System design
2. **Development Guide:** [DEVELOPMENT.md](./DEVELOPMENT.md) - Code standards & testing
3. **API Contracts:** [API.md#api-contracts](./API.md#api-contracts) - Request/response formats

### For DevOps/Deployment
1. **Setup Guide:** [SETUP.md](./SETUP.md) - Local development setup
2. **Architecture:** [ARCHITECTURE.md#deployment-architecture-future](./ARCHITECTURE.md#deployment-architecture-future) - Production deployment
3. **Troubleshooting:** [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - Docker & environment issues

---

## Documentation Files

### [SETUP.md](./SETUP.md) - Getting Started ⚡
**For:** New developers, setup troubleshooting
**Contains:**
- Prerequisites check (Docker, Node, Go, PostgreSQL)
- Step-by-step installation
- Development workflow
- Common setup issues
- IDE setup (VS Code, JetBrains)
- Makefile command reference
- Quick troubleshooting checklist

**Start here if:** You're setting up for first time

---

### [API.md](./API.md) - API Reference 📡
**For:** Frontend developers, API integration, testing
**Contains:**
- Complete endpoint documentation
- Request/response examples
- HTTP status codes
- Error codes & messages
- Data type definitions
- JWT token structure
- CORS configuration
- SDK examples (JavaScript, Go, cURL)
- Testing the API

**Use this for:** Building features that integrate with backend

---

### [ARCHITECTURE.md](./ARCHITECTURE.md) - System Design 🏗️
**For:** Understanding codebase structure, design decisions
**Contains:**
- Complete project structure tree
- Technology stack details
- Architectural patterns (layered, handler, middleware)
- Data flow diagrams (registration, login, protected routes)
- Database schema (users, sessions tables)
- Backend layer breakdown
- Frontend component architecture
- Security architecture
- Error handling strategy
- Environment configuration
- Performance considerations
- Deployment architecture

**Use this for:** Understanding how system works

---

### [DEVELOPMENT.md](./DEVELOPMENT.md) - Development Standards 💻
**For:** Writing code, contributing features, code reviews
**Contains:**
- Go code standards (formatting, naming, error handling)
- TypeScript/React best practices (hooks, types, components)
- Git workflow & branch naming
- Commit message conventions
- Testing requirements (unit, integration, E2E)
- Performance guidelines
- Security practices (input validation, secrets)
- Documentation requirements
- Code review checklist
- Useful commands

**Use this for:** Maintaining code quality

---

### [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - Problem Solving 🔧
**For:** Debugging issues, resolving errors
**Contains:**
- Docker issues (won't start, container problems)
- Database connection errors
- Backend server issues
- Frontend problems
- Network & CORS issues
- Authentication problems
- Performance troubleshooting
- Environment configuration issues
- Cross-platform issues (Linux vs macOS)
- Debugging tips
- Log viewing and debugging commands

**Use this for:** Resolving errors & issues

---

## Documentation Structure Map

```
docs/
├── INDEX.md                    # This file (navigation hub)
├── SETUP.md                    # Getting started & installation
├── API.md                      # Complete API reference
├── ARCHITECTURE.md             # System design & structure
├── DEVELOPMENT.md              # Code standards & practices
└── TROUBLESHOOTING.md          # Problem solving guide
```

---

## Common Tasks & Where to Find Answers

### "I'm new and want to get running"
→ **[SETUP.md](./SETUP.md)** - Follow step-by-step instructions

### "I need to call an API endpoint"
→ **[API.md](./API.md)** - Find endpoint, request/response format, examples

### "I want to understand the codebase"
→ **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Read project structure, design decisions

### "I'm writing code and need standards"
→ **[DEVELOPMENT.md](./DEVELOPMENT.md)** - Learn code guidelines, testing, security

### "Something's broken, what do I do?"
→ **[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)** - Find your error, try solutions

### "What are the database tables?"
→ **[ARCHITECTURE.md#database-schema](./ARCHITECTURE.md#database-schema)** - View schemas

### "What's the authentication flow?"
→ **[ARCHITECTURE.md#data-flow](./ARCHITECTURE.md#data-flow)** - See registration & login flows

### "How do I run tests?"
→ **[DEVELOPMENT.md#testing-requirements](./DEVELOPMENT.md#testing-requirements)** - Test commands & patterns

### "What are the deployment targets?"
→ **[ARCHITECTURE.md#deployment-architecture-future](./ARCHITECTURE.md#deployment-architecture-future)** - Production setup

### "Port 8080 is already in use"
→ **[TROUBLESHOOTING.md#port-already-in-use](./TROUBLESHOOTING.md#port-already-in-use)** - Solution

---

## Phase 1 Status

✅ **Complete**

**Implemented:**
- Authentication system (register, login, logout)
- JWT token management
- PostgreSQL database
- Redis caching
- React frontend
- Protected routes
- All tests passing (31/31)

**Key Files:**
- Backend: `backend/internal/api/auth_handler.go`
- Frontend: `frontend/src/pages/Login.tsx`, `Dashboard.tsx`
- Database: `backend/migrations/001_initial_schema.sql`

---

## Quick Reference

### Essential Commands

```bash
# Setup & Start
make dev                # Start Docker services + migrations
make backend           # Start Go backend (port 8080)
make frontend          # Start React frontend (port 5173)

# Testing
make test              # Run all tests

# Database
PGPASSWORD=dev_password psql -h localhost -U dev -d voice_training

# Logs
docker-compose logs -f [service]

# Cleanup
make docker-down       # Stop all services
```

### URLs in Development

| Service | URL | Health Check |
|---------|-----|--------------|
| Frontend | http://localhost:5173 | (just visit it) |
| Backend | http://localhost:8080 | /health |
| PostgreSQL | localhost:5432 | (use psql) |
| Redis | localhost:6379 | (use redis-cli) |

### Environment Variables

```
DATABASE_URL=postgres://dev:dev_password@localhost:5432/voice_training?sslmode=disable
REDIS_URL=redis://localhost:6379
JWT_SECRET=<generated-secret>
PORT=8080
FRONTEND_URL=http://localhost:5173
```

### Important Files

| File | Purpose | Tech |
|------|---------|------|
| `backend/cmd/server/main.go` | Server entry, routing | Go, Gin |
| `backend/internal/api/auth_handler.go` | Auth endpoints | Go, HTTP |
| `backend/internal/auth/jwt.go` | Token generation | Go, JWT |
| `frontend/src/App.tsx` | App routing | React, TypeScript |
| `frontend/src/pages/Login.tsx` | Login page | React |
| `frontend/src/stores/authStore.ts` | Auth state | Zustand |
| `docker-compose.yml` | Services config | Docker |
| `Makefile` | Build commands | Make |

---

## Documentation Maintenance

**Last Updated:** 2025-11-17
**Phase:** 1 (Complete)
**Status:** All documentation current and complete

### Update Guidelines
- Update docs when features change
- Keep examples and code snippets current
- Add new sections for new features
- Fix broken links and outdated references
- Review quarterly for accuracy

---

## Getting Help

1. **Check this index** - Find relevant documentation
2. **Search documentation** - Use Ctrl+F in each file
3. **Check TROUBLESHOOTING.md** - Most common issues covered
4. **Review code** - Source is documentation
5. **Contact team** - Ask development team for clarification

---

## Navigation Tips

- **Use Ctrl+F (Cmd+F)** in each document to search
- **Follow [Links]** to jump between related docs
- **Check tables of contents** at top of each file
- **Look for code examples** - Most docs have practical examples
- **Read headers** - Organized by topic for easy scanning

---

## Next Steps

### For Setup
→ Read **[SETUP.md](./SETUP.md)** to get running

### For Feature Development
→ Read **[ARCHITECTURE.md](./ARCHITECTURE.md)** then **[DEVELOPMENT.md](./DEVELOPMENT.md)**

### For API Integration
→ Read **[API.md](./API.md)** for endpoint details

### For Problem Solving
→ Read **[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)**

---

## Document Map

```
You are here: INDEX.md (Navigation Hub)
    ↓
Choose your path:
    ├─ New Developer? → SETUP.md
    ├─ API Integration? → API.md
    ├─ Code Review? → DEVELOPMENT.md
    ├─ Problem Solving? → TROUBLESHOOTING.md
    └─ Understanding System? → ARCHITECTURE.md
```

---

**Start with the task that fits your role, then explore related documents as needed.**
