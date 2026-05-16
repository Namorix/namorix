# Progress

## What Works

- Frontend Vite project created with React + TypeScript
- Backend Express project scaffold with TypeScript + tsx
- pnpm monorepo workspace configured
- `@namorix/styles` package (SCSS tokens, reset, fonts, variables, mixins)
- `@namorix/ui` package with components:
  - NmxButton, NmxForm (7 sub-components), NmxInlineAlert, NmxToggle
- `@namorix/core` with:
  - `cx` utility, `ApiError`, `http` client (RequestBuilder with CSRF auto-injection, 401 auto-refresh + retry)
  - `GuardedRoute`, auth guards (createAuthGuard, createLoginGuard, createRegisterGuard)
  - `NmxI18n` class (i18n layering: core + translation namespaces)
  - `ValidationRunner` (fluent client-side validation)
  - `formatApiError`, `formatValidationError`, `formatAuthError`
  - `authService` (async `isAuthenticated` via `/api/auth/session`)
- `@namorix/shared` merged into `@namorix/core` (2026-05-14 restructure)
- React Router setup with /login, /register, / routes
- Auth pages (Login, Register with AuthPage wrapper) + responsive layout
- i18next with react-i18next (en/vi locales, layered namespaces)
- Auth endpoints (login/register/logout/session/refresh/status) — decorator-based
- JWT secret management (env var or .secret file)
- First user = admin, subsequent = user
- Token refresh with rotation
- Auth guards with GuardedRoute (async isAuthenticated)
- Controller pattern for frontend API calls
- Login page with client-side validation + API connection + rememberMe toggle connected + rememberMe toggle connected
- `useAuthForm` hook (shared alert state + error handling for Login/Register)
- `validate()` middleware in backend-core (Schema-based)
- `createMiddleware()` in backend-core (configurable stack)
- CSRF double-submit protection (set + validate cookie/header mismatch), enabled by default
- HttpOnly auth cookies with sameSite: lax
- Cookie wrappers in @namorix/backend-core (set/get/clear for access, refresh, csrf)
- Token whitelist: refresh_tokens table (jti, userId, userAgent, fingerprint, ipAddress, timestamps)
- Token reuse detection: unknown jti → revoke all user tokens
- logout-all endpoint (revoke all user tokens by userId)
- Remember-me (90d TTL, preserved on rotation via remaining seconds)
- eslint config + lint scripts across all packages (strictTypeChecked)
- **Fingerprint generation**: `packages/core/src/fingerprint/` with `FingerprintComponents` interface + SHA-256 hash (fallback base64 if non-HTTPS)
- **Fingerprint verification on refresh**: Option C balanced — revoke if both fingerprint AND IP changed; allow if only fingerprint changed (browser/OS update)
- **Trust proxy + getClientIP()**: Priority chain (CF → X-Forwarded-For → X-Real-IP → X-Client-IP → True-Client-IP)
- **Secure cookie flag**: Configurable via SECURE_COOKIE env var
- **backend-c (.NET/C#)**: ASP.NET Core 8 + EF Core + SQLite migration scaffolded (migrated from Node.js backend, now in `backend/` folder)

## Milestones

### M1 — Static Shell UI + Mock Auth Page
**Status:** Complete ✅

### M2 — Full Auth Backend
**Status:** Complete ✅

- [x] Backend scaffold (Express + TypeScript + tsx)
- [x] `@namorix/backend-core` setup (logger, jwt, db, middleware, validate, utils, decorators, csrf)
- [x] `@namorix/shared` setup (types, constants, error codes, helpers, http-headers)
- [x] Database schema (users, refreshTokens, settings)
- [x] Auth API endpoints (login/register/logout/logout-all/session/refresh/status)
- [x] JWT utilities (signAccessToken with optional TTL, signRefreshToken, verifyToken)
- [x] Auth service (Login, Register, refreshToken, revokeToken, revokeAllUserTokens, cleanupExpiredTokens, getAuthStatus)
- [x] Config + Secret management (CSRF_DISABLE=false by default, JWT_ACCESS_TTL, JWT_REFRESH_TTL, JWT_REFRESH_REMEMBER_TTL)
- [x] First user = admin logic
- [x] Token refresh with rotation + TTL preservation (remember-me 90d)
- [x] Cookie wrappers in @namorix/backend-core (set/get/clear for access, refresh, csrf)
- [x] Settings service with in-memory cache
- [x] Cleanup job for expired refresh_tokens (daily cron at 03:00)
- [x] `validate()` middleware (Schema-based)
- [x] `createMiddleware()` (configurable middleware stack)
- [x] Decorator system (@Controller, @Get, @Post, @Validate, registerController)
- [x] `ValidationErrorCode` + `AuthErrorCode` enums in shared
- [x] `ApiError` class in @namorix/core
- [x] Frontend auth.controller.ts (controller pattern)
- [x] Register page with client-side validation + API connection
- [x] Login page with client-side validation + API connection
- [x] i18n layering (core namespace + frontend translation namespace)
- [x] ValidationRunner (fluent client-side validation)
- [x] formatApiError / formatValidationError / formatAuthError
- [x] CSRF double-submit protection (csf token cookie + header validation)
- [x] Async isAuthenticated (calls /api/auth/session instead of document.cookie)
- [x] HttpHeader moved from @namorix/core to @namorix/shared
- [x] backend-core tsconfig.json
- [x] Frontend fingerprint generation (B1): `packages/core/src/fingerprint/` with `FingerprintComponents` interface + `generateFingerprint()` + SHA-256 hash (base64 fallback)
- [x] Backend fingerprint verification on refresh (B2): Option C balanced — revoke if both fingerprint AND IP changed; allow if only fingerprint changed
- [x] Trust proxy + getClientIP() (CF → X-Forwarded-For → X-Real-IP → X-Client-IP → True-Client-IP)
- [x] Secure cookie flag (SECURE_COOKIE env var, replaces COOKIE_SECURE)
- [x] eslint config + lint scripts across all packages (strictTypeChecked)
- [ ] Vitest tests for auth.service (no test files exist yet)

### M3 — System Addons (Built-in)
**Status:** Desktop Shell UI ✅ + Addon System 🔜

- [x] Desktop shell UI (taskbar, launcher, desktop area)
- [x] Zustand stores (windows, launcher)
- [x] WindowManager + WindowFrame (drag, resize, minimize, maximize)
- [x] Addon contract trong `@namorix/core` (AddonEntry, NmxAddonManifest, AddonContext)
- [x] Frontend addon registry (registerAddon, resolveAddon, listAddons)
- [x] WindowFrame addon mounting (useEffect + registry)
- [x] Launcher + DesktopArea dùng listAddons() từ registry
- [x] Internal addon: Log Viewer (LogViewer component + mount/unmount lifecycle)
- [x] Theme system: types (`@namorix/core`), theme loader/registry (frontend), backend theme repository API
- [ ] Internal addon: File Manager
- [ ] Internal addon: Terminal
- [ ] Internal addon: Settings (includes theme picker UI)

### M4 — External Addon System (Docker)
**Status:** Not Started

- Dùng chung contract với internal addon (AddonEntry, NmxAddonManifest)
- External addon load động qua `import()` từ Docker container
- Khác biệt: handshake token auth, EventBus sandbox, Docker lifecycle

### M5 — @namorix/core npm Publishing
**Status:** Not Started

## Known Issues

- Vitest tests for auth.service listed in M2 but no test files exist
- i18n `vi.json` locale contains keys but translations are English
- `addonInstalls` table documented but not yet in schema (only 3 of 4 tables)
- `frontend/src/components/index.ts` only exports AuthPage

## Current Version

| Package | Version | Milestone |
|---------|---------|-----------|
| frontend | 0.10.1 | M3 (Auth guard dedup, Root extraction, refresh fix) |
| @namorix/core | 0.10.1 | M3 (Refresh: skip session URL, return proper error) |
| @namorix/styles | 0.2.0 | M2 |
| @namorix/ui | 0.3.0 | M2 |
| backend | 0.19.0 | M3 (ThemeController, UserService DI, AuthController refactor) |

## Version Rules

### Per-Package Versioning
- Each package tracks its own version independently
- Version reflects **when that package's deliverables change**, not project-wide milestones

### Version Bump Triggers

| Package | Bump Patch when | Bump Minor when |
|---------|----------------|-----------------|
| frontend | Bug fixes, CSS tweaks | New pages, routing changes, auth flow, i18n |
| @namorix/core | Bug fixes | New type, new module, breaking change |
| @namorix/styles | Token fixes | New token, new variable, new export |
| @namorix/ui | Bug fixes | New component, component breaking change |
| backend | Bug fixes, C# config tweaks | New endpoint, new service, auth feature |

## Version History

### 2026-05-15 (Addon system: contract, registry, LogViewer addon)
| Package | Version | Changes |
|---------|---------|---------|
| @namorix/core | 0.9.0 | New addon module: addon/types.ts (NmxAddonManifest, AddonContext, AddonEntry, AddonModule), barrel export |
| frontend | 0.9.0 | New addon system: registry.ts (registerAddon, resolveAddon, listAddons), WindowFrame addon mounting via useEffect + resolveAddon, Launcher + DesktopArea dùng listAddons() thay hardcoded array. New LogViewer addon (LogViewer.tsx + LogViewer.scss + LogViewer.addon.tsx) |

### 2026-05-15 (Theme system: types, loader, registry, ThemeProvider, backend API)
| Package | Version | Changes |
|---------|---------|---------|
| @namorix/core | 0.10.0 | New theme module: types.ts (ThemeManifest), loader.ts (restoreTheme, loadTheme), registry.ts (getBuiltInThemes, getAllThemes), barrel export. New providers module: ThemeProvider.tsx (ThemeContext, useTheme hook, switchTheme). New http.getJson method. New constants (NMX_THEME_CSS_ID, NMX_THEME_STORAGE_KEY). New API routes (ApiThemeRoutes, ThemeRoutes, ApiUserRoutes). |
| frontend | 0.10.0 | Theme integration: Root component with ThemeProvider wrap, restoreTheme() on app start, getAllThemes() load. Login theme sync — fetch user themeId from `/api/user/theme` → localStorage. |
| backend | 0.18.0 | New ThemeManifest model. User.ThemeId field. AppDbContext: ThemeManifests + AddonManifests DbSet + unique indexes. New UserService (GetThemeAsync, SetThemeAsync). New UserController (GET/PUT /api/user/theme). |

### 2026-05-16 (Auth fix: UserService DI, AuthController refactor, refresh + guard fixes)
| Package | Version | Changes |
|---------|---------|---------|
| backend | 0.19.0 | New ThemeController (GET /api/themes) + ThemeService. Fix: UserService register DI (lỗi 500). Fix: ThemeManifest nullable fields. Refactor: AuthController — session endpoint gọi TryRefresh() thay vì 401 ngay; cookie helpers dùng AuthService TTL methods; UserOk helper. Fix: AuthService TTL methods (GetAccessTokenExpirationDateTime, GetRefreshTokenExpiration). Config: AccessTokenExpirationMinutes → AccessTokenExpirationSeconds (appsettings + JwtConfig). |
| @namorix/core | 0.10.1 | Fix: client.ts — skip refresh cho session URL (tránh loop khi session expired). Fix: client.ts — return refreshResponse khi refresh fail thay vì fallthrough gây lỗi parse. |
| frontend | 0.10.1 | Fix: guards.ts — dedupeGuard wrapper ngăn double guard call trong React StrictMode. Chore: Root.tsx — tách Root component khỏi main.tsx. |

### 2026-05-15 (Desktop shell UI: taskbar, launcher, window manager + stores + types)
| Package | Version | Changes |
|---------|---------|---------|
| frontend | 0.8.0 | New desktop shell UI: Taskbar (clock, launcher toggle, window buttons), DesktopArea (icon shortcuts), WindowFrame (drag, resize, minimize, maximize, close), WindowManager, Launcher (start menu). New stores: window.store.ts (Zustand — open/close/focus/minimize/maximize/move/resize), launcher.store.ts. New types: WindowId, WindowState. Desktop.tsx — placeholder → full shell layout. App tokens: --nmx-taskbar-height, --nmx-window-frame-edge-size. Deps: added zustand |

### 2026-05-15 (Bug fixes: refresh token, IPv6, CSRF; multi-project migration)
| Package | Version | Changes |
|---------|---------|---------|
| backend | 0.17.1 | Bug fixes: Refresh token flow — hash Base64 lookup thay vì parse JWT; NetworkHelper — xử lý IPv6 loopback + pure IPv6; CsrfMiddleware — dùng biến `token` local cho first-request 403; Program.cs CORS — fallback về AppConfig.AllowedOrigins; PermissionService — xoá dead code; RequireAdminAttribute — int.TryParse thay vì ToString(); Logout — RevokeTokenByHash thay vì ExtractJtiFromToken. Refactor: multi-project migration (Namorix.Core, Namorix.Adapters, Namorix.Server, Namorix.Workers). Cleanup: ExtractJtiFromToken, using SQLitePCL dư |
| @namorix/core | 0.8.1 | guards.ts: extracted DefaultPaths as reusable const object |
| frontend | 0.7.1 | App.tsx: Blocked page health check on mount; guard wiring refinements |

### 2026-05-15 (Permission/RBAC system, auth middleware, attribute filters, CORS dynamic config)
| Package | Version | Changes |
|---------|---------|---------|
| backend | 0.17.0 | New Permission/RBAC system: PermissionController, UserPermissionController, PermissionService (cached), Permission/UserPermission models; New middleware: AuthMiddleware (JWT decode → HttpContext.User), NotFoundMiddleware (404 → ApiResponse JSON), RequireAuthAttribute, RequireAdminAttribute, RequirePermissionAttribute; New constants: HttpHeaders, Time, User (Admin=1/User=0); New Responses/ForbiddenObjectResult; SettingsController dynamic CORS origins (IMemoryCache); SettingsService generic GetListAsync/SetListAsync; AuthController session user existence check + cookie cleanup on invalid user; PermissionService with assignment/revocation + cache |

### 2026-05-14 (Trusted proxy detection, health endpoint, Blocked page, error code refactoring)
| Package | Version | Changes |
|---------|---------|---------|
| @namorix/core | 0.8.0 | New types: MiddlewareErrorCodes tách từ HttpErrorCodes; ApiResponse thêm statusCode; api-routes thêm ApiMiddlewareRoutes; client.ts inject HTTP status code via spread; validation-messages thêm formatMiddlewareError; i18n thêm common.errors.untrustedProxy |
| frontend | 0.7.0 | New Blocked page (switch-case theo error code), Blocked.scss (color-mix), health.controller.ts, controllers restructuring (assets/controllers/ → controllers/), App.tsx health check on mount với blocking logic, i18n thêm blocked section (4 error types) |
| backend | 0.16.0 | New HealthController (GET /api/health), NetworkHelper (CORS origin validation), Error.cs refactoring (tách MiddlewareErrorCodes), TrustedProxyMiddleware trả về JSON ApiResponse, middleware pipeline reorder (UseCors trước UseTrustedProxy) |

### 2026-05-14 (Workspace restructure: packages → frontend/ + shared → core)
| Package | Version | Changes |
|---------|---------|---------|
| frontend | 0.6.0 | Workspace restructure: xoá root package.json, pnpm-workspace.yaml, tsconfig.base.json; chuyển `packages/*` vào `frontend/packages/*`; frontend tự đứng với workspace riêng; eslint.config.js→.ts; thêm jiti |
| @namorix/core | 0.7.0 | Merge `@namorix/shared` vào core: types/, api-routes.ts, constants.ts; core giờ là package duy nhất cho frontend + external addon |
| root (namorix) | — | Đã xoá `package.json`, `tsconfig.base.json`, `pnpm-workspace.yaml` khỏi root — workspace chuyển vào frontend/ |

### 2026-05-14 (Cleanup: xoá backend-n + packages/backend-core)
| Package | Version | Changes |
|---------|---------|---------|
| root (namorix) | 0.3.1 | Xoá thư mục `backend-n/` (Node.js backend cũ) và `packages/backend-core/` (TypeScript utilities). Cập nhật docs: CLAUDE.md, README.md, architecture.md, memory files, m2-auth.md, m4-addon-system.md, skill file |

### 2026-05-14 (latest — TrustedProxyMiddleware, SettingsController)
| Package | Version | Changes |
|---------|---------|---------|
| backend | 0.15.0 | TrustedProxyMiddleware (chỉ trust X-Forwarded-For từ IP trong trusted list, block untrusted proxy), SettingsController (GET/PUT /api/settings/proxies), SettingsService GetTrustedProxies/SetTrustedProxies, HttpContextKeys (TrustedProxy, RealIp, RealScheme), GetClientIp dùng RealIp từ context trước, fallback RemoteIpAddress |
| frontend | 0.5.4 | main.tsx conditional API URL (izerocs.space → https), vite.config.ts conditional X-Forwarded-For forward (chỉ forward nếu đã có từ upstream) |
| root (namorix) | 0.3.0 | Backend 0.15.0 new feature (trusted proxy system) |

### 2026-05-13 (SecurityHeaders, Settings cache, SecureCookie fix)
| Package | Version | Changes |
|---------|---------|---------|
| backend | 0.14.1 | SecurityHeadersMiddleware (X-ContentType-Options, X-Frame-Options, X-XSS-Protection, Referrer-Policy), SettingsService IMemoryCache (5min), SecureCookie dùng AppConfig trực tiếp thay vì AllowedOrigins heuristic, UseXForwardedHeaders extension (KnownNetworks/KnownProxies clear), Kestrel 10KB body limit, JsonErrorMiddleware StatusCodes constants, AccessToken TTL 15→5 |
| frontend | 0.5.3 | Enable Vite proxy /api, API URL default fix (bỏ hardcoded port) |
| root (namorix) | 0.2.1 | Backend 0.14.1 + frontend 0.5.3 patches |

### 2026-05-13 (CSRF, rate limiting, token cleanup)
| Package | Version | Changes |
|---------|---------|---------|
| backend | 0.14.0 | Add CsrfMiddleware, rate limiting (100 req/min), TokenCleanupService (BackgroundService), AppConfig CsrfEnabled/SecureCookie, HttpErrorCodes.RateLimitExceeded, ApplicationBuilderExtensions.UseCsrfProtection, Program.cs pipeline update |
| root (namorix) | 0.2.0 | Backend 0.14.0 new features |

### 2026-05-13 (Validation system expansion)
| Package | Version | Changes |
|---------|---------|---------|
| backend | 0.13.0 | Validation expansion: FormatValidationRule, EnumValidateRule, ApiResponse refactor (Error/Field/Meta), JsonErrorMiddleware Validated flag, AuthService ValidateAndParseToken extracted, empty string→Required fix, HttpContextKeys constant, global usings cleanup |
| root (namorix) | 0.1.9 | Backend 0.13.0 validation expansion |

### 2026-05-13 (Naming migration + docs cleanup)
| Package | Version | Changes |
|---------|---------|---------|
| backend | 0.12.0 | Add custom [Validate] attribute for auth endpoints: IValidationSchema, ValidateAttribute, ValidationRule; LoginSchema, RegisterSchema using AuthConstraints; JsonErrorMiddleware bug fix (remove FlushAsync) |
| Package | Version | Changes |
|---------|---------|---------|
| root (namorix) | 0.1.8 | Docs cleanup: xóa backend-go/ + docs/migration-backend-go.md, xóa AGENTS.md references, update README code examples |
| frontend | 0.5.2 | i18n text: "Sign in" → "Log in", "Sign up" → "Register" across en.json + page links |
| @namorix/core | 0.6.3 | Field refactoring: needsSignup→needsRegister, signUpEnabled→registerEnabled; guards updated; validation-messages key renamed |
| @namorix/shared | 0.7.0 | **Breaking:** AuthStatus.needsSignup→needsRegister, signUpEnabled→registerEnabled; AuthErrorCode.SIGNUP_CLOSED→REGISTER_CLOSED |
| backend | 0.11.0 | CORS middleware (AddCors/UseCors with AllowCredentials); SettingsService method renames; JsonErrorMiddleware StatusCodes fix |

### 2026-05-12 (Bug fix session)
| Package | Version | Changes |
|---------|---------|---------|
| root (namorix) | 0.1.7 | Bug fix: auth guard loop (checkHasUsers/isAuthenticated catch 401 instead of throw) |
| backend | 0.10.0 | New: ExceptionMiddleware, JsonErrorMiddleware, ApplicationBuilderExtensions for consistent JSON error responses |
| @namorix/core | 0.6.2 | Bug fix: checkHasUsers() and isAuthenticated() catch 401 instead of throwing |

### 2026-05-12 (Phase 4 complete)
| Package | Version | Changes |
|---------|---------|---------|
| root (namorix) | 0.1.6 | C# migration Phase 4 complete: AuthController (7 endpoints), typed ApiResponse<T>, route rename (login/register/logout) |
| backend | 0.9.0 | AuthController with 7 endpoints (login, register, logout, logout-all, session, refresh, status), typed ApiResponse<T>, SettingsService, CleanIp helper, GetClientIp proxy chain |
| @namorix/shared | 0.6.1 | Route naming: signin→login, signup→register, signout→logout |
| @namorix/core | 0.6.1 | Guard route references updated to match new API route naming |
| frontend | 0.5.1 | Login/Register pages renamed, route wiring updated to new API routes |

### 2026-05-12 (latest)
| Package | Version | Changes |
|---------|---------|---------|
| root (namorix) | 0.1.5 | Backend C# migration Phase 4: AuthController with 7 endpoints, typed ApiResponse<T> |
| backend | 0.8.0 | Add AuthController (signin/signup/signout/signout-all/session/refresh/status), ApiResponse<T> typed responses, UserResponse, StatusResponse, SettingsService, CleanIp helper |

### 2026-05-12 (Phase 1-3)
| Package | Version | Changes |
|---------|---------|---------|
| root (namorix) | 0.1.4 | Backend C# migration Phase 1-3: AuthService, Config/Constants/Exceptions folders, IOptions<T> pattern |
| backend | 0.7.0 | New AuthService module (Login, Register, RefreshToken, RevokeToken, fingerprint check), Config pattern (IOptions<JwtConfig>), Settings model, Constants/Exceptions folders |

### 2026-05-10 (latest)
| Package | Version | Changes |
|---------|---------|---------|
| root (namorix) | 0.1.3 | Bump any package (Phase B: core 0.6.0, backend 0.6.2) |
| @namorix/core | 0.6.0 | Add fingerprint module (`FingerprintComponents` interface, `generateFingerprint()`, SHA-256 hash with base64 fallback), attach fingerprint header in `RequestBuilder.json()` |
| backend | 0.6.2 | Phase B complete: fingerprint verify Option C balanced in `refreshToken()` — revoke if fingerprint + IP changed; allow if only fingerprint changed (browser/OS update) |

### 2026-05-10 (Phase B)
| Package | Version | Changes |
|---------|---------|---------|
| @namorix/core | 0.6.0 | Add `generateFingerprint()` + `FingerprintComponents` interface, SHA-256 hash in `RequestBuilder.json()` |
| backend | 0.6.1 | Add fingerprint verification in `refreshToken()` with Option C (balanced) — revoke only when both fingerprint and IP change |

### 2026-05-10 (later)
| Package | Version | Changes |
|---------|---------|---------|
| root (namorix) | 0.1.3 | JWT TTL config/env fix, rememberMe frontend wiring, useAuthForm dedup |
| frontend | 0.5.1 | Fix rememberMe toggle (wired to backend); add useAuthForm hook (dedup alert state + error handling in Login/Register) |
| @namorix/backend-core | 0.5.1 | signAccessToken accepts optional TTL param; remove generateTokenPair + TokenPair (dead code) |
| backend | 0.6.1 | signIn/refreshToken use config TTLs instead of hardcoded; add JWT_REFRESH_REMEMBER_TTL env var |

### 2026-05-10 (earlier)
| Package | Version | Changes |
|---------|---------|---------|
| root (namorix) | 0.1.2 | Add lint workspace script (pnpm -r run lint) |
| @namorix/shared | 0.6.0 | Add UserAgent + Fingerprint http headers; type→interface for AuthResult, User, ValidationErrorMeta, ValidationRule, ValidationMessage; eslint config + tsconfig |
| @namorix/backend-core | 0.5.0 | Add cookie wrappers (set/get/clear for access, refresh, csrf); CSRF double-submit middleware; verifyToken returns JwtPayload\|null; signRefreshToken accepts optional TTL (StringValue); eslint config; add @types/ms |
| @namorix/core | 0.5.2 | eslint config; type→interface refactors |
| backend | 0.6.0 | refresh_tokens whitelist (replaces revoked_tokens) with userAgent, fingerprint, ipAddress, lastUsedAt; signout-all endpoint; remember-me (90d TTL preserved on rotation); CSRF enabled by default (CSRF_DISABLE=false); remove verifyAccessToken (redundant after verifyToken null-return); cookie wrappers moved to backend-core; eslint fix (any, template literal, async, type assertions) |

### 2026-05-09 (later)
| Package | Version | Changes |
|---------|---------|---------|
| root (namorix) | 0.1.1 | Auto token refresh fix (bug fix in @namorix/core) |
| @namorix/core | 0.5.1 | Add 401 auto-refresh + retry in RequestBuilder.json() |

### 2026-05-09
| Package | Version | Changes |
|---------|---------|---------|
| root (namorix) | 0.1.0 | Add license field (GPL-3.0-only), sync versions to package.json files |
| @namorix/backend-core | 0.4.0 | Add CSRF middleware (setCsrfCookie, validateCsrf), create tsconfig.json |
| @namorix/core | 0.5.0 | Fix isAuthenticated (async fetch /session), CSRF auto-header in RequestBuilder, remove HttpHeader (moved to shared) |
| @namorix/shared | 0.5.0 | Add NMX_COOKIE_CSRF_KEY, SystemErrorCode.CSRF_MISMATCH, HttpHeader (moved from core, lowercase for Express) |
| frontend | 0.5.0 | Async isAuthenticated fix, CSRF token in requests |
| backend | 0.5.0 | Add CSRF_MODE env var + csrfMode config |
| @namorix/styles | 0.2.0 | Add variables.scss ($nmx-breakpoint-collapse) + package.json exports |

### 2026-05-09 (earlier)
| Package | Version | Changes |
|---------|---------|---------|
| @namorix/backend-core | 0.3.0 | Add decorator system (@Controller, @Get, @Post, @Validate, registerController) |
| @namorix/core | 0.4.0 | Add NmxI18n class, ValidationRunner, validation-messages, formatApiError |
| @namorix/shared | 0.4.0 | Add ValidationErrorCode enum, AuthErrorCode enum, rename ValidateErrorCode→ValidationErrorCode |
| frontend | 0.4.0 | Login connected, client-side validation, i18n layering |
| backend | 0.4.0 | Refactor routes to decorator-based, @Validate on signIn/signUp |

### 2026-05-08
| Package | Version | Changes |
|---------|---------|---------|
| backend | 0.3.0 | Use createMiddleware from backend-core, validate middleware, fix tsconfig |
| @namorix/shared | 0.3.0 | Add ValidateErrorMeta type, ValidateErrorCode constants |
| @namorix/core | 0.3.0 | Add ApiError class with fromResponse(), http module |
| frontend | 0.3.0 | Add auth.controller.ts, connect Register to real API |
| @namorix/ui | 0.3.0 | Add @types/react, scss.d.ts, use FormHTMLAttributes |
| @namorix/backend-core | 0.2.0 | Add createMiddleware, validate middleware, cookie/response utils |

### 2026-05-07
| Package | Version | Changes |
|---------|---------|---------|
| backend | 0.1.0 | Auth endpoints (signin/signup/signout/session), config, secret management |
| @namorix/backend-core | 0.1.0 | NmxDataBase class, logger with tag + timestamp, jwt utilities |
| @namorix/shared | 0.1.0 | Types (UserPublic, ApiResponse), constants, errors |
| @namorix/styles | 0.1.0 | CSS tokens, reset, fonts |
| @namorix/ui | 0.2.0 | NmxButton, NmxForm, NmxInlineAlert, NmxSwitch components |

### 2026-05-06
| Package | Version | Changes |
|---------|---------|---------|
| frontend | 0.0.1 | Initial Vite project, React Router setup |
| @namorix/core | 0.0.1 | cx utility |
