# Backend Migration: TypeScript → Go

Document quá trình chuyển backend từ Node.js/TypeScript (Express) sang Go.

## Status

**Đang tiến hành** — M2 phase.

## Mục tiêu

Chuyển backend auth API từ TypeScript/Express sang Go thuần, giữ nguyên:
- API endpoints (7 endpoints)
- Database schema (users, refresh_tokens, settings)
- Auth flow + token whitelist + fingerprint verification
- Config từ env vars

## Architecture Overview

```
namorix/
├── backend-go/              # Desktop backend (Go)
│   ├── core/               # Shared package (desktop + addon backends dùng chung)
│   │   ├── auth/           # JWT sign/verify, session
│   │   ├── errors/         # ApiResponse, error codes
│   │   ├── middleware/     # CORS, cookie, csrf
│   │   ├── config/         # Env loading
│   │   └── utils/          # getClientIP, logging
│   ├── internal/           # Desktop-specific (không share với addon)
│   │   ├── handlers/       # Auth handlers (desktop only)
│   │   ├── db/             # DB operations (desktop schema)
│   │   └── ...
│   ├── cmd/server/         # Desktop entry point
│   ├── data/              # SQLite + .secrets
│   └── go.mod
│
├── frontend/
│   ├── packages/
│   │   └── core/           # @namorix/core (browser client lib)
│   └── src/                # Shell UI (React)
```

## Phân biệt core/ vs internal/

| Package | Desktop | Addon | Share |
|---------|---------|-------|-------|
| `core/` (shared) | Import | Import | **Có** — addon developers dùng |
| `internal/` (desktop) | Dùng nội bộ | Không thấy | **Không** |

### core/ — Shared Package

Addon developers import khi viết addon backend bằng Go:
```go
import "namorix/backend/core"
```

Chứa những thứ addon cần dùng chung:
- JWT verify
- Error codes, ApiResponse format
- Middleware (CORS, cookie)
- Config loading
- getClientIP utility

### internal/ — Desktop Only

Những thứ chỉ desktop backend cần:
- Auth handlers (signIn, signUp, signOut, etc.) — gọi auth service
- Database operations với desktop schema
- Settings service
- Cleanup jobs

## Scope

### Trong scope
- Auth API: signin, signup, signout, signout-all, session, refresh, status
- JWT utilities
- Middleware (CORS, CSRF, cookie, trust proxy)
- SQLite database
- Config loading

### Ngoài scope (giữ TypeScript)
- `@namorix/shared` — TypeScript types/constants cho frontend
- `@namorix/core` — browser-only code
- `@namorix/backend-core` — TypeScript utilities → **deprecated**
- WebSocket handlers (Socket.IO shell + terminal) — làm sau

## Dependencies

| Library | Purpose | Import |
|---------|---------|--------|
| `github.com/golang-jwt/jwt/v5` | JWT sign/verify | jwt |
| `modernc.org/sqlite` | SQLite (pure Go) | modernc.org/sqlite |
| `golang.org/x/crypto/bcrypt` | Password hashing | golang.org/x/crypto/bcrypt |
| `github.com/gorilla/websocket` | WebSocket (future) | github.com/gorilla/websocket |

**Không dùng framework** — `net/http` thuần.

## API Endpoints

| Method | Path | Handler | Note |
|--------|------|---------|------|
| POST | /api/auth/signin | handleSignIn | rememberMe body |
| POST | /api/auth/signup | handleSignUp | |
| POST | /api/auth/signout | handleSignOut | revoke token jti |
| POST | /api/auth/signout-all | handleSignOutAll | revoke all user tokens |
| GET | /api/auth/session | handleSession | returns user from access token |
| POST | /api/auth/refresh | handleRefresh | rotate tokens, fingerprint check |
| GET | /api/auth/status | handleStatus | needsSignup, signUpEnabled |

## Progress

### Phase 1: Setup + Structure
- [x] Initialize go.mod
- [ ] Create folder structure (core/ + internal/)
- [ ] Constants (cookie names, error codes)

### Phase 2: core/ — Shared Package
- [ ] auth/ — JWT sign/verify
- [ ] errors/ — ApiResponse, error codes
- [ ] config/ — Env loading
- [ ] utils/ — getClientIP
- [ ] middleware/ — CORS, cookie helpers

### Phase 3: internal/ — Desktop DB
- [ ] Schema (users, refresh_tokens, settings tables)
- [ ] DB operations (CRUD)

### Phase 4: internal/ — Auth Handlers
- [ ] Auth handlers (signIn, signUp, signOut, etc.)
- [ ] Route registration
- [ ] Response helpers

### Phase 5: Middleware
- [ ] CSRF double-submit
- [ ] Trust proxy

### Phase 6: Entry Point
- [ ] main.go wiring
- [ ] Graceful startup

### Phase 7: Testing
- [ ] Test all endpoints
- [ ] Compare with TypeScript backend responses

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Framework | None — `net/http` | Simple, no deps |
| Router | Manual `http.HandleFunc` | 7 endpoints only |
| SQLite driver | `modernc.org/sqlite` | Pure Go, no cgo |
| WebSocket | `gorilla/websocket` | Standard for Go |
| Shared package | `core/` subdirectory | Desktop + addon dùng chung |

## Notes

- Decorator pattern from TypeScript → manual router in Go
- Validation middleware → inline validation in handlers
- `@namorix/backend-core` → deprecated, code không còn maintain
- Addon viết bằng Go import `namorix/backend/core` để dùng chung utilities