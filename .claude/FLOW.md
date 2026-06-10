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
| `frontend/src/controllers/auth.controller.ts` | `login()`, `register()`, `logout()`, `loadAppearance()`, `loadSystemDefaults()` |
| `frontend/packages/core/src/auth/auth.service.ts` | `isAuthenticated()`, `checkHasUsers()`, `isRegistrationOpen()` |
| `backend/src/Namorix.Server/Controllers/AuthController.cs` | Login, register, refresh, logout, session |
| `backend/src/Namorix.Adapters/Services/AuthService.cs` | Token logic, fingerprint, refresh rotation |

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
Page load (chưa login)
  └── Root → useAppearanceSync()
        ├── user null → loadSystemDefaults()
        │     └── GET /api/settings/appearance (public)
        │           ├── setAppearanceStore(data)
        │           ├── applyAppearanceTokens(data)
        │           └── applyTheme(data.appearance_theme)
        └── user có → loadAppearance()
              └── GET /api/user/settings
                    ├── setAppearanceStore(data)
                    ├── applyAppearanceTokens(data)
                    └── applyTheme(data.appearance_theme)

User change settings
  └── SignalR: user:settings-changed { userId }
        └── useAppearanceSync() → reloadAppearance()

Admin change system defaults
  └── SignalR: system:config-changed { key: "appearance_defaults" }
        └── useAppearanceSync() → loadSystemDefaults() nếu user null
```

### applyTheme mechanism

```
applyTheme(themeId)
  └── loadTheme(themeId, cssUrl)
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
| `frontend/src/controllers/auth.controller.ts` | `loadAppearance()`, `loadSystemDefaults()` |
| `backend/src/Namorix.Adapters/Services/SettingsService.cs` | `GetAppearanceDefaultsAsync()` + cache |
| `backend/src/Namorix.Adapters/Services/UserSettingsService.cs` | `GetAllAsync()`, `SetBatchAsync()` + cache |
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
| `backend/src/Namorix.Adapters/Services/SettingsService.cs` | System settings logic |
| `backend/src/Namorix.Adapters/Services/UserSettingsService.cs` | User settings logic + SignalR notify on change |
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
        └── HubConnectionBuilder
              ├── .withUrl("/hubs/main")
              ├── .withAutomaticReconnect()
              └── build().start()
                    ├── Subscribe groups: traffic, logs
                    └── Emit handshake

On disconnect
  └── scheduleReconnect() exponential backoff
        ├── 5s → 10s → 20s → 30s cap
        └── Reset delay on successful reconnect
```

### Events

| Event | Direction | Payload | Used by |
|-------|-----------|---------|---------|
| `traffic:new-logs` | Server → Client | TrafficLogsFlushed + BucketData | NetworkTraffic |
| `traffic:stats-init` | Server → Client | BucketData[] | NetworkTraffic stats |
| `logs:new-entry` | Server → Client | LogEntry[] | LogViewer (live mode) |
| `system:config-changed` | Server → Client | `{ key: string }` | useAppearanceSync |
| `user:settings-changed` | Server → Client | `{ userId: number }` | useAppearanceSync (re-fetch user settings) |
| `user:theme-changed` | Server → Client | `{ themeId: string }` | (planned) |

### Hooks

| Hook | Usage |
|------|-------|
| `useSignalR(enabled)` | Mount/unmount connection lifecycle |
| `useSignalREvent<T>(event, handler)` | Subscribe event with cleanup |
| `useSignalRGroup(group)` | Join/leave group with reconnect handler |

### Backend

```
NmxHub (IHubContext)
  ├── ISystemNotifier → NotifyConfigChangedAsync(key)
  ├── ITrafficNotifier → NotifyFlushAsync()
  └── ILogNotifier → NotifyNewEntriesAsync()
```

### Key files

| File | Role |
|------|------|
| `frontend/packages/core/src/signalr/signalr.service.ts` | Connection singleton, reconnect logic |
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
  locale: string
  theme: 'light' | 'dark'
}

interface NmxAddonManifest {
  id: string
  displayName: string
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
})

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

### Addon modes (planned M4)

| Mode | Auth | DOM slot | Token needed |
|------|------|----------|-------------|
| Widget (cùng DOM) | Cookie shell | ✅ | ❌ |
| Full app (window.open) | Handshake token | ❌ | ✅ |
| Direct URL | Redirect → handshake | ❌ | ✅ |

### Key files

| File | Role |
|------|------|
| `frontend/packages/core/src/addon/types.ts` | AddonEntry, NmxAddonManifest, AddonContext |
| `frontend/packages/core/src/addon/factory.tsx` | `defineAddon()` |
| `frontend/packages/core/src/addon/registry.ts` | `registerAddon()`, `resolveAddon()`, `listAddons()` |
| `frontend/packages/core/src/addon/context.tsx` | `AddonContextProvider`, `useAddonContext()` |
| `frontend/packages/core/src/eventBus.ts` | `emit()`, `on()`, `off()` |
| `frontend/src/addons/` | All built-in addons (LogViewer, Settings, etc.) |

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
| `NmxChip`, `NmxChipFilter` | Primitive | semantic color |
| `NmxToggle` | Primitive | checked, onChange |
| `NmxRail` | Layout | sidebar with tabs |
| `NmxToolbar` | Layout | toolbar with tabs |
| `NmxSettingsSection`, `NmxSettingsCard`, `NmxSettingsRow` | Layout | settings layout |

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
| `Namorix.Core` | Config, constants, models, validation, middleware, SignalR notifiers (system + user settings) |
| `Namorix.Adapters` | EF Core, services (Auth, Permission, Settings, Theme, User), migrations |
| `Namorix.Server` | Controllers, Program.cs, middleware (Auth, TrustedProxy) |
| `Namorix.Workers` | TokenCleanupWorker |

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
