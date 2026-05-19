# Namorix

Browser-based desktop shell, self-hosted.

## Features

- **Desktop Shell** — Window manager, taskbar, launcher, desktop icon shortcuts
- **System Addons** — Built-in addons (File Manager, Terminal, Settings, Log Viewer) via addon contract
- **External Addons** — Docker-based addons with 3 modes: widget DOM slot, full app via window.open, direct URL
- **Centralized Auth** — Single auth server for shell and addons

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Vite + React |
| Backend | ASP.NET Core 8 |
| Database | SQLite + EF Core |
| Auth | JWT (access + refresh) with HttpOnly cookies |
| Terminal | xterm.js |
| Realtime | SignalR (planned) |
| Server-to-server | gRPC (planned) |
| Docker | Docker.DotNet.Enhanced (planned) |

## Quick Start

```bash
# Clone
git clone <repo-url> namorix
cd namorix

# Install dependencies (uses pnpm)
cd frontend && pnpm install

# Run development (2 terminals)
cd backend && dotnet watch run  # Backend C# (port 3000)
# or: cd backend && dotnet run
cd frontend && pnpm dev         # Frontend (Vite port 5173)
```

## Repository Structure

```
namorix/
├── frontend/
│   ├── package.json          # pnpm workspace root
│   ├── pnpm-workspace.yaml   # workspace config
│   ├── tsconfig.base.json    # shared TypeScript config
│   ├── packages/
│   │   ├── core/             # @namorix/core — browser-only types, utils (publishable)
│   │   │   └── src/
│   │   │       ├── auth/     # auth.service.ts (AuthChecker for guards)
│   │   │       ├── http/     # ApiError, http client with auto-refresh
│   │   │       ├── router/   # GuardedRoute, createAuthGuard, createLoginGuard, createRegisterGuard
│   │   │       ├── i18n/     # NmxI18n, ValidationRunner, validation-messages
│   │   │       ├── theme/    # ThemeManifest types, loader (hot swap CSS), registry
│   │   │       ├── providers/# ThemeProvider, useTheme hook
│   │   │       ├── config.ts # configureCore(), getApiBaseUrl()
│   │   │       ├── apiRoutes.ts
│   │   │       ├── constants.ts
│   │   │       └── utils/    # cx (className utility)
│   │   ├── styles/           # @namorix/styles — SCSS tokens, reset, fonts
│   │   └── ui/               # @namorix/ui — React primitive components
│   │       └── src/
│   │           └── Primitives/
│   │               ├── NmxButton/
│   │               ├── NmxForm/
│   │               ├── NmxInlineAlert/
│   │               └── NmxToggle/
│   └── src/
│       ├── controllers/
│       │   ├── auth.controller.ts
│       │   └── health.controller.ts
│       ├── components/
│       │   ├── Auth/            # AuthPage (hero + form panel layout)
│       │   ├── Taskbar/         # Clock, start button, window buttons
│       │   ├── DesktopArea/     # App icon shortcuts
│       │   ├── WindowFrame/     # Draggable, resizable window chrome
│       │   ├── WindowManager/   # Renders all open windows
│       │   └── Launcher/        # Start menu with system app list
│       ├── store/
│       │   ├── index.ts             # configureStore, RootState, AppDispatch
│       │   ├── hooks.ts             # useAppDispatch, useAppSelector
│       │   ├── types.ts             # WindowId, AnimState, WindowRect, WindowData
│       │   ├── slices/
│       │   │   ├── windowsSlice.ts  # Window lifecycle + geometry + animation
│       │   │   ├── launcherSlice.ts # Launcher open/close
│       │   │   └── taskbarSlice.ts  # Taskbar button rects
│       │   └── selectors/
│       │       ├── windowSelectors.ts
│       │       ├── launcherSelectors.ts
│       │       └── taskbarSelectors.ts
│       ├── config/
│       │   └── windowDefaults.ts    # CSS token cache (read from --nmx-*)
│       ├── types/
│       │   ├── windowing.ts     # WindowId, WindowState interfaces
│       │   └── index.ts
│       ├── pages/
│       │   ├── Login.tsx
│       │   ├── Register.tsx
│       │   └── Desktop.tsx      # Full shell layout
│       ├── styles/
│       └── i18n/
└── backend/                   # ASP.NET Core 8 API (port 3000)
    ├── Makefile               # Build/EF commands
    ├── Namorix.sln            # Solution file
    └── src/
        ├── Namorix.Core/      # Config, Constants, Models, Exceptions, Responses, Validation
        ├── Namorix.Adapters/  # Persistence (AppDbContext, migrations), Services (Auth, Permission, Settings)
        ├── Namorix.Server/    # Controllers, Middleware, Extensions, Helpers, Program.cs
        └── Namorix.Workers/   # TokenCleanupWorker (background service)
```

## Packages

| Package | Purpose | Importable By |
|---------|---------|---------------|
| `@namorix/core` | Types, auth guards, http client, `ApiError`, i18n, validation, constants, addon, theme | frontend, @namorix/ui, external addons |
| `@namorix/styles` | SCSS tokens, reset, fonts | frontend, @namorix/ui, external addons |
| `@namorix/ui` | NmxButton, NmxForm, NmxInlineAlert, NmxToggle, etc. | frontend |
| `backend` | ASP.NET Core 8 API server | - |
| `frontend` | Vite React shell | - |

## Auth Architecture

### Controller Pattern (Frontend)

Frontend uses controller pattern for API calls:

```typescript
// frontend/src/controllers/auth.controller.ts
import { http, getApiBaseUrl, ApiError, ApiAuthRoutes } from "@namorix/core"

export const authController = {
  register: async (username: string, password: string) => {
    const data = await http
      .url(getApiBaseUrl() + ApiAuthRoutes.register)
      .post({ username, password })
      .json()
    if (!data.success) throw ApiError.fromResponse(data)
  },
  // ...
}
```

### Decorator-based Controllers (C#)

Backend uses ASP.NET Core attributes for route declaration:

```csharp
[ApiController]
[Route("api/auth")]
public class AuthController(AuthService authService) : ControllerBase
{
    [HttpPost("register")]
    [Validate(typeof(RegisterSchema))]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        var result = await authService.Register(request.Username, request.Password);
        return Ok(ApiResponse.Ok(result));
    }
}
```

## Addon Architecture

### Internal Addons (M3 — Built-in)

System addons (File Manager, Terminal, Settings, Log Viewer) sử dụng chung addon contract với external addons:
- **AddonEntry**: `mount(container, context)` / `unmount()` lifecycle
- **NmxAddonManifest**: id, displayName, description?, icon?
- **AddonContext**: addonId, locale, theme

Internal addons import tĩnh, bundle sẵn trong shell, full permission.

### External Addons (M4 — Docker)

Addon có 3 mode tích hợp:

| Mode | Cách hoạt động | Auth |
|------|----------------|------|
| **Widget** | Addon frontend render trong DOM slot trên Dashboard, mount/unmount qua `addonEntry.js` contract (`mount(container, context)` / `unmount()`) | HttpOnly cookie (same-origin) |
| **Full App** | Mở tab mới qua `window.open` từ Dashboard, addon dùng `nmx_handshake_token` để exchange lấy session | One-time token exchange |
| **Direct URL** | User nhập URL addon → addon redirect về shell xin `nmx_handshake_token` → shell redirect lại addon kèm token → addon exchange lấy session | One-time token exchange (cùng flow mode 2) |

### Communication

- **Server-to-server**: gRPC bidirectional streaming (Namorix Backend ↔ Addon Backend)
- **Frontend realtime**: SignalR (Dashboard ↔ Namorix Backend, Addon Frontend ↔ Addon Backend)
- **Shell ↔ Addon**: Event Bus (`@namorix/core`) — `shell:*` events và `addon:*` events (cùng JS context cho widget mode, postMessage cho full app mode)

## Environment Variables

### Backend (ASP.NET Core, `__` separator for hierarchy)

| Variable | Config Path | Default | Description |
|----------|-------------|---------|-------------|
| `JWT__Secret` | Jwt.Secret | (required) | JWT signing key |
| `JWT__AccessTokenExpirationMinutes` | Jwt.AccessTokenExpirationMinutes | 15 | Access token TTL |
| `JWT__RefreshTokenExpirationDays` | Jwt.RefreshTokenExpirationDays | 7 | Refresh token TTL |
| `JWT__RefreshTokenExpirationDaysRemember` | Jwt.RefreshTokenExpirationDaysRemember | 90 | Remember-me TTL |
| `ConnectionStrings__DefaultConnection` | ConnectionStrings.DefaultConnection | `Data Source=namorix.db` | SQLite connection string |
| `SECURE_COOKIE` | AppConfig.SecureCookie | false | Set true for HTTPS |
| `CSRF_DISABLE` | AppConfig.CsrfEnabled | false | Set true to disable CSRF |

## Milestones

1. **M1** — Static shell UI + mock auth page ✅
2. **M2** — Full auth backend (login/register/logout/refresh/session, decorators, i18n, validation) ✅
3. **M3** — System Addons (Built-in): Redux state management, addon contract + registry, Log Viewer, NetworkTraffic, SystemMonitor, theme system (hot swap CSS, localStorage+DB), File Manager, Terminal, Settings 🔜
4. **M4** — External addon system (Docker lifecycle, addon manager)
5. **M5** — @namorix/core publish npm + addon integration guide