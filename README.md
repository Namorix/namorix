# Namorix

Browser-based desktop shell, self-hosted.

## Features

- **Desktop Shell** — Window manager, taskbar, app launcher in browser
- **System Apps** — File manager, Terminal, Settings, Log viewer
- **External Addons** — Docker-based apps open in new tab
- **Centralized Auth** — Single auth server for shell and addons

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Vite + React |
| Backend | ASP.NET Core 8 |
| Database | SQLite + EF Core |
| Auth | JWT (access + refresh) with HttpOnly cookies |
| Terminal | xterm.js |

## Documentation

| Doc | Description |
|-----|-------------|
| [Architecture](docs/architecture.md) | Source of truth kỹ thuật |
| [M2 Auth](docs/m2-auth.md) | Auth backend spec |
| [M1 Shell UI](docs/m1-shell-ui.md) | Shell UI spec |

## Quick Start

```bash
# Clone
git clone <repo-url> namorix
cd namorix

# Install dependencies (uses pnpm)
pnpm install

# Run development (2 terminals)
cd backend && dotnet watch run  # Backend C# (port 3000)
# or: cd backend && dotnet run
cd frontend && npm run dev      # Frontend (Vite port 5173)
```

## Repository Structure

```
namorix/
├── package.json              # pnpm workspaces root
├── pnpm-workspace.yaml       # workspace config
├── tsconfig.base.json        # shared TypeScript config
├── docs/
│   ├── architecture.md       # source of truth kỹ thuật
│   ├── m1-shell-ui.md        # M1 spec
│   ├── m2-auth.md           # M2 spec
│   ├── m3-system-apps.md    # M3 spec
│   ├── m4-addon-system.md    # M4 spec
│   └── m5-core-package.md    # M5 spec
├── packages/
│   ├── core/                 # @namorix/core — browser-only types, utils (publishable)
│   │   └── src/
│   │       ├── auth/         # auth.service.ts (AuthChecker for guards)
│   │       ├── http/         # ApiError, http client with auto-refresh
│   │       ├── router/       # GuardedRoute, createAuthGuard, createSignInGuard, createSignUpGuard
│   │       ├── config.ts     # configureCore(), getApiBaseUrl()
│   │       └── utils/        # cx (className utility)
│   ├── styles/               # @namorix/styles — SCSS tokens, reset, fonts
│   ├── ui/                   # @namorix/ui — React primitive components
│   │   └── src/
│   │       └── Primitives/
│   │           ├── NmxButton/
│   │           ├── NmxForm/   # FormField, FormInput, FormActions, FormHeader, FormPage, FormCard
│   │           ├── NmxInlineAlert/
│   │           └── NmxToggle/
│   └── shared/               # @namorix/shared — shared code for backend + frontend
│       └── src/
│           ├── types/        # ApiResponse, User, AuthStatus, ValidateErrorMeta, etc.
│           ├── api-routes.ts # ApiAuthRoutes constants
│           └── constants.ts  # HttpStatus, NMX_COOKIE_*, etc.
├── frontend/                 # Vite + React shell (port 5173)
│   └── src/
│       ├── assets/
│       │   └── controllers/
│       │       └── auth.controller.ts  # signUp, signIn, signOut
│       ├── components/
│       ├── pages/
│       │   ├── Login.tsx
│       │   ├── Register.tsx
│       │   └── Desktop.tsx
│       └── i18n/
└── backend/                   # ASP.NET Core 8 API (port 3000)
    ├── Controllers/           # API endpoints (Auth, Settings)
    ├── Services/              # AuthService, SettingsService, TokenCleanupService
    ├── Models/                # EF Core entities (User, RefreshToken, Setting)
    ├── Middleware/            # CSRF, Exception, SecurityHeaders, TrustedProxy
    ├── Config/                # AppConfig, JwtConfig (IOptions<T>)
    ├── Validation/            # IValidationSchema, ValidateAttribute, schemas
    ├── Constants/             # AuthConstraints, Cookie names, error codes
    ├── Migrations/            # EF Core migrations
    ├── Responses/             # ApiResponse<T>
    ├── Extensions/            # ApplicationBuilderExtensions
    ├── Program.cs             # Entry point + middleware pipeline
    └── appsettings.json       # Configuration
```

## Packages

| Package | Purpose | Importable By |
|---------|---------|---------------|
| `@namorix/core` | Browser-only types, `ApiError`, `cx` utility, auth guards | frontend, @namorix/ui |
| `@namorix/styles` | SCSS tokens, reset, fonts | frontend, @namorix/ui, external addons |
| `@namorix/ui` | NmxButton, NmxForm, NmxInlineAlert, NmxToggle, etc. | frontend |
| `@namorix/shared` | Types, constants, ValidateErrorMeta | all packages |
| `backend` | ASP.NET Core 8 API server | - |
| `frontend` | Vite React shell | - |

## Auth Architecture

### Controller Pattern (Frontend)

Frontend uses controller pattern for API calls:

```typescript
// frontend/src/assets/controllers/auth.controller.ts
import { http, getApiBaseUrl } from "@namorix/core"
import { ApiAuthRoutes } from "@namorix/shared"

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
3. **M3** — System apps (File manager, Terminal, Settings, Log viewer) 🔜
4. **M4** — External addon system (Docker lifecycle, addon manager)
5. **M5** — @namorix/core publish npm + addon integration guide