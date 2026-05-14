# M2 — Full Auth Backend

## Mục tiêu

Login/logout/refresh/session/register, cookie, revoke, bootstrap admin. Nối frontend thật với backend.

## Spec References

- Authentication architecture → `architecture.md#4`
- Database schema → `architecture.md#8`
- REST API → `architecture.md#appendix-rest-api`
- JWT payload → `architecture.md#4.5`
- Default admin bootstrap → `architecture.md#4.7`

## Deliverables

### 1. Backend Infrastructure ✅

- [x] `backend/` (ASP.NET Core 8) setup
  - [x] `AuthService` — login, register, refresh, revoke
  - [x] `AuthController` — 7 REST endpoints
  - [x] `SettingsService` — with IMemoryCache
  - [x] Middleware — CSRF, rate limiting, security headers, trusted proxy
  - [x] JWT — System.IdentityModel.Tokens.Jwt
  - [x] Database — EF Core + SQLite migrations
- [x] `@namorix/shared` setup
  - [x] types (ApiResponse, ValidateErrorMeta, User, AuthStatus)
  - [x] constants (ApiAuthRoutes, HttpStatus, NMX_COOKIE_*)
  - [x] error helpers (apiAuthError, apiSuccess)
- [x] Config + secret management

### 2. Database Schema (Drizzle) ✅

- [x] `users` table (id, username, passwordHash, role, createdAt)
- [x] `revokedTokens` table (jti, revokedAt, expiresAt)
- [x] `settings` table (key, value)
- [x] NmxDataBase wrapper class with migrations support

### 3. Auth API Endpoints ✅

- [x] `POST /api/auth/login` — validate creds, set cookies (accessToken, refreshToken)
- [x] `POST /api/auth/register` — create user
- [x] `POST /api/auth/logout` — clear cookies, revoke token
- [x] `GET /api/auth/session` — validate session, return user
- [x] `POST /api/auth/refresh` — refresh access token with rotation
- [x] `GET /api/auth/status` — return { needsRegister, registerEnabled }

### 4. Middleware ✅

- [x] CSRF middleware (double-submit pattern)
- [x] Rate limiting (100 req/min, .NET 8 built-in)
- [x] Security headers middleware
- [x] Trusted Proxy middleware
- [x] Exception + JSON error middleware
- [x] Custom `[Validate]` attribute (schema-based validation)

### 5. Frontend Integration ✅

- [x] `auth.controller.ts` - controller pattern for API calls
- [x] Register page connected to real API with validation error handling
- [x] Login page with form (needs API connection)
- [x] GuardedRoute with auth guards from `@namorix/core`
- [x] `ApiError` class with `fromResponse()` static method

### 6. Security ✅

- [x] Password hashing (bcryptjs)
- [x] JWT secret management (env or .secret file auto-generate)
- [x] Token revocation (revokedTokens table)
- [x] First user = admin (role=1), subsequent users = user (role=0)
- [x] Token refresh with rotation (old refresh token revoked)

## File Structure

```
backend/
├── Controllers/           # ASP.NET Core controllers
│   └── AuthController.cs
├── Services/
│   ├── AuthService.cs
│   ├── SettingsService.cs
│   └── TokenCleanupService.cs
├── Models/
│   ├── User.cs
│   ├── RefreshToken.cs
│   ├── Setting.cs
│   └── AppDbContext.cs
├── Middleware/
│   ├── CsrfMiddleware.cs
│   ├── ExceptionMiddleware.cs
│   ├── JsonErrorMiddleware.cs
│   ├── SecurityHeadersMiddleware.cs
│   └── TrustedProxyMiddleware.cs
├── Config/
│   ├── AppConfig.cs
│   └── JwtConfig.cs
├── Constants/
│   ├── Auth.cs
│   ├── Cookie.cs
│   ├── Error.cs
│   ├── Http.cs
│   ├── Jwt.cs
│   ├── Settings.cs
│   └── Validation.cs
├── Exceptions/
│   └── AuthException.cs
├── Extensions/
│   └── ApplicationBuilderExtensions.cs
├── Responses/
│   └── ApiResponse.cs
├── Validation/
│   ├── IValidationSchema.cs
│   ├── ValidateAttribute.cs
│   ├── ValidationRule.cs
│   └── Schemas/
│       ├── LoginSchema.cs
│       └── RegisterSchema.cs
├── Program.cs
└── appsettings.json

packages/shared/src/
├── types/
│   ├── api.ts              # ApiResponse
│   ├── auth.ts             # AuthStatus, UserPublic
│   ├── error.ts            # AuthErrorCode, SystemErrorCode, ValidateErrorCode
│   ├── helpers.ts          # apiAuthError, apiSystemError, apiValidateError, apiSuccess
│   ├── http.ts             # HttpStatus
│   └── validate.ts         # ValidateErrorMeta
├── api-routes.ts           # ApiAuthRoutes
└── constants.ts            # NMX_COOKIE_ACCESS_KEY, NMX_COOKIE_REFRESH_KEY

packages/core/src/http/
├── index.ts                # barrel export
├── api-error.ts            # ApiError class
├── client.ts               # http client with auto-refresh (TODO)
└── http-headers.ts              # header helpers (TODO)

frontend/src/
├── assets/
│   └── controllers/
│       └── auth.controller.ts  # login, register, logout
└── pages/
    ├── Register.tsx          # connected to real API
    └── Login.tsx          # connected to real API (client-side validation + error handling)
```

## Current Status

### Done ✅ (C# .NET 8)
- Backend scaffold (ASP.NET Core 8)
- C# AuthService (Login, Register, RefreshToken, RevokeToken, RevokeAllUserTokens)
- C# SettingsService (IMemoryCache, register toggle, trusted proxies)
- C# TokenCleanupService (BackgroundService, 24h interval)
- Database models (User, RefreshToken, Setting) + EF Core + SQLite migrations
- Auth API endpoints (login/register/logout/logout-all/session/refresh/status)
- JWT (access + refresh tokens, Issuer/Audience validation)
- Config (IOptions<T>, AppConfig + JwtConfig)
- Cookie-based auth (HttpOnly, sameSite: Lax)
- Token refresh with fingerprint rotation
- First user = admin logic
- CSRF middleware (double-submit pattern)
- Rate limiting (100 req/min, .NET 8 built-in)
- Security headers middleware
- Trusted Proxy middleware
- Exception + JSON error middleware
- Custom `[Validate]` attribute (schema-based validation)
- Client-side validation (`ValidationRunner` + `formatApiError`)
- Frontend controller pattern (auth.controller.ts)
- Register page with API connection and validation error handling
- Login page with client-side validation + API connection + error handling
- i18n layering (core namespace + frontend translation namespace)

### Phase A + B (Security Hardening) ✅
- [x] **Trust proxy + getClientIP()**: Proxy header priority chain (CF → X-Forwarded-For → X-Real-IP → X-Client-IP → True-Client-IP)
- [x] **Secure cookie flag**: Configurable via SECURE_COOKIE env var
- [x] **CSRF double-submit**: Enabled by default (CSRF_DISABLE=false), non-HttpOnly cookie + X-CSRF-Token header
- [x] **Async isAuthenticated**: Calls `/api/auth/session` instead of checking document.cookie (HttpOnly)
- [x] **logout-all endpoint**: Revokes all refresh tokens for user
- [x] **RememberMe wired**: Frontend toggle → backend receives boolean
- [x] **Token whitelist (refresh_tokens)**: Replaces revokedTokens blacklist; tracks userAgent, fingerprint, ipAddress, lastUsedAt
- [x] **Token reuse detection**: Unknown jti → revokeAllUserTokens()
- [x] **Fingerprint generation (B1)**: `packages/core/src/fingerprint/` with `FingerprintComponents` + SHA-256 hash
- [x] **Fingerprint verification (B2)**: Option C balanced on refresh — revoke only if both fingerprint AND IP changed

### To Do
- Vitest tests for auth.service (no test files yet)

## API Response Format

```typescript
// Success
{ success: true, data: T }

// Error
{ success: false, error: string, code?: string, field?: string, meta?: ValidationErrorMeta }
```

## Decorator-based Route Registration

```typescript
// Moved to ASP.NET Core C#:
// [ApiController]
// [Route("api/auth")]
// [HttpPost("login")]
// [Validate(typeof(LoginSchema))]
// AuthController with ControllerBase inheritance
import { AuthConstraints } from "@namorix/shared"

@Controller("/api/auth")
export class AuthController {
  @Validate({
    username: {
      required: true, type: "string",
      minLength: AuthConstraints.username.minLength,
      maxLength: AuthConstraints.username.maxLength,
      trim: true,
    },
    password: {
      required: true, type: "string",
      minLength: AuthConstraints.password.minLength,
    },
  })
  @Post("/register")
  async register(req: Request, res: Response) { /* body đã validated */ }
}
```

Route được đăng ký qua `registerController(router, AuthController)` — đọc Reflect metadata từ decorator, tạo instance, wire route + middleware.

## Auth Constraints (from @namorix/shared)

```typescript
export const AuthConstraints = {
  username: { minLength: 1, maxLength: 32 },
  password: { minLength: 8 },
}
```