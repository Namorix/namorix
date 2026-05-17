# Active Context

## Current Work Focus

M3 — Desktop Shell UI ✅ + Addon System (contract, registry, Log Viewer) ✅

- Desktop shell: Taskbar, DesktopArea, WindowManager, Launcher ✅
- DesktopArea + Taskbar refactored into modular sub-components (DesktopIcon, DesktopAreaView, TaskbarAppButton, TaskbarView) ✅
- New useTaskbarClock hook for live clock ✅
- Addon contract dùng chung cho system + external: AddonEntry, NmxAddonManifest, AddonContext
- Internal addon (built-in) và external addon (Docker) — cùng contract, khác cách load + permission
- Frontend: `addons/registry.ts` (registerAddon, resolveAddon, listAddons), `*.addon.ts`, bootstrap qua `addons/index.ts`
- LogViewer addon: LogViewer.tsx + LogViewer.scss + LogViewer.addon.tsx (useEffect+registry mount)
- Backend addon metadata deferred — chỉ cần khi M4 external addon
- WindowFrame mount addon vào content area qua ref + AddonEntry lifecycle

## Recent Changes (2026-05-17)

### Taskbar/WindowFrame refactor, WindowManager flatten, blocked SCSS migration
- **@namorix/styles (0.7.0 → 0.7.1)**: Icomoon rebuilt with new glyphs (fonts.scss +21 lines, variables.scss +3, ttf/woff/svg updated). Blocked.scss moved from frontend into shell/components/. Window.scss refined.
- **@namorix/ui (0.6.1 → 0.6.2)**: NmxIconFont.types.ts — 3 new icon symbols matching icomoon glyphs.
- **frontend (0.10.6 → 0.10.7)**: Taskbar refactored (Taskbar, TaskbarAppButton, TaskbarView — ~178 lines total). WindowFrame resize/drag overhaul (useWindowResize +127 lines, useWindowDrag +48 lines, WindowFrameView -83 lines). New WindowTitleBar and WindowResizeHandles sub-components. WindowManager flattened from subdirectory to single file. Window.store refactored (+68 lines). Blocked.tsx unused import removed. Desktop.tsx wired to new components.

### Shell SCSS migration + component refactor (WindowFrame, Launcher, AuthView)
- **@namorix/styles (0.6.0 → 0.7.0)**: Shell component SCSS moved from frontend (auth, desktop SCSS renamed into shell/components/). New shell component SCSS — taskbar.scss, window.scss. New elevation tokens (elevation.scss). New app-logs icon. Icomoon rebuilt (removed unused glyphs). Theme CSS rebuilt.
- **@namorix/core (0.10.3 → 0.10.4)**: New NmxAddonIconType = NmxIconSvgSymbol (type refinement for manifest.icon). ThemeProvider import path fix.
- **@namorix/ui (0.6.0 → 0.6.1)**: NmxIconSvg refinement, type tweaks.
- **frontend (0.10.5 → 0.10.6)**: WindowFrame split — WindowFrameView, useAddonMount, useWindowDrag, useWindowResize, WindowFrame.types. Launcher split — LauncherView, useLauncherSearch, Launcher.types. AuthPage renamed to AuthView. New barrel exports — controllers/, hooks/, stores/, all component sub-dirs. Login/Register minor fixes. SCSS files deleted from frontend (moved to styles package). main.scss moved from src/styles/ → src/.
- **README.md**: AuthPage → AuthView in directory structure and dependencies table.

## Recent Changes (2026-05-17)

### Shell refactor: DesktopArea/Taskbar modular, NmxMetaList, abstract/ restructure
- **@namorix/styles (0.5.0 → 0.6.0)**: New abstract/ (maps, palette), shell/ entry, icons/, tokens/ modules. New meta-list.scss, icon-svg.scss components. New exports: ./mixins, ./shell. Icomoon rebuilt with new glyphs. All component SCSS + theme tokens updated. Deleted empty placeholder files.
- **@namorix/ui (0.5.0 → 0.6.0)**: New NmxMetaList composite (label+value rows). New NmxIconSvg primitive. NmxIconFont new symbols, NmxCardHeader refinements, new type/utils helpers.
- **frontend (0.10.4 → 0.10.5)**: DesktopArea split (DesktopIcon + DesktopAreaView). Taskbar split (TaskbarAppButton + TaskbarView + useTaskbarClock). Blocked dùng NmxMetaList. WindowFrame SCSS + window.store cleanup.

## Recent Changes (2026-05-16)

### NmxIconFont, NmxIconBox, icon SCSS, shared types/utils
- **@namorix/core (0.10.2 → 0.10.3)**: Removed cx export from utils (moved to @namorix/ui).
- **@namorix/styles (0.4.0 → 0.5.0)**: New icomoon SCSS module (variables + @font-face), new icon component styles (icon-font, icon-box), new typography + utilities modules. base/index.scss reordered. vite.config.ts cssMinify: false.
- **@namorix/ui (0.4.0 → 0.5.0)**: New NmxIconFont primitive (symbol prop), NmxIconBox (semantic color + children). New shared types module (WithBaseProps, WithVariant, WithSemanticColor). New utils module (cx, cxSize, cxSemantic, cxVariant). Refactored all Primitives (NmxButton, NmxForm, NmxInlineAlert, NmxToggle) + NmxCard to use shared types.
- **frontend (0.10.3 → 0.10.4)**: Login, Register, Blocked, Taskbar, WindowFrame prop refactoring. Theme CSS rebuilt.

## Recent Changes (2026-05-16)

### Styles: base/components/, layouts/, dark tokens; UI: NmxCard, flatten primitives
- **@namorix/styles (0.3.0 → 0.4.0)**: New base/components/ dir (card, form, inline-alert, toggle, button SCSS), base/layouts/ (split.scss). New themes/dark/tokens.scss (dark :root vars). Fix base/tokens.scss — light colors. Fix button BEM naming (--full-width, --upper-case). vite.config.ts — SCSS entries direct, xoá remove-js-output plugin. Xoá tsconfig.json, scss.d.ts, theme index.ts entries.
- **@namorix/ui (0.3.0 → 0.4.0)**: New Components/ module — NmxCard, NmxCardContent, NmxCardBody, NmxCardHeader, NmxCardFooter. package.json exports ./Components, ./Primitives. Flattened Primitives (NmxButton, NmxInlineAlert, NmxToggle từ subfolder → flat files). Xoá SCSS khỏi ui (moved to @namorix/styles).
- **frontend (0.10.2 → 0.10.3)**: Login, Register dùng NmxCard. AuthPage import cleanup. Blocked, main, tokens CSS cleanup.

## Recent Changes (2026-05-16)

### Styles restructure: base/ + themes/, validation, dedupe, env fix
- **@namorix/styles (0.2.0 → 0.3.0)**: Restructure — base/ subdir (reset, fonts, mixins, variables, tokens), themes/ subdir (dark/index.scss). New vite.config.ts, tsconfig.json, scss.d.ts for theme CSS build.
- **@namorix/core (0.10.1 → 0.10.2)**: New env/production.ts (conditional DEV flag via package.json exports). New utils/dedupe.ts (async dedup), utils/sanitizePath.ts. Theme fixes: types (isBuiltIn, cssPath), loader ({id}/{path} pattern), registry (merged fetch), ThemeProvider (switch/restore). Guards dedupeGuard wrapper.
- **frontend (0.10.1 → 0.10.2)**: vite.config.ts theme CSS build entries. main.tsx restoreTheme. main.scss @forward → @use. AuthPage.scss tweak.
- **backend (0.19.0 → 0.19.1)**: New SetThemeSchema (IValidationSchema). SetTheme [Validate] attribute. ThemeManifest css → cssPath. AuthController TryRefresh refactor. Migrations recreated.

## Recent Changes (2026-05-16)

### Auth fix: UserService DI, AuthController refactor, refresh + guard fixes
- **backend (0.19.0)**: New ThemeController (GET /api/themes) + ThemeService. Fix: UserService, ThemeService register DI — xoá lỗi 500. Fix: ThemeManifest nullable fields. Refactor: AuthController — session endpoint gọi TryRefresh() khi token expired thay vì 401 ngay; refactor cookie helpers (SetCookie dùng AuthService TTL); UserOk helper. Fix: AuthService TTL helper methods. Config: AccessTokenExpirationMinutes → AccessTokenExpirationSeconds (appsettings + JwtConfig).
- **@namorix/core (0.10.1)**: Fix: client.ts — skip refresh cho session URL (tránh loop). Fix: client.ts — return refreshResponse khi refresh fail thay vì fallthrough parse lỗi.
- **frontend (0.10.1)**: Fix: guards.ts — dedupeGuard wrapper ngăn double guard call trong React StrictMode. Chore: Root.tsx — tách Root component khỏi main.tsx.

## Recent Changes (2026-05-15)

### Addon system architecture — unified contract (internal + external)
- **Contract dùng chung**: Internal addon (M3) và external addon (M4) dùng cùng `AddonEntry` (mount/unmount lifecycle), `NmxAddonManifest` (id, displayName, icon), `AddonContext` (addonId, locale, theme). Khác biệt: internal import tĩnh bundle sẵn + full permission; external import động từ container + EventBus sandbox.
- **Frontend**: `addons/` directory với `registry.ts` (Map-based: registerAddon, resolveAddon, listAddons), mỗi addon có `*.addon.ts` export manifest + default entry, bootstrap qua `addons/index.ts` import top-level.
- **Backend**: Không tách project mới. AddonManifest + AddonIds → Namorix.Core (Models/Constants), AddonRegistry + AddonHandshake → Namorix.Adapters (Services), AddonController → Namorix.Server (REST surface).
- **WindowFrame**: Dùng ref mount addon vào content area qua `entry.mount(el, context)` / `entry.unmount()`. Cả internal và external dùng chung cơ chế này.

### Addon contract + registry + LogViewer implementation
- **@namorix/core (0.9.0)**: New addon module — addon/types.ts (NmxAddonManifest, AddonContext, AddonEntry, AddonModule), barrel export
- **frontend (0.9.0)**: registry.ts (registerAddon, resolveAddon, listAddons), WindowFrame addon mounting (useEffect + resolveAddon), Launcher + DesktopArea dùng listAddons() thay hardcoded array
- **LogViewer addon**: LogViewer.tsx + LogViewer.scss + LogViewer.addon.tsx (mount via createRoot), registerAddon, bootstrap trong addons/index.ts
- **Backend addon metadata deferred**: Chỉ cần khi M4 external addon

### Desktop shell UI (taskbar, launcher, window manager + stores)
- **frontend (0.8.0)**: New shell components — Taskbar (clock, launcher toggle, window buttons), DesktopArea (icon shortcuts), WindowFrame (drag/resize/minimize/maximize/close), WindowManager, Launcher (start menu with system apps list). New Zustand stores — window.store.ts (windows lifecycle, z-index stacking, position/size management), launcher.store.ts (start menu toggle). New types — WindowId, WindowState. Desktop.tsx — từ placeholder `<div>Test</div>` sang full shell layout. tokens.scss — thêm --nmx-taskbar-height, --nmx-window-frame-edge-size. Deps: thêm zustand 5.0.13.

### Bug fixes + Multi-project migration
- **backend (0.17.1)**: Bug fixes: Refresh token flow (hash Base64 lookup, không parse JWT nữa), NetworkHelper IPv6 crash, CsrfMiddleware first-request 403, PermissionService dead code, RequireAdminAttribute int.TryParse, Logout dùng RevokeTokenByHash. Refactor: multi-project migration từ flat `backend/` sang `backend/src/{Namorix.Core, Namorix.Adapters, Namorix.Server, Namorix.Workers}`.

### Documentation updates
- **CLAUDE.md**: Socket.IO → SignalR (Architecture Principles, Tech Stack)
- **root README.md**: Thêm addon 3 modes, SignalR/gRPC/Docker.DotNet.Enhanced vào Tech Stack, Addon Architecture section
- **backend README.md**: Cập nhật multi-project structure, thêm tech stack entries (planned), planned addon endpoints, Docker Management + Realtime Events sections
- **frontend README.md**: Sửa structure đúng với codebase, VITE_API_URL env var, thêm Upcoming section
- **Memory bank docs**: Cập nhật systemPatterns.md, techContext.md, productContext.md, projectbrief.md với addon architecture mới (gRPC, SignalR, 3 modes, nmx_handshake_token, Event Bus)

## Recent Changes (2026-05-14)

### Trusted proxy detection, health endpoint, Blocked page, error code refactoring
- **@namorix/core (0.8.0)**: MiddlewareErrorCodes tách từ HttpErrorCodes; ApiResponse thêm statusCode field; ApiMiddlewareRoutes cho health endpoint; client.ts inject HTTP status code; formatMiddlewareError trong validation-messages
- **frontend (0.7.0)**: New Blocked page với switch-case theo error code từ API; health.controller.ts (trả về raw response); controllers restructuring (assets/controllers/ → controllers/); App.tsx health check on mount blocking route; Blocked page i18n (4 error types)
- **backend (0.16.0)**: New HealthController (GET /api/health, DisableRateLimiting); NetworkHelper (OriginAllow/IsPrivateIp); Error.cs refactor (MiddlewareErrorCodes); TrustedProxyMiddleware trả về JSON ApiResponse; CORS pipeline reorder (UseCors trước UseTrustedProxy); JsonErrorMiddleware Validated flag fix

## Recent Changes (2026-05-14)

### Workspace Restructure: packages → frontend/ + shared → core
- **frontend (0.6.0)**: Xoá root package.json, tsconfig.base.json, pnpm-workspace.yaml; chuyển `packages/*` vào `frontend/packages/*`; frontend tự đứng với workspace riêng; eslint.config.js → .ts + thêm jiti
- **@namorix/core (0.7.0)**: Merge `@namorix/shared` vào core — thêm types/, api-routes.ts, constants.ts. Core là package duy nhất cho frontend + external addon
- **root**: Đã xoá package.json khỏi root, workspace chuyển vào frontend/
- **CLAUDE.md, docs**: Cập nhật package boundaries, file structure, dev commands, scopes

### Cleanup: Xoá backend-n + packages/backend-core
- **root (0.3.1)**: Xoá thư mục `backend-n/` (Node.js backend cũ) và `packages/backend-core/` (TypeScript utilities) — đã được C# backend `backend/` thay thế hoàn toàn
- Cập nhật tất cả docs: CLAUDE.md, README.md, architecture.md, memory files, m2-auth.md, m4-addon-system.md, skill file
- Chạy `pnpm install` để cleanup lockfile

### TrustedProxyMiddleware, SettingsController
- **backend (0.15.0)**: New TrustedProxyMiddleware — chỉ trust X-Forwarded-For khi RemoteIpAddress nằm trong trusted list (từ Settings DB), block request với forwarded header từ untrusted proxy (400). New SettingsController: GET/PUT `/api/settings/proxies`. SettingsService thêm GetTrustedProxies/SetTrustedProxies (cùng IMemoryCache pattern). HttpContextKeys mở rộng (TrustedProxy, RealIp, RealScheme). GetClientIp dùng RealIp từ context trước, fallback RemoteIpAddress. Xóa UseXForwardedHeaders cũ.
- **frontend (0.5.4)**: API URL conditional (izerocs.space → https://api.izerocs.space). Vite proxy chỉ forward X-Forwarded-For nếu đã có từ upstream.
- **root (0.3.0)**: Backend trusted proxy feature

## Recent Changes (2026-05-13)

### Security Headers, Settings Cache, SecureCookie Fix, Vite Proxy
- **backend (0.14.1)**: New SecurityHeadersMiddleware (nosniff, DENY frame, XSS protection, Referrer-Policy), SettingsService IMemoryCache (5min cache), SecureCookie fix (dùng AppConfig.SecureCookie thay vì AllowedOrigins.Contains("https")), new UseXForwardedHeaders extension (KnownNetworks/KnownProxies clear), Kestrel 10KB body limit, JsonErrorMiddleware StatusCodes constants, AccessToken TTL 15→5
- **frontend (0.5.3)**: Enable Vite proxy /api, API URL default fix
- **root (0.2.1)**: backend + frontend patches

### CSRF Middleware (C#) + Rate Limiting + Token Cleanup
- **backend (0.14.0)**: New CsrfMiddleware (double-submit pattern, request header validation), rate limiting (100 req/min, built-in .NET 8 middleware), TokenCleanupService (BackgroundService, 24h interval, EF Core ExecuteDeleteAsync), AppConfig.CsrfEnabled/SecureCookie, HttpErrorCodes.RateLimitExceeded, ApplicationBuilderExtensions.UseCsrfProtection, pipeline reorder (CORS → RateLimiter → CSRF → Controllers)
- **root (0.2.0)**: New backend features — CSRF, rate limiting, token cleanup
- Migrated remaining missing features từ Node.js backend (backend-n/)

### Naming Migration — signin/signup/signout → login/register/logout
- **@namorix/shared (0.7.0)**: AuthStatus fields renamed (`needsSignup`→`needsRegister`, `signUpEnabled`→`registerEnabled`), error code `SIGNUP_CLOSED`→`REGISTER_CLOSED`
- **@namorix/core (0.6.3)**: auth.service.ts field access updated, validation-messages key renamed, guards updated
- **frontend (0.5.2)**: i18n en.json text ("Sign in"→"Log in", "Sign up"→"Register"), page links updated
- **backend (0.12.0)**: SettingsService method renames (`IsSignUpEnabled`→`IsRegisterEnabled`), CORS middleware added, custom [Validate] attribute (IValidationSchema, ValidateAttribute, ValidationRule, LoginSchema, RegisterSchema), JsonErrorMiddleware fix
- **Docs**: architecture.md, m1-shell-ui.md, m2-auth.md, m5-core-package.md, frontend/README.md, .claude/CLAUDE.md all updated
- **Memory bank**: progress.md, activeContext.md, systemPatterns.md all updated

### Validation System Expansion (C#)
- **FormatValidationRule**: Regex pattern matching for format validation
- **EnumValidateRule**: `Enum.IsDefined` check for enum validation
- **ApiResponse refactor**: Added `Error`, `Field`, `Meta` properties to match TypeScript schema; `Fail()` overloads for auth vs validation errors
- **JsonIgnoreCondition.WhenWritingNull**: Null fields omitted from JSON responses
- **JsonErrorMiddleware fix**: Uses `HttpContext.Items["Validated"]` flag to distinguish custom 400 (keep) from ASP.NET model-binding 400 (override)
- **HttpContextKeys constant class**: Typed key for `"Validated"` to prevent typos
- **AuthService cleanup**: Extracted `ValidateAndParseToken` private method, removed debug Console.WriteLine
- **User model fix**: `CreateAt`→`CreatedAt`, `UpdateAt`→`UpdatedAt`
- **ValidationRule fixes**: Empty string now correctly reports `Required` instead of min/max; nullable Min/Max handled correctly
- **ValidationErrorCodes/HttpErrorCodes**: Proper error code constants instead of hardcoded strings
- **ValidationMeta class**: Structured constraint metadata (minLength, maxLength, min, max, pattern, enum) for frontend i18n
    
### Custom [Validate] Attribute (C#)
- **backend/Validation/**: New directory with schema-based validation system
- **IValidationSchema**: Marker interface for validation schemas
- **ValidateAttribute**: ActionFilterAttribute that validates action arguments against schema properties
- **ValidationRule**: Abstract base + StringValidationRule with MinLength, MaxLength, Trim support
- **LoginSchema/RegisterSchema**: Use AuthConstraints constants (UsernameMinLength=1, UsernameMaxLength=32, PasswordMinLength=8)
- AuthController endpoints now use `[Validate(typeof(LoginSchema))]` and `[Validate(typeof(RegisterSchema))]` instead of `ModelState.IsValid` check
- Fix: ValidateAttribute condition was inverted (needed `!IsAssignableFrom` not `IsAssignableFrom`)
- Fix: ValidationRule MaxLength check had wrong operator (`<` instead of `>`)
- Fix: JsonErrorMiddleware removed unnecessary `FlushAsync` call

### Go Migration Artifacts Removed
- `backend-go/` directory deleted (go.mod, go.sum, internal/db/*.go)
- `docs/migration-backend-go.md` deleted
- All `backend-go` references cleaned from project

### AGENTS.md References Cleaned
- `.claude/skills/` — all references updated to CLAUDE.md, `.claude/memory/`, `.claude/rules/`
- `README.md` — AGENTS.md removed from directory tree

## Recent Changes (2026-05-12)

### Bug Fix Session
- **Auth guard loop fix**: `checkHasUsers()` and `isAuthenticated()` now catch 401 instead of throwing, fixing infinite redirect loop on fresh session
- **ExceptionMiddleware + JsonErrorMiddleware**: Consistent JSON error responses for 415 Unsupported Media Type and 500 Internal Server Error
- **ApplicationBuilderExtensions**: Clean middleware wiring in `Program.cs`

### C# Backend Migration — Phase 4 (latest)
- **AuthController**: 7 endpoints (login, register, logout, logout-all, session, refresh, status)
- **Typed responses**: `ApiResponse<T>`, `UserResponse`, `StatusResponse` (no more anonymous objects)
- **SettingsService**: `IsRegisterEnabled()`, `SetRegisterEnabled()`, `GetAuthStatus()`
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
- All guards (`createAuthGuard`, `createLoginGuard`, `createRegisterGuard`) now `await` the async `isAuthenticated()`
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

### logout-all Wired
- `/logout-all` endpoint wired in `backend/src/routes/auth.ts`
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
- Login: INSERT into whitelist with session metadata
- Refresh: DELETE old token + INSERT new token (rotation), preserves TTL via `remainingSeconds`
- Logout: DELETE by jti
- Logout-all: DELETE WHERE userId = ?
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
- `Login` passes `refreshTtl` based on `meta.rememberMe`: `config.jwtRefreshRememberTtl` (default `"90d"`) vs `config.jwtRefreshTtl` (default `"7d"`)
- On refresh: remaining TTL calculated from `existing.expiresAt`, preserved in new token
- Uses `StringValue` type from `ms` for proper `expiresIn` typing in `jwt.sign`
- Frontend `rememberMe` toggle now wired through controller → backend

### JWT TTL Config Refactor
- `signAccessToken` now accepts optional `ttl?: string` param (uses `ACCESS_TOKEN_TTL` constant as fallback)
- `Login` and `refreshToken` pass `config.jwtAccessTtl` / `config.jwtRefreshTtl` / `config.jwtRefreshRememberTtl` from env
- Removed `generateTokenPair` + `TokenPair` interface (dead code — auth service calls signAccessToken/signRefreshToken directly)
- New env var: `JWT_REFRESH_REMEMBER_TTL` (default `"90d"`)

### useAuthForm Hook + rememberMe Fix
- `frontend/src/hooks/useAuthForm.ts` — extracts shared alert state (`busy`, `alertVariant`, `alertMessage`) and error handling (`handlerError`) from Login/Register
- Fix: `rememberMe` toggle in Login now wired via `authController.login(username, password, rememberMe)` → backend receives `rememberMe` boolean

### ESLint strictTypeChecked Across All Packages
- Added `eslint.config.ts` + `tsconfig.json` to backend-core, core, shared
- All configs extend `strictTypeChecked` + `stylisticTypeChecked`
- Root `package.json` now has `"lint": "pnpm -r run lint"` script
- Fixed 20+ ESLint errors (any from req.body/req.headers, dead code, async without await, template literal, type assertions)

## Recent Changes (2026-05-15 — Theme System Design)

### Theme system architecture decisions
- **Theme là hệ thống riêng**, không phải addon — không dùng addon registry/contract
- **Live switch** qua hot swap `<link>` — không reload trang, giữ state
- **Mỗi theme = 1 file CSS** ghi đè `:root`, không dùng `[data-theme]` selector
- **Kho themes do backend quản lý** — validate CSS trước khi cho tải, chặn untrusted sources
- **Dùng `--nmx-*` CSS variables** — theme CSS override biến có sẵn từ `@namorix/styles`
- **localStorage + DB**: localStorage cache tránh flash + gọi API khi login sync; DB là source of truth
- **Ref:** `systemPatterns.md` — Theme System Architecture section (đầy đủ chi tiết)

### Version bumps (2026-05-15)
- **@namorix/core**: 0.9.0 → 0.10.0 — new theme module + providers + http.getJson
- **frontend**: 0.9.0 → 0.10.0 — ThemeProvider integration + login theme sync
- **backend**: 0.17.1 → 0.18.0 — ThemeManifest, UserController, UserService

### SignalR token expiry handling (M4 design)
- **Server-driven timer**: DashboardHub tự schedule expiry dựa trên JWT `exp`, không cần client gửi token
- **AuthController → IHubContext**: Khi refresh API thành công, controller gọi hub reset timer — token giữ trong HttpOnly
- **Grace period 30s**: Báo "TokenExpiring" → client có 30s gọi refresh → server kick nếu không phản hồi
- **CancellationTokenSource**: Lưu per-connection trong `ConcurrentDictionary`, hủy timer cũ khi refresh
- **Ref:** `systemPatterns.md` — SignalR Token Expiry Handling section (đầy đủ code)

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
- Logout: DELETE one jti. Logout-all: DELETE all by userId
- No token_version column needed — whitelist approach is simpler and gives per-device control

### Fingerprint Validation Strategy ✅ (Resolved — Strict)
Đã là **Strict mode**: fingerprint mismatch → `RevokeAllUserTokens`. Không cần xét IP. Code ở `RefreshToken()` lines 165-171 đã kiểm tra fingerprint !== stored fingerprint và revoke ngay.

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

### Service Error Handling — DB Failures Go Unwrapped (Intentional)
Các service method (PermissionService, SettingsService) không có try/catch cho DB operations. Nếu EF Core failed (unique constraint, connection loss, etc.), exception propagate lên controller rồi ExceptionMiddleware trả 500 generic.

**Quyết định:** Đây là lỗi hệ thống, không cần bắt. ExceptionMiddleware trả 500 đủ để người dùng biết và báo quản trị viên. Chỉ try/catch những operation quan trọng (vd: transaction rollback trong PermissionService.DeletePermission).

### Auth Filter Attribute — Inconsistent Pattern ✅ (Resolved)
Cả 3 attribute filter (`RequireAuthAttribute`, `RequireAdminAttribute`, `RequirePermissionAttribute`) đã thống nhất dùng `ActionFilterAttribute` + async `OnActionExecutionAsync`.

## Pending Fixes (TODO tomorrow)

### CSS URL resolution inconsistency
- `restoreTheme()` ghép URL từ `ThemeRoutes.themes.replace("{id}", ...)`
- `switchTheme()` dùng `manifest.css` trực tiếp — sau refresh load sai URL
- **Fix:** Option A — thêm `NMX_THEME_CSS_URL_KEY`, lưu URL thật, restore ưu tiên URL này, fallback ghép từ ID
- **Files:** `constants.ts`, `loader.ts` (thêm `saveThemePreference`), `ThemeProvider.tsx` (lưu URL khi switch), `auth.controller.ts` (lưu URL khi login sync)

### ThemeManifest types drift
- TS `ThemeManifest` thiếu `IsBuiltIn` field so với C# model — `getAllThemes()` gộp built-in + external, không phân biệt được
- **Fix:** Thêm `isBuiltIn: boolean` vào TS interface

### SetThemeRequest thiếu validation
- `UserController.cs:45-47` — `SetThemeRequest.ThemeId` thiếu `[Required]`, `[MaxLength]`
- `User.cs:16` — `ThemeId` thiếu `[MaxLength]` (các string field khác đều có)
- **Fix:** Thêm `[Required]`, `[MaxLength(100)]` vào cả 2 chỗ

### Login flow — theme fetch error propagation
- `auth.controller.ts:20-27` — Nếu GET `/api/user/theme` fail, error propagate ra caller dù login đã OK
- **Fix:** Tách try/catch riêng cho theme fetch, không block login

### `/api/themes` không có handler
- `ThemeController.cs` đã uncomment + implement, `ThemeService` register DI
- **Fix:** Đã implement ✅

### Thiếu `public/themes/registry.json`
- `ThemeRoutes.builtin` = `/themes/registry.json` — file chưa được tạo
- **Fix:** Tạo thư mục `frontend/public/themes/` + file registry JSON

## Next Steps

1. M3 — Internal addon: File Manager
2. M3 — Internal addon: Terminal (xterm.js)
3. M3 — Internal addon: Settings
4. M3 — Zustand stores (auth, addons, desktop)
5. M4 — SignalR + backend addon metadata
6. Write Vitest tests for auth.service
7. Add Vietnamese translations (vi.json is empty)
