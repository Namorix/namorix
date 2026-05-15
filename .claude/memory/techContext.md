# Tech Context

## Technologies Used

### Frontend
- **Framework:** React 18+ with TypeScript
- **Build Tool:** Vite
- **Routing:** React Router DOM
- **State:** Zustand
- **Terminal:** xterm.js
- **Styling:** SCSS modules + CSS custom properties

### Backend
- **Runtime:** .NET 8
- **Framework:** ASP.NET Core 8
- **Database:** SQLite + EF Core 8
- **Auth:** JWT (System.IdentityModel.Tokens.Jwt), BCrypt (BCrypt.Net-Next)
- **Caching:** IMemoryCache
- **Docker:** Docker.DotNet.Enhanced (fork từ Docker.DotNet, maintain bởi Testcontainers team)

### Packages
| Package | Purpose | Dependencies |
|---------|---------|--------------|
| `@namorix/core` | Browser-only: auth, http, i18n, validation, router, types, constants | react, react-router-dom, i18next, react-i18next |
| `@namorix/styles` | SCSS tokens, reset, fonts, variables | None (pure SCSS) |
| `@namorix/ui` | React primitive components | React, @namorix/core, @namorix/styles |

## Development Setup

### Prerequisites
- Node.js 18+
- pnpm 9+
- Docker (for addon containers)

### Commands
```bash
cd frontend && pnpm install    # Install frontend workspace
cd backend && dotnet restore   # Restore backend packages
cd backend && dotnet watch run # Backend only (port 3000)
cd frontend && pnpm dev        # Frontend only (Vite port 5173)
cd frontend && pnpm build      # Build all frontend packages
cd frontend && pnpm test       # Run frontend tests
```

### Environment Variables (Frontend)

| Variable | Purpose | Default |
|----------|---------|---------|
| `VITE_API_URL` | Backend API base URL | `""` (relative, uses Vite proxy) |

**Development:** Use `""` (relative URL) with Vite proxy in `vite.config.ts` — no CORS issues.
**Production:** Set `VITE_API_URL` to actual backend URL (e.g., `https://api.yourdomain.com`).

**Current state:** `main.tsx` has `apiBaseUrl: "http://localhost:5173"` hardcoded — works for local dev only. Will need to change to `import.meta.env.VITE_API_URL ?? ""` before production deployment.

### Packages Structure
```
frontend/packages/
├── core/           # @namorix/core — TypeScript contracts, http, auth
│   └── src/
│       ├── auth/          # auth.service.ts (async isAuthenticated)
│       ├── http/          # ApiError, RequestBuilder (CSRF auto-injection)
│       ├── i18n/          # NmxI18n, ValidationRunner, validation-messages
│       ├── router/        # GuardedRoute, createAuthGuard, etc.
│       ├── types/         # ApiResponse, AuthStatus, error codes, helpers (merged from shared)
│       ├── api-routes.ts  # (merged from shared)
│       ├── constants.ts   # NMX_COOKIE_*, AuthConstraints (merged from shared)
│       ├── config.ts
│       └── utils/cx.ts
├── styles/         # @namorix/styles — SCSS tokens
│   └── src/
│       ├── index.scss
│       ├── reset.scss       # CSS reset
│       ├── fonts.scss       # font imports
│       ├── mixins.scss
│       └── variables.scss
└── ui/             # @namorix/ui — React primitives
    └── src/
        ├── Primitives/
        │   ├── NmxButton/
        │   ├── NmxForm/
        │   ├── NmxInlineAlert/
        │   └── NmxToggle/
        └── index.ts
```

## TypeScript Configuration

```json
{
  "compilerOptions": {
    "target": "ES2023",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "verbatimModuleSyntax": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

## Technical Constraints

1. **`@namorix/core` is browser-only** — single package for frontend + external addons (shared merged in)
2. **`@namorix/styles` is pure SCSS** — provides CSS custom properties (--nmx-*)
3. **Single-node deployment** — SQLite file-based, no separate DB server
4. **Same-machine Docker** — Unix socket, not TCP
5. **ES2023 target** — with bundler module resolution
6. **Package boundaries enforced** — no cross-package imports outside allowed list
7. **HttpOnly cookies** — auth tokens not readable by JS; isAuthenticated must use API call
8. **CSRF double-submit** — non-HttpOnly CSRF cookie + X-CSRF-Token header, enabled via CSRF_DISABLE env

## Database Schema (EF Core / SQLite)

### Tables

**`Users`**
| Column | Type | Constraints |
|--------|------|-------------|
| `Id` | int | PK, auto-increment |
| `Username` | text | unique, not null |
| `PasswordHash` | text | not null (BCrypt) |
| `Role` | int | not null, default 0 (bitmask: `ADMIN = 1 << 0`) |
| `CreatedAt` | datetime | not null |

**`RefreshTokens`**
| Column | Type | Constraints |
|--------|------|-------------|
| `Jti` | text | PK |
| `UserId` | int | FK → Users.Id |
| `TokenHash` | text | not null |
| `UserAgent` | text | nullable |
| `Fingerprint` | text | nullable |
| `IpAddress` | text | nullable |
| `LastUsedAt` | datetime | nullable |
| `ExpiresAt` | datetime | not null |
| `CreatedAt` | datetime | not null |

**`Settings`**
| Column | Type | Constraints |
|--------|------|-------------|
| `Key` | text | PK |
| `Value` | text | not null |

### Migration Strategy
- EF Core migrations in `backend/src/Namorix.Adapters/Migrations/`
- Run: `dotnet ef database update`
- Or auto-apply at startup: `DbContext.Database.Migrate()`

## REST API Endpoints

### Auth (`/api/auth`)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/login` | Login with username + password + rememberMe? |
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/logout` | Clear cookies, revoke refresh token |
| POST | `/api/auth/logout-all` | Revoke all user refresh tokens |
| GET | `/api/auth/session` | Validate access token, return user info |
| POST | `/api/auth/refresh` | Rotate tokens (fingerprint + IP check) |
| GET | `/api/auth/status` | Return `{ needsRegister, registerEnabled }` |

### Settings (`/api/settings`)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/settings/proxies` | Get trusted proxy IP list |
| PUT | `/api/settings/proxies` | Set trusted proxy IPs |

### Addon (Planned — M4)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/addon/handshake` | Exchange addon secret for AddonToken |
| POST | `/api/addon/session-exchange` | Exchange one-time nmx_handshake_token for session (full app mode) |
| GET | `/api/logs/addons` | List addon log sources |
| GET | `/api/logs?addonId=` | Fetch addon logs |

## Middleware Pipeline
```
CORS → SecurityHeaders → TrustedProxy → Routing → RateLimiter (100 req/min) → CSRF → Controllers
```

## Docker Labels (External Addons)
```dockerfile
LABEL namorix.addon=true
LABEL namorix.addon.id=homethread
LABEL namorix.addon.display_name=HomeThread
LABEL namorix.addon.internal_port=4000
```

## Key Files

| Path | Purpose |
|------|---------|
| `frontend/packages/core/src/` | Browser contracts (AuthChecker, http client, i18n, validation, types, constants) |
| `frontend/packages/core/src/auth/auth.service.ts` | Async auth checker (calls /api/auth/session) |
| `frontend/packages/core/src/http/client.ts` | RequestBuilder with CSRF auto-injection |
| `frontend/packages/styles/src/` | SCSS tokens and reset |
| `frontend/packages/ui/src/` | React primitive components |
| `frontend/src/` | React shell UI |
| `backend/src/Namorix.Server/` | ASP.NET Core 8 API (Controllers, Middleware, Program.cs) |
| `backend/src/Namorix.Core/` | Shared contracts (Config, Constants, Models, Exceptions, Responses, Validation) |
| `backend/src/Namorix.Adapters/` | Persistence + Services (AppDbContext, AuthService, PermissionService, SettingsService) |
| `backend/src/Namorix.Workers/` | Background services (TokenCleanupWorker) |
| `backend/src/Namorix.Server/Program.cs` | Entry point + middleware pipeline |
| `backend/src/Namorix.Server/Middleware/CsrfMiddleware.cs` | CSRF double-submit middleware |
| `backend/src/Namorix.Server/Middleware/TrustedProxyMiddleware.cs` | Trusted proxy validation |
