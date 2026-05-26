# Namorix Backend

ASP.NET Core 8 API server for the Namorix desktop shell. Handles authentication, addon backend communication, flat file storage for traffic/logs, SignalR realtime events, and security middleware.

## Tech Stack

| Component | Technology |
|-----------|------------|
| Runtime | .NET 8 |
| Framework | ASP.NET Core 8 |
| ORM | Entity Framework Core |
| Database | SQLite |
| JWT | System.IdentityModel.Tokens.Jwt |
| Password | BCrypt.Net-Next |
| Realtime | SignalR |
| Server-to-server | gRPC (planned) |
| Docker | Docker.DotNet.Enhanced (planned) |

## Quick Start

```bash
# Install dependencies
dotnet restore

# Run database migrations
dotnet ef database update

# Start development server
dotnet watch run

# Hoặc dùng Makefile
make watch
```

Server runs at `http://localhost:3000` (default).

## Project Structure

```
backend/
├── Makefile                          # Build/EF shortcuts
├── Namorix.sln                       # Solution file (4 projects)
└── src/
    ├── Namorix.Core/                 # Shared infrastructure
    │   ├── Attributes/
    │   │   └── TrafficMonitorAttribute.cs  # Action filter for traffic monitoring
    │   ├── Config/
    │   │   ├── AppConfig.cs          # Root config (CsrfEnabled, SecureCookie, AllowedOrigins)
    │   │   └── JwtConfig.cs          # JWT settings (Secret, Issuer, Audience, expiration)
    │   ├── Constants/
    │   │   ├── Auth.cs               # AuthConstraints (username/password min/max length)
    │   │   ├── Cookie.cs             # Cookie names (nmx_access_token, nmx_refresh_token, nmx_csrf_token)
    │   │   ├── Error.cs              # HttpErrorCodes, AuthErrorCodes, MiddlewareErrorCodes
    │   │   ├── Http.cs               # HttpContextKeys
    │   │   ├── Jwt.cs                # JwtClaims (UserId, Username, Role, Jti, Iat)
    │   │   ├── Routes.cs             # API route constants
    │   │   ├── Settings.cs           # SettingKeys (RegisterEnabled, TrustedProxies)
    │   │   └── Validation.cs         # ValidationErrorCodes
    │   ├── Controllers/
    │   │   └── LogController.cs      # Log query with level/source filters, pagination
    │   ├── Exceptions/
    │   │   └── AuthException.cs      # Custom exception with error code
    │   ├── Extensions/
    │   │   ├── ApplicationBuilderExtensions.cs  # Core middleware pipeline
    │   │   └── ServiceCollectionExtensions.cs   # DI registration + DbContext + SignalR + CSRF + ValidationFilter
    │   ├── Filters/
    │   │   ├── TrafficLogFilter.cs
    │   │   ├── TrafficLogFilterParser.cs
    │   │   └── ValidationFilter.cs   # Global action filter replacing auto-400 model binding
    │   ├── FlatFile/
    │   │   ├── FlatFileOptions.cs
    │   │   ├── FlatFileStore.cs      # Rotating flat file storage engine
    │   │   ├── IFlatFileSerializer.cs
    │   │   ├── IFlatFileStore.cs
    │   │   ├── LogEntrySerializer.cs
    │   │   └── TrafficLogSerializer.cs
    │   ├── Helpers/
    │   │   └── NetworkHelper.cs
    │   ├── Hubs/
    │   │   ├── HubContextExtensions.cs
    │   │   ├── NmxHub.cs             # SignalR hub for log/traffic/status events
    │   │   ├── NmxHubFilter.cs       # Hub connection filter (auth + error handling)
    │   │   ├── SignalRLogNotifier.cs
    │   │   ├── SignalRSystemNotifier.cs
    │   │   └── SignalRTrafficNotifier.cs
    │   ├── Infrastructure/
    │   │   ├── CountingStream.cs
    │   │   ├── ILogNotifier.cs
    │   │   ├── ISystemNotifier.cs
    │   │   ├── ITrafficNotifier.cs
    │   │   ├── LogBuffer.cs
    │   │   ├── SignalREvents.cs
    │   │   └── TrafficBuffer.cs
    │   ├── IO/
    │   │   └── DataDirectory.cs
    │   ├── Logger/
    │   │   ├── FileLogger.cs
    │   │   └── FileLoggerProvider.cs  # Custom ILoggerProvider for file output
    │   ├── Middleware/
    │   │   ├── CsrfMiddleware.cs     # Double-submit CSRF protection
    │   │   ├── ExceptionMiddleware.cs# Global exception handler
    │   │   ├── JsonErrorMiddleware.cs# Consistent JSON error responses
    │   │   ├── NotFoundMiddleware.cs # Catch-all 404 handler
    │   │   ├── RequireAdminAttribute.cs
    │   │   ├── RequireAuthAttribute.cs
    │   │   ├── SecurityHeadersMiddleware.cs
    │   │   └── TrafficMonitorMiddleware.cs
    │   ├── Models/
    │   │   ├── AddonManifest.cs      # Addon metadata (for M4)
    │   │   ├── Permission.cs
    │   │   ├── RefreshToken.cs       # Refresh token entity
    │   │   ├── Setting.cs            # Key-value settings entity
    │   │   ├── ThemeManifest.cs      # Theme metadata (id, name, css, tags, IsBuiltIn)
    │   │   ├── User.cs               # User entity (includes ThemeId)
    │   │   └── UserPermission.cs
    │   ├── Responses/
    │   │   └── ApiResponse.cs        # Typed ApiResponse<T>
    │   ├── Services/
    │   │   ├── LogService.cs         # Flat file log query service
    │   │   └── TrafficMonitorService.cs  # Traffic data collection + aggregation
    │   ├── Validation/
    │   │   ├── IValidationSchema.cs
    │   │   ├── ValidateAttribute.cs
    │   │   ├── ValidationRule.cs
    │   │   └── Schemas/
    │   │       ├── LoginSchema.cs
    │   │       └── RegisterSchema.cs
    │   └── Workers/                  # Background services (registered via AddNamorixCore)
    │       ├── LogFlushWorker.cs
    │       ├── TrafficCleanupWorker.cs
    │       ├── TrafficFlushWorker.cs
    │       └── TrafficStatsWorker.cs
    ├── Namorix.Adapters/             # Persistence + Business Services
    │   ├── Migrations/               # EF Core migrations
    │   ├── Persistence/
    │   │   └── AppDbContext.cs       # EF Core DbContext
    │   └── Services/
    │       ├── AuthService.cs        # Login, Register, RefreshToken, RevokeToken, VerifyAccessToken
    │       ├── PermissionService.cs  # User permission management
    │       ├── SettingsService.cs    # IsRegisterEnabled, GetTrustedProxies, AllowedOrigins (IMemoryCache)
    │       ├── ThemeService.cs       # User theme preferences
    │       └── UserService.cs        # User CRUD
    ├── Namorix.Server/               # API + Middleware Pipeline
    │   ├── Controllers/
    │   │   ├── AuthController.cs     # 7 auth endpoints (login, register, logout, session, refresh, status)
    │   │   ├── HealthController.cs   # Health check endpoint
    │   │   ├── PermissionController.cs   # User permission management
    │   │   ├── SettingsController.cs # Trusted proxies, allowed origins
    │   │   ├── ThemeController.cs    # Theme list query
    │   │   ├── UserController.cs     # User theme preferences
    │   │   └── UserPermissionController.cs
    │   ├── Extensions/
    │   │   └── ApplicationBuilderExtensions.cs  # Server middleware pipeline wrapper
    │   ├── Middleware/
    │   │   ├── AuthMiddleware.cs     # Session validation
    │   │   ├── RequirePermissionAttribute.cs
    │   │   └── TrustedProxyMiddleware.cs
    │   ├── Program.cs
    │   ├── appsettings.json
    │   └── appsettings.Development.json
    └── Namorix.Workers/              # Server-level background services
        └── TokenCleanupWorker.cs     # Cleans expired tokens every 24h
```

## API Endpoints

### Auth (`/api/auth`)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/login` | Login with username + password. Body: `{ username, password, rememberMe? }` |
| POST | `/api/auth/register` | Register new user. Body: `{ username, password }` |
| POST | `/api/auth/logout` | Clear cookies, revoke refresh token |
| POST | `/api/auth/logout-all` | Revoke all refresh tokens for current user |
| GET | `/api/auth/session` | Validate access token, return user info (auto-refresh if expired) |
| POST | `/api/auth/refresh` | Rotate tokens (fingerprint + IP check) |
| GET | `/api/auth/status` | Return `{ needsRegister, registerEnabled }` |

### Settings (`/api/settings`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/settings/proxies` | Get list of trusted proxy IPs |
| PUT | `/api/settings/proxies` | Set trusted proxy IPs. Body: `{ proxies: string[] }` |

### User (`/api/user`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/user/theme` | Get current user's themeId |
| PUT | `/api/user/theme` | Set user theme preference. Body: `{ themeId: string }` |

### Permission (`/api/permission`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/permission/user/{userId}` | Get permissions for a user |
| PUT | `/api/permission/user/{userId}` | Set user permissions |

### Health (`/api/health`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check |

> All endpoints except health, login, register, and status require authentication.

### Addon (Planned — M4)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/addon` | List installed addons |
| POST | `/api/addon/install` | Install new addon from Docker image |
| POST | `/api/addon/{id}/start` | Start addon container |
| POST | `/api/addon/{id}/stop` | Stop addon container |
| POST | `/api/addon/{id}/remove` | Remove addon container |
| POST | `/api/addon/handshake` | Exchange addon secret for AddonToken |
| POST | `/api/addon/session-exchange` | Exchange one-time nmx_handshake_token for session |
| GET | `/api/addon/{id}/stream` | SSE stream for widget events |
| POST | `/api/addon/{id}/command` | Send command to addon |

## Middleware Pipeline

Thứ tự middleware trong `Program.cs`:

```
CORS → SecurityHeaders → TrustedProxy → Routing → CSRF → ExceptionMiddleware → Controllers
```

- **CORS**: Allow any origin + credentials (cho dev). AllowedOrigins from config + DB for production.
- **SecurityHeaders**: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `X-XSS-Protection: 1; mode=block`, `Referrer-Policy: strict-origin-when-cross-origin`.
- **TrustedProxy**: Chỉ trust `X-Forwarded-For` từ IP trong trusted list (Settings DB). Block request từ untrusted proxy với 400.
- **CSRF**: Double-submit pattern — so sánh `nmx_csrf_token` cookie với `X-CSRF-Token` header trên mutating methods (disabled by default).
- **JsonErrorMiddleware + ExceptionMiddleware**: Chuyển lỗi thành JSON format đồng nhất.
- **ValidationFilter**: Global action filter — validates request body via schema attributes, returns structured error JSON.
- **TrafficMonitorMiddleware**: Ghi lại traffic stats (request count, bytes) vào flat file.

## Configuration

### `appsettings.json`

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Data Source=namorix.db"
  },
  "Jwt": {
    "Secret": "<your-secret>",
    "AccessTokenExpirationMinutes": 5,
    "RefreshTokenExpirationDays": 7
  }
}
```

### Environment Variables (override appsettings)

| Variable | Config Path | Default | Description |
|----------|-------------|---------|-------------|
| `JWT__Secret` | Jwt.Secret | (required) | JWT signing key |
| `JWT__AccessTokenExpirationMinutes` | Jwt.AccessTokenExpirationMinutes | 15 | Access token TTL |
| `JWT__RefreshTokenExpirationDays` | Jwt.RefreshTokenExpirationDays | 7 | Refresh token TTL |
| `JWT__RefreshTokenExpirationDaysRemember` | Jwt.RefreshTokenExpirationDaysRemember | 90 | Remember-me TTL |
| `ConnectionStrings__DefaultConnection` | ConnectionStrings.DefaultConnection | `Data Source=namorix.db` | SQLite connection string |
| `AppConfig__CsrfEnabled` | AppConfig.CsrfEnabled | false | Enable CSRF protection (`true` = CSRF check enabled) |
| `AppConfig__SecureCookie` | AppConfig.SecureCookie | false | Set true for HTTPS |
| `AppConfig__AllowedOrigins` | AppConfig.AllowedOrigins | (empty) | Comma-separated CORS origins; empty = allow all (trusted proxy mode) |

> .NET uses `__` (double underscore) as separator for hierarchy in env vars.

## Database

SQLite database file (`namorix.db`), tạo tự động khi chạy migrations.

### Models

- **User** — `id`, `username`, `password`, `role`, `themeId`, `createdAt`
- **RefreshToken** — `jti`, `userId`, `tokenHash`, `userAgent`, `fingerprint`, `ipAddress`, `lastUsedAt`, `expiresAt`
- **Setting** — `key` (PK), `value`
- **Permission** — `id`, `name`, `description`
- **UserPermission** — `userId`, `permissionId`
- **ThemeManifest** — `id`, `name`, `version`, `author`, `description`, `preview`, `css`, `tags`, `isBuiltIn`
- **AddonManifest** — `id`, `name`, `version`, `author`, `description`, `icon`, `entry`, `permissions` (for M4)

### Migrations

```bash
# Create migration
dotnet ef migrations add <Name>

# Apply
dotnet ef database update

# Makefile shortcuts
make db_update
make db_reset
```

## Auth Flow

```
1. Login → POST /api/auth/login → Set HttpOnly cookies (access + refresh, SameSite=Lax)
2. Session check → GET /api/auth/session → validate access token via cookie (auto-refresh if expired)
3. Token refresh → POST /api/auth/refresh → rotate tokens (fingerprint + IP verification)
4. Logout → POST /api/auth/logout → clear cookies, revoke token jti
5. Logout-all → POST /api/auth/logout-all → revoke all user tokens
```

- Access token: JWT, 5 phút (có thể cấu hình)
- Refresh token: random 64-byte, 7 ngày (mặc định) / 90 ngày (remember-me)
- Refresh rotation: old token bị revoke ngay khi refresh
- Fingerprint verification: nếu cả fingerprint + IP đều thay đổi → revoke tất cả tokens (anti-theft)
- Token reuse detection: unknown jti → revoke tất cả user tokens

## Realtime Events (SignalR)

SignalR is implemented and active via `/hubs/main`:

- **Log events**: Real-time log entry streaming to Log Viewer addon
- **Traffic events**: Network traffic data push to Network Traffic addon
- **System events**: Backend status notifications (planned)

SignalR client (frontend) auto-reconnects with exponential backoff (5s → 30s cap, infinite retry).

## Docker Management (Planned — M4)

Namorix sẽ quản lý addon containers qua Docker Unix socket, sử dụng thư viện **Docker.DotNet.Enhanced**.

```
DockerMonitor (BackgroundService)
  ↓ phát hiện container mới/dừng
AddonService
  ↓ CRUD qua Docker API
REST endpoints (AddonController)
```

## Development

```bash
# Watch mode (hot reload)
dotnet watch run

# Build
dotnet build

# Run tests (when available)
dotnet test
```
