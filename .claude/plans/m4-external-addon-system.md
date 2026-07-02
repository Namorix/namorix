# M4 — External Addon System (Docker)

## Goal

Cho phép cài đặt, quản lý, và chạy addon từ Docker containers bên cạnh các built-in addon hiện có. External addon dùng chung contract `AddonEntry`/`AddonContext` với internal addon, nhưng load động qua Docker lifecycle thay vì bundle sẵn.

## Current State

- **Addon contract** (`NmxAddonManifest`, `AddonEntry`, `AddonContext`, `AddonModule`) đã sẵn sàng — external addon chỉ cần implement các interface này ✅
- **Registry** (`registerAddon`, `resolveAddon`, `listAddons`) đã support runtime registration ✅
- **Backend `AddonManifest` model** đã expand fields (Image, HostPort, Status, Version, Author, ClientId, PublicKey, RedirectUri, Scope) + migration `AddonManifestFields` ✅
- **OAuth2 Authorization Server** hoàn tất: models + service + controller + middleware ✅
- **Frontend core**: ApiAddonRoutes, external types, addon controller, AddonContext mở rộng ✅
- **Module Federation** — `@module-federation/vite` (v1.15.4) installed, `externalAddonEntry.ts` dùng `@module-federation/runtime` (`registerRemotes` + `loadRemote`) ✅
- **Redux slice** (`externalAddonsSlice`) + store registration ✅
- **PackageCenter addon** — đã implement UI với Rail+Grid+Card (All/Installed/Updated tabs) ✅
- **Docker dev/prod setup** — Dockerfile.dev (node:22-alpine), Dockerfile.prod (multi-stage), docker-compose.yml (desktop-dev + desktop-prod) ✅
- **namorix-weave** — external addon mẫu tại `~/namorix-weave/`, federation mount Hello World trên desktop đã hoạt động ✅
- **`@namorix/core`** — thiếu 4 transitive deps trong `package.json`: `react-dom`, `react-redux`, `@reduxjs/toolkit`, `@microsoft/signalr`. Cần bổ sung. ✅
- **Chưa có:** SSE stream, OAuth2 private_key_jwt full implementation, catalog sync worker

---

## Phase 1 — Backend Docker Integration

### 1.1 Docker.DotNet Package ✅

Add `Docker.DotNet` NuGet package to `Namorix.Server.csproj`:

```xml
<PackageReference Include="Docker.DotNet" Version="3.125.15" />
```

Connect via Unix socket: `/var/run/docker.sock`

### 1.2 DockerService (`Services/DockerService.cs`) ✅

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

### 1.3 AddonService (`Services/AddonService.cs`) ✅

Business logic layer:

| Method | Description |
|--------|-------------|
| `GetInstalledAddonsAsync()` | Query `AddonManifests` DB + merge với Docker container status |
| `InstallAddonAsync(InstallRequest)` | Pull image, gen key pair, create container, register in DB |
| `UninstallAddonAsync(string id)` | Stop + remove container, remove from DB |
| `StartAddonAsync(string id)` | Start container, update status |
| `StopAddonAsync(string id)` | Stop container, update status |

### 1.4 AddonManifest DB Model — Expand ✅

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

### 1.5 AddonController (`Controllers/AddonController.cs`) ✅

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/addons` | Admin | List installed addons + status từ Docker |
| POST | `/api/addons/install` | Admin | Install addon từ Docker image |
| POST | `/api/addons/{id}/start` | Admin | Start container |
| POST | `/api/addons/{id}/stop` | Admin | Stop container |
| DELETE | `/api/addons/{id}` | Admin | Remove container + DB record |
| GET | `/api/addons/{id}/stream` | OAuth2 (addon) | SSE stream cho widget events |
| POST | `/api/addons/{id}/command` | Admin | Send command to addon |

### 1.6 DockerMonitor (`Workers/DockerMonitorWorker.cs`) ✅

BackgroundService với cơ chế **event stream + health check poll**:
1. **Khởi tạo**: `SyncAllContainersAsync` full sync một lần
2. **Watcher**: Subscribe Docker events (`MonitorEventsAsync`) filter label `namorix-addon=true`
   - `start` → query container info, sync/discover
   - `stop`/`die` → set `AddonStatus.Stopped` trực tiếp, không query Docker
   - `destroy` → set `AddonStatus.Error` trực tiếp
   - Reconnect → auto full sync
3. **Health check poll**: 30s check `_lastEventTime`, im lặng >5 phút → full sync (safety net)
4. Auto-discover container mới → tạo `AddonManifest` entry
5. Sync metadata (DisplayName, HostPort) từ labels
6. Orphaned DB entries không còn container → set `AddonStatus.Error`
7. Push SignalR `addon:status-changed` qua `IAddonNotifier`/`SignalRAddonNotifier`

**Created alongside:**
- `Namorix.Core/Infrastructure/IAddonNotifier.cs` — interface
- `Namorix.Server/Infrastructure/SignalRAddonNotifier.cs` — SignalR implementation

### 1.7 OAuth2 Authorization Server ✅

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

### 2.1 API Routes ✅

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

### 2.2 Addon Types — External Addon ✅

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

### 2.3 External Addon Controller ✅

Add `frontend/src/controllers/addon.controller.ts` theo pattern controller hiện có:

```typescript
// listAddons, installAddon, startAddon, stopAddon, removeAddon
// Dùng nmxHttp pattern, handle ApiError
```

### 2.4 External Addon Context Provider ✅

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

### Module Federation (@module-federation/runtime) ✅

Dùng `@module-federation/runtime` để load remote entry từ container:

```typescript
// externalAddonEntry.ts (thực tế)
import { loadRemote, registerRemotes } from "@module-federation/runtime"

export function createExternalAddonEntry(manifest: ExternalAddonManifest): AddonEntry {
  let unmount: (() => void) | null = null

  return {
    async mount(container: HTMLElement, context: AddonContext) {
      const baseUrl = context.containerUrl ?? `http://localhost:${manifest.hostPort}`
      const remoteName = `addon_${manifest.id}`

      registerRemotes([
        { name: remoteName, entry: `${baseUrl}/assets/remoteEntry.js` },
      ])

      const Addon = (await loadRemote(`${remoteName}/Addon`)) as AddonModule
      unmount = Addon.mount(container, context)
    },
    unmount() { unmount?.() },
  }
}
```

**Lưu ý:**
- Dùng `@module-federation/runtime` (`registerRemotes` + `loadRemote`), **không phải** `vite-plugin-federation/runtime` (`loadRemoteFromManifest`)
- File entry là `remoteEntry.js` (cấu hình `filename: "remoteEntry.js"` trong federation plugin của addon), **không phải** `mf-manifest.json`
- Shell expose `react`, `react-dom`, `@namorix/core` qua `shared` trong `vite.config.ts`
- Addon khai báo `shared` trong federation config của nó, runtime tự động dùng singleton từ shell

**Lợi ích so với iframe:**
- Chia sẻ `@namorix/core`, React, Redux store trực tiếp
- Theme cascade tự nhiên (CSS variables)
- Gọi function trực tiếp, không cần postMessage
- Cùng context với shell

**Hạn chế:**
- Addon phải build bằng Vite + `@module-federation/vite` plugin
- `@namorix/core` có transitive deps không được declare (`react-dom`, `react-redux`, `@reduxjs/toolkit`, `@microsoft/signalr`) — addon phải add thêm vào `dependencies` của nó

### Standalone Mode (window.open)

Container serve `index.html` riêng (`bootstrap.tsx` → `mount()`), bundle riêng, không qua federation. Addon chạy như web app độc lập, tự quản lý dependencies của nó. Dùng chung file `mount.tsx` với federation mode, chỉ khác entry point load.

### Option A: Iframe (Discarded)

Iframe đã bị loại bỏ vì:
- Không share được `@namorix/core` trực tiếp
- postMessage protocol thay vì function call
- Mất Redux store, theme cascade
- "Đéo ai gà làm iframe"

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

### State Management ✅

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

## Phase 7 — Addon Catalog Sync

### 7.1 Catalog Index

**`catalog/addons.json`** (trong namorix repo) — index file lists tất cả addon có sẵn:

```json
{
  "version": 1,
  "ttl": 3600,
  "addons": [
    {
      "id": "namorix-weave",
      "manifestUrl": "https://raw.githubusercontent.com/Namorix/namorix-weave/main/addon.json"
    }
  ]
}
```

- `version` — schema version của catalog index
- `ttl` — cache TTL (giây), gợi ý backend cache trong DB
- `addons[].id` — addon ID, phải match `id` trong remote manifest
- `addons[].manifestUrl` — URL tới `addon.json` của từng addon

Mỗi addon repo tự publish `addon.json` (validate bởi `addon-v1.json` schema). Catalog index chỉ chứa `id` + `manifestUrl`.

### 7.2 Backend Model

**`Namorix.Core/Models/AddonCatalogEntry.cs`** — DB model cache remote manifest:

```csharp
public class AddonCatalogEntry
{
    [Key, MaxLength(100)]
    public string Id { get; init; } = string.Empty;

    [MaxLength(100)] public string Name { get; set; } = string.Empty;
    [MaxLength(250)] public string? Description { get; set; }
    [MaxLength(500)] public string? Icon { get; set; }
    [MaxLength(50)]  public string? Category { get; set; }
    [MaxLength(200)] public string? Author { get; set; }
    [MaxLength(500)] public string? Repo { get; set; }
    [MaxLength(100)] public string? License { get; set; }

    [MaxLength(500)] public string Image { get; set; } = string.Empty;
    [MaxLength(100)] public string? ImageTag { get; set; }
    public string? Arch { get; set; }               // JSON array serialized

    public string? Ports { get; set; }               // JSON array serialized
    public string? Volumes { get; set; }             // JSON array serialized

    [MaxLength(50)] public string? MinCoreVersion { get; set; }
    [MaxLength(50)] public string? MinServerVersion { get; set; }
    [MaxLength(50)] public string? Boot { get; set; }

    [MaxLength(1000)] public string ManifestUrl { get; init; } = string.Empty;
    public DateTime CachedAt { get; set; }
}
```

**JSON fields** (Ports, Volumes, Arch): dùng `string?` + `System.Text.Json` serialize/deserialize trong service.

### 7.3 CatalogSyncWorker

**`Namorix.Server/Workers/CatalogSyncWorker.cs`** — BackgroundService chạy định kỳ:

```
On startup + mỗi N phút (CatalogSyncInterval từ config)
  └── GET catalog/addons.json từ configured URL
        ├── Parse JSON Index (version, ttl, addons[])
        ├── Check CachedAt trong DB
        │     ├── cachedAt + ttl > now → skip (còn cache)
        │     └── expired/chưa có → fetch manifestUrl
        │           ├── GET addon.json
        │           ├── Parse + validate basic fields
        │           └── Upsert AddonCatalogEntry
        └── Xóa entries không còn trong index
```

**Config** — mặc định trong `appsettings.json`:
```json
{
  "AddonCatalog": {
    "Url": "https://raw.githubusercontent.com/Namorix/namorix/main/catalog/addons.json",
    "SyncIntervalMinutes": 60
  }
}
```

### 7.4 Catalog API

Thêm endpoint trong AddonController:

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/addons/catalog` | Admin | Danh sách addon từ catalog cache |

### 7.5 Frontend — PackageCenter "All" Tab

Tab "All" trong PackageCenter merge 2 nguồn:
1. **Catalog** (có sẵn để cài) — `GET /api/addons/catalog`
2. **Installed** — `GET /api/addons` (existing)

Card hiển thị:
- **Chưa cài** (catalog-only): "Install" button, thông tin từ catalog (name, description, author)
- **Đã cài** (installed): status badge, Start/Stop/Remove buttons

### 7.6 Files

| File | Role |
|------|------|
| `Namorix.Core/Models/AddonCatalogEntry.cs` | NEW: DB model |
| `Namorix.Server/Workers/CatalogSyncWorker.cs` | NEW: BackgroundService |
| `Namorix.Server/Services/CatalogService.cs` | NEW: Fetch + parse + cache logic |
| `Namorix.Server/Persistence/AppDbContext.cs` | MODIFIED: Add DbSet |
| `Namorix.Server/Controllers/AddonController.cs` | MODIFIED: Add GET catalog |
| `Namorix.Server/Program.cs` | MODIFIED: DI + worker |
| `catalog/addons.json` | NEW: Catalog index |

---

## Files Changed/Added

### Backend (New) ✅
| File | Phase |
|------|-------|
| `Namorix.Server/Services/DockerService.cs` | P1 ✅ |
| `Namorix.Server/Services/AddonService.cs` | P1 ✅ |
| `Namorix.Server/Services/OAuthService.cs` | P1 ✅ |
| `Namorix.Server/Controllers/AddonController.cs` | P1 ✅ |
| `Namorix.Server/Controllers/OAuthController.cs` | P1 ✅ |
| `Namorix.Server/Workers/DockerMonitorWorker.cs` | P1 ✅ |
| `Namorix.Server/Workers/CatalogSyncWorker.cs` | P7 ⏳ |
| `Namorix.Server/Services/CatalogService.cs` | P7 ⏳ |
| `Namorix.Server/Middleware/OAuth2Middleware.cs` | P1 ✅ |
| `Namorix.Core/Models/OAuthAuthorizationCode.cs` | P1 ✅ |
| `Namorix.Core/Models/OAuthToken.cs` | P1 ✅ |
| `Namorix.Core/Models/OAuthConsent.cs` | P1 ✅ |
| `Namorix.Core/Models/AddonCatalogEntry.cs` | P7 ⏳ |
| `Namorix.Core/Infrastructure/IAddonNotifier.cs` | P1 ✅ |
| `Namorix.Server/Infrastructure/SignalRAddonNotifier.cs` | P1 ✅ |
| `Namorix.Server/Constants/Addon.cs` | P1 ✅ |
| Migration `AddonManifestFields`, `InitialCreate` (OAuth) | P1 ✅ |

### Backend (Modified) ✅
| File | Change |
|------|--------|
| `Namorix.Server/Persistence/AppDbContext.cs` | Add OAuth DbSets + OAuthConsent composite key, AddonCatalogEntry |
| `Namorix.Server/Program.cs` | DI: DockerService, AddonService, IAddonNotifier, DockerMonitorWorker, CatalogSyncWorker, CatalogService; pipeline: UseOAuth2 |
| `Namorix.Server/Extensions/ApplicationBuilderExtensions.cs` | Add UseOAuth2() |
| `Namorix.Server/Namorix.Server.csproj` | Add Docker.DotNet package |
| `Namorix.Core/Models/AddonManifest.cs` | Expand fields (Docker + OAuth2) |

### Frontend Core (Modified) ✅
| File | Change |
|------|--------|
| `packages/core/src/apiRoutes.ts` | Add `ApiAddonRoutes` |
| `packages/core/src/addon/types.ts` | Add `ExternalAddonManifest`, `AddonContainerStatus`, `InstallAddonRequest`, AddonContext mở rộng |

### Frontend (New) ✅
| File | Phase |
|------|-------|
| `src/controllers/addon.controller.ts` | P2 ✅ |
| `src/store/slices/externalAddonsSlice.ts` | P4 ✅ |
| `src/services/externalAddonEntry.ts` | P3 ✅ (federation runtime) |
| `src/hooks/useAddonEvents.ts` | P5 ✅ |
| `src/store/selectors/externalAddonSelectors.ts` | P4 ✅ |
| `Dockerfile.dev` | P6 ✅ |
| `Dockerfile.prod` | P6 ✅ |
| `docker-compose.yml` | P6 ✅ |

### Frontend (Modified) ✅
| File | Change |
|------|--------|
| `src/store/index.ts` | Register externalAddonsSlice ✅ |
| `src/store/selectors/index.ts` | Barrel export externalAddonSelectors ✅ |
| `src/hooks/index.ts` | Barrel export useAddonEvents ✅ |
| `src/pages/Desktop.tsx` | Mount useAddonEvents ✅ |
| `src/addons/PackageCenter/PackageCenter.tsx` | Từ placeholder → full UI ✅ |
| `frontend/package.json` | Add @module-federation/vite dep, docker scripts ✅ |
| `frontend/vite.config.ts` | Federation config, csproj read fix ✅ |

---

## Execution Order

```
Phase 1 (Backend Docker) ✅ (trừ SSE)
  ├── 1.1 Docker.DotNet package ✅
  ├── 1.2 DockerService ✅
  ├── 1.3 AddonService ✅
  ├── 1.4 AddonManifest model expand + migration ✅
  ├── 1.5 AddonController ✅
  ├── 1.6 DockerMonitor ✅ (event stream + health check, auto-discover, action-based)
  ├── 1.7 OAuth2 Authorization Server ✅
  └── 1.8 SSE Stream ← **pending**

Phase 2 (Frontend Core) ✅
  ├── 2.1 ApiAddonRoutes ✅
  ├── 2.2 External addon types ✅
  ├── 2.3 Addon controller ✅
  └── 2.4 AddonContext mở rộng ✅

Phase 3 (Mount Strategy — Module Federation) ✅
  ├── 3.1 @module-federation/vite + @module-federation/runtime installed ✅
  ├── 3.2 createExternalAddonEntry dùng registerRemotes + loadRemote ✅
  ├── 3.3 Fix: remoteEntry.js thay vì mf-manifest.json ✅
  └── 3.4 namorix-weave: federation mount Hello World trên desktop đã hoạt động ✅

Phase 4 (PackageCenter UI) ✅
  ├── 4.1 Redux slice ✅
  ├── 4.2 PackageCenter component (danh sách, install form, start/stop/remove) ✅
  ├── 4.3 AddonGrid stats bar (total/running/stopped), optimistic pending, installed-first sort ✅
  └── 4.4 SCSS styles ✅

Phase 5 (SignalR Events) ✅
  ├── 5.1 Backend hub methods (addon:status-changed qua SignalRAddonNotifier) ✅
  ├── 5.2 Frontend AddonEventWatcher (globalComponent, active) ✅
  ├── 5.3 useSignalREvent deferred registration (addStatusHandler/removeStatusHandler) ✅
  └── 5.4 Removed dead useAddonEvents hook ✅

Phase 6 (Integration)
  ├── Wire up DI + store ✅
  ├── Docker dev setup (Dockerfile.dev/prod, docker-compose.yml, node:22-alpine) ✅
  ├── vite.config.ts: try/catch backend csproj read cho Docker build ✅
  ├── namorix-weave addon mẫu (Hello World, standalone + desktop mount) ✅
  ├── namorix-weave Dockerfile + docker-compose + scripts (pnpm docker:prod) ✅
  ├── namorix-weave container labels (namorix-addon=true, namorix-addon-id, namorix-addon-name) ✅
  ├── Xác định @namorix/core thiếu 4 transitive deps ✅
  ├── PackageCenter: full UI với Rail+Grid+Card ✅
  ├── handleRemove: dispatch(removeAddon(id)) ✅
  ├── Test OAuth2 flow
  └── Documentation + version bump ✅

Phase 7 (Catalog Sync)
  ├── 7.1 Catalog index JSON (catalog/addons.json) ✅
  ├── 7.2 AddonCatalogEntry DB model
  ├── 7.3 CatalogSyncWorker (BackgroundService)
  ├── 7.4 CatalogService (fetch + parse + cache)
  ├── 7.5 AppDbContext + DI wiring
  ├── 7.6 GET /api/addons/catalog endpoint
  └── 7.7 PackageCenter "All" tab merge catalog + installed
```

## PendingTaskPhase — Addons Task Invariant

Thêm field `PendingTaskPhase` vào `AddonInstallation`, đồng bộ lifecycle với `PendingTaskId`.

### Rationale

`PendingTaskId` chỉ biết "có task đang chạy" nhưng không biết "đang làm gì". `PendingTaskPhase` bổ sung phase (installing/starting/stopping/...). Quan trọng: 2 field này phải luôn **set cùng lúc, clear cùng lúc** — không được lệch pha.

### Các file cần sửa

| File | Change |
|------|--------|
| `Namorix.Core/Models/AddonInstallation.cs:20` | Thêm `[MaxLength(20)] public string? PendingTaskPhase` |
| `Namorix.Server/Constants/Addon.cs:17-22` | Thêm `Installing`, `Updating`, `Pulling` constants |
| Migration: `AddPendingTaskPhase` | `AddColumn<string>("PendingTaskPhase", maxLength: 20)` |
| `Namorix.Server/Services/AddonService.cs:35-42` | `SetTaskPending`: thêm `.SetProperty(a => a.PendingTaskPhase, status)` |
| `Namorix.Server/Services/AddonTaskExecutor.cs:98-118` | `SetStatusAsync`: thêm `.SetProperty(a => a.PendingTaskPhase, (string?)null)` ở cả 2 nhánh |
| `Namorix.Server/Services/AddonTaskQueue.cs:60-79` | `SetErrorStatusAsync`: thêm `.SetProperty(a => a.PendingTaskPhase, null as string)` |
| `Namorix.Server/Workers/DockerMonitorWorker.cs:55-60` | `SyncAllContainersAsync`: thêm `.SetProperty(a => a.PendingTaskPhase, null as string)` |

### Invariant rule

**Set:** `PendingTaskId` + `PendingTaskPhase` luôn set cùng nhau (trong cùng `ExecuteUpdateAsync`).
**Clear:** Cả 2 luôn clear cùng nhau (null đồng thời). Không clear 1 trong 2.

---

## Version Bumps

| Package | Version | Reason |
|---------|---------|--------|
| Namorix.Server | 0.38.0 → 0.39.0 | New module: AddonController, DockerService, DockerMonitor, OAuth2 |
| Namorix.Core | 0.36.4 → 0.37.0 | AddonManifest model expanded |
| @namorix/core | 0.35.1 → 0.36.0 | New types, API routes |
| frontend | 0.44.4 → 0.45.0 | PackageCenter UI, hooks, controller, vite-plugin-federation |
