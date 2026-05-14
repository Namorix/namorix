# Namorix Backend

ASP.NET Core 8 API server cho Namorix desktop shell. Xử lý authentication, settings, và middleware bảo mật.

## Tech Stack

| Component | Technology |
|-----------|------------|
| Runtime | .NET 8 |
| Framework | ASP.NET Core 8 |
| ORM | Entity Framework Core |
| Database | SQLite |
| JWT | System.IdentityModel.Tokens.Jwt |
| Password | BCrypt.Net-Next |

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

Server chạy tại `http://localhost:3000` (mặc định).

## Project Structure

```
backend/
├── Config/               # IOptions<T> config classes
│   ├── AppConfig.cs      # Root config (Jwt, ConnectionString, CsrfEnabled, SecureCookie)
│   └── JwtConfig.cs      # JWT settings (Secret, Issuer, Audience, expiration)
├── Constants/            # Static constants
│   ├── Auth.cs           # AuthConstraints (username/password min/max length)
│   ├── Cookie.cs         # Cookie names (nmx_access_token, nmx_refresh_token, nmx_csrf_token)
│   ├── Error.cs          # HttpErrorCodes, AuthErrorCodes
│   ├── Http.cs           # HttpContextKeys
│   ├── Jwt.cs            # JwtClaims (UserId, Username, Role, Jti, Iat)
│   ├── Settings.cs       # SettingKeys (RegisterEnabled, TrustedProxies)
│   └── Validation.cs     # ValidationErrorCodes
├── Controllers/          # API endpoints
│   ├── AuthController.cs      # 7 auth endpoints
│   └── SettingsController.cs  # Trusted proxies management
├── Exceptions/
│   └── AuthException.cs       # Custom exception with error code
├── Extensions/
│   └── ApplicationBuilderExtensions.cs  # Middleware pipeline extensions
├── Middleware/
│   ├── CsrfMiddleware.cs           # Double-submit CSRF protection
│   ├── ExceptionMiddleware.cs      # Global exception handler
│   ├── JsonErrorMiddleware.cs      # Consistent JSON error responses
│   ├── SecurityHeadersMiddleware.cs # Security headers (nosniff, DENY frame, etc.)
│   └── TrustedProxyMiddleware.cs   # Trusted proxy validation for X-Forwarded-For
├── Migrations/           # EF Core migrations
├── Models/
│   ├── AppDbContext.cs   # EF Core DbContext
│   ├── RefreshToken.cs   # Refresh token entity
│   ├── Setting.cs        # Key-value settings entity
│   └── User.cs           # User entity
├── Responses/
│   └── ApiResponse.cs    # Typed ApiResponse<T>
├── Services/
│   ├── AuthService.cs         # Login, Register, RefreshToken, RevokeToken, VerifyAccessToken
│   ├── SettingsService.cs     # IsRegisterEnabled, GetTrustedProxies (IMemoryCache)
│   └── TokenCleanupService.cs # BackgroundService, cleans expired tokens every 24h
├── Validation/
│   ├── IValidationSchema.cs       # Marker interface
│   ├── ValidateAttribute.cs       # ActionFilterAttribute
│   ├── ValidationRule.cs          # Abstract + concrete rules
│   └── Schemas/
│       ├── LoginSchema.cs
│       └── RegisterSchema.cs
├── Program.cs             # Entry point + middleware pipeline
├── appsettings.json       # Config values
├── appsettings.Development.json
└── Makefile               # Migration shortcuts
```

## API Endpoints

### Auth (`/api/auth`)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/login` | Login with username + password. Body: `{ username, password, rememberMe? }` |
| POST | `/api/auth/register` | Register new user. Body: `{ username, password }` |
| POST | `/api/auth/logout` | Clear cookies, revoke refresh token |
| POST | `/api/auth/logout-all` | Revoke all refresh tokens for current user |
| GET | `/api/auth/session` | Validate access token, return user info |
| POST | `/api/auth/refresh` | Rotate tokens (fingerprint + IP check) |
| GET | `/api/auth/status` | Return `{ needsRegister, registerEnabled }` |

### Settings (`/api/settings`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/settings/proxies` | Get list of trusted proxy IPs |
| PUT | `/api/settings/proxies` | Set trusted proxy IPs. Body: `{ proxies: string[] }` |

## Middleware Pipeline

Thứ tự middleware trong `Program.cs`:

```
CORS → SecurityHeaders → TrustedProxy → Routing → CORS → RateLimiter (100 req/min) → CSRF → Controllers
```

- **CORS**: Allow any origin + credentials (cho dev).
- **SecurityHeaders**: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `X-XSS-Protection: 1; mode=block`, `Referrer-Policy: strict-origin-when-cross-origin`.
- **TrustedProxy**: Chỉ trust `X-Forwarded-For` từ IP trong trusted list (Settings DB). Block request từ untrusted proxy với 400.
- **RateLimiter**: 100 requests/minute fixed window.
- **CSRF**: Double-submit pattern — so sánh `nmx_csrf_token` cookie với `X-CSRF-Token` header trên mutating methods.
- **JsonErrorMiddleware**: Chuyển lỗi thành JSON format đồng nhất.
- **ExceptionMiddleware**: Catch unhandled exceptions, trả 500 JSON.

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
| `SECURE_COOKIE` | AppConfig.SecureCookie | false | Set true for HTTPS |
| `CSRF_DISABLE` | AppConfig.CsrfEnabled | false | Set true to disable CSRF |

> **Note:** .NET uses `__` (double underscore) as separator for hierarchy in env vars.

## Database

SQLite database file (`namorix.db`), tạo tự động khi chạy migrations.

### Models

- **User** — `id`, `username`, `password`, `role`, `createdAt`
- **RefreshToken** — `jti`, `userId`, `tokenHash`, `userAgent`, `fingerprint`, `ipAddress`, `lastUsedAt`, `expiresAt`
- **Setting** — `key` (PK), `value`

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
2. Session check → GET /api/auth/session → validate access token via cookie
3. Token refresh → POST /api/auth/refresh → rotate tokens (fingerprint + IP verification)
4. Logout → POST /api/auth/logout → clear cookies, revoke token jti
5. Logout-all → POST /api/auth/logout-all → revoke all user tokens
```

- Access token: JWT, 5 phút (có thể cấu hình)
- Refresh token: random 64-byte, 7 ngày (mặc định) / 90 ngày (remember-me)
- Refresh rotation: old token bị revoke ngay khi refresh
- Fingerprint verification: nếu cả fingerprint + IP đều thay đổi → revoke tất cả tokens (anti-theft)
- Token reuse detection: unknown jti → revoke tất cả user tokens

## Development

```bash
# Watch mode (hot reload)
dotnet watch run

# Build
dotnet build

# Run tests (when available)
dotnet test
```
