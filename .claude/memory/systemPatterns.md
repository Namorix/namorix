# System Patterns

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Browser                             │
│  ┌─────────────────────┐  ┌──────────────────────────┐ │
│  │   Shell Dashboard    │  │  Terminal App             │ │
│  │  (React: shell UI +  │  │  (xterm.js)               │ │
│  │   addon DOM slots)  │  │                           │ │
│  └──────────┬──────────┘  └────────────┬─────────────┘ │
└─────────┼─────────────────┼────────────────────┼──────────┘
          │                 │                    │
          ▼                 ▼                    ▼
┌─────────────────────────────────────────────────────────┐
│               Backend (ASP.NET Core 8)                    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │
│  │   REST API   │  │ Shell WS    │  │  Terminal WS     │  │
│  │  (auth, etc) │  │ (Socket.IO) │  │  (PTY bridge)   │  │
│  └──────┬───────┘  └──────┬───────┘  └────────┬────────┘  │
│         │                 │                    │           │
│         ▼                 ▼                    ▼           │
│  ┌─────────────────────────────────────────────────────┐ │
│  │          EF Core / SQLite  │ JWT │ Logger           │ │
│  └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────┐         ┌─────────────────────────┐
│   SQLite DB     │         │   Docker (Unix socket)   │
│   (local file)  │         │   Addon containers        │
└─────────────────┘         └─────────────────────────┘
```

## Key Technical Decisions

### 1. Desktop as Only Auth Server
- Desktop issues access (15min) + refresh (7 days) JWT tokens
- Addons **verify** tokens via API call, not issue their own
- HttpOnly cookies reduce XSS risk
- **Why:** Simplicity, single source of truth for sessions

### 2. Monorepo with Publishable Packages
- `@namorix/core` — TypeScript contracts, zero deps, browser-only
- `@namorix/styles` — SCSS design tokens (--nmx-* CSS variables)
- `@namorix/ui` — React primitive components (NmxButton, NmxInput, etc.)
- **Why:** Type drift prevention, consistent design across addons

### 3. SQLite + EF Core for Database
- Single-node deployment simplicity
- No separate DB server needed for self-hosted
- **Why:** Simple, zero-config for personal/home server

### 4. SignalR for Backend Realtime Events
- Backend → Shell events: `nmx:notification`, `nmx:addon-status`, `nmx:deprecation`
- WebSocket endpoints: `/namorix-shell-ws`, `/namorix-terminal-ws`
- **Chỉ dùng cho backend communication.** Shell ↔ Addon trong browser dùng Event Bus (`@namorix/core`), không qua SignalR.

### 5. Docker via Unix Socket (Docker.DotNet.Enhanced)
- Desktop backend runs on same machine as Docker
- NuGet package: `Docker.DotNet.Enhanced` — fork maintained bởi Testcontainers team (repo gốc `Docker.DotNet` từ dotnet org không còn maintain)
- Kết nối qua Unix socket (`/var/run/docker.sock`)
- Addon containers trên `namorix_net` bridge network
- **Why:** Secure addon isolation, native Docker management

## Package Boundary (STRICT)

| Package | Can Import |
|---------|------------|
| `@namorix/core` | React ecosystem. Single package for frontend + external addons (shared merged in) |
| `@namorix/styles` | **Nothing** — pure SCSS |
| `@namorix/ui` | `@namorix/core`, React deps. Uses `--nmx-*` CSS vars from `@namorix/styles` (consumer must import) |
| `frontend` | `@namorix/core`, `@namorix/styles`, `@namorix/ui`, React deps |
| `backend` | ASP.NET Core 8 ecosystem only |

## Key Interfaces

```typescript
interface NmxSession { user: NmxUser; expiresAt: string }
interface NmxUser { id: number; username: string; role: number }
interface NmxAddonManifest { id: string; displayName: string; version: string; icon?: string }

// AddonEntry — mỗi addon phải export default interface này
interface AddonEntry {
  mount(container: HTMLElement, context: AddonContext): void
  unmount(): void
}

// AddonContext — shell truyền vào khi mount addon
interface AddonContext {
  addonId: string
  locale: string
  theme: 'light' | 'dark'
}

// Event Bus — shell ↔ addon communication (cùng JS context)
interface EventBus {
  emit<K extends keyof EventMap>(event: K, payload: EventMap[K]): void
  on<K extends keyof EventMap>(event: K, handler: (payload: EventMap[K]) => void): () => void
  off<K extends keyof EventMap>(event: K, handler: (payload: EventMap[K]) => void): void
}
```

## Design Patterns

### Error Handling
- `ApiError` for HTTP errors (statusCode, message, code, field, meta)
- Client: `formatApiError(t, err)` resolves validation→auth→null, caller provides generic fallback
- Controller: throw ApiError.fromResponse(data) on non-success

### i18n Layering
- `@namorix/core` pre-loads base locales in `"core"` namespace
- Frontend loads page strings in `"translation"` namespace via `NmxI18n.load()`
- `fallbackNS: ["core", "translation"]` ensures core translations always available

### Validation (Two-Tier)
- **Server:** `validate(schema)` middleware — Schema-based, `ValidationErrorCode` enum
- **Client:** `ValidationRunner` — fluent builder, returns translated strings
- **Bridge:** `formatApiError()` parses API response, resolves code → i18n key → formatted string

### Decorator-based Routing (Backend — C#)
- ASP.NET Core attributes: `[ApiController]`, `[Route]`, `[HttpPost]`, `[HttpGet]`, `[Validate]`
- `AddControllers()` / `MapControllers()` for built-in route registration

### Authentication (Async isAuthenticated)
- `AuthChecker.isAuthenticated()` is **async** — calls `GET /api/auth/session` with `credentials: "include"`
- HttpOnly cookies are NOT readable by `document.cookie`, must verify via API
- Guards (`createAuthGuard`, etc.) await the async check
- `http` client (RequestBuilder) always includes `credentials: "include"`

### CSRF Double-Submit Pattern
- **Server:** `setCsrfCookie` sets non-HttpOnly `nmx_csrf_token` cookie; `validateCsrf` checks header matches cookie on mutating requests
- **Client:** `RequestBuilder._body()` reads cookie and auto-injects `X-CSRF-Token` header
- **Env:** Enabled only when `CSRF_MODE=double-submit`
- **Cookie policy:** Auth cookies `httpOnly: true, sameSite: "lax"`; CSRF cookie `httpOnly: false, sameSite: "lax"`
- Attacker can't read CSRF cookie from cross-origin → cannot forge matching header

### Shell ↔ Addon Communication (Event Bus)
- Shell và addon cùng bundle → cùng JS context → không cần postMessage hay WebSocket
- Giao tiếp qua `eventBus` export từ `@namorix/core` (`emit/on/off`)
- Event types phân biệt chiều: `shell:*` → addon lắng nghe, `addon:*` → shell lắng nghe
- Shell subscribe `addon:*` events, addon subscribe `shell:*` events
- return value của `on()` là unsubscribe function, gọi trong `unmount()`
- **Không share Zustand store trực tiếp giữa shell và addon**

```typescript
type EventMap = {
  // Shell → Addon
  "shell:theme-changed": { theme: "light" | "dark" }
  "shell:locale-changed": { locale: string }
  "shell:file-open": { path: string }
  // Addon → Shell
  "addon:notification": { addonId: string; title: string; message: string }
  "addon:open-file": { addonId: string; path: string }
  "addon:request-focus": { addonId: string }
}
```

### Fingerprint Verification on Token Refresh (Option C Balanced)
- **Client:** `generateFingerprint()` creates SHA-256 hash from `FingerprintComponents` (userAgent, acceptLanguage, acceptEncoding, screenResolution, timezone, platform). Falls back to base64 if non-HTTPS.
- **Header:** Fingerprint sent via `x-device-fingerprint` header on every request (auto-attached in `RequestBuilder.json()`)
- **Server verification on refresh:**
  - Fingerprint differs BUT IP same → update fingerprint, continue (browser/OS update)
  - Fingerprint AND IP both differ → revoke ALL user tokens (high risk: possible token theft)
- **Why Option C:** Avoids false positives when users update browser (fingerprint changes but IP stays same)

### Token Whitelist (refresh_tokens)
- Replaced `revokedTokens` blacklist with `refresh_tokens` whitelist
- New columns: `userAgent`, `fingerprint`, `ipAddress`, `lastUsedAt`
- On login: INSERT into whitelist with session metadata
- On refresh: DELETE old + INSERT new (rotation), preserves TTL via `remainingSeconds`
- On logout: DELETE by jti
- On logout-all: DELETE WHERE userId = ?
- Token reuse detection: unknown jti → `revokeAllUserTokens()` (anti-theft)
- Cleanup job: DELETE expired tokens by `expiresAt < now`

### Remember-Me (90d TTL)
- `login` passes `refreshTtl` based on `meta.rememberMe`: `config.jwtRefreshRememberTtl` (90d) vs `config.jwtRefreshTtl` (7d)
- On refresh: remaining TTL calculated from `existing.expiresAt`, preserved in new token

### Frontend Controller Pattern
- API calls encapsulated in controller objects (e.g., `authController`)
- Uses `http.url().post().json()` fluent API from `@namorix/core`
- Throws `ApiError.fromResponse(data)` on non-success

### State Management (Zustand)
- Tất cả store bọc middleware `devtools` để support Redux DevTools:
  ```typescript
  import { devtools } from "zustand/middleware"
  const useWindowStore = create(devtools((set) => ({ ... }), { name: "WindowStore" }))
  ```
- File pattern: `{name}.store.ts`

| Store | Key State | Key Actions |
|-------|-----------|-------------|
| `windowStore` ✅ | `windows: WindowState[]`, `activeId` | `openWindow`, `closeWindow`, `focusWindow`, `minimizeWindow`, `maximizeWindow`, `moveWindow`, `resizeWindow` |
| `launcherStore` ✅ | `isOpen` | `toggle`, `open`, `close` |
| `authStore` | `user: User \| null`, `isAuthenticated` | `setUser`, `clearUser` |
| `addonStore` | `installedAddons`, `runningContainers` | `installAddon`, `uninstallAddon`, `startContainer`, `stopContainer` |
| `desktopStore` | `theme`, `locale`, `wallpaper` | — |

### React Component Patterns (@namorix/ui)
- Components prefixed with `Nmx` (e.g., `NmxButton`, `NmxInput`)
- Props interfaces: `[ComponentName]Props`
- CSS classes: BEM `nmx-kebab-case` (e.g., `nmx-button`, `nmx-button--primary`)
- Use CSS variables from `@namorix/styles` (--nmx-color-primary, etc.)
- Functional components only
- `shouldRender` prop for conditional rendering

## Event Flow

### Auth Flow (Current)
```
1. Login → POST /api/auth/login → Set HttpOnly cookies (access + refresh, sameSite: lax)
2. Session check → GET /api/auth/session → validate access token via cookie (credentials: "include")
3. Token refresh → POST /api/auth/refresh → rotate both tokens
4. Logout → POST /api/auth/logout → clear cookies, revoke token jti
5. CSRF on mutating requests: read nmx_csrf_token cookie → send X-CSRF-Token header
```

## Shell UI Architecture

### WindowState
```typescript
type WindowState = {
  id: string             // UUID
  app: string            // 'file-manager' | 'terminal' | 'settings' | ...
  title: string
  x: number
  y: number
  width: number
  height: number
  minimized: boolean
  maximized: boolean
  zIndex: number
}
```

### Window Manager
- `nextZIndex` counter, `activeId` tracking
- On focus: increment `nextZIndex`, assign to window, set `minimized: false`
- Drag/resize: `onMouseDown` + `document.addEventListener("mousemove"/"mouseup")` trên titlebar và 8 resize handles

### Z-index Layer Stack
| Layer | z-index | Notes |
|-------|---------|-------|
| Taskbar | 9999 | Always on top |
| Launcher overlay | 9998 | Start menu + backdrop |
| Windows | 100+ | Dynamic zIndex managed by WindowManager |
| Desktop icons | 50 | Desktop background |

### System Apps
- Each system app is mounted inside Window.tsx by appId (switch/registry map)
- Taskbar: shows running windows, focus, minimize/restore
- AppLauncher: shortcuts to open system apps (creates new WindowState)
- System apps: File Manager, Terminal, Settings, Log Viewer

## WebSocket Architecture

### /namorix-shell-hub (SignalR — Backend Events Only)
Server → Client:
| Event | Payload | Notes |
|-------|---------|-------|
| `nmx:addon-status` | `AddonInfo[]` | Backend báo trạng thái Docker container |
| `nmx:notification` | `{ title, message }` | Backend gửi notification |
| `nmx:deprecation` | `NmxDeprecation` | Incompatible core version |

Client → Server:
| Event | Payload | Notes |
|-------|---------|-------|
| `nmx:handshake` | `{ coreVersion }` | Auto-send on connect |

Reconnection: SignalR automatic reconnect; server resends state on reconnect.

**Note:** Addon communication trong browser dùng Event Bus (`@namorix/core`), không qua SignalR.
Shell ↔ Addon events (install, start, stop, remove, logs) gọi REST API, không dùng WebSocket.

### /namorix-terminal-ws (PTY bridge)
Client → Server: `{ type: 'input' | 'resize'; data: string; cols?: number; rows?: number }`
Server → Client: `{ type: 'output'; data: string }`

## External Addon System

### Mô hình tổng quát
```
Shell (Namorix Dashboard)
├── Addon Slot A  ←  addonA/addonEntry.js  ←  Docker container A
├── Addon Slot B  ←  addonB/addonEntry.js  ←  Docker container B
└── Addon Slot C  ←  addonC/addonEntry.js  ←  Docker container C
```

Mỗi addon:
- Chạy trong Docker container riêng (backend/service)
- Export file `addonEntry.js` — được shell load động
- Shell wrap trong `<div className="addon-slot addon-{addonId}">`
- Addon tự quản lý state nội bộ (có thể dùng bất kỳ thư viện nào)
- Giao tiếp với shell qua Event Bus (`@namorix/core`)

### Addon Entry Contract
```typescript
// Mỗi addon bắt buộc export default:
export default {
  mount(container: HTMLElement, context: AddonContext): void {
    // Render vào container shell cấp
    // Đăng ký event listeners
  },
  unmount(): void {
    // Cleanup listeners, timers, subscriptions
  }
}
```

### Shell Load Addon
```typescript
const addonModule = await import(/* addonEntry URL */)
addonModule.default.mount(document.getElementById(`addon-slot-${addonId}`), context)
// Khi cần unmount:
addonModule.default.unmount()
```

### CSS Isolation
- Convention-based scoping (không dùng Shadow DOM)
- Addon dùng `@namorix/ui` và `@namorix/styles` là chính
- CSS riêng của addon phải scope theo `.addon-{addonId}`
- Addon dev guide chi tiết ở M5

### Addon Modes

Addon có 3 mode hoạt động:

| Mode | Cách mở | Auth | DOM slot? | Token needed? |
|------|---------|------|-----------|---------------|
| **1. Widget** | Nhúng trong dashboard | Cookie shell (cùng origin) | ✅ | ❌ |
| **2. Full app (từ dashboard)** | `window.open` từ shell | `nmx_handshake_token` truyền qua URL | ❌ | ✅ |
| **3. Full app (direct URL)** | User tự nhập URL / bookmark → addon redirect về shell xin token | `nmx_handshake_token` (cùng flow mode 2) | ❌ | ✅ |

#### Mode 1 — Widget (DOM slot)
- Như đã mô tả ở trên: shell load `addonEntry.js`, render vào `<div className="addon-slot addon-{addonId}">`
- Dùng chung cookie của shell → auth tự động (không cần token)

#### Mode 2 — Full app từ dashboard
- User click addon → shell gọi `window.open(url)` với `nmx_handshake_token` trong query string
- Shell tạo `nmx_handshake_token` (one-time), lưu tạm, truyền qua URL cho addon
- Addon nhận token → gọi `POST /api/addon/session-exchange` → đổi lấy session
- **Cross-origin** nên không dùng được cookie shell → cần handshake token

#### Mode 3 — Direct URL (bookmark, tự gõ)
- User vào trực tiếp URL addon, không qua shell → addon frontend không có token
- Addon **redirect user về Namorix shell** kèm `returnUrl` (ví dụ: `https://namorix/auth?returnUrl=<addon-url>`)
- Namorix kiểm tra shell session, nếu valid → tạo `nmx_handshake_token` rồi redirect về addon kèm token
- Addon nhận token → gọi `POST /api/addon/session-exchange` → đổi lấy session
- **Cùng flow `nmx_handshake_token` với mode 2**, chỉ khác ai khởi tạo: mode 2 do shell chủ động `window.open`, mode 3 do addon redirect về shell xin token

### Addon Auth Flows
- **Widget mode (DOM slot):** Dùng `@namorix/core` http client — cookie shell có sẵn, tự động auth
- **Full app mode (window.open):** Dùng `nmx_handshake_token` exchange flow
- **Server-to-server:** Desktop inject AddonSecret qua Docker env, addon gọi `POST /api/addon/handshake` để lấy AddonToken
### Docker Lifecycle (M4)
- NuGet package: `Docker.DotNet.Enhanced` (fork từ `Docker.DotNet`, maintain bởi Testcontainers team)
- Kết nối Docker qua Unix socket (`/var/run/docker.sock`)
- REST API endpoints: install (pull & create), start, stop, remove container
- DockerMonitor: poll container changes, detect container với label `namorix.addon=true`
- Labels: `namorix.addon.id`, `namorix.addon.display_name`, `namorix.addon.internal_port`

---

## Backend Communication Architecture

### Tổng quan
```
Dashboard Widget / Addon Frontend (browser)
    ↕ SignalR (WebSocket + fallback)
Namorix Backend (ASP.NET Core 8)
    ↕ gRPC Bidirectional Streaming
Addon Backend (Docker container)
```
**Trạng thái hiện tại:** Backend thuần REST (5 controllers). gRPC, SignalR chưa implement.

### Namorix Backend ↔ Addon Backend: gRPC (M4)
- **Cần thêm:** package `Grpc.AspNetCore` vào server, define `.proto` file
- Namorix là **gRPC client** (chủ động connect vào từng addon), addon là **gRPC server**
- Proto: `rpc Session(stream ShellCommand) returns (stream AddonEvent)`
  - `ShellCommand`: StartCommand, PauseCommand, CancelCommand, ConfigCommand
  - `AddonEvent`: ProgressEvent, ResultEvent, LogEvent, ErrorEvent
- Addon backend có thể viết bằng bất kỳ ngôn ngữ nào (Go, Python, Node.js...)

### Dashboard / Addon Frontend ↔ Namorix Backend: SignalR (M4)
- SignalR có sẵn trong ASP.NET Core 8 — **không cần thêm package backend**
- **Cần thêm npm package:** `@microsoft/signalr` cho frontend
- Tạo Hub class, map với `app.MapHub<AddonHub>("/hubs/addon")`
- Dashboard Widget gọi `HubConnection` trong `mount()`, `stop()` trong `unmount()`
- Vì cả 2 đầu đều C# + JS, SignalR tận dụng WebSocket + fallback tự động

### Addon Frontend ↔ Addon Backend: SignalR
- Addon frontend dùng SignalR kết nối thẳng với addon backend của nó — không qua Namorix
- Addon backend C# tự host SignalR Hub, lý do giống Namorix (cùng stack, không cần package)

### Relay: gRPC → SignalR
Namorix Backend relay event từ gRPC stream của addon → forward qua SignalR Hub tới Dashboard. Có thể filter/transform trước khi relay.

| Đoạn | Protocol | Trạng thái |
|------|----------|------------|
| Namorix ↔ Addon Backend | gRPC | Chưa (M4 — cần `Grpc.AspNetCore`) |
| Dashboard ↔ Namorix | SignalR | Chưa (M4 — có sẵn ASP.NET, cần `@microsoft/signalr`) |
| Addon Frontend ↔ Addon Backend | SignalR | Addon tự làm, cùng stack C# |
