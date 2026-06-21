# M4 — External Addon System (Docker)

## Goal

Cho phép cài đặt, quản lý, và chạy addon từ Docker containers bên cạnh các built-in addon hiện có. External addon dùng chung contract `AddonEntry`/`AddonContext` với internal addon, nhưng load động qua Docker lifecycle thay vì bundle sẵn.

## Current State

- **Addon contract** (`NmxAddonManifest`, `AddonEntry`, `AddonContext`, `AddonModule`) đã sẵn sàng — external addon chỉ cần implement các interface này
- **Registry** (`registerAddon`, `resolveAddon`, `listAddons`) đã support runtime registration
- **Backend `AddonManifest` model** đã có trong DB (table `AddonManifests`) — chỉ cần controller/service
- **PackageCenter addon** đang là placeholder trống
- **Chưa có:** Docker.DotNet, AddonController, AddonService, DockerMonitor, frontend dynamic loading, OAuth2 flow

---

## Phase 1 — Backend Docker Integration

### 1.1 Docker.DotNet Package

Add `Docker.DotNet` NuGet package to `Namorix.Server.csproj`:

```xml
<PackageReference Include="Docker.DotNet" Version="3.125.15" />
```

Connect via Unix socket: `/var/run/docker.sock`

### 1.2 DockerService (`Services/DockerService.cs`)

Wrapper quanh Docker.DotNet client:

| Method | Description |
|--------|-------------|
| `ListContainersAsync()` | List all containers (filter by label `namorix-addon=true`) |
| `InspectContainerAsync(string id)` | Get container details (ports, status, env) |
| `PullImageAsync(string image)` | Pull Docker image with progress |
| `CreateContainerAsync(AddonContainerSpec)` | Create container from image with env vars, port mapping, labels |
| `StartContainerAsync(string id)` | Start container |
| `StopContainerAsync(string id)` | Stop container |
| `RemoveContainerAsync(string id)` | Force remove container |
| `GetContainerLogsAsync(string id)` | Stream logs |

**AddonContainerSpec** model:
- `Image` — Docker image name:tag
- `AddonId` — registered addon ID
- `PortMappings` — internal→host port
- `EnvVars` — `NMX_ADDON_ID`, `NMX_API_URL`, `NMX_PRIVATE_KEY` (PEM), `NMX_CLIENT_ID`, `NMX_REDIRECT_URI`
- `Labels` — `namorix-addon=true`, `namorix-addon-id={id}`
- `MemoryLimit`, `CpuLimit` — resource constraints

### 1.3 AddonService (`Services/AddonService.cs`)

Business logic layer:

| Method | Description |
|--------|-------------|
| `GetInstalledAddonsAsync()` | Query `AddonManifests` DB + merge với Docker container status |
| `InstallAddonAsync(InstallRequest)` | Pull image, gen key pair, create container, register in DB |
| `UninstallAddonAsync(string id)` | Stop + remove container, remove from DB |
| `StartAddonAsync(string id)` | Start container, update status |
| `StopAddonAsync(string id)` | Stop container, update status |

### 1.4 AddonManifest DB Model — Expand

Thêm fields vào `AddonManifest.cs`:

```csharp
public class AddonManifest {
    public string Id { get; init; }           // PK, addon ID duy nhất
    public string DisplayName { get; init; }
    public string? Description { get; init; }
    public string? Icon { get; init; }         // URL hoặc SVG
    public string Image { get; init; }         // Docker image:tag
    public int HostPort { get; init; }         // Container port exposed trên host
    public string? Status { get; set; }        // "installed" | "running" | "stopped" | "error"
    public string? Version { get; init; }
    public string? Author { get; init; }
    public DateTime InstalledAt { get; init; }
}
```

Cần migration mới.

### 1.5 AddonController (`Controllers/AddonController.cs`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/addons` | Admin | List installed addons + status từ Docker |
| POST | `/api/addons/install` | Admin | Install addon từ Docker image |
| POST | `/api/addons/{id}/start` | Admin | Start container |
| POST | `/api/addons/{id}/stop` | Admin | Stop container |
| DELETE | `/api/addons/{id}` | Admin | Remove container + DB record |
| GET | `/api/addons/{id}/stream` | OAuth2 (addon) | SSE stream cho widget events |
| POST | `/api/addons/{id}/command` | Admin | Send command to addon |

### 1.6 DockerMonitor (`Workers/DockerMonitor.cs`)

BackgroundService chạy tuần tự:
1. Poll Docker API mỗi 10s (hoặc watch events)
2. Detect container mới có label `namorix-addon=true`
3. Sync trạng thái container với `AddonManifests` DB
4. Push SignalR event `addon:status-changed` khi có thay đổi

### 1.7 OAuth2 Authorization Server

Namorix Server đóng vai trò **Authorization Server (AS)** cho external addon. Addon là **OAuth2 confidential client** (có client_secret).

#### Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/oauth/authorize` | Authorization endpoint — user consents |
| POST | `/oauth/token` | Token endpoint — exchange code → access_token |
| POST | `/oauth/revoke` | Revoke access_token |
| GET | `/oauth/.well-known/openid-configuration` | OIDC discovery (optional) |

#### Flow: Authorization Code Grant

```
User Browser                  External Addon              Namorix AS
     │                              │                        │
     │  1. User mở addon window     │                        │
     │─────────────────────────────>│                        │
     │                              │                        │
     │  2. Redirect to /oauth/      │                        │
     │     authorize?client_id=...  │                        │
     │     &redirect_uri=...        │                        │
     │     &response_type=code      │                        │
     │<─────────────────────────────│                        │
     │                              │                        │
     │  3. User đã login?           │                        │
     │     Nếu chưa → redirect      │                        │
     │     login → redirect back    │                        │
     │─────────────────────────────────────────────────────>│
     │                              │                        │
     │  4. Hiển thị consent screen  │                        │
     │     (scope: read, write...)  │                        │
     │<─────────────────────────────────────────────────────│
     │                              │                        │
     │  5. User approves            │                        │
     │─────────────────────────────────────────────────────>│
     │                              │                        │
     │  6. Authorization code       │                        │
     │     Redirect to addon's      │                        │
     │     redirect_uri?code=XYZ    │                        │
     │─────────────────────────────>│                        │
     │                              │                        │
     │  7. POST /oauth/token        │                        │
     │     code=XYZ                 │                        │
     │     + client_assertion       │                        │
     │     (signed JWT by addon)    │                        │
     │─────────────────────────────────────────────────────>│
     │                              │                        │
     │  8. Verify code +            │                        │
     │     client_assertion         │                        │
     │     return access_token      │                        │
     │<─────────────────────────────────────────────────────│
     │                              │                        │
     │  9. Addon gọi API với        │                        │
     │     Bearer access_token      │                        │
     │─────────────────────────────────────────────────────>│
```

#### Client Authentication: `client_assertion` (private_key_jwt)

Thay vì client_secret truyền thống, addon dùng **private_key_jwt**:
- Mỗi addon có cặp key RSA khi tạo container
- `client_assertion` = JWT signed bởi addon's private key
- Namorix verify với addon's public key (lưu trong `AddonManifests`)

```csharp
public class AddonManifest {
    // ... existing fields ...
    public string? ClientId { get; set; }        // OAuth2 client_id
    public string? PublicKey { get; set; }        // RSA public key (PEM)
    public string? RedirectUri { get; set; }       // OAuth2 redirect_uri
    public string? Scope { get; set; }             // Default scope
}
```

**Tại sao private_key_jwt thay vì client_secret:**
- Không cần share secret lúc runtime
- Key pair gen lúc install, inject public key vào DB, private key vào container env
- Container restart không mất secret (không phải handshake lại)
- Có thể rotate key mà không cần reinstall

#### Token types

| Token | Who uses | TTL | Usage |
|-------|----------|-----|-------|
| `authorization_code` | Browser → Addon | 1 phút | Exchange lấy access_token |
| `access_token` | Addon → API | 1 giờ | Bearer header cho API calls |
| `refresh_token` | Addon | 30 ngày | Obtain new access_token |

#### OAuth2Middleware

Thêm middleware xác thực access_token ở những endpoint addon cần gọi:

```csharp
// /api/addons/{id}/stream — addon gửi widget events
// /api/... — các endpoint khác addon cần access
```

Middleware check:
1. `Authorization: Bearer <token>`
2. Verify token signature (RSA, Namorix's public key)
3. Check scope
4. Set `HttpContext.User` với addon identity

#### DB Tables mới

```sql
-- OAuth clients (1-1 với addon)
oauth_clients: client_id, client_secret_hash, redirect_uri, scope, public_key

-- Authorization codes (ngắn hạn)
oauth_codes: code, client_id, user_id, scope, expires_at, redirect_uri

-- Access tokens
oauth_tokens: token_id, client_id, user_id, scope, expires_at, revoked

-- User consent
oauth_consents: user_id, client_id, scope, granted_at
```

### 1.8 SSE Stream + Command

**SSE Stream** (`GET /api/addons/{id}/stream`):
- Addon gửi widget events về shell (ví dụ: "new message", "status update")
- Backend authenticate request bằng OAuth2 access_token (Bearer)
- Forward events qua SignalR đến frontend (`addon:widget-event`)

**Command Channel** (`POST /api/addons/{id}/command`):
- Shell gửi command vào addon qua HTTP endpoint
- Backend proxy request vào container's internal HTTP endpoint
- Response trả về frontend

---

## Phase 2 — Frontend Core Changes

### 2.1 API Routes

Add `ApiAddonRoutes` in `@namorix/core/src/apiRoutes.ts`:

```typescript
export const API_ADDON_BASE = API_BASE + "/addons"

export const ApiAddonRoutes = {
  list: API_ADDON_BASE,
  install: API_ADDON_BASE + "/install",
  start: (id: string) => `${API_ADDON_BASE}/${id}/start`,
  stop: (id: string) => `${API_ADDON_BASE}/${id}/stop`,
  remove: (id: string) => `${API_ADDON_BASE}/${id}`,
}
```

### 2.2 Addon Types — External Addon

Add vào `@namorix/core/src/addon/types.ts`:

```typescript
export interface ExternalAddonManifest extends NmxAddonManifest {
  image?: string           // Docker image:tag
  hostPort?: number        // Host port của container
  status?: AddonContainerStatus
  version?: string
  author?: string
  installedAt?: string
}

export type AddonContainerStatus =
  | "installed"
  | "running"
  | "stopped"
  | "error"
  
export interface InstallAddonRequest {
  image: string            // Docker image:tag
  port?: number            // Container port (internal)
  displayName?: string
  description?: string
  icon?: string
}
```

### 2.3 External Addon Controller

Add `frontend/src/controllers/addon.controller.ts` theo pattern controller hiện có:

```typescript
// listAddons, installAddon, startAddon, stopAddon, removeAddon
// Dùng nmxHttp pattern, handle ApiError
```

### 2.4 External Addon Context Provider

Mở rộng `AddonContext` để support external addon:

```typescript
interface AddonContext {
  addonId: string
  nmxStore: typeof nmxStore
  store?: Store
  // --- Mới cho external ---
  isExternal?: boolean
  containerUrl?: string     // http://localhost:{hostPort}
  sendCommand?: (command: string, payload?: unknown) => Promise<unknown>
}
```

`containerUrl` cho phép iframe-based addon biết URL để load.
`sendCommand` cho phép addon gửi command lên backend.

---

## Phase 3 — External Addon Mount Strategies

### Option A: Iframe (Recommended cho M4)

```typescript
// externalAddonEntry.ts
export function createExternalAddonEntry(manifest: ExternalAddonManifest): AddonEntry {
  return {
    mount(container: HTMLElement, context: AddonContext) {
      const iframe = document.createElement("iframe")
      iframe.src = context.containerUrl ?? `http://localhost:${manifest.hostPort}`
      iframe.className = "nmx-external-addon-frame"
      iframe.allow = "cross-origin-isolated"
      container.appendChild(iframe)
    },
    unmount(container: HTMLElement) {
      container.querySelector("iframe")?.remove()
    },
  }
}
```

**Pros:**
- Isolation tuyệt đối (DOM, CSS, JS)
- Không cần dynamic import/build tooling
- Addon tự quản lý tech stack (React, Vue, vanilla JS đều được)
- Bảo mật tốt (sandbox attribute)

**Cons:**
- Communication qua `postMessage` — cần protocol chuẩn hóa
- Chia sẻ theme CSS phức tạp (cần inject `--nmx-*` vars vào iframe)
- Không share được Redux store trực tiếp

**postMessage Protocol:**

```typescript
// Shell → Addon
interface ShellToAddonMessage {
  type: "nmx:theme-change" | "nmx:command" | "nmx:resize" | "nmx:locale-change"
  payload: unknown
}

// Addon → Shell
interface AddonToShellMessage {
  type: "nmx:widget-event" | "nmx:open-url" | "nmx:notify"
  payload: unknown
}
```

### Option B: Dynamic Script Injection (Future — M4.1)

Dùng `import(/* webpackIgnore: true */ url)` hoặc `<script>` injection để load JS bundle từ container.

**Pros:**
- Chia sẻ được `@namorix/core`, Redux store, theme
- Render trực tiếp trong DOM shell (không iframe)
- UX mượt hơn

**Cons:**
- Rủi ro bảo mật (arbitrary code execution trong cùng origin)
- Cần sandbox (Web Worker? Shadow DOM?)
- CORS configuration phức tạp
- Phụ thuộc vào build tooling của addon

**Decision:** Bắt đầu với **Option A (Iframe)** cho M4. Chuyển sang Option B khi có use case cụ thể.

---

## Phase 4 — PackageCenter Addon

Hiện tại là placeholder (`frontend/src/addons/PackageCenter/`). Cần implement:

### UI Components

| Component | Description |
|-----------|-------------|
| `PackageCenter.tsx` | Main view — danh sách installed addons |
| `PackageCenter.addon.tsx` | Registration (giữ nguyên, chỉ cập nhật) |

### Views

**Installed Addons List:**
- Table/card list: icon, name, version, author, status badge
- Hành động: Start/Stop/Remove button theo status
- SignalR subscription: `addon:status-changed` → cập nhật realtime

**Install Dialog:**
- Input: Docker image name (`owner/name:tag`)
- Optional: display name, port mapping
- Progress indicator khi pull image
- Validation: image format, port conflict, trùng addon ID

### State Management

Add `externalAddonsSlice` vào Redux store (hoặc mở rộng `windowsSlice`):

```typescript
interface ExternalAddonsState {
  items: Record<string, ExternalAddonManifest>
  order: string[]
  loading: boolean
  installing: boolean
}
```

### Styles

SCSS module theo pattern `nmx-package-center` BEM, dùng surface tone stack.

---

## Phase 5 — SignalR for Addon Events

### Backend

Thêm SignalR hub methods:

| Event | Direction | Payload |
|-------|-----------|---------|
| `addon:status-changed` | Server → Client | `{ addonId, status }` |
| `addon:widget-event` | Server → Client | `{ addonId, event, data }` |
| `addon:log` | Server → Client | `{ addonId, message, level }` |

### Frontend

Add `useAddonEvents` hook (pattern theo `useNotificationEvents`):

```typescript
function useAddonEvents() {
  // Subscribe addon:status-changed
  // Dispatch vào externalAddonsSlice
  // Trigger PackageCenter re-render
}
```

---

## Phase 6 — Security

| Layer | Measure |
|-------|---------|
| **Container** | Read-only rootfs, non-root user, mem/cpu limits |
| **Network** | Addon chỉ gọi được backend API qua HTTP (không truy cập Docker socket) |
| **Auth** | OAuth2 Authorization Code + private_key_jwt (không shared secret lộ liễu) |
| **Key pair** | Gen khi install, inject public→DB, private→container env (mount tmpfs) |
| **Iframe** | `sandbox="allow-scripts allow-same-origin"`, CSP frame-src |
| **API** | OAuth2 access_token cho addon→backend, Admin auth cho shell→addon |
| **DB** | AddonManifests + oauth tables chỉ admin mới write được |

---

## Files Changed/Added

### Backend (New)
| File | Phase |
|------|-------|
| `Namorix.Server/Services/DockerService.cs` | P1 |
| `Namorix.Server/Services/AddonService.cs` | P1 |
| `Namorix.Server/Controllers/AddonController.cs` | P1 |
| `Namorix.Server/Workers/DockerMonitor.cs` | P1 |
| Migration update for `AddonManifests` table | P1 |

### Backend (Modified)
| File | Change |
|------|--------|
| `Namorix.Server/Program.cs` | DI: DockerService, AddonService, DockerMonitor |
| `Namorix.Server/Namorix.Server.csproj` | Add Docker.DotNet package |
| `Namorix.Core/Models/AddonManifest.cs` | Expand fields |

### Frontend Core (Modified)
| File | Change |
|------|--------|
| `packages/core/src/apiRoutes.ts` | Add `ApiAddonRoutes` |
| `packages/core/src/addon/types.ts` | Add `ExternalAddonManifest`, `AddonContainerStatus` |
| `packages/core/src/addon/index.ts` | Re-export new types |

### Frontend (New)
| File | Phase |
|------|-------|
| `src/controllers/addon.controller.ts` | P2 |
| `src/addons/PackageCenter/PackageCenter.tsx` | P4 |
| `src/addons/PackageCenter/PackageCenter.module.scss` | P4 |
| `src/hooks/useAddonEvents.ts` | P5 |
| `src/store/slices/externalAddonsSlice.ts` | P4 |
| `src/store/selectors/externalAddonsSelectors.ts` | P4 |
| `src/services/externalAddonEntry.ts` | P3 (iframe strategy) |

### Frontend (Modified)
| File | Change |
|------|--------|
| `src/addons/PackageCenter/PackageCenter.addon.tsx` | Update registration |
| `src/addons/index.ts` | Uncomment/import PackageCenter |
| `src/store/store.ts` | Register externalAddonsSlice |
| `src/components/Desktop/Desktop.tsx` | Mount `useAddonEvents` |

---

## Execution Order

```
Phase 1 (Backend Docker)
  ├── 1.1 Docker.DotNet package
  ├── 1.5 AddonController (CRUD endpoints)
  ├── 1.2 DockerService (container operations)
  ├── 1.3 AddonService (business logic + DB)
  ├── 1.4 AddonManifest model expand + migration
  ├── 1.6 DockerMonitor (background service)
  └── 1.7 OAuth2 Authorization Server + 1.8 SSE stream

Phase 2 (Frontend Core)
  ├── 2.1 ApiAddonRoutes
  ├── 2.2 External addon types
  └── 2.3 Addon controller

Phase 3 (Mount Strategy)
  └── 3.1 Iframe entry (externalAddonEntry.ts)

Phase 4 (PackageCenter UI)
  ├── 4.1 Redux slice
  ├── 4.2 Main PackageCenter component
  └── 4.3 SCSS styles

Phase 5 (SignalR Events)
  ├── 5.1 Backend hub methods
  └── 5.2 Frontend useAddonEvents hook

Phase 6 (Integration)
  ├── Wire up DI + store
  ├── Test OAuth2 flow
  └── Documentation + version bump
```

## Version Bumps

| Package | Version | Reason |
|---------|---------|--------|
| Namorix.Server | 0.37.2 → 0.38.0 | New module: AddonController, DockerService, DockerMonitor |
| Namorix.Core | 0.36.3 → 0.37.0 | AddonManifest model expanded |
| @namorix/core | 0.35.1 → 0.36.0 | New types, API routes |
| frontend | 0.44.3 → 0.45.0 | PackageCenter UI, new hooks, controller |
