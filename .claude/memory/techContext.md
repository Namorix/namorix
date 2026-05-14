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
- **Database:** SQLite + EF Core
- **JWT:** System.IdentityModel.Tokens.Jwt
- **Password hashing:** BCrypt.Net

### Packages
| Package | Purpose | Dependencies |
|---------|---------|--------------|
| `@namorix/shared` | Types, constants, error codes, HttpHeader | None |
| `@namorix/core` | Browser-only: auth, http, i18n, validation, router | @namorix/shared, react, react-router-dom, i18next, react-i18next |
| `@namorix/styles` | SCSS tokens, reset, fonts, variables | None (pure SCSS) |
| `@namorix/ui` | React primitive components | React, @namorix/core, @namorix/styles |

## Development Setup

### Prerequisites
- Node.js 18+
- npm 9+
- Docker (for addon containers)

### Commands
```bash
npm install                    # Install all workspaces
npm run dev                    # Run all dev servers (needs multiple terminals)
npm run dev --workspace frontend   # Frontend only (Vite port 5173)
npm run build                  # Build all packages
npm run test                   # Run tests
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
packages/
├── core/           # @namorix/core — TypeScript contracts, http, auth
│   └── src/
│       ├── auth/          # auth.service.ts (async isAuthenticated)
│       ├── http/          # ApiError, RequestBuilder (CSRF auto-injection)
│       ├── i18n/          # NmxI18n, ValidationRunner, validation-messages
│       ├── router/        # GuardedRoute, createAuthGuard, etc.
│       ├── config.ts
│       └── utils/cx.ts
├── styles/         # @namorix/styles — SCSS tokens
│   └── src/
│       ├── tokens.scss      # CSS variables (--nmx-*)
│       ├── reset.scss       # CSS reset
│       ├── fonts.scss       # font imports
│       ├── mixins.scss
│       ├── variables.scss
│       └── index.scss       # @use all partials
├── ui/             # @namorix/ui — React primitives
│   └── src/
│       ├── Primitives/
│       │   ├── NmxButton/
│       │   ├── NmxForm/
│       │   ├── NmxInlineAlert/
│       │   └── NmxToggle/
│       └── index.ts
└── shared/         # @namorix/shared — zero-deps types + constants
    └── src/
        ├── types/         # ApiResponse, AuthStatus, error codes, helpers
        ├── api-routes.ts
        ├── constants.ts        # NMX_COOKIE_*, AuthConstraints
        ├── http-headers.ts     # HttpHeader (lowercase for Express)
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

1. **`@namorix/core` is browser-only** — can import @namorix/shared + React ecosystem
2. **`@namorix/shared` has zero internal deps** — pure TypeScript types + constants + HttpHeader
3. **`@namorix/styles` is pure SCSS** — provides CSS custom properties (--nmx-*)
4. **Single-node deployment** — SQLite file-based, no separate DB server
5. **Same-machine Docker** — Unix socket, not TCP
6. **ES2023 target** — with bundler module resolution
7. **experimentalDecorators + emitDecoratorMetadata** — required for @Controller, @Validate decorators
8. **Package boundaries enforced** — no cross-package imports outside allowed list
9. **HttpOnly cookies** — auth tokens not readable by JS; isAuthenticated must use API call
10. **CSRF double-submit** — non-HttpOnly CSRF cookie + X-CSRF-Token header, enabled via CSRF_MODE env

## Key Files

| Path | Purpose |
|------|---------|
| `packages/core/src/` | Browser contracts (AuthChecker, http client, i18n, validation) |
| `packages/core/src/auth/auth.service.ts` | Async auth checker (calls /api/auth/session) |
| `packages/core/src/http/client.ts` | RequestBuilder with CSRF auto-injection |
| `packages/shared/src/` | Shared types, error codes, constants, HttpHeader |
| `packages/shared/src/http-headers.ts` | HttpHeader const (moved from core, all lowercase) |
| `packages/styles/src/` | SCSS tokens and reset |
| `packages/ui/src/` | React primitive components |
| `frontend/src/` | React shell UI |
| `backend/` | ASP.NET Core 8 API (Controllers, Services, Middleware, Models) |
| `backend/Program.cs` | Entry point + middleware pipeline |
| `backend/Middleware/CsrfMiddleware.cs` | CSRF double-submit middleware |
| `backend/Middleware/TrustedProxyMiddleware.cs` | Trusted proxy validation |
