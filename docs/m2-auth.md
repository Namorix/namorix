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

- [x] `@namorix/backend-core` setup
  - [x] `logger` with tag + custom timestamp format
  - [x] `jwt` utilities (signAccessToken, signRefreshToken, verifyToken)
  - [x] `db` utilities (NmxDataBase class, getDB)
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

- [x] `POST /api/auth/signin` — validate creds, set cookies (accessToken, refreshToken)
- [x] `POST /api/auth/signup` — create user
- [x] `POST /api/auth/signout` — clear cookies, revoke token
- [x] `GET /api/auth/session` — validate session, return user
- [x] `POST /api/auth/refresh` — refresh access token with rotation
- [x] `GET /api/auth/status` — return { needsSignup, signUpEnabled }

### 4. Middleware ✅

- [x] `createMiddleware` from `@namorix/backend-core` (helmet, cors, rateLimit, cookieParser, express.json, handleJsonError)
- [x] `validate` middleware from `@namorix/backend-core` (Schema-based validation)
- [x] Error handler middleware (`handleJsonError`)

### 5. Frontend Integration ✅

- [x] `auth.controller.ts` - controller pattern for API calls
- [x] SignUp page connected to real API with validation error handling
- [x] SignIn page with form (needs API connection)
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
├── src/
│   ├── index.ts               # Express app entry
│   ├── config/
│   │   ├── index.ts           # env loading
│   │   ├── types.ts           # Config interface
│   │   └── secret.ts          # JWT secret management
│   ├── routes/
│   │   └── auth.ts            # AuthController class với decorator (@Controller, @Validate, @Post, @Get)
│   ├── services/
│   │   └── auth.service.ts    # signIn, signUp, verifyAccessToken, refreshToken, revokeToken
│   └── middleware/
│       └── index.ts           # uses createMiddleware from @namorix/backend-core

packages/backend-core/src/
├── db/
│   ├── index.ts              # NmxDataBase class
│   └── types.ts             # NmxDB type
├── jwt/
│   ├── index.ts             # signAccessToken, signRefreshToken, verifyToken
│   └── types.ts            # JwtPayload, TokenPair
├── logger/
│   ├── index.ts             # createLogger with tag + custom timestamp
│   └── types.ts            # LoggerConfig
├── middleware/
│   ├── index.ts             # barrel export
│   ├── types.ts             # MiddlewareConfig, defaultMiddlewareConfig
│   ├── apply.ts             # createMiddleware()
│   └── json-error.ts        # handleJsonError
├── utils/
│   ├── index.ts             # barrel export
│   ├── cookie.ts            # setAccessCookie, getAccessCookie, etc.
│   └── response.ts          # sendSuccess, sendError
├── validate/
│   └── index.ts             # validate() middleware, Schema, Rule
├── decorators/
│   ├── controller.ts        # @Controller
│   ├── http-methods.ts      # @Get, @Post, @Put, @Patch, @Delete
│   ├── validate.ts          # @Validate
│   ├── register.ts          # registerController()
│   └── index.ts             # barrel export
└── index.ts                 # barrel export

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
│       └── auth.controller.ts  # signUp, signIn, signOut
└── pages/
    ├── SignUp.tsx          # connected to real API
    └── SignIn.tsx          # connected to real API (client-side validation + error handling)
```

## Current Status

### Done ✅
- Backend scaffold (Express + TypeScript + tsx)
- `@namorix/backend-core` setup (logger, jwt, db, middleware, validate, utils, decorators)
- `@namorix/shared` setup (types, constants, error helpers, ValidationErrorMeta)
- Database schema (users, refreshTokens, settings)
- Auth API endpoints (signin/signup/signout/signout-all/session/refresh/status)
- JWT utilities (signAccessToken with optional TTL, signRefreshToken, verifyToken)
- Config + secret management
- Auth service (signIn, signUp, verifyAccessToken, refreshToken, revokeToken, revokeAllUserTokens, getAuthStatus)
- Cookie-based auth (HttpOnly cookies with sameSite: lax)
- Token refresh with rotation
- First user = admin logic
- `validate()` middleware in backend-core (Schema-based)
- `createMiddleware()` in backend-core (configurable stack)
- Decorator system (`@Controller`, `@Get`, `@Post`, `@Validate`, `registerController`)
- Client-side validation (`ValidationRunner` + `formatApiError`)
- Frontend controller pattern (auth.controller.ts)
- SignUp page with API connection and validation error handling
- SignIn page with client-side validation + API connection + error handling
- i18n layering (core namespace + frontend translation namespace)

### Phase A + B (Security Hardening) ✅
- [x] **Trust proxy + getClientIP()**: Proxy header priority chain (CF → X-Forwarded-For → X-Real-IP → X-Client-IP → True-Client-IP)
- [x] **Secure cookie flag**: Configurable via SECURE_COOKIE env var
- [x] **CSRF double-submit**: Enabled by default (CSRF_DISABLE=false), non-HttpOnly cookie + X-CSRF-Token header
- [x] **Async isAuthenticated**: Calls `/api/auth/session` instead of checking document.cookie (HttpOnly)
- [x] **signout-all endpoint**: Revokes all refresh tokens for user
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
import { Controller, Post, Validate } from "@namorix/backend-core"
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
  @Post("/signup")
  async signUp(req: Request, res: Response) { /* body đã validated */ }
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