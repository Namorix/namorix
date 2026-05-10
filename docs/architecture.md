# Kiến trúc Namorix

Tài liệu này là **source of truth** kỹ thuật cho dự án Namorix. Implementation phải bám theo đây; nếu cần thay đổi hành vi, cập nhật tài liệu trước hoặc cùng lúc với code.

---

## 1. Tổng quan

### 1.1 Mô tả sản phẩm

**Namorix** là desktop shell chạy trong trình duyệt, tự host (self-hosted). Người dùng mở URL của server, thấy giao diện desktop: taskbar, launcher, window manager. Các **system app** (File manager, Terminal, Settings, Log viewer) chạy trong cửa sổ nội bộ shell. **External addon** (ứng dụng trong Docker container) mở ở **tab mới** trên cùng trình duyệt.

**Desktop đóng vai orchestrator trung tâm:** xác thực người dùng, điều phối vòng đời container của addon, và cung cấp event bus cho toàn hệ thống.

**Lý do:** Một nút điều khiển duy nhất giúp đồng bộ session, quyền admin, và trạng thái addon; tránh mỗi addon tự làm auth riêng lẻ.

### 1.2 Triết lý kiến trúc

| Nguyên tắc | Giải thích ngắn |
|------------|-----------------|
| Desktop là auth server duy nhất | Addon và shell đều tin tưởng session do Desktop cấp; addon chỉ **verify** qua API/session, không phát hành JWT riêng. |
| Cookie HttpOnly cho token | Giảm rủi ro XSS đọc trộm token; JS chỉ gọi API same-origin hoặc CORS có kiểm soát. |
| Monorepo + package `core` publishable | Shell và addon thứ ba dùng chung contract (`@namorix/core`) để không lệch kiểu và luồng refresh. |
| SQLite + Drizzle | Đơn giản cho self-hosted một node; đủ cho user/settings/addon metadata. |
| Docker qua Unix socket | Phù hợp triển khai trên host/Linux; Desktop backend chạy cùng máy với Docker. |
| Socket.IO | Một lớp realtime thống nhất cho shell events và mở rộng sau này. |

### 1.3 Bảng tóm tắt thành phần

| Thành phần | Vai trò |
|------------|---------|
| `frontend` | UI shell React: window manager, taskbar, system apps. |
| `backend` | Express API, WebSocket shell + terminal, auth, logs, điều khiển addon. |
| `packages/core` | Client thư viện trình duyệt cho addon (auth, HTTP, events); publish npm. |
| `packages/backend-core` | Tiện ích server nội bộ: logger, JWT, DB, Docker, config. |
| SQLite | Lưu user, addon install, revoked tokens, settings. |
| Docker | Chạy external addon; discover qua label image/container. |

### 1.4 Dependency bổ sung (ngoài bảng stack chính)

Các gói sau **được phép** vì phục vụ trực tiếp phần đã mô tả trong kiến trúc; không thay thế stack đã chốt.

| Package | Nơi dùng | Lý do |
|---------|----------|--------|
| `pino` | `@namorix/backend-core` (logger) | Log có cấu trúc, hiệu năng tốt cho server Node. |
| `xterm.js` | Terminal system app | Terminal trong trình duyệt chuẩn de-facto. |
| `socket.io-client` | `@namorix/core` (events) | Cùng giao thức với server Socket.IO. |

---

## 2. Repository structure

### 2.1 Cây thư mục

```
namorix/
├── package.json                 # npm workspaces root, scripts chung
├── docs/
│   └── architecture.md        # tài liệu này (source of truth)
├── packages/
│   ├── core/                    # @namorix/core — publishable, browser-only
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── auth/           # AuthChecker interface for guards
│   │       ├── http/           # ApiError, http client
│   │       ├── i18n/           # NmxI18n class, validation-messages, validation-runner
│   │       ├── router/         # GuardedRoute, createAuthGuard, etc.
│   │       ├── config.ts       # configureCore(), getApiBaseUrl()
│   │       └── utils/          # cx (className utility)
│   ├── backend-core/            # @namorix/backend-core — shared desktop + addon
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── db/             # NmxDataBase class
│   │       ├── decorators/     # @Controller, @Get, @Post, @Validate, registerController
│   │       ├── jwt/           # signAccessToken, verifyToken
│   │       ├── logger/        # createLogger
│   │       ├── middleware/    # createMiddleware, handleJsonError
│   │       ├── utils/         # cookie helpers, sendSuccess, sendError
│   │       ├── validate/     # validate() middleware, Schema, Rule
│   │       └── index.ts
│   ├── shared/                  # @namorix/shared — backend + frontend shared
│   │   └── src/
│   │       ├── types/         # ApiResponse, ValidateErrorMeta, etc.
│   │       ├── api-routes.ts  # ApiAuthRoutes
│   │       └── constants.ts  # HttpStatus, NMX_COOKIE_*
│   ├── ui/                      # @namorix/ui — React primitives
│   └── styles/                  # @namorix/styles — SCSS tokens
├── frontend/                    # Vite + React shell
│   ├── src/
│   │   ├── assets/
│   │   │   └── controllers/
│   │   │       └── auth.controller.ts  # signUp, signIn, signOut
│   │   ├── pages/
│   │   └── components/
│   └── vite.config.ts
└── backend/                     # Express API
    └── src/
        ├── config/
        ├── routes/auth.ts
        ├── services/
        ├── middleware/          # uses createMiddleware from backend-core
        └── db/
```

**Lý do tách `core` và `backend-core`:** `core` chỉ chạy trên browser và phải publish; `backend-core` chứa Node/Docker/SQLite — tránh lẫn môi trường và tránh leak implementation server vào addon.

### 2.2 Dependency rules (ai import ai)

| Package / app | Được phép import |
|---------------|-------------------|
| `@namorix/shared` | **Không** import bất kỳ package nội bộ Namorix nào (zero internal deps). |
| `@namorix/core` | `@namorix/shared`, React ecosystem. **Không** import `@namorix/backend-core`, `@namorix/ui`, frontend, backend. |
| `@namorix/styles` | **Không** import gì — pure SCSS. |
| `@namorix/ui` | `@namorix/core` (utils), React deps. |
| `@namorix/backend-core` | `@namorix/shared`, express, pino, jsonwebtoken, drizzle, etc. **Không** import `@namorix/core`. |
| `frontend` | `@namorix/core`, `@namorix/styles`, `@namorix/ui`, `@namorix/shared`, React deps. |
| `backend` | `@namorix/backend-core`, `@namorix/shared`, Express. |
| External addon (repo khác) | `@namorix/core` từ **npm**. |

**Đồng bộ contract API:** Kiểu JSON response của REST và payload WebSocket phải khớp định nghĩa trong `shared` (`types`) và implementation backend. Khi đổi contract, đổi `shared` + backend + tài liệu cùng phiên bản.

---

## 3. `@namorix/core` — Package spec

### 3.1 Mục đích và giới hạn

- Thư viện **chỉ dùng trên trình duyệt** để addon giao tiếp với Desktop backend (session, HTTP có refresh, events).
- **Không** chứa code Node.js, **không** chứa component React/Vue/Lit, **không** thao tác DOM trực tiếp.

**Lý do:** Addon có thể viết bằng bất kỳ framework nào; `core` chỉ cung cấp logic tích hợp Namorix.

### 3.2 Subpath exports và TypeScript API

Package exports (theo `package.json`):

| Subpath | Nội dung |
|---------|----------|
| `@namorix/core` | Barrel: auth, router, utils, http, i18n, config |
| `@namorix/core/auth` | `authService` (AuthChecker implementation) |
| `@namorix/core/http` | `http` (RequestBuilder), `ApiError`, `HttpHeader` |
| `@namorix/core/router` | `GuardedRoute`, `createAuthGuard`, `createSignInGuard`, `createSignUpGuard` |
| `@namorix/core/utils` | `cx()` className utility |
| `@namorix/core/i18n` | `NmxI18n` class, `ValidationRunner`, `validate()`, `ValidationFields`, `formatApiError()`, `formatValidationError()`, `formatAuthError()` |

#### `@namorix/core/auth`

```typescript
/** Kiểm tra trạng thái auth từ cookie. */
export interface AuthChecker {
  isAuthenticated: () => boolean
  checkHasUsers: () => Promise<boolean>
  isRegistrationOpen: () => Promise<boolean>
}

export const authService: AuthChecker
```

#### `@namorix/core/http`

```typescript
// Fluent RequestBuilder pattern
export const http = {
  url(baseUrl: string): RequestBuilder
}

export class RequestBuilder {
  get(): this
  post(body?: unknown): this
  put(body?: unknown): this
  patch(body?: unknown): this
  delete(body?: unknown): this
  header(key: string, value: string): this
  async json<T>(): Promise<ApiResponse<T>>
}

// ApiError với factory từ API response
export class ApiError extends Error {
  code?: string
  field?: string
  meta?: ValidationErrorMeta
  static fromResponse(data: ApiResponse): ApiError
}
```

#### `@namorix/core/router`

```typescript
// Route guard với async check
export const GuardedRoute: React.FC<{ guard: GuardFn; children: React.ReactNode }>

export function createAuthGuard(checker: AuthChecker): GuardFn
export function createSignInGuard(checker: AuthChecker): GuardFn
export function createSignUpGuard(checker: AuthChecker): GuardFn
```

#### `@namorix/core/i18n`

```typescript
// Lớp khởi tạo i18n với namespace layering
export class NmxI18n {
  constructor()                         // pre-load core locales (en/vi)
  load(locale: string, ns: string, data: Record<string, unknown>): this
  async start(options?: { defaultNS?: string }): Promise<typeof i18n>
}

// Client-side validation runner (fluent builder)
export function validate(t: TFunction): ValidationRunner

export class ValidationRunner {
  required(field: string, value: string): this
  minLength(field: string, value: string, count: number): this
  maxLength(field: string, value: string, count: number): this
  range(field: string, value: string | number, min: number, max: number): this
  equal(field: string, value: string, expected: string): this
  custom(predicate: boolean, code: ValidationErrorCode, field: string, meta?: ValidationErrorMeta): this
  first(): string | null          // trả về lỗi đầu tiên hoặc null
}

// Hằng số field name cho type safety
export const ValidationFields = {
  USERNAME: "username",
  PASSWORD: "password",
  CONFIRM_PASSWORD: "confirmPassword",
}

// Format error từ API response
export function formatApiError(t: TFunction, err: unknown): string | null
export function formatValidationError(t: TFunction, code: string, field?: string, meta?: ValidationErrorMeta): string
export function formatAuthError(t: TFunction, code: string): string
```

#### `@namorix/core/types` (planned — M5)

```typescript
export interface NmxUser {
  id: number
  username: string
  role: number
}

export interface NmxSession {
  user: NmxUser
  expiresAt: string
}

export interface NmxAddonManifest {
  id: string
  displayName: string
  internalPort: number
}

export interface NmxNotification {
  message: string
  level?: 'info' | 'warning' | 'error'
}

export interface NmxAddonStatus {
  addonId: string
  status: 'installed' | 'running' | 'stopped' | 'error'
}

export interface NmxEventMap {
  'nmx:notification': NmxNotification
  'nmx:addon-status': NmxAddonStatus
  'nmx:deprecation': NmxDeprecation
  'nmx:handshake': { addonId: string; coreVersion: string }
}
```

### 3.3 Ví dụ — frontend controller pattern

```typescript
// frontend/src/assets/controllers/auth.controller.ts
import { http, getApiBaseUrl, ApiError } from '@namorix/core'
import { ApiAuthRoutes } from '@namorix/shared'

export const authController = {
  signIn: async (username: string, password: string) => {
    const data = await http
      .url(getApiBaseUrl() + ApiAuthRoutes.signin)
      .post({ username, password })
      .json()
    if (!data.success) throw ApiError.fromResponse(data)
  },
}
```

### 3.4 Client-side validation (frontend)

```typescript
import { validate, ValidationFields as F, formatApiError } from "@namorix/core"
import { useTranslation } from "react-i18next"

const { t } = useTranslation()

// Submit handler
const handleSubmit = async () => {
  const error = validate(t)
    .required(F.USERNAME, username)
    .minLength(F.USERNAME, username, 3)
    .required(F.PASSWORD, password)
    .minLength(F.PASSWORD, password, 6)
    .first()
  if (error) { setAlert(error); return }

  try {
    await authController.signIn(username, password)
  } catch (err: unknown) {
    setAlert(formatApiError(t, err) ?? t("auth.signin.errors.generic"))
  }
}
```

### 3.5 i18n layering

```
@namorix/core locales (namespace "core")
  └── common.validation.*, common.fields.*, common.auth.errors.*
        │
        │  NmxI18n.load("en", "translation", frontendLocales)
        ▼
frontend locales (namespace "translation")
  └── auth.signin.*, auth.signup.*
```

- `NmxI18n` constructor pre-load core locales trong namespace `"core"`
- Frontend gọi `.load(locale, "translation", data)` để thêm page-specific strings
- `start()` init i18next với `fallbackNS: ["core", "translation"]` — key trong `translation` override `core`

### 3.6 Mẫu `package.json` — field `exports`

```json
{
  "name": "@namorix/core",
  "version": "0.3.0",
  "type": "module",
  "sideEffects": false,
  "exports": {
    ".": "./src/index.ts",
    "./auth": "./src/auth/index.ts",
    "./http": "./src/http/index.ts",
    "./router": "./src/router/index.ts",
    "./utils": "./src/utils/index.ts",
    "./i18n": "./src/i18n/index.ts"
  },
  "files": ["dist"]
}
```

Đường dẫn `dist` tùy pipeline build (Vite/tsup/tsc); quan trọng là **giữ đúng subpath** khi publish npm (M5).

---

## 4. Authentication architecture

### 4.1 Nguyên tắc

- **Chỉ Desktop backend** phát hành và làm mới JWT; **addon không** là OAuth server hay issuer riêng.
- Addon (origin khác) **verify** người dùng bằng cách gọi `GET /api/auth/session` (hoặc `getSession`) với cookie (nếu same-site phù hợp) hoặc cơ chế bổ trợ do tài liệu này quy định (Bearer fallback — xem dưới).

**Lý do:** Một nguồn sự thật cho identity; giảm bề mặt tấn công và trùng lặp user store.

### 4.2 Cookie và tên

| Cookie | Mục đích |
|--------|----------|
| `nmx_access_token` | JWT access (HttpOnly, path `/`, SameSite strict). |
| `nmx_refresh_token` | JWT refresh (HttpOnly, path `/api/auth`, SameSite strict). |

### 4.3 Luồng trong shell (same-origin)

1. **Sign in:** `POST /api/auth/signin` → response JSON `{ user }` + `Set-Cookie` cho access + refresh.
2. **Bootstrap (F5):** App load → `GET /api/auth/session` (credentials: include). Nếu 401 → thử `POST /api/auth/refresh` một lần rồi gọi lại session.
3. **Refresh định kỳ / sau 401:** Frontend hoặc `createApiClient` gọi `POST /api/auth/refresh`, server set cookie mới, rotate refresh token.
4. **Sign out:** `POST /api/auth/signout` → xóa cookie, revoke token (ghi `revokedTokens` theo `jti`).

**Lý do:** Cookie HttpOnly giảm rủi ro XSS đọc token; refresh tách biệt giúp rút ngắn TTL của access token.

### 4.4 External addon — redirect flow

Addon chạy port riêng, không có cookie `nmx_access` (cross-origin).

1. Addon gọi `getSession(DESKTOP_BASE_URL)` → `null`.
2. Redirect `DESKTOP/signin?redirect=<addon URL>`.
3. Sau khi đăng nhập, Desktop redirect về `<addon URL>?nmx_token=<one-time token>`.
4. Addon exchange `nmx_token` qua `POST /api/addon/session-exchange` → nhận session.

Chi tiết đầy đủ xem mục 4.10b.

### 4.5 JWT payload (access)

Server verify và có thể trả derived user từ DB; payload tối thiểu:

```typescript
interface JwtPayload {
  userId: number
  username: string
  role: number
  jti: string
  iat: number
  exp: number
}
```

Mỗi access token có `jti`; logout/revoke ghi `jti` vào `revokedTokens` cho đến khi `exp` của token đó trôi qua (hoặc dọn dẹp theo chính sách).

### 4.6 Secret management

- Ưu tiên biến môi trường `JWT_SECRET` (production/Docker).
- Nếu không có: generate secret lần đầu, ghi `data/.secrets`, file gitignored, quyền filesystem hạn chế (ví dụ `chmod 600`).

**Lý do:** Self-hosted không bắt buộc người dùng tự tạo secret ngay từ đầu; production vẫn có thể inject qua env.

### 4.7 Default admin

Lần đầu chạy, nếu DB **không có user**: tạo user `admin` với **mật khẩu ngẫu nhiên**, in ra **console** server.

**Lý do:** Cho phép bootstrap nhanh; operator bắt buộc có quyền đọc log console hoặc đổi mật khẩu sau khi vào.

### 4.8 CSRF và Bearer fallback

| Biến môi trường | Giá trị | Ý nghĩa |
|-----------------|---------|---------|
| `NMX_CSRF_MODE` | (trống) | Không bật double-submit CSRF (phù hợp dev nhanh; production nên bật nếu dùng cookie session). |
| `NMX_CSRF_MODE` | `double-submit` | Bật pattern double-submit cookie + header cho các mutating request từ browser. |
| `NMX_ALLOW_BEARER_FALLBACK` | (trống) | Cho phép client gửi `Authorization: Bearer` như phương án phụ khi cookie không khả dụng (ví dụ addon cross-origin). |
| `NMX_ALLOW_BEARER_FALLBACK` | `false` | Chỉ chấp nhận cookie; addon phải dùng chiến lược khác (proxy same-origin hoặc redirect-only). |

**Lý do:** Cookie-first an toàn hơn cho shell same-origin; Bearer tùy chọn cho tích hợp khó dùng cookie cross-site — có thể tắt để thắt chặt.

### 4.9 Addon core version verification

Bỏ cơ chế Docker label `namorix.addon.core_version` vì addon developer có thể khai báo sai. Thay bằng runtime verification:

- `@namorix/core` hardcode `CORE_VERSION` trong source khi publish npm.
- Khi addon gọi `connectEvents()`, core tự động emit `nmx:handshake` lên `/namorix-shell-ws`:
  `{ addonId: string, coreVersion: string }`
- Desktop nhận handshake, so sánh với `MIN_SUPPORTED_CORE_VERSION`:
  - `coreVersion >= min` → cho kết nối
  - `coreVersion < min` → ngắt kết nối, emit `nmx:deprecation`, hiện warning trong Addon Manager UI

**Lưu ý:** Addon có thể tự implement WebSocket và gửi version giả — đây là hành vi cố tình phá, không phải vô tình dùng version cũ, chấp nhận được.

**Lý do:** Docker label không đáng tin cậy vì người viết addon có thể điền sai. Runtime verification đảm bảo Desktop thực sự biết addon dùng version nào.

### 4.10 Addon authentication (AddonToken)

Addon chạy độc lập trên port riêng (không phụ thuộc Desktop để mở). Desktop là auth server duy nhất. Có 2 luồng auth tách biệt:

#### 4.10a Addon server auth (server-to-server)

Khi Desktop install/start addon container:

1. Generate `AddonSecret` (random), lưu vào `addonInstalls` DB.
2. Inject vào container qua Docker env: `NMX_ADDON_SECRET=xxx`, `NMX_DESKTOP_URL=http://host:3000`.

Khi addon server khởi động:

1. Đọc `NMX_ADDON_SECRET` từ env.
2. Gọi `POST /api/addon/handshake`: `{ addonId, secret, coreVersion }`.
3. Desktop verify secret → trả `AddonToken` (long-lived, server-to-server).
4. Addon lưu `AddonToken` trong memory, dùng cho mọi API call về sau: `Authorization: Bearer <AddonToken>`.

#### 4.10b User auth trong addon (browser)

Addon chạy port riêng, không có cookie `nmx_access` (cross-origin). Flow:

1. Addon gọi `getSession(DESKTOP_URL)` → `null`.
2. Redirect sang `DESKTOP/signin?redirect=<addon URL>`.
3. Sau khi đăng nhập, Desktop redirect về `<addon URL>?nmx_token=<one-time token>`.
4. `nmx_token` là one-time, TTL ngắn (vài giây), dùng xong là hết hạn (chống replay attack).
5. Addon exchange `nmx_token` lấy session qua `POST /api/addon/session-exchange`: `{ token: nmx_token }`.
6. Desktop trả session info, addon hoạt động bình thường.

#### 4.10c Bảng tóm tắt 2 token

| Token | Ai cấp | Dùng ở đâu | Mục đích |
|-------|--------|------------|----------|
| `AddonToken` | Desktop → Addon server | Server-to-server | Addon server gọi Desktop API |
| `nmx_token` | Desktop → Browser | URL param, one-time | User auth khi vào addon port |

### 4.11 Addon revoke / shutdown

Khi Desktop stop hoặc uninstall addon:

1. Desktop gọi `POST http://host:<hostPort>/nmx/shutdown` (dùng `hostPort` từ `addonInstalls` DB) — addon graceful shutdown.
2. Đồng thời revoke `AddonToken` trong DB (thêm vào bảng `revokedTokens` hoặc xóa khỏi `addonInstalls`).
3. Nếu addon không phản hồi `/nmx/shutdown` trong vài giây → Desktop kill Docker container trực tiếp qua Docker socket.

Addon nên expose endpoint `POST /nmx/shutdown` — chỉ chấp nhận request có `AddonToken` hợp lệ trong header để tránh bị gọi tùy tiện từ bên ngoài.

### 4.12 Decorator-based routing (backend)

Backend dùng TypeScript decorator + `reflect-metadata` để khai báo route thay vì gọi `router.post(...)` thủ công.

```typescript
// backend/src/routes/auth.ts
@Controller("/api/auth")
export class AuthController {
  @Validate({
    username: { required: true, type: "string", minLength: 1, maxLength: 32, trim: true },
    password: { required: true, type: "string", minLength: 8 },
  })
  @Post("/signin")
  async signIn(req: Request, res: Response) { /* ... */ }
}
```

**Cơ chế:**
- `@Controller(prefix)` — lưu prefix vào `Reflect.defineMetadata(Symbol.for("nmx:prefix"), ...)`
- `@Get/@Post/@Put/@Patch/@Delete(path)` — lưu route vào `Reflect.defineMetadata(Symbol.for("nmx:routes"), ...)`
- `@Validate(schema)` — lưu validation schema vào `Reflect.defineMetadata(Symbol.for("nmx:validations"), ...)`
- `registerController(router, ControllerClass)` — đọc metadata, instantiate controller, đăng ký route với middleware tương ứng

**Dùng `Symbol.for()` cho metadata key** vì decorator và `registerController` nằm ở module khác nhau — `Symbol.for()` đảm bảo cùng key toàn cục.

### 4.13 Validation hai tầng

| Tầng | Vị trí | Công cụ | Cơ chế |
|------|--------|---------|--------|
| Server | `@namorix/backend-core` | `validate(schema)` middleware | Schema-based, trả `ApiResponse` với `ValidationErrorCode` |
| Client | `@namorix/core/i18n` | `ValidationRunner` (fluent builder) | Trả translated string, dùng `formatApiError()` parse lỗi từ API |

**Server-side** (`validate(schema)`):
```typescript
// Rule types: required, type, minLength, maxLength, min, max, pattern, trim, enum
validate({ field: { required: true, type: "string", minLength: 3 } })
// → Express middleware, trả 400 + apiValidateError nếu fail
```

**Client-side** (`ValidationRunner`):
```typescript
const error = validate(t)
  .required("username", username)
  .minLength("username", username, 3)
  .first()  // "Username is required" hoặc null
```

**Error codes** (`ValidationErrorCode` enum):
`REQUIRED`, `TOO_SHORT`, `TOO_LONG`, `MISMATCH`, `INVALID_FORMAT`, `INVALID_TYPE`, `OUT_OF_RANGE`, `INVALID_ENUM`

**Auth error codes** (`AuthErrorCode` enum):
`INVALID_CREDENTIALS`, `USERNAME_EXISTS`, `UNAUTHORIZED`, `SIGNUP_CLOSED`

---


### 5.1 `WindowState`

```typescript
type WindowState = {
  windowId: string        // UUID
  appId: string           // 'file-manager' | 'terminal' | 'settings' | ...
  title: string
  icon?: string
  position: { x: number; y: number }
  size: { width: number; height: number }
  minimized: boolean
  maximized: boolean
  zIndex: number
}
```

### 5.2 Zustand stores (cấu trúc)

| Store | Trách nhiệm |
|-------|-------------|
| `auth.store` | `user`, `status` (`anonymous` \| `loading` \| `authenticated`), `expiresAt`. |
| `windows.store` | `windows: WindowState[]`, `focusOrder: string[]` (windowId), `openWindow`, `closeWindow`, `focusWindow`, cập nhật position/size/min/max. |
| `addons.store` | `AddonInfo[]` đồng bộ từ event WebSocket `shell:addons`. |
| `desktop.store` | `theme`, `locale`, `wallpaper`. |

**Lý do:** Tách auth / cửa sổ / addon / giao diện giúp giảm re-render và ranh giới rõ.

### 5.3 Window Manager — focus và z-order

- `focusOrder`: mảng windowId; phần tử cuối là cửa sổ **đang focus**.
- Khi focus: đưa `windowId` lên cuối `focusOrder`; gán `zIndex` cửa sổ đó cao hơn các cửa sổ khác trong layer window (ví dụ lấy `baseWindowZ + index` hoặc `max + 1`).

**Lý do:** Mô hình đơn giản, đủ cho desktop ảo; tránh z-index cố định cứng cho từng app.

### 5.4 Drag và resize

- Dùng **Pointer Events** (`pointerdown` / `pointermove` / `pointerup`) trên thanh tiêu đề và cạnh cửa sổ.
- Trong lúc kéo/co, có thể `setPointerCapture` để không mất track.

**Lý do:** Một API thống nhất cho chuột và touch; giảm phụ thuộc legacy mouse events.

### 5.5 Z-index layer stack (shell chrome)

Giá trị tuyệt đối định nghĩa **lớp** UI; cửa sổ ứng dụng dùng lớp riêng với `zIndex` động trong khoảng window layer.

| Layer | z-index | Ghi chú |
|-------|---------|---------|
| Auth overlay | 9000 | Che toàn màn hình khi chưa đăng nhập. |
| Notification center | 8000 | Panel thông báo. |
| App launcher | 7000 | Menu mở ứng dụng. |
| Taskbar | 1000 | Luôn nổi trên **vùng nội dung cửa sổ** (số cao hơn base của window). |
| Windows (nội dung) | 100+ | `WindowManager` cấp `zIndex` tăng dần khi focus; **khung/title bar** cùng stacking với window đó. |
| Desktop icons | 50 | Nền desktop. |

**Lý do:** Taskbar và launcher luôn có thể nhận click; cửa sổ không che mất shell chrome khi cần tương tác hệ thống. Maximized window có thể mở rộng viewport nhưng vẫn để taskbar hiển thị phía trên (giống “taskbar always on top”).

### 5.6 System apps

Mỗi system app là component được mount **bên trong** `Window.tsx` theo `appId` (switch hoặc registry map).

**Lý do:** Một window manager — nhiều app; không nhúng route độc lập full-page cho từng app trong shell chính.

### 5.7 Taskbar và Launcher

- **Taskbar:** hiển thị cửa sổ đang mở, focus, minimize/restore.
- **AppLauncher:** lối tắt mở system app (tạo `WindowState` mới).

---

## 6. External addon system

### 6.1 Docker lifecycle qua Shell WebSocket

Client **admin** gửi message qua `/namorix-shell-ws` (chi tiết mục 7): `install`, `start`, `stop`, `remove`, `logs`. Server dùng `DockerClient` từ `@namorix/backend-core` để thực thi.

**Lý do:** Một kênh realtime cho thao tác dài (pull image, stream log) và đẩy cập nhật trạng thái về UI.

### 6.2 DockerMonitor và auto-discover

- `DockerMonitor` poll/listen thay đổi container; khi phát hiện container có label `namorix.addon=true`, merge vào registry addon.
- Giá trị metadata lấy từ label: `namorix.addon.id`, `namorix.addon.display_name`, `namorix.addon.internal_port`.

**Lý do:** Addon có thể được tạo ngoài UI; Desktop vẫn hiển thị đúng trạng thái.

### 6.3 Launch addon — tab mới

- Khi người dùng mở addon từ Desktop: `window.open` tới `http(s)://<host>:<hostPort>/` (hoặc path public của addon), trong đó `hostPort` lưu ở `addonInstalls.hostPort`, bind `ADDON_HOST_BIND`.

**Lý do:** Addon là ứng dụng web độc lập; tab mới tránh nhét iframe phức tạp và cookie third-party.

### 6.4 `@namorix/core` trong addon

1. `getSession` / `createApiClient` để gọi API Desktop.
2. `connectEvents` để nhận `nmx:notification`, `nmx:addon-status`, `nmx:deprecation` (và event khác server forward).

**Lưu ý:** `connectEvents()` tự động emit `nmx:handshake` khi kết nối — Desktop dùng handshake này để verify core version (xem 4.9).

**Lý do:** Thống nhất cách tích hợp cho mọi addon.

---

## 7. WebSocket architecture

### 7.1 `/namorix-shell-ws` (Socket.IO)

**Auth handshake:** Kết nối dùng cookie session (JWT trong `nmx_access`) gửi kèm handshake nếu cùng site; hoặc cơ chế Bearer nếu bật và server hỗ trợ. Server từ chối nếu không xác thực được.

**Server → Client:**

| Event | Payload | Ghi chú |
|-------|---------|---------|
| `shell:addons` | `AddonInfo[]` | Snapshot khi connect; lặp lại mỗi khi danh sách/thay đổi trạng thái. |
| `shell:addon:logLine` | `{ addonId: string, line: string }` | Stream log incremental. |
| `nmx:deprecation` | `NmxDeprecation` | Gửi khi addon core version không tương thích (xem 4.9). |

**Client → Server:**

| Event | Payload | Ghi chú |
|-------|---------|---------|
| `nmx:handshake` | `{ addonId: string, coreVersion: string }` | Emit tự động khi addon gọi `connectEvents()`; dùng cho core version verification (4.9). |
| `shell:addon:install` | `{ imageRef: string }` | |
| `shell:addon:start` | `{ addonId: string }` | |
| `shell:addon:stop` | `{ addonId: string }` | |
| `shell:addon:remove` | `{ addonId: string }` | |
| `shell:addon:logs` | `{ addonId: string, since?: number }` | |

**Reconnection strategy:**

1. Dùng client Socket.IO với `reconnection: true`, backoff mặc định.
2. Sau mỗi lần `connect`: server gửi lại `shell:addons` (full snapshot) — client **replace** state local.
3. Nếu handshake fail do 401: gọi flow refresh session (HTTP) rồi reconnect; sau N lần thất bại → đăng xuất UI / redirect signin.

**Lý do:** Tránh trạng thái addon lệch sau reconnect; refresh session xử lý cookie hết hạn giữa chừng.

### 7.2 `/namorix-terminal-ws` (PTY bridge)

**Client → Server:**

```typescript
type TerminalClientMessage =
  | { type: 'input'; data: string }
  | { type: 'resize'; cols: number; rows: number }
```

**Server → Client:**

```typescript
type TerminalServerMessage = { type: 'output'; data: string }
```

Server gắn socket với PTY (trong implementation); chỉ user đã auth được phép mở session (cùng middleware auth).

**Lý do:** Giao thức tối giản, dễ map sang xterm.js.

---

## 8. Database schema

### 8.1 Bảng và cột (Drizzle / SQLite)

Schema logic (ánh xạ Drizzle tương ứng `integer`, `text`):

**`users`**

| Cột | Kiểu | Ràng buộc |
|-----|------|-----------|
| `id` | integer | PK, autoincrement |
| `username` | text | unique, not null |
| `password` | text | not null |
| `role` | integer | not null, default 0 (bitmask, `ADMIN = 1 << 0`) |
| `createdAt` | text | not null (ISO string) |

**`addonInstalls`**

| Cột | Kiểu | Ràng buộc |
|-----|------|-----------|
| `id` | integer | PK, autoincrement |
| `addonId` | text | unique, not null |
| `imageRef` | text | not null |
| `containerId` | text | nullable |
| `hostPort` | integer | nullable |
| `status` | text | not null (`installed` \| `running` \| `stopped` \| `error`) |
| `manifestDisplayName` | text | not null |
| `manifestInternalPort` | integer | not null |
| `addonSecret` | text | not null |
| `addonToken` | text | nullable |
| `createdAt` | text | not null |
| `updatedAt` | text | not null |

**`revokedTokens`**

| Cột | Kiểu | Ràng buộc |
|-----|------|-----------|
| `jti` | text | PK |
| `revokedAt` | text | not null |
| `expiresAt` | text | not null |

Dùng chung để revoke cả access token của user và `AddonToken` (dùng `jti` giống nhau).

**`settings`**

| Cột | Kiểu | Ràng buộc |
|-----|------|-----------|
| `key` | text | PK |
| `value` | text | not null |

### 8.2 Migration strategy

- Migration Drizzle lưu trong repo (ví dụ `backend/drizzle/`).
- Khởi động server: `runMigrations(db)` từ `@namorix/backend-core` trước khi nhận traffic (hoặc bước CLI riêng trong CI/production — phải được ghi rõ trong README khi implement).

**Lý do:** SQLite không tự migrate; một lần chạy nhất quán tránh lệch schema giữa môi trường.

---

## 9. Development setup

### 9.1 Prerequisites

- Node.js (phiên bản LTS được team chốt khi khởi tạo repo; ghi vào `package.json` `engines` nếu cần).
- npm (workspaces).
- Docker (tùy chọn cho M4: build/run addon).

### 9.2 Clone và cài đặt

```bash
git clone <repository-url> namorix
cd namorix
npm install
```

### 9.3 Chạy dev (3 terminal)

| Terminal | Lệnh (đại diện) | Mục đích |
|----------|------------------|----------|
| 1 | `npm run dev --workspace backend` (hoặc tương đương) | API + WebSocket |
| 2 | `npm run dev --workspace frontend` | Vite shell |
| 3 | (tùy chọn) Docker daemon + network `namorix_net` | Test addon |

**Lý do:** Frontend và backend tách cổng (Vite thường 5173, API 3000); CORS/`DESKTOP_ORIGIN` cấu hình tương ứng.

### 9.4 Biến môi trường backend

| Biến | Ví dụ | Ý nghĩa |
|------|-------|---------|
| `PORT` | `3000` | Cổng HTTP Express. |
| `DESKTOP_ORIGIN` | `http://localhost:5173` | Origin frontend — CORS và cookie `SameSite` liên quan. |
| `COOKIE_SECURE` | `false` | Dev local HTTP; production bật `true` nếu chỉ phục vụ HTTPS. |
| `NMX_CSRF_MODE` | (trống) hoặc `double-submit` | Bật CSRF double-submit khi cần. |
| `NMX_ALLOW_BEARER_FALLBACK` | (trống) hoặc `false` | Cho phép hay cấm Bearer thay cookie. |
| `DOCKER_SOCKET_PATH` | `/var/run/docker.sock` | Unix socket Docker API. |
| `ADDON_NETWORK` | `namorix_net` | Tên Docker network gắn addon. |
| `ADDON_HOST_BIND` | `127.0.0.1` | Bind port addon về loopback (an toàn hơn mặc định). |
| `JWT_SECRET` | (trống) | Nếu set thì dùng; không thì generate file `data/.secrets`. |

---

## 10. Milestone roadmap

| Milestone | Phạm vi | Mục tiêu hoàn thành |
|-----------|---------|---------------------|
| **M1** | Shell UI tĩnh + trang auth (mock) | Layout desktop, window manager cơ bản, router, signin UI **không bắt buộc backend**. |
| **M2** | Auth backend đầy đủ | Login/logout/refresh/session/register, cookie, revoke, bootstrap admin, nối frontend thật. |
| **M3** | System apps | File manager, Terminal (xterm + `/namorix-terminal-ws`), Settings, Log viewer + API logs. |
| **M4** | External addon | Docker lifecycle qua shell WS, DockerMonitor, Addon Manager UI, mở addon tab mới. |
| **M5** | `@namorix/core` | Hoàn thiện API, publish npm, viết **addon integration guide**.

---

## Phụ lục — REST API (Desktop backend)

```
POST /api/auth/signin        body: { username, password } → { user } + Set-Cookie
POST /api/auth/signup        body: { username, password } → { user }
POST /api/auth/signout       → clear cookies, revoke token
POST /api/auth/refresh       → Set-Cookie mới (rotate refresh)
GET  /api/auth/session       → { user } | 401
GET  /api/auth/status        → { needsSignup: boolean, signUpEnabled: boolean }

POST /api/addon/handshake       body: { addonId, secret, coreVersion } → { addonToken }
POST /api/addon/session-exchange body: { token } → { user, expiresAt }

GET  /api/logs/addons       → { addons: [{ id, label }] }
GET  /api/logs?addonId=     → { logs: LogEntry[], total: number }
```

## Phụ lục — Docker labels (external addon)

```
namorix.addon=true
namorix.addon.id=homethread
namorix.addon.display_name=HomeThread
namorix.addon.internal_port=4000
```

---

*Tài liệu được sinh từ brief dự án và là chuẩn kỹ thuật cho đến khi được sửa đổi có kiểm soát.*
