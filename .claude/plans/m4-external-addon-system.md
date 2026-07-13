# M4 — External Addon System (Docker)

## Goal

Cho phép cài đặt, quản lý, và chạy addon từ Docker containers bên cạnh các built-in addon hiện có. External addon dùng chung contract `AddonEntry`/`AddonContext` với internal addon, nhưng load động qua Docker lifecycle thay vì bundle sẵn.

## Current State

- **Addon contract** (`NmxAddonManifest`, `AddonEntry`, `AddonContext`, `AddonModule`) đã sẵn sàng — external addon chỉ cần implement các interface này ✅
- **Registry** (`registerAddon`, `resolveAddon`, `listAddons`) đã support runtime registration ✅
- **Backend `AddonManifest` model** đã expand fields (Image, HostPort, Status, Version, Author, ClientId, PublicKey, RedirectUri, Scope) + migration `AddonManifestFields` ✅
- **OAuth2 Authorization Server** — full implementation ✅: client_credentials + private_key_jwt, JWT RS256 verification, addon self-registration (RSA keypair gen + registration token), token caching, ExemptPaths middleware pattern, OAuth2 client SDK (`NmxOAuth2Client`, `NmxAddonConfig`, `NmxOAuth2ServiceCollectionExtensions`). Còn: authorization_code grant (authorize endpoint + consent screen) cho user-facing addon auth.
- **Frontend core**: ApiAddonRoutes, external types, addon controller, AddonContext mở rộng ✅
- **Module Federation** — `@module-federation/vite` (v1.15.4) installed, `externalAddonEntry.ts` dùng `@module-federation/runtime` (`registerRemotes` + `loadRemote`) ✅
- **Redux slice** (`externalAddonsSlice`) + store registration ✅
- **PackageCenter addon** — đã implement UI với Rail+Grid+Card (All/Installed/Updated tabs) ✅
- **Docker dev/prod setup** — Dockerfile.dev (node:22-alpine), Dockerfile.prod (multi-stage), docker-compose.yml (desktop-dev + desktop-prod) ✅
- **namorix-weave** — external addon mẫu tại `~/namorix-weave/`, federation mount Hello World trên desktop đã hoạt động ✅
- **`@namorix/core`** — thiếu 4 transitive deps trong `package.json`: `react-dom`, `react-redux`, `@reduxjs/toolkit`, `@microsoft/signalr`. Cần bổ sung. ✅
- **Catalog sync** — CatalogSyncWorker, CatalogService, AddonCatalogEntry DB model, GET/POST catalog endpoints ✅
- **Install flow** — InstallAsync uses catalog lookup (id-based), port parsing from catalog entry, DockerService.ImageExistsLocallyAsync ✅
- **Redux catalog store** — setCatalog reducer, updateAddonStatus creates entries for new addons, selectorCatalog ✅
- **Không còn `ComputeAddonId`** — identity dùng catalog id trực tiếp ✅
- **gRPC Addon Channel** — bidirectional streaming, auth interceptor, periodic re-check (5 phút), active cancellation via `AddonChannelManager`, `NotifyAddonWidgetEvent` forward SignalR ✅
- **gRPC client module** — `AddonChannelClient` (OAuth2 token + duplex stream + proactive refresh), `AddonChannelClientExtensions` (DI), `RetryConnectHostedService` (auto-reconnect), Kestrel 2-port (5000 HTTP/1.1 + 5002 HTTP/2 h2c) ✅
- **Chưa có:** OAuth2 author endpoint (consent screen)
- **BackendConfig + NMX_API_URL compute** — `IsRunningInContainer()` → host.docker.internal / container name, ExtraHosts + NetworkMode tuỳ runtime, `RegistrationTokenTtlMinutes` configurable ✅

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
- `EnvVars` — `NMX_API_URL` (compute theo runtime), `NMX_REGISTRATION_TOKEN` (one-time token, addon dùng để self-register)
- `Labels` — `namorix-addon=true`, `namorix-addon-id={id}`
- `MemoryLimit`, `CpuLimit` — resource constraints
- `ExtraHosts` — `host.docker.internal:host-gateway` (khi backend bare-metal)
- `NetworkName` — user-defined bridge network (khi backend containerized, cần DNS resolution)
- `RegistrationToken` — one-time token, addon dùng để đăng ký OAuth2 client

**BackendConfig** (`Namorix.Core/Config/BackendConfig.cs`):
- `Port` — backend HTTP port (default 3000)
- `ContainerName` — container name cho container-to-container DNS (default `namorix-server`)
- `NetworkName` — Docker network name cho addon container (default `namorix-net`)

**Container runtime detection** (`DockerService.IsRunningInContainer()`):
- Check `File.Exists("/.dockerenv")`
- `true` → ApiUrl = `http://{ContainerName}:{Port}`, set `NetworkMode`, không ExtraHosts
- `false` → ApiUrl = `http://host.docker.internal:{Port}`, set `ExtraHosts`, không NetworkMode

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
| — | `(gRPC Connect)` | OAuth2 (addon) | gRPC bidirectional stream — addon gửi/nhận event qua stream thay vì HTTP |

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

### 1.7 OAuth2 Authorization Server ✅ (client_credentials + private_key_jwt)

Namorix Server đóng vai trò **Authorization Server (AS)** cho external addon. Addon là **OAuth2 confidential client**.

**Trạng thái:** ✅ Full implementation cho client_credentials grant:
- `VerifyClientAssertion` — JWT RS256 validation with stored RSA public key
- `CacheSignatureProviders = false` — fix `CryptoProviderFactory.Default` static cache returning stale `SignatureProvider` backed by disposed `RSA` instance, gây `invalid_client` khi addon restart
- Addon self-registration: install → gen registration token → Docker env → addon tự gen RSA keypair → POST /api/oauth/register
- Token caching trong NmxOAuth2Client (cache đến expires_in - 30s)
- ExemptPaths pattern: middleware bypass cho form-urlencoded OAuth endpoints
- BackendConfig.RegistrationTokenTtlMinutes configurable (default 10)
- TokenCleanupWorker mở rộng: xóa OAuthRegistrations đã used/expired
- OAuth2 client SDK (`NmxOAuth2Client`, `NmxAddonConfig`, DI extensions) trong `Namorix.Core/OAuth/`

**Còn thiếu:**
- `authorization_code` grant — Authorize endpoint + consent screen (cho user-facing addon auth)
- gRPC bidirectional stream — addon gửi/nhận event qua stream thay vì SSE + HTTP Command

#### Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/oauth/authorize` | Authorization endpoint — user consents |
| POST | `/oauth/register` | Token endpoint — addon tự đăng ký client credentials |
| POST | `/oauth/token` | Token endpoint — exchange client_assertion → access_token |
| POST | `/oauth/revoke` | Revoke access_token |
| GET | `/oauth/.well-known/openid-configuration` | OIDC discovery (optional) |

#### Flow: Client Credentials Grant (private_key_jwt)

```
Namorix Desktop Backend            External Addon
     │                              │
     │  1. InstallAsync             │
     │     ├─ Gen registration      │
     │     │   token (Guid, TTL=10m)│
     │     ├─ Lưu OAuthRegistration │
     │     └─ Docker create:        │
     │        NMX_API_URL +         │
     │        NMX_REGISTRATION_TOKEN│
     │─────────────────────────────>│
     │                              │
     │  2. Addon starts             │
     │     NmxOAuth2Client.         │
     │     EnsureInitializedAsync() │
     │     ├─ Gen RSA keypair       │
     │     ├─ POST /oauth/register  │
     │     │  { registrationToken,  │
     │     │    publicKey }         │
     │     ├─ Nhận clientId         │
     │     └─ Save oauth.json       │
     │<─────────────────────────────│
     │                              │
     │  3. NmxOAuth2Client.         │
     │     GetAccessTokenAsync()    │
     │     ├─ Tạo client_assertion  │
     │     │   JWT (iss=clientId,  │
     │     │   signed by private key│
     │     ├─ POST /oauth/token     │
     │     │  grant_type=client_    │
     │     │  credentials +         │
     │     │  client_assertion      │
     │     ├─ Nhận access_token     │
     │     └─ Cache trong memory    │
     │<─────────────────────────────│
     │                              │
     │  4. Addon gọi API với        │
     │     Bearer access_token      │
     │─────────────────────────────>│
```

#### Client Authentication: `client_assertion` (private_key_jwt)

Thay vì client_secret truyền thống, addon dùng **private_key_jwt**:
- Addon tự gen RSA keypair khi lần đầu chạy (self-registration)
- `client_assertion` = JWT signed bởi addon's private key, TTL 2 phút
- Namorix verify với addon's public key (lưu trong `AddonInstallations`)

```csharp
// AddonInstallation (mở rộng)
public string? ClientId { get; set; }        // OAuth2 client_id (sau register)
public string? PublicKey { get; set; }        // RSA public key (PEM, từ addon self-register)
public string? RedirectUri { get; set; }       // OAuth2 redirect_uri (future)
public string? Scope { get; set; }             // Default scope
```

**Tại sao private_key_jwt thay vì client_secret:**
- Addon tự gen keypair — backend không bao giờ biết private key
- Registration token chỉ dùng 1 lần (one-time), TTL ngắn (10 phút)
- Container restart không mất secret (lưu trong volume `/data/oauth.json`)
- Có thể rotate key mà không cần reinstall

#### Token types

| Token | Who uses | TTL | Usage |
|-------|----------|-----|-------|
| `registration_token` | Addon → Namorix | 10 phút (configurable) | One-time: đăng ký client_id + public key |
| `authorization_code` | Browser → Addon | 1 phút | Exchange lấy access_token |
| `access_token` | Addon → API | 1 giờ | Bearer header cho API calls |
| `refresh_token` | Addon | 30 ngày | Obtain new access_token |

#### OAuth2Middleware

Middleware xác thực access_token ở những endpoint addon cần gọi:

```csharp
// gRPC interceptor — addon gửi access_token trong metadata lúc mở stream
// /api/... — các endpoint khác addon cần access
```

Middleware check:
1. `Authorization: Bearer <token>`
2. Verify token signature (RSA, Namorix's public key)
3. Check scope
4. Set `HttpContext.User` với addon identity

#### Middleware Exemption Pattern (ExemptPaths)

JsonErrorMiddleware + CsrfMiddleware dùng `ExemptPaths` array để bypass OAuth endpoints:

```csharp
public static class ExemptPaths
{
    // Machine clients gửi form-urlencoded — skip JSON enforcement
    public static readonly string[] NonJsonBody = ["/api/oauth/token"];

    // Machine clients không có cookie session — skip CSRF check
    public static readonly string[] NoCsrfSession = ["/api/oauth/token", "/api/oauth/register"];
}
```

**Lý do không dùng Attribute:** Middleware chạy trước `UseRouting()`, endpoint metadata chưa available.

#### DB Tables

```sql
-- OAuth registration tokens (ngắn hạn, one-time)
oauth_registrations: id, token, addon_installation_id, expires_at, used

-- Authorization codes (ngắn hạn)
oauth_codes: code, client_id, user_id, scope, expires_at, redirect_uri

-- Access tokens
oauth_tokens: token_id, client_id, user_id, scope, expires_at, revoked

-- User consent
oauth_consents: user_id, client_id, scope, granted_at
```

### 1.8 gRPC Addon Channel

**gRPC bidirectional streaming** thay thế SSE Stream + HTTP Command:
- Addon mở 1 kênh gRPC duy nhất khi start, sống suốt vòng đời container
- Cả addon→backend và backend→addon đều qua cùng 1 stream — không cần 2 chiều riêng (SSE + Command)

**Proto service definition** (`addon_channel.proto` trong Namorix.Server):

```protobuf
service AddonChannel {
  rpc Connect(stream AddonMessage) returns (stream ShellMessage);
}

message AddonMessage {
  string type = 1;       // "widget-event", "log", "heartbeat"
  string payload = 2;    // JSON payload
}

message ShellMessage {
  string type = 1;       // "command", "config-update", "heartbeat-ack"
  string payload = 2;    // JSON payload
}
```

**Auth trên gRPC — 2 lớp:**

1. **Initial auth (gRPC interceptor):**
   - Addon gửi `access_token` qua gRPC metadata (giống HTTP header `Authorization: Bearer ...`) khi gọi `Connect()`
   - Backend interceptor verify token đầy đủ (JWT signature + expiry) 1 lần lúc mở stream
   - Reject ngay nếu invalid/expired — không cho vào stream

2. **Periodic re-check (5 min timer trong server-side stream loop):**
   ```csharp
   public override async Task Connect(
       IAsyncStreamReader<AddonMessage> requestStream,
       IServerStreamWriter<ShellMessage> responseStream,
       ServerCallContext context)
   {
       var addonId = ValidateInitialToken(context); // throw nếu invalid

       using var cts = CancellationTokenSource.CreateLinkedTokenSource(context.CancellationToken);
       var recheckTask = Task.Run(async () =>
       {
           while (!cts.Token.IsCancellationRequested)
           {
               await Task.Delay(TimeSpan.FromMinutes(5), cts.Token);
               if (!await IsAddonStillAuthorizedAsync(addonId))
               {
                   cts.Cancel();
                   break;
               }
           }
       }, cts.Token);

       // xử lý requestStream/responseStream như bình thường, dùng cts.Token
   }
   ```
   `IsAddonStillAuthorizedAsync` chỉ check trạng thái nhanh: addon còn tồn tại trong DB (chưa bị gỡ) + token chưa bị revoke — **không verify lại JWT signature**.

3. **Active cancellation khi revoke:**
   - `ConcurrentDictionary<string, CancellationTokenSource>` lưu theo `addonId`
   - Khi action `/oauth/revoke` hoặc "gỡ addon" xảy ra → gọi `cts.Cancel()` ngay
   - Không cần chờ chu kỳ 5 phút

**So với SSE + Command:**
- ✅ Một kênh duy nhất, không cần 2 endpoint riêng
- ✅ Backend chủ động gửi message xuống addon (qua `responseStream`) — SSE chỉ 1 chiều
- ✅ Không cần HTTP polling hay health-check riêng
- ✅ Auth tập trung tại interceptor, không rải rác ở controller middleware

**Client-side implementation (`Namorix.Core/Grpc/`):**

1. **`AddonChannelClient`** — wraps `GrpcChannel` + OAuth2 token acquisition + duplex stream management:
   - `StartAsync(CancellationToken)` — mở kênh gRPC với Bearer token từ `NmxOAuth2Client.GetAccessTokenAsync()`
   - `SendAsync(AddonMessage)` — gửi message lên server
   - `SendHeartbeatAsync()` — heartbeat periodic
   - `StopAsync()` — complete request stream, cancel `_cts`, shutdown channel
   - `ReceiveLoopAsync()` — `ReadAllAsync` loop, invoke `OnMessage` event, auto-reconnect qua `ReconnectAsync` nếu crash
   - `ScheduleTokenRefreshAsync()` — chủ động reconnect trước khi token hết hạn (dùng `CurrentTokenExpiresAt` - 5 phút buffer), stop → start với token mới
   - `_lifetimeCt` vs `_cts` separation — `StopAsync` chỉ cancel `_cts`, không ảnh hưởng `_lifetimeCt`, nên `ReconnectAsync` và `ScheduleTokenRefreshAsync` vẫn dùng được `_lifetimeCt` sau khi stop

2. **`AddonChannelClientExtensions`** — `AddAddonChannelClient()` DI extension, register `AddonChannelClient` as singleton

3. **`RetryConnectHostedService`** — abstract `IHostedService` base class:
   - StartAsync gọi `ConfigureHandlers()` rồi `ConnectWithRetryAsync()` (fire-and-forget)
   - Retry loop với 5s delay, log stack trace ở lần fail đầu, one-liner cho các lần sau
   - `OnConnectedAsync()` hook sau khi connect thành công

**Key design decisions:**
- Token refresh dùng **stop-start** (không make-before-break) vì message hiện tại low criticality (heartbeat, widget-event, log). Gap ~5s mỗi giờ chấp nhận được.
- `ReconnectAsync` có 5s delay trước khi retry — tránh reconnect storm khi server đang restart
- `ReceiveLoopAsync` catch `RpcException` với `StatusCode.Cancelled` — phân biệt cancel (chủ động) với crash thật

**Kestrel 2-port config (`Program.cs`):**
- Port 5000: HTTP/1.1 (API + SignalR + OAuth)
- Port 5002: HTTP/2 cleartext (h2c) — gRPC channel
- `ListenAnyIP(IPAddress.Loopback, 5002, opts => opts.Protocols = HttpProtocols.Http2)`
- gRPC reflection enabled trong development mode

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

### 7.3 CatalogSyncWorker ✅

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

### 7.4 Catalog API ✅

Thêm endpoint trong AddonController:

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/addons/catalog` | Admin | Danh sách addon từ catalog cache |

### 7.5 Frontend — PackageCenter "All" Tab ✅

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
| `Namorix.Server/Services/AddonTaskQueue.cs` | P5 ✅ |
| `Namorix.Server/Services/AddonTaskExecutor.cs` | P5 ✅ |
| `Namorix.Server/Models/AddonTask.cs` | P5 ✅ |
| `Namorix.Server/Services/OAuthService.cs` | P1 ✅ |
| `Namorix.Core/OAuth/NmxOAuth2Client.cs` | P1 ✅ |
| `Namorix.Core/OAuth/NmxAddonConfig.cs` | P1 ✅ |
| `Namorix.Core/OAuth/NmxOAuth2ServiceCollectionExtensions.cs` | P1 ✅ |
| `Namorix.Core/OAuth/OAuthEndpoints.cs` | P1 ✅ |
| `Namorix.Core/OAuth/OAuthResponse.cs` | P1 ✅ |
| `Namorix.Core/Config/BackendConfig.cs` | P1 ✅ |
| `Namorix.Core/Constants/OAuth.cs` | P1 ✅ |
| `Namorix.Core/Constants/ExemptPaths.cs` | P1 ✅ |
| `Namorix.Core/Models/OAuthRegistration.cs` | P1 ✅ |
| `Namorix.Server/Migrations/20260704041156_AddOAuthRegistration.cs` | P1 ✅ |
| `Namorix.Server/Controllers/AddonController.cs` | P1 ✅ |
| `Namorix.Server/Controllers/OAuthController.cs` | P1 ✅ |
| `Namorix.Server/Workers/DockerMonitorWorker.cs` | P1 ✅ |
| `Namorix.Server/Workers/CatalogSyncWorker.cs` | P7 ✅ |
| `Namorix.Server/Services/CatalogService.cs` | P7 ✅ |
| `Namorix.Server/Middleware/OAuth2Middleware.cs` | P1 ✅ |
| `Namorix.Core/Models/OAuthAuthorizationCode.cs` | P1 ✅ |
| `Namorix.Core/Models/OAuthToken.cs` | P1 ✅ |
| `Namorix.Core/Models/OAuthConsent.cs` | P1 ✅ |
| `Namorix.Core/Models/AddonCatalogEntry.cs` | P7 ✅ |
| `Namorix.Core/Infrastructure/IAddonNotifier.cs` | P1 ✅ |
| `Namorix.Server/Infrastructure/SignalRAddonNotifier.cs` | P1 ✅ |
| `Namorix.Server/Constants/Addon.cs` | P1 ✅ |
| `Namorix.Core/Protos/addon_channel.proto` | P1 ✅ |
| `Namorix.Server/Services/AddonChannelManager.cs` | P1 ✅ |
| `Namorix.Server/Services/Grpc/AddonChannelService.cs` | P1 ✅ |
| Migration `AddonManifestFields`, `InitialCreate` (OAuth) | P1 ✅ |
| `Namorix.Core/Grpc/AddonChannelClient.cs` | P1 ✅ — gRPC client with OAuth2 token + duplex stream + proactive token refresh |
| `Namorix.Core/Grpc/AddonChannelClientExtensions.cs` | P1 ✅ — DI extension `AddAddonChannelClient()` |
| `Namorix.Core/Grpc/RetryConnectHostedService.cs` | P1 ✅ — abstract IHostedService base class (fire-and-forget connect + retry loop) |

### Backend (Modified) ✅
| File | Change |
|------|--------|
| `Namorix.Server/Persistence/AppDbContext.cs` | Add OAuth DbSets + OAuthConsent composite key, AddonCatalogEntry |
| `Namorix.Server/Program.cs` | DI: DockerService, AddonService, IAddonNotifier, DockerMonitorWorker, CatalogSyncWorker, CatalogService; pipeline: UseOAuth2; Kestrel 2-port (5000 HTTP/1.1, 5002 HTTP/2 h2c), gRPC reflection, MapGrpcService |
| `Namorix.Server/Extensions/ApplicationBuilderExtensions.cs` | Add UseOAuth2() |
| `Namorix.Server/Namorix.Server.csproj` | Add Docker.DotNet package |
| `Namorix.Core/Models/AddonManifest.cs` | Expand fields (Docker + OAuth2) |
| `Namorix.Core/OAuth/NmxAddonConfig.cs` | Added GrpcUrl property, NMX_GRPC_URL env reading |
| `Namorix.Core/OAuth/NmxOAuth2Client.cs` | Added CurrentTokenExpiresAt property for proactive token refresh |
| `Namorix.Server/Services/OAuthService.cs` | CacheSignatureProviders = false fix for RsaSecurityKey stale cache bug |

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
Phase 1 (Backend Docker) ✅ (trừ author endpoint)
  ├── 1.1 Docker.DotNet package ✅
  ├── 1.2 DockerService ✅ (+ IsRunningInContainer, ExtraHosts, NetworkMode, BackendConfig)
  ├── 1.3 AddonService ✅ (InstallRequest simplified)
  ├── 1.4 AddonManifest model expand + migration ✅
  ├── 1.5 AddonController ✅ (dùng id không compute)
  ├── 1.6 DockerMonitor ✅
  ├── 1.7 OAuth2 ✅ (client_credentials + private_key_jwt full: register, JWT RS256 verify, ExemptPaths, client SDK)
  └── 1.8 gRPC Addon Channel ✅

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
  ├── InstallAsync catalog rewrite (id-based, port parsing, catalog lookup) ✅
  ├── Redux catalog store + updateAddonStatus creates entries ✅
  ├── Xoá ComputeAddonId (identity dùng catalog id) ✅
  ├── BackendConfig model + appsettings + DI registration ✅
  ├── NMX_API_URL compute: IsRunningInContainer() → host.docker.internal / container name ✅
  ├── Addon self-registration: registration token → addon tự gen RSA → POST /api/oauth/register ✅
  ├── Network attach: ExtraHosts + NetworkMode tuỳ runtime ✅
  ├── NmxOAuth2Client + NmxAddonConfig + DI extensions trong Namorix.Core/OAuth/ ✅
  ├── ExemptPaths pattern: middleware bypass cho OAuth form-urlencoded endpoints ✅
  ├── JsonErrorMiddleware + CsrfMiddleware: OAuth endpoints exempt ✅
  ├── TokenCleanupWorker: OAuthRegistration cleanup ✅
  ├── gRPC Addon Channel: proto definition (bidirectional Connect), AddonChannelManager (ConcurrentDictionary + active cancellation), AddonChannelService (interceptor auth, periodic 5-min re-check, HandleAddonMessageAsync forward widget-event/ log/ heartbeat), MapGrpcService wiring + DI ✅
  ├── OAuthController.Revoke: form body, call RevokeTokenAsync + DisconnectAsync gRPC stream, ExemptPaths.NoCsrfSession ✅
  ├── OAuthService: RevokeTokenAsync, IsAddonAuthorizedAsync, ValidateTokenAsync ✅
  ├── IAddonNotifier.NotifyAddonWidgetEvent + SignalR impl + ServerSignalREvent.AddonWidgetEvent constant ✅
  ├── OAuth2Middleware: Bearer prefix constant + token lookup fix ✅
  ├── NmxOAuth2Client: fix File.Exists() logic (read when exists, not when missing) ✅
  ├── AddonInstallation: consistent `init` setters for immutable fields ✅
  ├── Grpc.AspNetCore package (Directory.Packages.props + both csproj) ✅
  ├── OAuth2 client SDK — build + test với namorix-weave ✅
  ├── AddonChannelClient: gRPC duplex client + OAuth token refresh + reconnect ✅
  ├── AddonChannelClientExtensions + RetryConnectHostedService: DI + auto-reconnect base class ✅
  ├── NmxAddonConfig: GrpcUrl property, NMX_GRPC_URL env var ✅
  ├── NmxOAuth2Client: CurrentTokenExpiresAt for proactive token refresh ✅
  ├── Program.cs: Kestrel 2-port (5000/5002), gRPC reflection ✅
  ├── OAuthService: CacheSignatureProviders = false (RsaSecurityKey stale cache fix) ✅
  ├── AddonChannelService: recheck loop, widget-event logging, heartbeat handling ✅
  └── Documentation + version bump ✅

Phase 7 (Catalog Sync) ✅
  ├── 7.1 Catalog index JSON (catalog/addons.json) ✅
  ├── 7.2 AddonCatalogEntry DB model ✅
  ├── 7.3 CatalogSyncWorker (BackgroundService) ✅
  ├── 7.4 CatalogService (fetch + parse + cache) ✅
  ├── 7.5 AppDbContext + DI wiring ✅
  ├── 7.6 GET/POST /api/addons/catalog endpoints ✅
  └── 7.7 PackageCenter "All" tab merge catalog + installed ✅
```

## PendingTaskPhase + NotifyPendingTaskChanged — Completed ✅

### Core

- `AddonPendingPhase` type với 6 phase: starting, stopping, uninstalling, installing, updating, pulling
- `AddonPendingTaskPayload` interface (`{ addonId, taskPhase }`)
- `lastErrorCode` + `pendingTaskPhase` fields trên `ExternalAddonManifest`
- `lastErrorCode` trên `AddonStatusPayload`

### Backend

| File | Change |
|------|--------|
| `Namorix.Core/Models/AddonInstallation.cs` | Thêm `PendingTaskPhase` field, `LastErrorMessage` → `LastErrorCode` |
| `Namorix.Server/Constants/Addon.cs` | `AddonTaskPendingStatus` renamed + thêm Installing/Updating/Pulling |
| `Namorix.Server/Constants/AddonError.cs` | NEW — error code constants (ContainerNotFound, PortConflict, ...) |
| `Namorix.Server/Constants/ServerSignalR.cs` | Thêm `AddonPendingTaskChanged`, `AddonUninstalled` events |
| `Namorix.Server/Infrastructure/IAddonNotifier.cs` | Thêm `NotifyPendingTaskChanged(phase?)`, `NotifyAddonUninstalled()` |
| `Namorix.Server/Hubs/SignalRAddonNotifier.cs` | Implement 2 methods mới |
| `Namorix.Server/Services/AddonService.cs` | Inject `IAddonNotifier`, `SetTaskPending` calls `NotifyPendingTaskChanged` |
| `Namorix.Server/Services/AddonTaskExecutor.cs` | Start/Stop check DB null, Docker error → error code, UninstallAsync dùng `NotifyPendingTaskChanged` + `NotifyAddonUninstalled` |
| `Namorix.Server/Services/AddonTaskQueue.cs` | `SetErrorStatusAsync` calls `NotifyPendingTaskChanged(null)`, logger trong catch |
| Migrations: `AddPendingTaskPhase`, `RenameLastErrorCode` | Column add + rename |

### Frontend

| File | Change |
|------|--------|
| `signalr/constants.ts` | Thêm `AddonPendingTaskChanged`, `AddonUninstalled` events |
| `addon.controller.ts` | `AddonManifestDto` thêm `pendingTaskPhase`, `lastErrorCode` |
| `externalAddonsSlice.ts` | `updateAddonStatus` set `lastErrorCode` |
| `AddonEventWatcher.tsx` | Toast start/stop/error, handler `AddonUninstalled` → remove + toast |
| `AddonGrid.tsx` | `AddonPendingTaskChanged` handler → pendingMap, stats rename (installed/available), error badge |
| `addonError.ts` | `formatAddonErrorCode` function (error code → locale) |

### SignalR Events

| Event | Direction | Payload | Handler |
|-------|-----------|---------|---------|
| `addon:pending-task-changed` | Server → Client | `{ addonId, taskPhase }` | AddonGrid set/clear pendingMap |
| `addon:uninstalled` | Server → Client | `{ addonId }` | AddonEventWatcher removeAddon + toast |

## Version Bumps

| Package | Version | Reason |
|---------|---------|--------|
| Namorix.Server | 0.44.0 → 0.45.0 | NotifyPendingTaskChanged/NotifAddonUninstalled, AddonErrorCodes, executor refactor |
| Namorix.Core | 0.41.0 → 0.42.0 | LastErrorMessage → LastErrorCode rename |
| @namorix/core | 0.40.0 → 0.41.0 | AddonPendingPhase, AddonPendingTaskPayload, lastErrorCode fields |
| @namorix/ui | 0.25.0 → 0.26.0 | ERROR icon symbol |
| @namorix/styles | 0.35.0 → 0.36.0 | __icon-status SCSS block, icomoon rebuild |
| frontend | 0.51.0 → 0.52.0 | NotifyPendingTaskChanged handler, error toast, stats rename |

### 2026-07-04 — OAuth2 private_key_jwt full implementation

| Package | Version | Reason |
|---------|---------|--------|
| Namorix.Core | 0.42.3 → 0.43.0 | New OAuth2 module (client SDK, constants, ExemptPaths) |
| Namorix.Server | 0.45.3 → 0.46.0 | New OAuth endpoints (register/token), registration flow |
| @namorix/core | 0.41.2 → 0.41.3 | // TODO comments on addon types |
| @namorix/styles | 0.36.1 → 0.36.2 | Taskbar font-size tweak |

### 2026-07-13 — gRPC client module, Kestrel 2-port, CacheSignatureProviders fix

| Package | Version | Reason |
|---------|---------|--------|
| Namorix.Core | 0.44.0 → 0.45.0 | New Grpc/ module (AddonChannelClient, AddonChannelClientExtensions, RetryConnectHostedService), GrpcUrl on NmxAddonConfig, CurrentTokenExpiresAt on NmxOAuth2Client |
| Namorix.Server | 0.47.0 → 0.48.0 | Kestrel 2-port (5000 HTTP/1.1 + 5002 HTTP/2 h2c), gRPC reflection, CacheSignatureProviders=false fix, recheck loop/heartbeat handling in AddonChannelService |
