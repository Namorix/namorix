# Active Context

## Current Work Focus

M2 — Full Auth Backend → **Complete** ✅ + **Harden** ✅ + **ESLint** ✅ + **Phase A** ✅ + **Phase B** ✅ + **C# Migration** ✅ (Phase 1-4 complete)

- All auth endpoints implemented and connected
- Login page fully connected with client-side validation + error handling
- Register page fully connected
- Decorator-based routing system in backend-core
- i18n layering (core namespace + frontend translation namespace)
- Client-side validation with ValidationRunner
- Server-side validation with validate() middleware
- **CSRF double-submit protection** implemented
- **isAuthenticated fixed** — now calls `/api/auth/session` instead of checking `document.cookie`
- **Token whitelist** with fingerprint + IP tracking
- **Phase A**: rememberMe wired, secureCookie fix, getClientIP, signout-all in API routes
- **Phase B**: frontend fingerprint generation (FingerprintComponents + SHA-256), backend verify on refresh (Option C balanced)
- **C# Migration Phase 1-3**: AuthService, Config (IOptions<T>), Constants, Exceptions, Settings model
- **C# Migration Phase 4**: AuthController (7 endpoints), typed ApiResponse<T>, SettingsService, CleanIp helper
- Moving to M3 (System Apps)

## Recent Changes (2026-05-12)

### Bug Fix Session
- **Auth guard loop fix**: `checkHasUsers()` and `isAuthenticated()` now catch 401 instead of throwing, fixing infinite redirect loop on fresh session
- **ExceptionMiddleware + JsonErrorMiddleware**: Consistent JSON error responses for 415 Unsupported Media Type and 500 Internal Server Error
- **ApplicationBuilderExtensions**: Clean middleware wiring in `Program.cs`

### C# Backend Migration — Phase 4 (latest)
- **AuthController**: 7 endpoints (signin, signup, signout, signout-all, session, refresh, status)
- **Typed responses**: `ApiResponse<T>`, `UserResponse`, `StatusResponse` (no more anonymous objects)
- **SettingsService**: `IsSignUpEnabled()`, `SetSignUpEnabled()`, `GetAuthStatus()`
- **CleanIp helper**: strips `::ffff:` prefix from IPv6-mapped IPv4 addresses
- **GetClientIp**: proxy header priority chain (CF → X-Forwarded-For → X-Real-IP → X-Client-IP → True-Client-IP → RemoteIpAddress)
- **Cookie constants**: `CookieName.AccessToken = "nmx_access_token"`, `CookieName.RefreshToken = "nmx_refresh_token"` (match `@namorix/shared`)

### C# Backend Migration — Phase 1-3
- **Config pattern**: `IOptions<T>` binding, no hardcoded strings
- **AuthService**: Login, Register, GenerateTokens, CreateRefreshToken, VerifyAccessToken, RefreshToken (fingerprint + rotation), RevokeToken, RevokeAllUserTokens
- **Constants**: JwtClaims (UserId, Username, Role, Jti, Iat), AuthErrors (InvalidCredentials, UsernameExists, TokenReuseDetected, FingerprintMismatch, InvalidToken)
- **Exceptions**: AuthException with error code
- **Settings model**: Entity for key-value storage
- **Config binding**: `builder.Services.Configure<JwtConfig>(builder.Configuration.GetSection("Jwt"))`

## Recent Changes (2026-05-09)

### Auto Token Refresh (401 Interceptor)
- `RequestBuilder.json()` now auto-refreshes access token on 401 responses
- On 401: calls `POST /api/auth/refresh` → if success, retries original request once
- Guards against infinite loop: skips refresh for the refresh endpoint itself (`isRefreshUrl`)
- Uses `_retried` flag to limit to one retry per request
- `authService.isAuthenticated()` stays simple — just calls session and returns `data.success` (HTTP client handles refresh transparently)

### Cookie Auth Fix
- `isAuthenticated()` was checking `document.cookie.includes(NMX_COOKIE_ACCESS_KEY)` — always returned false because cookies are **HttpOnly**
- Fixed: now calls `GET /api/auth/session` with `credentials: "include"` via `http` client
- `AuthChecker.isAuthenticated` type changed from `() => boolean` to `() => Promise<boolean>`
- All guards (`createAuthGuard`, `createSignInGuard`, `createSignUpGuard`) now `await` the async `isAuthenticated()`
- `cookieSameSite` changed from `"strict"` to `"lax"` — strict was blocking cross-port cookie sending in dev

### CSRF Double-Submit Implementation
```
packages/backend-core/src/middleware/csrf.ts
├── setCsrfCookie() — sets non-HttpOnly nmx_csrf_token cookie (random UUID)
├── validateCsrf() — compares cookie to X-CSRF-Token header on mutating methods
└── Enabled when CSRF_MODE=double-submit env var is set
```

**Client auto-injection:**
- `RequestBuilder._body()` reads `nmx_csrf_token` from `document.cookie`
- Sets `X-CSRF-Token` header automatically on POST/PUT/PATCH/DELETE

**New constants:**
- `NMX_COOKIE_CSRF_KEY = "nmx_csrf_token"` (in `@namorix/shared`)
- `SystemErrorCode.CSRF_MISMATCH` (in `@namorix/shared`)

### http-headers.ts Moved to Shared
- Was in `@namorix/core`, moved to `@namorix/shared`
- All header values changed to **lowercase** (Express compatibility)
- `XCsrfToken: "x-csrf-token"` added
- Core no longer exports HttpHeader directly — import from `@namorix/shared`

### backend-core tsconfig.json Created
- `packages/backend-core/tsconfig.json` created (extends `tsconfig.base.json`)
- Adds `experimentalDecorators` + `emitDecoratorMetadata`
- Fixes WebStorm TS error about `esModuleInterop` for cookie-parser import

### Config Changes
- `backend/src/config/types.ts`: Added `csrfMode: "double-submit" | undefined`
- `backend/src/config/index.ts`: Reads `CSRF_MODE` env var (was `NMX_CSRF_MODE`)
- `packages/backend-core/src/middleware/types.ts`: Added `csrfMode` to `MiddlewareConfig`

## Recent Changes (2026-05-10)

### getClientIP Utility
- `packages/backend-core/src/utils/get-client-ip.ts` — proxy header priority chain: CF → X-Forwarded-For → X-Real-IP → X-Client-IP → True-Client-IP
- `packages/backend-core/src/types/http.d.ts` — IncomingHttpHeaders module augmentation for custom proxy headers

### Secure Cookie + Trust Proxy
- `trustProxy` + `secureCookie` added to `MiddlewareConfig`, wired into `createMiddleware`
- All cookie setters (`setAccessCookie`, `setRefreshCookie`, `setCsrfCookie`) now pass `secure` flag
- `setCsrf` refactored from direct handler to factory fn: `(secureCookie) => handler`
- `TRUST_PROXY` env var (default `true`), `SECURE_COOKIE` env var (replaces `COOKIE_SECURE`)
- CSRF cookie: `{ httpOnly: false, secure: secureCookie }` (non-HttpOnly for JS double-submit)

### signout-all Wired
- `/signout-all` endpoint wired in `backend/src/routes/auth.ts`
- Uses `revokeAllUserTokens()` — DELETE all refresh tokens for current user

### HttpHeader Enum Removed
- Removed from `@namorix/shared` — incompatible with ESLint strictTypeChecked on IncomingHttpHeaders
- All consumers now use string literals (`"content-type"`, `"x-csrf-token"`, etc.)
- `core/src/http/client.ts` updated to use string literals

### JSON Parse Error Fix
- Fixed typo in JSON parse error message in backend-core

### Phase B: Fingerprint (B1 + B2)
- `packages/core/src/fingerprint/` — NEW module: `generateFingerprint()`, `getFingerprint()`, `FingerprintComponents` interface
- `packages/core/src/http/client.ts` — attach `x-device-fingerprint` header in `json()` method
- `frontend/src/main.tsx` — call `generateFingerprint()` on app start (non-blocking)
- `backend/src/services/auth.service.ts:refreshToken()` — **Option C verification:**
  - If fingerprint differs AND IP differs → revoke all tokens (high risk)
  - If fingerprint differs but IP same → allow (browser/OS update)
- `backend/src/routes/auth.ts:refresh()` — pass fingerprint + IP to `refreshToken()`

## Recent Changes (2026-05-10)

### Token Whitelist (refresh_tokens)
- Replaced `revoked_tokens` blacklist with `refresh_tokens` whitelist
- New columns: `userAgent`, `fingerprint`, `ipAddress`, `lastUsedAt`
- Sign-in: INSERT into whitelist with session metadata
- Refresh: DELETE old token + INSERT new token (rotation), preserves TTL via `remainingSeconds`
- Sign-out: DELETE by jti
- Sign-out-all: DELETE WHERE userId = ?
- Token reuse detection: unknown jti → `revokeAllUserTokens()` (anti-theft)
- Cleanup job: DELETE expired tokens by `expiresAt < now`

### CSRF Enabled by Default
- `csrfMode: process.env.CSRF_DISABLE === "true" ? undefined : "double-submit"` — opt-out, not opt-in
- `.env.example`: `CSRF_DISABLE=false`

### Cookie Wrappers Moved to backend-core
- All cookie helpers (set/get/clear for access, refresh, csrf) moved from `backend/src/utils/` to `packages/backend-core/src/utils/cookie.ts`
- Explicit return types (`string | undefined`) on get functions to fix ESLint `any` errors
- CSRF cookie: `{ ...cookieOptions, httpOnly: false }`

### verifyToken API Change
- `verifyToken` now returns `JwtPayload | null` (catches internally, no longer throws)
- `verifyAccessToken` removed (redundant — was wrapping verifyToken in another try/catch)
- All call sites now use `verifyToken` directly

### Remember-Me (90d TTL)
- `signIn` passes `refreshTtl` based on `meta.rememberMe`: `config.jwtRefreshRememberTtl` (default `"90d"`) vs `config.jwtRefreshTtl` (default `"7d"`)
- On refresh: remaining TTL calculated from `existing.expiresAt`, preserved in new token
- Uses `StringValue` type from `ms` for proper `expiresIn` typing in `jwt.sign`
- Frontend `rememberMe` toggle now wired through controller → backend

### JWT TTL Config Refactor
- `signAccessToken` now accepts optional `ttl?: string` param (uses `ACCESS_TOKEN_TTL` constant as fallback)
- `signIn` and `refreshToken` pass `config.jwtAccessTtl` / `config.jwtRefreshTtl` / `config.jwtRefreshRememberTtl` from env
- Removed `generateTokenPair` + `TokenPair` interface (dead code — auth service calls signAccessToken/signRefreshToken directly)
- New env var: `JWT_REFRESH_REMEMBER_TTL` (default `"90d"`)

### useAuthForm Hook + rememberMe Fix
- `frontend/src/hooks/useAuthForm.ts` — extracts shared alert state (`busy`, `alertVariant`, `alertMessage`) and error handling (`handlerError`) from Login/Register
- Fix: `rememberMe` toggle in Login now wired via `authController.signIn(username, password, rememberMe)` → backend receives `rememberMe` boolean

### ESLint strictTypeChecked Across All Packages
- Added `eslint.config.ts` + `tsconfig.json` to backend-core, core, shared
- All configs extend `strictTypeChecked` + `stylisticTypeChecked`
- Root `package.json` now has `"lint": "pnpm -r run lint"` script
- Fixed 20+ ESLint errors (any from req.body/req.headers, dead code, async without await, template literal, type assertions)

## Active Decisions

### Authentication Check Strategy
- `isAuthenticated()` now makes an async API call (`GET /api/auth/session`) instead of sync cookie check
- This correctly handles HttpOnly cookies
- Guard components already supported async guards — `GuardFn = () => Promise<string | null>`
- HTTP client (`http.url().get().json()`) provides `credentials: "include"` automatically

### CSRF Protection Strategy
- **Double-submit cookie pattern** — stateless, no server session needed
- Non-HttpOnly CSRF cookie is readable by JS but not by cross-origin pages
- **Enabled by default** (`CSRF_DISABLE` env var to opt-out)
- CSRF cookie wrappers in `@namorix/backend-core/utils/cookie.ts`
- `sameSite: "lax"` on auth cookies provides baseline protection even without CSRF

### Token Whitelist Strategy
- **Whitelist** (`refresh_tokens` table): track active refresh tokens by jti
- On refresh: DELETE old + INSERT new (atomic rotation), preserve remaining TTL
- On unknown jti: revoke ALL user tokens (anti-theft — prevents reuse of stolen tokens)
- Sign-out: DELETE one jti. Sign-out-all: DELETE all by userId
- No token_version column needed — whitelist approach is simpler and gives per-device control

### Token Refresh Strategy
- Auto-refresh on 401 handled in `RequestBuilder.json()` (HTTP client level, transparent to callers)
- Refresh endpoint is guarded against self-calling (`isRefreshUrl` check)
- Only one retry per request (`_retried` flag)
- Remember-me (90d) TTL preserved across refreshes via `remainingSeconds` calculation; configured via `JWT_REFRESH_REMEMBER_TTL` env
- `verifyToken` returns `JwtPayload | null` (no throw), used uniformly across all call sites

### Cookie Policy
- Access + refresh tokens: `httpOnly: true, sameSite: "lax"` (HttpOnly for security)
- CSRF token: `httpOnly: false, sameSite: "lax"` (readable by JS for double-submit)
- `sameSite: "lax"` chosen over `"strict"` because frontend/backend run on different ports in dev

## Next Steps

1. M3 — Desktop shell UI (taskbar, launcher, window manager)
2. M3 — Zustand stores (auth, windows, addons, desktop)
3. M3 — WindowState type + WindowManager component
4. M3 — System apps: File manager, Terminal (xterm.js + PTY), Settings (signup toggle), Log viewer
5. Write Vitest tests for auth.service
6. Add Vietnamese translations (vi.json is empty)
