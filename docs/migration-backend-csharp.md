# Backend Migration: TypeScript → C# (.NET)

Document quá trình chuyển backend từ Node.js/TypeScript (Express) sang C# (.NET 8).

## Status

**Đang tiến hành** — M2 phase.

## Mục tiêu

Chuyển backend auth API từ TypeScript/Express sang C# (.NET 8), giữ nguyên:
- API endpoints (7 endpoints)
- Database schema (users, refresh_tokens, settings)
- Auth flow + token whitelist + fingerprint verification
- Config từ env vars

## Architecture Overview

```
backend/
├── Config/
│   ├── AppConfig.cs      # Root config: Jwt, ConnectionString, AllowedOrigins
│   └── JwtConfig.cs      # JWT settings: Secret, Issuer, Audience, expiration
├── Constants/
│   └── AuthConstants.cs  # JwtClaims (claim names), AuthErrors (error codes)
├── Exceptions/
│   └── AuthException.cs  # Custom exception with error code
├── Models/
│   ├── User.cs           # User entity
│   ├── RefreshToken.cs   # RefreshToken entity
│   ├── Setting.cs        # Setting entity
│   └── AppDbContext.cs  # EF Core DbContext
├── Services/
│   └── AuthService.cs    # Auth business logic
├── Program.cs            # Entry point
├── appsettings.json      # Config values
└── backend.csproj
```

> **Không dùng multi-project** (Namorix.Core/Namorix.Api) để đơn giản hóa. Share code = internal class hoặc package riêng nếu cần.

## Scope

### Trong scope
- Auth API: signin, signup, signout, signout-all, session, refresh, status
- JWT utilities
- Middleware (CORS, CSRF, cookie, trust proxy)
- SQLite database
- Config loading

### Ngoài scope (giữ TypeScript)
- `@namorix/shared` — TypeScript types/constants cho frontend
- `@namorix/core` — browser-only code
- `@namorix/backend-core` — TypeScript utilities → **deprecated**
- WebSocket handlers (Socket.IO shell + terminal) — làm sau

## Tech Stack

| Component | Technology |
|-----------|------------|
| Framework | ASP.NET Core 8 |
| ORM | Entity Framework Core + SQLite |
| JWT | System.IdentityModel.Tokens.Jwt |
| Password | BCrypt.Net-Next |
| SQLite | Microsoft.EntityFrameworkCore.Sqlite |
| Testing | xUnit |

**Dùng minimal API** — không cần full MVC.

## Config Pattern — Dùng IOptions<T>

**Nguyên tắc:** Không hardcoded string cho config keys. Dùng `IOptions<T>` binding.

### JwtConfig.cs — config model

```csharp
namespace backend.Config;

public class JwtConfig
{
    public string Secret { get; set; } = string.Empty;
    public string Issuer { get; set; } = "Namorix";
    public string Audience { get; set; } = "Namorix";
    public int AccessTokenExpirationMinutes { get; set; } = 15;
    public int RefreshTokenExpirationDays { get; set; } = 7;
}
```

### AppConfig.cs — root config

```csharp
namespace backend.Config;

public class AppConfig
{
    public JwtConfig Jwt { get; set; } = new();
    public string ConnectionString { get; set; } = string.Empty;
    public string AllowedOrigins { get; set; } = "http://localhost:5173";
}
```

### Program.cs — binding

```csharp
builder.Services.Configure<AppConfig>(builder.Configuration);
builder.Services.Configure<JwtConfig>(builder.Configuration.GetSection("Jwt"));
builder.Services.AddDbContext<AppDbContext>();
```

### AuthService — injection

```csharp
public class AuthService
{
    private readonly AppDbContext _dbContext;
    private readonly JwtConfig _jwtConfig;

    public AuthService(AppDbContext dbContext, IOptions<JwtConfig> jwtOptions)
    {
        _dbContext = dbContext;
        _jwtConfig = jwtOptions.Value;
        // _jwtConfig.AccessTokenExpirationMinutes — type-safe
        // _jwtConfig.Secret — không hardcoded string
    }
}
```

**Lợi ích:**
- IDE autocomplete cho properties
- Compile-time error nếu property không tồn tại
- Không cần hardcoded `"Jwt:AccessTokenExpirationMinutes"` string

---

## Constants Pattern

### AuthConstants.cs

```csharp
namespace backend.Constants;

public static class JwtClaims
{
    public const string UserId = "userId";
    public const string Username = "username";
    public const string Role = "role";
    public const string Jti = "jti";
    public const string Iat = "iat";
}

public static class AuthErrors
{
    public const string InvalidCredentials = "INVALID_CREDENTIALS";
    public const string UsernameExists = "USERNAME_EXISTS";
    public const string TokenReuseDetected = "TOKEN_REUSE_DETECTED";
    public const string FingerprintMismatch = "FINGERPRINT_MISMATCH";
    public const string InvalidToken = "INVALID_TOKEN";
    public const string SignupClosed = "SIGNUP_CLOSED";
}
```

### AuthException.cs

```csharp
namespace backend.Exceptions;

public class AuthException : Exception
{
    public string Code { get; }

    public AuthException(string code) : base(code)
    {
        Code = code;
    }
}
```

### Usage

```csharp
new Claim(JwtClaims.UserId, user.Id.ToString())
throw new AuthException(AuthErrors.InvalidCredentials);
```

---

## Dependencies

```xml
<!-- backend.csproj -->
<PackageReference Include="Microsoft.AspNetCore.OpenApi" Version="8.0.0" />
<PackageReference Include="Microsoft.EntityFrameworkCore.Sqlite" Version="8.0.0" />
<PackageReference Include="Microsoft.EntityFrameworkCore.Design" Version="8.0.0">
  <IncludeAssets>runtime; build; native; contentfiles; analyzers; buildtransitive</IncludeAssets>
  <PrivateAssets>all</PrivateAssets>
</PackageReference>
<PackageReference Include="System.IdentityModel.Tokens.Jwt" Version="7.1.2" />
<PackageReference Include="BCrypt.Net-Next" Version="4.0.3" />
```

## API Endpoints

| Method | Path | Handler | Note |
|--------|------|---------|------|
| POST | /api/auth/signin | HandleSignIn | rememberMe body |
| POST | /api/auth/signup | HandleSignUp | |
| POST | /api/auth/signout | HandleSignOut | revoke token jti |
| POST | /api/auth/signout-all | HandleSignOutAll | revoke all user tokens |
| GET | /api/auth/session | HandleSession | returns user from access token |
| POST | /api/auth/refresh | HandleRefresh | rotate tokens, fingerprint check |
| GET | /api/auth/status | HandleStatus | needsSignup, signUpEnabled |

## Progress

### Phase 1: Setup + Structure
- [x] Create .NET solution
- [x] Config/ folder với JwtConfig, AppConfig
- [x] Constants/ folder với AuthConstants
- [x] Exceptions/ folder với AuthException
- [x] Add NuGet packages

### Phase 2: Models + DB
- [x] EF Core models (User, RefreshToken, Setting)
- [x] AppDbContext with DI
- [x] Migrations

### Phase 3: AuthService
- [x] Login, Register
- [x] GenerateTokens, CreateRefreshToken
- [x] VerifyAccessToken
- [x] RefreshToken với fingerprint check + token rotation
- [x] RevokeToken, RevokeAllUserTokens

### Phase 4: Auth Handlers
- [ ] AuthHandlers (7 endpoints)
- [ ] Route registration
- [ ] Response helpers

### Phase 5: Middleware
- [ ] CORS
- [ ] CSRF double-submit
- [ ] Trust proxy

### Phase 6: Entry Point
- [x] Program.cs wiring
- [ ] Graceful startup

### Phase 7: SettingsService
- [ ] getSetting, setSetting
- [ ] isSignUpEnabled

### Phase 8: Testing
- [ ] Test all endpoints

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| API style | Minimal API | Lightweight, no controllers |
| ORM | EF Core | Type-safe, migrations |
| SQLite driver | Microsoft.EntityFrameworkCore.Sqlite | Official Microsoft |
| WebSocket | System.Net.WebSockets | Built-in |
| Config | IOptions<T> + appsettings.json | Type-safe, no hardcoded strings |
| Project structure | Single project | Đơn giản, không multi-project |

## Notes

- `@namorix/backend-core` → deprecated
- Decorator pattern from TypeScript → Minimal API routing in C#
- Validation → inline hoặc record-based request models
- Addon viết bằng C# có thể reference project hoặc tách package riêng
- **Config pattern quan trọng:** Luôn dùng `IOptions<T>` thay vì `IConfiguration.GetValue<string>("key")` để tránh hardcoded strings