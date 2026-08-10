# Namorix FLOW

Toàn bộ luồng dữ liệu trong project. Dùng cho external addon dev biết cần hook vào đâu và làm gì.

## Mục lục

1. [App Initialization](#1-app-initialization)
2. [Authentication](#2-authentication)
3. [Appearance / Theme](#3-appearance--theme)
4. [Settings (System + User)](#4-settings-system--user)
5. [Validation](#5-validation)
6. [Error Handling](#6-error-handling)
7. [SignalR](#7-signalr)
8. [Addon System](#8-addon-system)
9. [Window Management](#9-window-management)
10. [Navigation / Guards](#10-navigation--guards)

---

## 1. App Initialization

### Sequence

```
main.tsx
  ├── configureCore({ baseUrl })
  ├── generateFingerprint()
  ├── ReactDOM.createRoot → <Root />
  └── Root.tsx
        ├── useAppearanceSync()          ← hook xử lý theme loading
        ├── NmxHostContext value="shell"
        ├── Provider (Redux store)
        ├── NmxToastProvider
        └── <App />
              ├── i18n setup
              ├── Route matching
              └── Guards → page
```

### Key files

| File | Role |
|------|------|
| `frontend/src/main.tsx` | Entry, config, render |
| `frontend/src/Root.tsx` | Appearance sync, providers shell |
| `frontend/src/App.tsx` | Routes, guards |
| `frontend/packages/core/src/index.ts` | Barrel, `initStores()` |

### What external addon needs

Addon không liên quan init flow. Chỉ cần biết `NmxHostContext` và Redux store đã sẵn sàng.

---

## 2. Authentication

### Login flow

```
Login form
  └── authController.login(user, pass)
        └── POST /api/auth/login
              ├── Server: validate credentials
              ├── Server: set HttpOnly cookies (access + refresh)
              └── Response success

  └── Auth guard (re-run)
        └── authService.isAuthenticated()
              └── GET /api/auth/session (via HttpOnly cookie)
                    ├── Success → setUserStore(user)
                    └── Fail → redirect /login
```

### Session restore flow (page refresh)

```
main.tsx → loadSystemDefaults()   ← theme cho login page trước khi biết auth

Root.tsx → useAppearanceSync()
  └── useEffect [user] — user mặc định null lúc đầu
        ├── user null → loadSystemDefaults()  ← system theme
        └── user set → loadAppearance()       ← user theme

App → Guard → isAuthenticated()
  └── GET /api/auth/session
        ├── Token valid → setUserStore(user)
        │     └── Root re-render → useEffect [user] → loadAppearance()
        └── Token invalid → redirect /login
```

### Token handling

| Token | Storage | TTL | Note |
|-------|---------|-----|------|
| Access token | HttpOnly cookie | 15 min | Auto-refresh on 401 |
| Refresh token | HttpOnly cookie | 7d (90d if remember-me) | Rotate on use |
| CSRF token | Non-HttpOnly cookie | Session | For double-submit |

### Key files

| File | Role |
|------|------|
| `frontend/src/controllers/auth.controller.ts` | `login()`, `register()`, `logout()`, `loadAppearance()` (1 call merged endpoint) |
| `frontend/packages/core/src/auth/auth.service.ts` | `isAuthenticated()`, `checkHasUsers()`, `isRegistrationOpen()` |
| `backend/src/Namorix.Server/Controllers/AuthController.cs` | Login, register, refresh, logout, session |
| `backend/src/Namorix.Server/Services/AuthService.cs` | Token logic, fingerprint, refresh rotation |

### What external addon needs

- **Widget addon** (cùng DOM): dùng `nmxHttp` auto-auth qua cookie
- **Standalone addon** (window.open): cần `nmx_handshake_token` exchange flow
- **Server-to-server**: cần `POST /api/addon/handshake` với AddonSecret

---

## 3. Appearance / Theme

### 3-layer cascade

```
User settings (DB)
    ↓ user has value?
System defaults (Settings table)
    ↓ system has value?
Hardcoded defaults (AppearanceDefaults)
```

### Load flow

```
Page load (chưa login hoặc đã login)
  └── Root → useAppearanceSync()
        └── loadAppearance()
              └── GET /api/settings/appearance/merged (public — userId derive từ JWT cookie nếu có)
                    ├── setAppearanceStore(data)
                    ├── applyAppearanceTokens(data)
                    ├── changeLanguage(data.appearance_language)
                    └── applyTheme(data.appearance_theme)

User change settings
  └── SignalR: user:settings-changed { userId }
        └── useAppearanceSync() → reloadAppearance()

Admin change system defaults
  └── SignalR: system:config-changed { key: "appearance_defaults" }
        └── useAppearanceSync() → loadAppearance() (re-fetch merged)
```

### applyTheme mechanism

```
applyTheme(themeId)
  └── loadTheme(themeId, "theme.css")   # cssPath cố định — ThemeManifest không còn CssPath
        └── appendStylesheet(themeId, "theme.css")
              ├── href = ThemeRoutes.themes.replace("{id}", themeId).replace("{path}", "theme.css")
              │        → /themes/{themeId}/theme.css (vd /themes/light/theme.css)
              ├── xóa <link id="nmx-theme-css"> cũ
              ├── tạo <link> mới → append vào <head>
              └── Promise resolve/reject dựa trên onload/onerror
```

### Appearance settings keys

| Key | Type | Valid values |
|-----|------|-------------|
| `appearance_theme` | string | backend-defined theme IDs |
| `appearance_accent_color` | string | blue, green, purple, orange, pink |
| `appearance_collapsed` | string | "true", "false" |
| `appearance_density` | string | compact, default, spacious |
| `appearance_font_family` | string | system (dynamic từ API) |
| `appearance_font_size` | string | sm, md, lg |
| `appearance_language` | string | en, vi |
| `appearance_date_format` | string | DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD |
| `appearance_time_format` | string | HH:mm, hh:mm A |

### APIs

| Method | Endpoint | Auth | Returns |
|--------|----------|------|---------|
| GET | `/api/settings/appearance` | Public | System default settings |
| GET | `/api/settings/appearance/merged` | Public | Merged 3-layer appearance (code ← system ← user) — userId từ cookie nếu có |
| GET | `/api/user/settings` | RequireAuth | User's settings |
| PUT | `/api/user/settings` | RequireAuth | Save user settings (validated) |
| PUT | `/api/settings/appearance` | RequireAdmin | Save system defaults (validated) |
| GET | `/api/settings/appearance/options` | RequireAuth | Valid options list |

### Key files

| File | Role |
|------|------|
| `frontend/packages/core/src/theme/loader.ts` | `restoreTheme()`, `loadTheme()`, `applyTheme()` |
| `frontend/packages/core/src/store/accessors.ts` | `setAppearanceStore()`, `useAppearanceStore()` |
| `frontend/packages/core/src/types/appearance.ts` | `AppearanceSettings` interface, `AppearanceDefaults` |
| `frontend/src/hooks/useAppearanceSync.ts` | Hook gắn appearance + SignalR listener |
| `frontend/src/controllers/auth.controller.ts` | `loadAppearance()` — 1 call `GET /api/settings/appearance/merged` |
| `backend/src/Namorix.Server/Services/SettingsService.cs` | `GetAppearanceDefaultsAsync()`, `GetMergedAppearanceAsync()` + cache |
| `backend/src/Namorix.Server/Services/UserSettingsService.cs` | `GetAllAsync()`, `SetBatchAsync()` + cache |
| `backend/src/Namorix.Core/Constants/Settings.cs` | `AppearanceSettingKeys`, `AppearanceDefaults` |
| `backend/src/Namorix.Core/Data/AppearanceOptionsData.cs` | Valid options for each key |

### What external addon needs

- Đọc theme hiện tại: `useAppearanceStore()` → `.appearance_theme`
- React khi theme đổi: subscribe `shell:theme-changed` event qua EventBus
- Ko cần tự apply theme — shell lo

---

## 4. Settings (System + User)

### Architecture

```
Settings table (system-wide)
  └── SettingKeys: register_enabled, trusted_proxies, allowed_origins, appearance_*
  └── Cached via IMemoryCache (10 min)

UserSettings table (per-user)
  └── UserId + Key + Value
  └── Cached via IMemoryCache (10 min)
```

### System settings

| Method | Endpoint | Auth | Note |
|--------|----------|------|------|
| GET | `/api/settings/system` | RequireAdmin | Proxies, origins, register |
| PUT | `/api/settings/system` | RequireAdmin | Save all |
| GET | `/api/settings/appearance` | Public | System defaults |
| PUT | `/api/settings/appearance` | RequireAdmin | Save defaults (validated) |

### User settings

| Method | Endpoint | Auth | Note |
|--------|----------|------|------|
| GET | `/api/user/settings` | RequireAuth | User's settings (cached) |
| PUT | `/api/user/settings` | RequireAuth | Batch save (validated) |

### Cache invalidation

```
GetAppearanceDefaultsAsync → memoryCache.GetOrCreate("appearance_defaults")
SetAppearanceDefaultsAsync → memoryCache.Remove("appearance_defaults")

UserSettings.GetAllAsync(userId) → memoryCache.GetOrCreate($"user_settings_{userId}")
UserSettings.SetAsync / SetBatchAsync → memoryCache.Remove($"user_settings_{userId}")
```

### Validation schema

```
SetSettingsSchema (IValidationSchema)
  ├── AppearanceAccentColor → AllowedValuesValidationRule (from AppearanceOptionsData)
  ├── AppearanceDensity → AllowedValuesValidationRule
  ├── AppearanceCollapsed → AllowedValuesValidationRule: ["true", "false"]
  ├── AppearanceFontFamily → AllowedValuesValidationRule
  ├── AppearanceFontSize → AllowedValuesValidationRule
  ├── AppearanceLanguage → AllowedValuesValidationRule
  ├── AppearanceDateFormat → AllowedValuesValidationRule
  └── AppearanceTheme → StringValidationRule (MaxLength: 100)
```

### Key files

| File | Role |
|------|------|
| `backend/src/Namorix.Core/Validation/Schemas/SetSettingsSchema.cs` | DTO + schema |
| `backend/src/Namorix.Core/Validation/ValidationRule.cs` | `AllowedValuesValidationRule` |
| `backend/src/Namorix.Server/Services/SettingsService.cs` | System settings logic |
| `backend/src/Namorix.Server/Services/UserSettingsService.cs` | User settings logic + SignalR notify on change |
| `backend/src/Namorix.Core/Infrastructure/IUserSettingsNotifier.cs` | Interface for user settings SignalR notification |
| `backend/src/Namorix.Core/Hubs/SignalRUserSettingsNotifier.cs` | Sends `user:settings-changed` to user's connections |
| `backend/src/Namorix.Core/Constants/Settings.cs` | Setting keys + defaults |

---

## 5. Validation

### Two-tier system

**Server side:**
```
[Validate(typeof(SomeSchema))]
  └── ValidateAttribute (ActionFilter)
        ├── Đọc schema properties
        ├── Match với request object property
        ├── Gọi rule.Validate(fieldName, value)
        └── Nếu fail → 400 + ApiResponse với error code
```

**Client side:**
```
validate(t)
  .required(F.USERNAME, username)
  .minLength(F.PASSWORD, password, 6)
  .first()
```

### Rule types

| Rule | Checks | Error code |
|------|--------|------------|
| `StringValidationRule` | Required, MinLength, MaxLength, Trim, MatchField | REQUIRED, TOO_SHORT, TOO_LONG, MISMATCH |
| `FormatValidationRule` | Pattern (regex), MinLength, MaxLength | INVALID_FORMAT |
| `EnumValidateRule` | Enum.IsDefined | INVALID_ENUM |
| `AllowedValuesValidationRule` | Value in allowed list | INVALID_OPTION |

### Filter pipeline

```
Request → JsonErrorMiddleware → ExceptionMiddleware
  → SecurityHeaders → AuthMiddleware → TrustedProxy
  → CsrfMiddleware → Routing → RateLimiter
  → ValidationFilter (ModelState)
  → [Validate] attribute (schema)
  → Controller action
```

### Error response format

```json
{
  "success": false,
  "error": "INVALID_OPTION",
  "field": "appearanceAccentColor",
  "meta": {
    "allowedValues": ["blue", "green", "purple", "orange", "pink"]
  }
}
```

### Key files

| File | Role |
|------|------|
| `backend/src/Namorix.Core/Validation/ValidateAttribute.cs` | Action filter cho schema validation |
| `backend/src/Namorix.Core/Validation/ValidationRule.cs` | All rule types |
| `backend/src/Namorix.Core/Validation/IValidationSchema.cs` | Marker interface |
| `backend/src/Namorix.Core/Validation/Schemas/` | All schemas |
| `backend/src/Namorix.Server/Validation/Frontgate/` | Frontgate schemas — FrontgateRuleSchema, FrontgateCertSchema, AccessPolicySchema, CustomCertSchema (schema prop name phải khớp request record prop — `ValidateAttribute.GetPropertyValue`) |
| `backend/src/Namorix.Core/Filters/ValidationFilter.cs` | ModelState filter |
| `backend/src/Namorix.Core/Constants/Error.cs` | Error codes |
| `backend/src/Namorix.Core/Constants/Validation.cs` | ValidationMeta |

---

## 6. Error Handling

### Flow

```
API error response
  ↓
nmxHttp → RequestBuilder.json()
  ├── 401 → auto-refresh token, retry once
  ├── !data.success → throw ApiError.fromResponse(data)
  └── success → return data

Controller / page component
  └── catch (err)
        └── formatApiError(t, err)
              ├── Validation error → translated message
              ├── Auth error → translated message
              └── null → use generic fallback
```

### ApiError structure

```typescript
class ApiError extends Error {
  statusCode: number
  code: string      // "INVALID_FORMAT", "UNAUTHORIZED", etc.
  field?: string    // field name nếu validation error
  meta?: ValidationErrorMeta  // chi tiết (min, max, allowedValues, etc.)
}
```

### Resolution chain

```
formatApiError(t, err)
  └── parseValidationError(t, err)  → field-level i18n key
  └── parseAuthError(t, err)        → auth error i18n key
  └── return null                   → caller dùng fallback
```

### Key files

| File | Role |
|------|------|
| `frontend/packages/core/src/http/client.ts` | RequestBuilder, auto-refresh, ApiError |
| `frontend/packages/core/src/i18n/validation-messages.ts` | Error → i18n mapper |
| `backend/src/Namorix.Core/Middleware/ExceptionMiddleware.cs` | Global exception handler |

---

## 7. SignalR

### Connection lifecycle

```
Desktop mount (authenticated)
  └── useSignalR(true)
        └── SignalrClient (per hubPath — default resolveHubPath() → getHubsPath() ?? HUB_MAIN)
              └── HubConnectionBuilder
                    ├── .withUrl(getApiBaseUrl() + hubPath)
                    ├── .withAutomaticReconnect()
                    └── build().start()
                          ├── Flush pendingHandlers (registered via client.on trước start)
                          ├── Subscribe groups: traffic, logs
                          └── Emit handshake

On disconnect
  └── scheduleReconnect()
        ├── refreshAccessToken() (single-flight — dùng chung REST + SignalR)
        │     ├── "expired" (401) → dừng retry → onUnauthorized (redirect login)
        │     └── "success" → startConnection() (lỗi thì backoff tiếp)
        └── exponential backoff 5s → 10s → 20s → 30s cap
              └── Reset delay on successful reconnect
```

### Events

| Event | Direction | Payload | Used by |
|-------|-----------|---------|---------|
| `traffic:new-logs` | Server → Client | TrafficLogsFlushed + BucketData (TOTAL API + proxy mixed — mỗi entry có `source` field) | NetworkTraffic |
| `traffic:stats-init` | Server → Client | BucketData[] | NetworkTraffic stats |
| `logs:new-entry` | Server → Client | LogEntry[] | LogViewer (live mode) |
| `system:config-changed` | Server → Client | `{ key: string }` | useAppearanceSync |
| `user:settings-changed` | Server → Client | `{ userId: number }` | useAppearanceSync (re-fetch user settings) |
| `user:theme-changed` | Server → Client | `{ themeId: string }` | (planned) |
| `addon:status-changed` | Server → Client | `AddonStatusPayload` (`{ addonId: string, status: AddonContainerStatus, lastErrorCode?: string }`) | PackageCenter AddonEventWatcher (global) |
| `addon:pending-task-changed` | Server → Client | `AddonPendingTaskPayload` (`{ addonId: string, taskPhase: AddonPendingPhase \| null }`) | PackageCenter AddonGrid (pending overlay) |
| `addon:uninstalled` | Server → Client | `{ addonId: string }` | AddonEventWatcher (remove addon + toast) |
| `addon:widget-event` | Server → Client | `{ addonId: string, payload: string }` | (planned) Forward addon widget events via gRPC→SignalR bridge |
| `beacon:hostname-status-changed` | Server → Client | `{ hostnameId: string, hostname: string, status: string }` | Beacon (status badge live update) |
| `beacon:activity-created` | Server → Client | `{ id, timestamp, level, code, paramsJson, hostname }` | BeaconActivity (realtime log — no handler khi tab activity chưa mở → SignalR JS log warning benign) |
| `beacon:hostnames-refreshed` | Server → Client | `{ updated: number }` | BeaconHostnames (sau probe queue) |
| `beacon:hostname-changed` | Server → Client | `{ hostnameId: string, hostname: string, action: string }` | BeaconHostnames (realtime CRUD — create/update/delete; action lowercase) |
| `frontgate:cert-status-changed` | Server → Client | `{ certId: string, status: string, issuer?: string, expiresAt?: string }` | Frontgate (certificate status — `FgCertRenewWorker`/`CertificateController`; group `frontgate`) |
| `frontgate:rule-changed` | Server → Client | `{ ruleId: string, action: string }` | FrontgateReverseProxy (realtime CRUD — group `frontgate`) |
| `frontgate:dry-run-changed` | Server → Client | `{ ruleId: string, action: string }` | FrontgateReverseProxy (dry-run confirm/cancel/expire — group `frontgate`) |
| `frontgate:cert-changed` | Server → Client | `{ certId: string, action: string }` | FrontgateCertificate (realtime CRUD — group `frontgate`) |
| `frontgate:audit-created` | Server → Client | `{ targetType: string, targetId: string, action: string }` (lowercase enum — FgAuditTargetType/FgAuditAction) | FrontgateAudit (realtime log — `FrontgateAudit.NotifyAuditCreated`; group `frontgate`) |
| `warden:new-event` | Server → Client | `{ id, eventType, severity, sourceAddon, sourceIp, count, timestamp }` | WardenOverview (stats realtime — `SignalRWardenNotifier.NotifyNewEvent`; group `warden`) |

### Hooks

| Hook | Usage |
|------|-------|
| `useSignalR(enabled, hubPath?)` | Mount/unmount connection lifecycle (per hubPath) |
| `useSignalREvent<T>(event, handler, hubPath?)` | Subscribe event with cleanup. If connection not ready, buffers via `client.on` → `pendingHandlers` flushed on `start()`. useRef handler, `[eventName, hubPath]` deps. |
| `useSignalRGroup(group, active, hubPath?)` | Join/leave group with reconnect handler |
| `useServerSignalREvent(event, handler)` | Typed wrapper for ServerSignalREvent |
| `useServerSignalRGroup(group)` | Typed wrapper for ServerSignalRGroups |

### Backend

```
NmxHub (IHubContext)
  ├── ISystemNotifier → NotifyConfigChangedAsync(key)
  ├── ITrafficNotifier → NotifyFlushAsync()
  ├── ILogNotifier → NotifyNewEntriesAsync()
  ├── IAddonNotifier → NotifyAddonStatusChanged(addonId, status, lastErrorCode?)
  │    ├── NotifyPendingTaskChanged(addonId, phase?)
  │    ├── NotifyAddonUninstalled(addonId)
  │    └── NotifyAddonWidgetEvent(addonId, payload)
  └── IBeaconNotifier → NotifyActivityCreated(log, hostname)
       ├── NotifyHostnameStatusChanged(hostnameId, hostname, status)
       ├── NotifyHostnamesRefreshed(updated)
       └── NotifyHostnameChanged(hostnameId, hostname, action)
  └── IFrontgateNotifier → NotifyCertStatusChanged(certId, status, issuer, expiresAt)
       ├── NotifyDryRunChanged(ruleId, action)
       ├── NotifyRuleChanged(ruleId, action)
       └── NotifyCertChanged(certId, action)
  └── IWardenNotifier → NotifyNewEvent(evt)         // warden:new-event → group warden
```

**Herald (scoped) — từ singleton `WdFirewallService`**: resolve `IHeraldNotifier` qua `IServiceScopeFactory` (scoped — phụ thuộc `NotificationService`). `HeraldNotifier` — `warden:ruleApplied` (Warning) / `warden:ruleRemoved` (Info), **chỉ khi `Action == Deny`**, params `name`/`sourceCidr`/`expiresAt`. `WdFirewallService.ApplyAllAsync(notify:false)` khi restart → không spam notify toàn bộ rules.

### Key files

| File | Role |
|------|------|
| `frontend/packages/core/src/signalr/signalr.service.ts` | `SignalrClient` class per hubPath (cached in `clients` Map), `pendingHandlers` buffer flushed on start, reconnect logic, `resolveHubPath()`/`getSignalrClient()` |
| `frontend/packages/core/src/signalr/useSignalR.ts` | Hook: mount/unmount connection |
| `frontend/packages/core/src/signalr/useSignalREvent.ts` | Hook: subscribe typed events |
| `frontend/packages/core/src/signalr/useSignalRGroup.ts` | Hook: group subscribe |
| `frontend/packages/core/src/signalr/constants.ts` | Event names + types |
| `backend/src/Namorix.Server/Hubs/NmxHub.cs` | SignalR hub |
| `backend/src/Namorix.Core/Hubs/` | Notifiers |

---

## 8. Addon System

### Addon contract

```typescript
interface AddonEntry {
  mount(container: HTMLElement, context: AddonContext): void
  unmount(): void
}

interface AddonContext {
  addonId: string
  nmxStore?: typeof nmxStore
  store?: Store
  isExternal?: boolean
  containerUrl?: string
  sendCommand?: (command: string, payload?: unknown) => Promise<unknown>
}

interface NmxAddonManifest {
  id: string
  name: string
  version: string
  icon?: string
  defaultWidth?: number
  defaultHeight?: number
  preferFullSize?: boolean
  role?: number   // bitmask, filter by user role
}
```

### Registration

```typescript
// *.addon.ts
export default defineAddon(manifest, (container, context) => {
  // mount logic
  return () => { /* unmount */ }
}, GlobalComponent?)  // optional global component (renders in Root.tsx)

// addons/index.ts
import "./LogViewer/LogViewer.addon"
import "./Settings/Settings.addon"
// auto-register at import time
```

### Lifecycle

```
addons/index.ts (import)
  └── defineAddon() → registerAddon(manifest, entry)

Window open
  └── resolveAddon(appId) → entry
  └── useAddonMount(container, entry, context)
        ├── useLayoutEffect
        ├── entry.mount(container, context)
        └── return () => entry.unmount()
```

### Event Bus (shell ↔ addon)

```typescript
// Shell → Addon
"shell:theme-changed"   → { theme }
"shell:locale-changed"  → { locale }
"shell:file-open"       → { path }

// Addon → Shell
"addon:notification"    → { addonId, title, message }
"addon:open-file"       → { addonId, path }
"addon:request-focus"   → { addonId }
```

### Addon modes

| Mode | Auth | DOM slot | Token needed | Status |
|------|------|----------|-------------|--------|
| Widget (iframe) | HttpOnly cookie | ✅ (DOM slot) | ❌ | M4 completed |
| Standalone (own server) | OAuth2 authorization_code + PKCE | ❌ | ✅ (cookie-based refresh) | M4 completed |
| Full app (window.open) | Handshake token | ❌ | ✅ | Planned |

### External Addon Standalone Auth (OAuth2 authorization_code + PKCE)

Addon standalone mode (own server, separate origin) uses OAuth2 authorization code flow with PKCE:

```
createMount (addon entry)
  ├── isStandalone && !context.oauthConfig
  │     └── fetch /.well-known/nmx-oauth-config (discovery)
  │           └── Returns { authorizeUrl, tokenUrl, clientId, redirectUri }
  │
  ├── URL có code + state? (OAuth callback)
  │     └── handleRedirectCallback(tokenUrl, clientId, redirectUri)
  │           ├── POST /api/oauth/token (form-urlencoded)
  │           │     grant_type=authorization_code
  │           │     code=xxx&code_verifier=yyy&client_id=zzz
  │           ├── Server: PKCE verification, create OAuthToken + OAuthRefreshToken
  │           ├── Set-Cookie: nmx_addon_refresh_token (HttpOnly, SameSite=Lax, Path=/api)
  │           └── Returns { accessToken, expiresIn }
  │     ├── store token in-memory (_token)
  │     └── window.history.replaceState (clean URL)
  │
  ├── Có access token? (getAccessToken)
  │     └── Return cached token if not expired
  │
  ├── Không có access token?
  │     └── trySilentRefresh(desktopUrl)
  │           ├── POST /api/oauth/token/refresh (with cookie)
  │           ├── Server: hash raw token → lookup OAuthRefreshToken
  │           │     ├── Not found/used/expired → 401
  │           │     └── Valid → mark old Used, create new OAuthToken + OAuthRefreshToken
  │           │           ├── Set-Cookie: new nmx_addon_refresh_token
  │           │           └── Returns { accessToken }
  │           └── Success → render()
  │
  │     └── Silent refresh failed?
  │           └── authorizeRedirect(authorizeUrl, clientId, redirectUri)
  │                 ├── Generate PKCE code_verifier (43-128 chars) + code_challenge (S256)
  │                 ├── Generate state (anti-CSRF)
  │                 ├── Store in sessionStorage (code_verifier, state)
  │                 └── Redirect to authorize endpoint:
  │                       GET /api/oauth/authorize?
  │                         client_id=xxx&redirect_uri=yyy&response_type=code
  │                         &code_challenge=S256hash&code_challenge_method=S256&state=zzz
  │
  └── OAuth authorize:
        └── Server checks user session (cookie)
              ├── No session → redirect {frontendUrl}/login?returnUrl={authorizeUrl with params}
              └── Has session → create authorization code
                    ├── Store code + PKCE challenge in OAuthAuthorizationCode
                    └── Redirect to redirect_uri?code=xxx&state=yyy
```

Token refresh rotation:
```
OAuthService.RefreshAddonTokenAsync(rawToken)
  ├── Hash = SHA256(Base64Decode(rawToken)) → hex string
  ├── Find OAuthRefreshToken by hash (not expired)
  │     ├── Not found → return (Expired, 401)
  │     ├── Found + Used == true → REUSE DETECTED
  │     │     ├── Revoke ALL OAuthTokens for this ClientId
  │     │     ├── Mark ALL OAuthRefreshTokens for this ClientId as Used
  │     │     ├── Log warning "Token reuse detected"
  │     │     └── Return (Reused, 401 + TOKEN_REUSED error code)
  │     └── Found + Used == false → mark as Used
  ├── Create new OAuthToken + new OAuthRefreshToken (rotation)
  └── Return (Ok, newTokenId, newRefreshToken)
```

OAuth token cleanup (TokenCleanupWorker, every 24h):
```
CleanupExpiredTokens
  ├── DELETE RefreshTokens WHERE ExpiresAt < UtcNow
  ├── DELETE OAuthRegistrations WHERE Used OR ExpiresAt < UtcNow
  ├── DELETE OAuthRefreshTokens WHERE Used OR ExpiresAt < UtcNow
  ├── DELETE OAuthAuthorizationCodes WHERE ExpiresAt < UtcNow
  └── DELETE OAuthTokens WHERE ExpiresAt < UtcNow
```

Cookie management:
```
SetAddonRefreshTokenCookie(token):
  ├── HttpOnly = true (not readable by JS)
  ├── SameSite = Lax (CSRF protection)
  ├── Path = /api (available to all /api/* endpoints)
  ├── Expires = UtcNow + OAuthRefreshTokenTtlDays (configurable, default 30)
  └── Secure = _appConfig.SecureCookie
```

### External Addons (M4 — Docker)

External addon lifecycle:
```
User installs addon
  └── POST /api/addons/install { id }
        ├── AddonController: SetTaskPending(id, Installing), enqueue Install task
        └── AddonTaskQueue → AddonTaskExecutor.InstallAsync(id)
              ├── Look up catalog entry by id (AddonCatalogEntry)
              ├── If catalog entry not found → notify ADDON_NOT_FOUND error
              ├── DockerService.ImageExistsLocallyAsync(image)
              │     └── If false → DockerService.PullImageAsync(image)
              ├── ParseCatalogPorts(catalogEntry.Ports) — JSON [{"container":5180,"protocol":"tcp"}]
              ├── DockerService.CreateContainerAsync() with env vars + port mapping
              │     (container created but NOT started)
              ├── Save AddonInstallation to DB (Status = Installed)
              └── NotifyAddonStatusChanged(addonId, Installed) via SignalR

DockerMonitorWorker
  ├── [Init] SyncAllContainersAsync — full sync once on startup
  │     └── Also clears stale `PendingTaskId` fields (server restart recovery)
  ├── [Primary] WatchContainerEventsAsync — real-time Docker event stream
  │     └── MonitorEventsAsync with label filter (namorix-addon=true)
  │           ├── start → query container info, sync/discover
  │           ├── stop/die → set AddonStatus.Stopped (no Docker query)
  │           └── destroy → set AddonStatus.Error
  ├── [Safety] PollLoopAsync (every 30s, check _lastEventTime)
  │     └── If silent >5 min → full sync (reconnect safety net)
  └── IAddonNotifier.NotifyAddonStatusChanged() via SignalR

External addon auth (OAuth2 client_credentials + private_key_jwt)

Addon tự tạo RSA keypair, gửi public key qua registration token để đăng ký:

```
InstallAsync (AddonTaskExecutor)
  └── Generate registration token (Guid)
  └── Store OAuthRegistration (Token, AddonInstallationId, ExpiresAt)
  └── Docker create: passes NMX_DESKTOP_API_URL + NMX_REGISTRATION_TOKEN env vars
  └── Addon container starts → NmxOAuth2Client.EnsureInitializedAsync()
        ├── Nếu oauth.json tồn tại: load credentials từ disk
        ├── Nếu NMX_REGISTRATION_TOKEN set: self-register
        │     ├── Gen RSA keypair (2048)
        │     ├── POST /api/oauth/register { registrationToken, publicKey }
        │     └── Save ClientId + PrivateKey → oauth.json
        └── Nếu không có cả 2: throw (misconfigured)

OAuthController.Register (POST /api/oauth/register)
  └── OAuthService.RegisterClientAsync
        ├── Validate registration token (exists, !Used, not expired)
        ├── Set ClientId + PublicKey on AddonInstallation
        └── Return clientId

OAuthController.Token (POST /api/oauth/token) [form-urlencoded, exempt from JSON + CSRF]
  ├── grant_type=client_credentials
  │     └── OAuthService.IssueClientCredentialsTokenAsync
  │           ├── Parse client_assertion (JWT)
  │           ├── Verify RSA signature against stored PublicKey
  │           └── Return access_token (Bearer, 1h TTL)
  ├── grant_type=authorization_code (future)
  │     └── OAuthService.ExchangeCodeAsync
  └── grant_type=invalid → unsupported_grant_type error

NmxOAuth2Client.GetAccessTokenAsync (addon gọi mỗi khi cần token)
  └── Check _cached (trả về cached nếu còn hạn - 30s buffer)
  └── Tạo client_assertion JWT mới (iss=clientId, sub=clientId, aud=token endpoint)
  └── POST /api/oauth/token với grant_type=client_credentials + assertion
  └── Cache access_token, return

OAuthController.Revoke (POST /api/oauth/revoke)
  └── OAuthService.RevokeTokenAsync(tokenId)
        ├── Lookup OAuthToken by TokenId
        ├── Set Revoked = true
        └── Tìm AddonInstallation bằng ClientId, trả về addonId
  └── AddonChannelManager.DisconnectAsync(addonId) — cancel gRPC stream

gRPC Addon Channel (addon ↔ backend bidirectional stream)

Addon mở 1 kênh gRPC duy nhất khi start, thay thế SSE Stream + HTTP Command:

```
Addon container → Connect(metadata: Bearer <access_token>)
  └── AddonChannelService.Connect
        ├── gRPC interceptor: ValidateTokenAsync(token) → addonId
        │     └── Fail → throw RpcException(Unauthenticated)
        ├── AddonChannelManager.Register(addonId, cts)
        ├── background recheck loop (5 phút):
        │     └── OAuthService.IsAddonAuthorizedAsync(addonId)
        │           ├── addon tồn tại + có ClientId → OK
        │           └── revoked/hết hạn → throw RpcException(PermissionDenied)
        ├── requestStream: addon → backend (AddonMessage)
        │     ├── "widget-event" → IAddonNotifier.NotifyAddonWidgetEvent → SignalR → frontend
        │     ├── "log" → ILogger
        │     └── "heartbeat" → respond ShellMessage heartbeat-ack
        ├── responseStream: backend → addon (ShellMessage)
        │     ├── "command" → (planned) admin gửi command xuống addon
        │     └── "config-update" → (planned) push config changes
        └── finally: AddonChannelManager.DisconnectAsync(addonId)

Active cancellation (revoke/uninstall):
  ├── OAuthController.Revoke → ChannelManager.DisconnectAsync(addonId)
  │     └── ChannelManager cancels ChannelContext.CTS → linkedCts cancelled
  │           └── server ReadAllAsync throws OCE → caught by when(cts.IsCancellationRequested)
  │                 └── throw RpcException(Cancelled) → gRPC framework → client
  │                       └── client ReceiveLoopAsync catches RpcException(Cancelled)
  │                             ├── logger.Warning("Server disconnected the channel")
  │                             └── _call = null → IsConnected = false
  └── AddonTaskExecutor.UninstallAsync/StopAsync → ChannelManager.DisconnectAsync(addonId)
```

### Addon Task Queue (Backend)

Async task execution for addon operations (install, uninstall, start, stop):

```
AddonController action
  └── SetTaskPending(addonId, status) — sets PendingTaskId + Status in DB
  └── AddonTaskQueue.Enqueue(addonId, taskType)
        └── Channel<AddonTask> (unbounded)
              └── AddonTaskExecutor (max 2 concurrent workers)
                    ├── Dequeue → execute Docker operation
                    └── On complete: clear PendingTaskId, update Status
```
```

### Key files

| File | Role |
|------|------|
| `frontend/packages/core/src/addon/types.ts` | AddonEntry, NmxAddonManifest, AddonContext, ExternalAddonManifest |
| `frontend/packages/core/src/addon/factory.tsx` | `defineAddon()` |
| `frontend/packages/core/src/addon/registry.ts` | `registerAddon()`, `resolveAddon()`, `listAddons()` |
| `frontend/packages/core/src/addon/context.tsx` | `AddonContextProvider`, `useAddonContext()` |
| `frontend/packages/core/src/apiRoutes.ts` | ApiAddonRoutes (list, install, start, stop, remove) |
| `frontend/packages/core/src/eventBus.ts` | `emit()`, `on()`, `off()` |
| `frontend/packages/core/src/signalr/constants.ts` | SignalR event names + ServerSignalR types (shared với frontend) |
| `frontend/src/signalr/constants.ts` | ServerSignalR constants mirroring backend (SystemMonitor, Addon groups/events) |
| `frontend/src/signalr/useSignalR.ts` | `useServerSignalREvent`, `useServerSignalRGroup` wrappers |
| `frontend/src/addons/` | All built-in addons (LogViewer, Settings, etc.) |
| `frontend/src/controllers/addon.controller.ts` | Addon API controller |
| `frontend/src/services/externalAddonEntry.ts` | Iframe mount/unmount for external addons |
| `frontend/src/store/slices/externalAddonsSlice.ts` | Redux state for external addons |
| `backend/src/Namorix.Server/Services/DockerService.cs` | Docker.DotNet wrapper |
| `backend/src/Namorix.Server/Services/AddonService.cs` | Addon CRUD business logic |
| `backend/src/Namorix.Server/Services/OAuthService.cs` | OAuth2 register + client_credentials token exchange (JWT RS256) |
| `backend/src/Namorix.Server/Controllers/AddonController.cs` | REST API endpoints |
| `backend/src/Namorix.Server/Controllers/OAuthController.cs` | OAuth register + token endpoints |
| `backend/src/Namorix.Server/Middleware/OAuth2Middleware.cs` | Bearer token verification |
| `backend/src/Namorix.Core/OAuth/NmxOAuth2Client.cs` | OAuth2 client SDK (self-registration, token caching) |
| `backend/src/Namorix.Core/OAuth/NmxAddonConfig.cs` | Addon env var config (DesktopApiUrl, RegistrationToken, GrpcUrl) |
| `backend/src/Namorix.Core/OAuth/NmxOAuth2ServiceCollectionExtensions.cs` | DI extension for addon OAuth2 client |
| `backend/src/Namorix.Core/Constants/OAuth.cs` | OAuth env vars, grant types, parameters |
| `backend/src/Namorix.Core/Constants/ExemptPaths.cs` | Middleware bypass paths (OAuth endpoints) |
| `backend/src/Namorix.Core/Config/BackendConfig.cs` | Backend config (Port, RegistrationTokenTtlMinutes) |
| `backend/src/Namorix.Core/Models/OAuthRegistration.cs` | Registration token entity |
| `backend/src/Namorix.Core/Grpc/AddonChannelClient.cs` | gRPC client for addons (OAuth2 token + duplex stream management) |
| `backend/src/Namorix.Core/Grpc/AddonChannelClientExtensions.cs` | DI extension for AddonChannelClient |
| `backend/src/Namorix.Core/Grpc/AddonHostedServiceBase.cs` | Base class for addon IHostedService (auto-reconnect) |
| `backend/src/Namorix.Server/Workers/DockerMonitorWorker.cs` | Container event stream + health check poll + auto-discover |
| `backend/src/Namorix.Core/Constants/Docker.cs` | Docker state/event/filter constants |
| `backend/src/Namorix.Server/Infrastructure/IAddonNotifier.cs` | Addon status notification interface |
| `backend/src/Namorix.Server/Hubs/SignalRAddonNotifier.cs` | SignalR addon:status-changed |
| `backend/src/Namorix.Server/Services/AddonTaskQueue.cs` | Channel-based async task queue |
| `backend/src/Namorix.Server/Services/AddonTaskExecutor.cs` | Concurrent worker (max 2) for addon operations |
| `backend/src/Namorix.Server/Models/AddonTask.cs` | Task model for queue |
| `backend/src/Namorix.Core/Protos/addon_channel.proto` | gRPC proto — bidirectional AddonChannel service |
| `backend/src/Namorix.Server/Services/AddonChannelManager.cs` | ConcurrentDictionary<string, ChannelContext> for active gRPC cancellation |
| `backend/src/Namorix.Server/Services/Grpc/AddonChannelService.cs` | gRPC bidirectional streaming — auth interceptor + 5-min recheck + SignalR bridge |
| `frontend/src/addons/PackageCenter/AddonEventWatcher.tsx` | Global SignalR handler for addon status events |

### Beacon DDNS Addon (M4 — internal)

DDNS updater: cập nhật DNS record trỏ về public IP hiện tại của mạng (kiểu Synology DSM). Route `/api/beacon`, controller `BcnController`, entity prefix `Bcn`. Đứng cùng Frontgate (Beacon báo "nhà đang ở IP nào", Frontgate mở cổng).

**Provider engine (Strategy + Registry):**
```
IBcnProviderClient (Info, UpdateAsync, TestAsync)
  ├── BcnGetProviderBase (abstract) — GET-style: NoIp, DuckDns, Dynu, Namecheap
  ├── CloudflareProvider / GoDaddyProvider — REST JSON (lookup record_id rồi PATCH/PUT)
  └── Custom: BcnSimpleGetProvider (UrlTemplate) / BcnRestJsonProvider (EndpointTemplate) — config-driven từ BcnProviderConfig
BcnProviderRegistry — resolve theo Info.Id từ IEnumerable<IBcnProviderClient> DI
BcnProviderResolver — built-in → registry, custom → theo Kind
```
- `BcnProviderConfig` = JSON blob (`ConfigJson` trên hostname), deserialize theo kind. Get: UrlTemplate/AuthType/User/Password/SuccessMatch. Rest: ApiToken/key+secret/Zone/Method/BodyTemplate/SuccessPath/RecordId.
- Provider built-in chỉ là template (URL + success-match + credential field layout) — credential nhập mỗi hostname. REST lookup record_id 1 lần rồi cache.

**Update loop (`BcnCheckWorker` BackgroundService — orchestrator, delegate logic sang `BcnHostnameService.UpdateHostAsync(host, ipv4, ipv6, force, ct)`; interval = `BcnSettings.CheckIntervalMinutes` default 15):**
```
1. Detect public IP (IPublicIpDetector / PublicIpService — auto/ipify.org)
2. Skip hostname Disabled / Updating / đang backoff
3. foreach host: updater.UpdateHostAsync(host, ip, ct) — service skip nếu IP không đổi (force=false)
4. Trong service: resolver.Resolve(...).UpdateAsync(host.Host, host.Domain, config, ipv4, ipv6, ct) — **provider tự split multi-host** (`@,www,home`): Cloudflare/GoDaddy/Namecheap loop từng tag (1 request/tag), DuckDNS batch (`domains=` nhận comma list)
5. Success → status Active + CurrentIp + Activity log (BCN_UPDATED)
6. Rate-limit (429/Retry-After) → BackoffUntil (exponential cap 24h), KHÔNG đổi status
7. Lỗi vĩnh viễn (401/403/404...) → status Error
8. IP detection fail → skip cả vòng, không log spam
```
`force=true` (controller `/check` manual) bypass bước 3 — Retry/Update luôn chạy kể cả IP không đổi. Logic update nằm duy nhất trong `BcnHostnameService` (1 nguồn, không drift giữa worker và controller).
`BcnActivityCleanupWorker` — pruning log quá `RetentionDays` (7 ngày), pattern `NotificationCleanupWorker`.

**Host/domain model (2026-08-05):** `BcnHostname` — `Host` = multi-tag comma (`@,www,home`), `Domain` = FQDN chuẩn dùng thẳng authoritative DNS. Provider `HostIsDomain` (No-IP) — controller derive `hostValue = domain` (lưu `Host = Domain`), FE ẩn host field + collapse label (`host === domain ? domain : host · domain`).
**Provider error detail + notification (2026-08-05):** error param `reason`/`httpStatus`/`detail` → FE `bcnErrorDetail` priority `detail → httpStatus>0 → reason`; backend `DescribeDetail` mirror. Namecheap extract `<Err1>` (GeneratedRegex + HtmlDecode), NoIp `reason` mọi error branch. Notification renderer (`Beacon.addon.tsx`) translate provider/hostname/detail + `return t(...)`. Toggle enable → `Updating` + `queue.EnqueueAsync` (chạy update qua queue như create/edit).

**Authoritative DNS read (2026-08-05):** `BcnHostnameService` so IP hiện tại với record thật của provider bằng `AuthoritativeDnsResolver.ResolveAsync` (DnsClient.NET) thay vì call provider GET: bootstrap NS qua `NameServer.GooglePublicDns` (Zone query `NS` → resolve NS IP), label-strip dần từ full hostname tới zone, query `A` + `AAAA` trực tiếp authoritative server (`UseCache=false`) → `BcnCurrentRecord(ipv4, ipv6)`. Provider-agnostic, không phụ thuộc provider GET /current.

**Queues (Channel-based BackgroundService):**
- `BcnUpdateQueue` — 1 hostname/event (create/update → `EnqueueAsync(host.Id)`): `SemaphoreSlim` max 2 concurrent, `RequeueUpdatingAsync` on startup (hostname Updating bị orphan sau restart → requeue), fail → status Error + `NotifyHostnameStatusChanged`.
- `BcnProbeQueue` — refresh toàn bộ (controller `POST /refresh` → `EnqueueAsync()`): batch probe hostname non-disabled qua `RefreshHostFromProviderAsync` (so sánh authoritative DNS + provider update), xong `NotifyHostnamesRefreshed(updated)`.

**SignalR realtime (2026-08-05):** `IBeaconNotifier` + `SignalRBeaconNotifier` (IHubContext<MainHub>, group `beacon`): `beacon:activity-created` (mỗi log BCN_PROBED/BCN_UPDATED), `beacon:hostname-status-changed`, `beacon:hostnames-refreshed` (sau probe). `beacon:hostname-changed` (2026-08-08) — create/update/delete hostname push `{hostnameId, hostname, action}` (action lowercase, `BcnHostnameAction`); FE `BeaconHostnames` subscribe → close edit dialog nếu hostname bị xóa ngoài + refetch. Note: JS SignalR client log warning `No client method with the name 'beacon:activity-created'` khi tab Activity chưa mount (không có handler) — event name đúng, warning benign. NmxRail giữ tab mounted (display:none) — `BeaconActivity` đã fix refresh-on-open bằng `useActiveTab()` gate (refetch mỗi khi tab active) + subscribe cả 2 beacon events. Warning `No client method` đã fix (BeaconActivity tự register handler khi mount).

**Config validation 2 lớp (2026-08-03):**
- **Runtime guard (provider)**: `BcnSimpleGetProvider` check `UrlTemplate` + basic `User`/`Password`; `BcnRestJsonProvider` check `EndpointTemplate` + `RecordLookupTemplate` (khi endpoint chứa `{recordId}`) → trả `BcnUpdateResult(false, BCN_CONFIG_INVALID, { field })`.
- **Save-time guard (controller)**: `BcnController.ValidateConfig` ở Create/Update — built-in qua `BcnProviderRegistry.Info.CredentialFields` (`Required==true`, map `GetConfigValue`), custom theo Kind → `400 ApiResponse.Fail(ConfigInvalid, null, field)` → `ApiError.field` → frontend inject label.

**API endpoints (`[RequireAdmin]`):**

| Method | Route | Chức năng |
|--------|-------|-----------|
| GET | `/api/beacon/hostnames?page&size` | list paginated |
| POST | `/api/beacon/hostnames` | tạo (validate schema + config) |
| PUT | `/api/beacon/hostnames/{id}` | cập nhật |
| DELETE | `/api/beacon/hostnames/{id}` | xóa (activity.HostnameId SetNull) |
| POST | `/api/beacon/hostnames/{id}/toggle` | disable → `Disabled`; enable → `Updating` + enqueue update |
| POST | `/api/beacon/hostnames/{id}/check` | **Retry/Update** manual — `UpdateHostAsync(force: true)` → `{success, code, params}` (passthrough `result.Params`) |
| POST | `/api/beacon/hostnames/test` | test config form (chưa save) bằng public IP hiện tại; dùng hostname từ form |
| GET | `/api/beacon/activity?page&size` | activity log (Code + ParamsJson + hostname text) |
| DELETE | `/api/beacon/activity` | xóa toàn bộ activity log (`ExecuteDeleteAsync` → `{ deleted }`) |
| GET | `/api/beacon/providers` | catalog (registry.Infos) |
| GET/PUT | `/api/beacon/settings` | check interval / IP service / IPv6 |
| GET | `/api/beacon/status` | total + healthy + lastCheck |
| POST | `/api/beacon/refresh` | refresh toàn bộ hostnames — enqueue `BcnProbeQueue` → `NotifyHostnamesRefreshed(updated)` |

Hostname status: `updating | active | disabled | error` (create/edit-save + toggle enable → Updating rồi chạy update ngầm qua `BcnUpdateQueue`; toggle disable → `Disabled`; rate-limit không đổi status).

**Frontend (`frontend/src/addons/Beacon/`):** `Beacon.tsx` — `NmxRail` 3 tab. `BeaconHostnames.tsx` — `NmxDataTable` (status badge, host·domain + current IP, provider badge, `NmxMenuButton` check/retry + enable/disable/delete, disable khi busy) + add/edit `NmxAlertDialog` (provider select placeholder + descriptions natural language, credential fields động + secret placeholder, host `NmxTagInput` multi + FQDN domain, hostIsDomain ẩn host field, custom toggle Simple GET / REST-JSON, Test connection). `BeaconActivity.tsx` — `NmxLogList` (label collapse host===domain). `BeaconSettings.tsx` — interval/IP service/IPv6 (hint). Feedback dùng markup `**{{hostname}}**` — render qua `markupToHtml` (toast + log list). Error: `BeaconErrorCodes` + `BCN_CONFIG_INVALID` → `formatBeaconError` (Beacon-local, `configFields` map inject field label), `bcnErrorDetail` normalize `detail`/`httpStatus`/`reason` → `detail`, `missingField` pre-check trước submit, `fieldLabel` lookup `credentialFields.*`. `Beacon.addon.tsx` — `registerNotificationDescriptionRenderer("beacon")`: translate error code qua `BeaconErrorCodes` + provider/hostname/detail, `return t('notification:'+key, params)`.

### Key files (Beacon)

| File | Role |
|------|------|
| `backend/src/Namorix.Server/Controllers/BcnController.cs` | REST API + `ValidateConfig` 2 lớp + `/check` manual |
| `backend/src/Namorix.Server/Constants/BcnErrorCodes.cs` | `BCN_*` codes (incl. `BCN_CONFIG_INVALID`) |
| `backend/src/Namorix.Server/Infrastructure/IBcnProviderClient.cs` | Provider contract + `BcnUpdateResult`/`BcnTestResult` |
| `backend/src/Namorix.Server/Infrastructure/IPublicIpDetector.cs` | Public IP detection abstraction (reuse cho Frontgate sau) |
| `backend/src/Namorix.Server/Services/BcnProviders/` | 6 built-in + custom SimpleGet/RestJson + registry + resolver + `BcnSecretProtector` + `AuthoritativeDnsResolver` |
| `backend/src/Namorix.Server/Services/PublicIpService.cs` | auto/ipify.org |
| `backend/src/Namorix.Server/Services/BcnHostnameService.cs` | Update logic single source (worker + controller `/check` + queue) — authoritative DNS compare |
| `backend/src/Namorix.Server/Services/BcnUpdateQueue.cs` | Channel queue — 1 hostname/event (create/update), concurrency 2, startup requeue updating |
| `backend/src/Namorix.Server/Services/BcnProbeQueue.cs` | Channel queue — refresh toàn bộ hostnames (`/refresh`) → `NotifyHostnamesRefreshed` |
| `backend/src/Namorix.Server/Hubs/SignalRBeaconNotifier.cs` | `IBeaconNotifier` SignalR impl (activity-created / hostname-status-changed / hostnames-refreshed) |
| `backend/src/Namorix.Server/Workers/BcnCheckWorker.cs` | Orchestrator — resolve service từ scope, delegate |
| `backend/src/Namorix.Server/Workers/BcnActivityCleanupWorker.cs` | Activity log pruning |
| `backend/src/Namorix.Server/Models/Bcn*.cs` | BcnHostname/Settings/ActivityLog/ProviderConfig/ProviderInfo |
| `frontend/src/addons/Beacon/` | BeaconHostnames/BeaconActivity/BeaconSettings + beacon.controller |
| `frontend/packages/core/src/apiRoutes.ts` | ApiBeaconRoutes |

### Warden Addon (M4 — internal)

Host-level firewall (dưới Frontgate HTTP layer): rules CIDR + iptables/nftables enforcement, security event log, auto-ban theo threshold profile, Herald notifications. Route `/api/warden`, controllers `WdController`/`WdEventController`, entity prefix `Wd`. Đứng dưới Frontgate — chặn ở layer mạng thay vì HTTP.

**Event publishing → `WdSecurityEvent` (`WdEventService.PublishAsync` — save DB + push SignalR):**
```
WdEventService.PublishAsync(eventType, severity, sourceAddon, sourceIp, count, detailJson)
  ├── new WdSecurityEvent → db.WdSecurityEvents.Add → SaveChangesAsync
  └── IWardenNotifier.NotifyNewEvent(evt) → SignalRWardenNotifier (group warden, event warden:new-event)
```
Call sites:
- `AcmeChallengeMiddleware` — ACME challenge fail → `WdEventTypes.AcmeChallengeFail` (severity Warning)
- `ProxyTrafficMiddleware` — 404 scan → `WdEventTypes.Scan404` (severity Info) — **debounce 1 event/IP/5-min** qua `ScanWindow` ConcurrentDictionary (chống DB flood khi bot scan hàng trăm req/s)

**Threshold engine (Phase 2):** `WdThresholdRules.For(eventType, thresholdFactor, durationFactor)` — base config theo event type:
| Event | Threshold | Lookback | BanDuration |
|-------|-----------|----------|-------------|
| `AcmeChallengeFail` | 20 | 5 min | 1 h |
| `Scan404` | 10 | 1 h | 30 min |
| `BruteForce` | 10 | 5 min | 1 h |

`WdThresholdFactors.For(profile, settings)` — Low (×2 / ×0.5), Medium (×1 / ×1), High (×0.5 / ×2), Custom (`CustomThresholdFactor`/`CustomDurationFactor`). Vượt threshold → auto tạo ban rule (WdThresholdWorker). `WdBanCleanupWorker` — gỡ rule hết hạn (`ExpiresAt`).

**Herald notifications (`IHeraldNotifier` — scoped, resolve từ singleton `WdFirewallService` qua `IServiceScopeFactory`):**
- `NotifyRuleAppliedAsync(rule)` — `warden:ruleApplied` (NotificationType.Warning), params `name`/`sourceCidr`/`expiresAt`
- `NotifyRuleRemovedAsync(rule)` — `warden:ruleRemoved` (NotificationType.Info), params `name`/`sourceCidr`
- **Chỉ notify khi `Action == Deny`** (allow rules im lặng). `ApplyAllAsync(notify:false)` khi restart — không spam notify toàn bộ rules.

**Notification keys:** `NotificationKeys.Warden.RuleApplied`/`RuleRemoved` = `warden:ruleApplied`/`warden:ruleRemoved` (camelCase — align FE template `warden.ruleApplied` "IP **{{sourceCidr}}** has been blocked"). `AddonSourceId.Warden` (`Namorix.Core/Constants/Addon.cs`).

**Frontend (`frontend/src/addons/Warden/`):** `Warden.tsx` — `NmxToolbar` tabs (overview/activity/rules/settings, content TRONG provider scope). Cả 3 page dùng `useActiveTab<WardenTab>` guard — chỉ fetch khi tab đang active. `WardenOverview.tsx` — firewall master toggle + 3 `NmxStatCard` + profile `NmxSegmentedGroup` + **stats realtime** (SignalR group `warden` `warden:new-event` + 30s poll fallback). `WardenActivity.tsx` — `NmxLogList` + pagination + detail dialog (click row → `NmxAlertDialog` + `NmxMetaList`, severity info/warning/error) + **Clear activity** (nút Clear → `NmxAlertDialog` confirm `confirmSemantic="error"` → `wardenController.clearEvents()` = `DELETE /api/warden/events`). `WardenRules.tsx` — `NmxDataTable` + `NmxBadge` allow=success/deny=error + `NmxMenuButton` + detail dialog + **add/update feedback** (`handleSubmitRule` → `nmxToast.success` `feedback.addSuccess`/`updateSuccess` kèm `{{name}}`; error `formatCustomError` + fallback `addError`/`updateError` qua `nmxToast.error` fallbackMessage). `WardenRuleDialog.tsx` — ports `NmxTagInput`. Notification icon: `warden` → `APP_WARDEN`.

### Key files (Warden)

| File | Role |
|------|------|
| `backend/src/Namorix.Server/Controllers/Warden/WdController.cs` | Rules CRUD + toggle + settings + stats (`/api/warden`, `[RequireAdmin]`) |
| `backend/src/Namorix.Server/Controllers/Warden/WdEventController.cs` | Security events (paginated, filter IP/type/severity; `DELETE` clear all) |
| `backend/src/Namorix.Server/Services/Warden/WdFirewallService.cs` | iptables/nftables enforcement engine + Herald qua `IServiceScopeFactory` (singleton → scoped) |
| `backend/src/Namorix.Server/Services/Warden/WdEventService.cs` | Publish WdSecurityEvent + notify |
| `backend/src/Namorix.Server/Services/Warden/HeraldNotifier.cs` | `IHeraldNotifier` — ruleApplied/ruleRemoved admin notifications |
| `backend/src/Namorix.Server/Hubs/SignalRWardenNotifier.cs` | `IWardenNotifier` — `warden:new-event` → group `warden` |
| `backend/src/Namorix.Server/Workers/Warden/WdThresholdWorker.cs` | Threshold engine — auto-ban theo profile |
| `backend/src/Namorix.Server/Workers/Warden/WdBanCleanupWorker.cs` | Gỡ ban rule hết hạn |
| `backend/src/Namorix.Server/Constants/Warden.cs` | `WdErrorCodes`/`WdEventTypes`/`WdSecurityProfile`/`WdThresholdFactors`/`WdThresholdRules` |
| `backend/src/Namorix.Server/Models/Warden/` | WdFirewallRule/WdSecurityEvent/WdSettings |
| `frontend/src/addons/Warden/` | Warden/WardenOverview/WardenActivity/WardenRules + warden.controller |
| `frontend/packages/core/src/apiRoutes.ts` | ApiWardenRoutes |

### Addon Catalog Sync (M4 — PackageCenter)

Addon catalog sync fetches available addons from a remote index for display in the PackageCenter:

```
CatalogSyncWorker (BackgroundService)
  ├── [Loop] Wait delay (success=SyncIntervalSeconds, failure=RetryDelaySeconds)
  ├── Fetch catalog index from CatalogUrl (catalog/addons.json)
  │     ├── Success → parse CatalogIndex with entries
  │     └── Failure → log error, retry after RetryDelaySeconds
  └── Sync each entry:
        ├── Check TTL (skip if not expired, unless force sync)
        ├── Fetch manifest from manifestUrl
        ├── Upsert AddonCatalogEntry in DB
        ├── Mark orphans (entries not in index) as outdated
        └── Update LastSyncedAt timestamp

Manual sync (force)
  └── POST /api/addons/catalog/sync
        ├── Adds force query param to CatalogService
        ├── Bypasses cutoff (DateTime.MinValue → all entries re-synced)
        └── Returns updated catalog entries

Get catalog
  └── GET /api/addons/catalog
        ├── Returns all AddonCatalogEntry from DB
        ├── Includes outdated entries (client decides display)
        └── Cached by TTL
```

Frontend flow:
```
PackageCenter → "All" tab
  └── AddonGrid component
        ├── GET /api/addons/catalog (catalog entries)
        ├── GET /api/addons (installed addons)
        ├── Merge by ID: catalog entry enriched with install status
        └── Display: icon (from url), name, description, install button
```

### Key files (catalog sync)

| File | Role |
|------|------|
| `backend/src/Namorix.Core/Config/AddonCatalogConfig.cs` | Catalog URL, TTL, sync interval, retry delay |
| `backend/src/Namorix.Server/Workers/CatalogSyncWorker.cs` | Background sync with dual delay |
| `backend/src/Namorix.Server/Services/CatalogService.cs` | Catalog fetch, manifest sync, TTL check |
| `backend/src/Namorix.Server/Models/AddonCatalogEntry.cs` | DB entity (cached catalog entries) |
| `backend/src/Namorix.Server/Models/Catalog/CatalogIndex.cs` | DTOs (CatalogIndex, CatalogEntry) |
| `backend/src/Namorix.Server/Controllers/AddonController.cs` | GET /api/addons/catalog, POST /api/addons/catalog/sync |
| `backend/src/Namorix.Server/Services/AddonService.cs` | GetCatalogAsync, RefreshCatalogAsync |
| `frontend/src/addons/PackageCenter/AddonGrid.tsx` | Catalog+installed merge grid |
| `frontend/packages/core/src/addon/types.ts` | AddonCatalogEntry type |
| `frontend/packages/core/src/apiRoutes.ts` | Catalog API routes |
| `catalog/addons.json` | Catalog index file |

---

## 9. Window Management

### State (Redux Toolkit)

```typescript
interface WindowsState {
  windows: Record<string, WindowData>   // byId
  order: string[]                        // taskbar order
  zOrder: string[]                       // rendering order
  activeId: string | null
  nextZIndex: number
}

interface WindowData {
  id: string
  app: string         // addon ID
  title: string
  x, y, width, height: number
  minimized: boolean
  maximized: boolean
  zIndex: number
}
```

### Window operations

```
openWindow(appId)
  ├── new WindowData with cascade position
  ├── dispatch to store
  └── WindowFrame renders + mounts addon

closeWindow(windowId)
  ├── anim state → closing
  ├── delay → dispatch remove
  └── addon unmounts

minimizeWindow(windowId)
  ├── anim state → minimizing
  └── store.minimized = true

focusWindow(windowId)
  ├── nextZIndex++
  └── dispatch focus
```

### Z-index layers

| Layer | Z-index |
|-------|---------|
| Taskbar | 9999 |
| Launcher overlay | 9998 |
| Windows | 100+ (dynamic) |
| Desktop icons | 50 |

### Key files

| File | Role |
|------|------|
| `frontend/src/store/slices/windowsSlice.ts` | Window state + reducers |
| `frontend/src/store/selectors/windowSelectors.ts` | Memoized selectors |
| `frontend/src/components/WindowManager/` | WindowFrame, titlebar, resize handles |

---

## 10. Navigation / Guards

### Routes

| Path | Guard | Page |
|------|-------|------|
| `/login` | `createLoginGuard` | Login |
| `/register` | `createRegisterGuard` | Register |
| `/` | `createAuthGuard` | Desktop (shell) |

### Guard logic

```
createLoginGuard(authService)
  └── isAuthenticated()?
        ├── true → redirect "/"
        └── false → null (render Login)

createAuthGuard(authService)
  └── isAuthenticated()?
        ├── true → checkHasUsers()?
        │     ├── true → null (render Desktop)
        │     └── false → redirect "/register"
        └── false → redirect "/login"

Note: `isRegistrationOpen()` trả về true nếu không có user nào (`needsRegister=true`),
bỏ qua `register_enabled` setting — user đầu tiên luôn có thể register.
```

### Key files

| File | Role |
|------|------|
| `frontend/packages/core/src/router/GuardedRoute.tsx` | Guard wrapper |
| `frontend/packages/core/src/router/guards.ts` | `createAuthGuard()`, `createLoginGuard()`, `createRegisterGuard()` |
| `frontend/packages/core/src/auth/auth.service.ts` | AuthChecker implementation |

---

## File Responsibility Map

### @namorix/core (publishable package)

| Module | Exports | Depends on |
|--------|---------|------------|
| `auth/` | `authService`, `AuthChecker` | http, store |
| `http/` | `nmxHttp`, `ApiError`, `RequestBuilder` | config, constants |
| `i18n/` | `NmxI18n`, `validate()`, `formatApiError()` | types |
| `router/` | `GuardedRoute`, `createAuthGuard()` | auth |
| `addon/` | `defineAddon()`, `registerAddon()`, `AddonContext` | types, eventBus |
| `theme/` | `restoreTheme()`, `loadTheme()`, `applyTheme()`, `applyAppearanceTokens()` | apiRoutes, constants |
| `signalr/` | `signalr.service`, `useSignalR()`, `useSignalREvent()` | @microsoft/signalr |
| `store/` | `nmxStore`, `setUserStore()`, `setAppearanceStore()` | types, init |
| `toast/` | `nmxToast` | - |
| `types/` | All interfaces + constants | - |
| `cache/` | `useTabCache()`, `Show` | - |
| `hooks/` | `usePageSize()` | - |
| `fingerprint/` | `generateFingerprint()` | - |

### @namorix/ui (React primitives)

| Component | Type | Props |
|-----------|------|-------|
| `NmxButton` | Primitive | size, variant, rounded, semantic |
| `NmxForm` | Primitive | NmxFormField, NmxFormInput, NmxFormActions |
| `NmxDialog` | Composite | NmxDialogHeader, NmxDialogBody, NmxDialogFooter |
| `NmxAlertDialog` | Composite | open, hideCancel, size, onConfirm, onCancel, loading |
| `NmxToastProvider` | Provider | subscribes nmxToast event bus |
| `NmxCard` | Composite | NmxCardHeader, NmxCardBody, NmxCardFooter |
| `NmxSelect`, `NmxSlider`, `NmxSegmentedGroup` | Primitive | - |
| `NmxSearchInput` | Primitive | onSubmit, suggestions |
| `NmxDataTable` | Data | columns, rows, hideBelow |
| `NmxPagination` | Data | page, pageSize, total |
| `NmxBadge` | Primitive | semantic, bgEnabled, uppercase, size |
| `NmxMetaList` | Layout | grid (auto 1fr) |
| `NmxMetaItem` | Layout | label, value, isBlockMessage, children |
| `NmxChip`, `NmxChipFilter`, `NmxChipToggle` | Primitive | semantic color; toggle: checked/defaultChecked/onCheckedChanged (role="switch") |
| `NmxToggle` | Primitive | checked, onChange |
| `NmxRail` | Layout | sidebar with tabs |
| `NmxToolbar` | Layout | toolbar with tabs |
| `NmxSettingsSection`, `NmxSettingsCard`, `NmxSettingsRow`, `NmxSettingsWrap` | Layout | settings layout |

### frontend (app)

| File | Role |
|------|------|
| `src/main.tsx` | Entry point |
| `src/Root.tsx` | Providers, appearance sync |
| `src/App.tsx` | Routes + guards |
| `src/controllers/auth.controller.ts` | Auth API calls |
| `src/hooks/useAppearanceSync.ts` | Theme loading + SignalR listener |
| `src/pages/Login.tsx`, `Register.tsx` | Auth pages |
| `src/pages/Desktop.tsx` | Shell desktop |
| `src/addons/` | Built-in addons |
| `src/store/slices/` | Redux slices |
| `src/store/selectors/` | Redux selectors |

### Backend (.NET)

| Project | Role |
|---------|------|
| `Namorix.Core` | Models, Config, Constants, Abstractions, Responses, NmxHub, Validation infrastructure |
| `Namorix.Server` | **Everything else:** Persistence, Services, Controllers, Middleware, Workers, Hubs, Extensions, Program.cs |

---

## Key Coupling Points

### When adding...

| If you add... | You must also update... |
|---------------|------------------------|
| New appearance setting key | `AppearanceSettingKeys`, `AppearanceDefaults`, `SetSettingsRequest`, `SetSettingsSchema`, `AppearanceOptionsData` (nếu có valid values) |
| New API endpoint | `apiRoutes.ts` (frontend), controller + service (backend) |
| New SignalR event | `SignalREvent` constants, backend notifier/hub |
| New validation rule | `ValidationRule.cs` + `ValidationErrorCodes` |
| New i18n key | Both `en.json` + `vi.json` + fallback key in code |
| New addon | `addons/index.ts` import + `.addon.ts` file |
