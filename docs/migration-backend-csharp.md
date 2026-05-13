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
- Auth API: login, register, logout, logout-all, session, refresh, status
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
    public const string RegisterClosed = "REGISTER_CLOSED";
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
| POST | /api/auth/login | HandleLogin | rememberMe body |
| POST | /api/auth/register | HandleRegister | |
| POST | /api/auth/logout | HandleLogout | revoke token jti |
| POST | /api/auth/logout-all | HandleLogoutAll | revoke all user tokens |
| GET | /api/auth/session | HandleSession | returns user from access token |
| POST | /api/auth/refresh | HandleRefresh | rotate tokens, fingerprint check |
| GET | /api/auth/status | HandleStatus | needsRegister, registerEnabled |

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
- [ ] isRegisterEnabled

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
- Decorator pattern from TypeScript → Controller-based routing trong C# (thay vì Minimal API như dự tính ban đầu, vì Controller hỗ trợ ActionFilter tốt hơn cho validation)
- Validation → `[Validate]` attribute với schema classes
- Addon viết bằng C# có thể reference project hoặc tách package riêng
- **Config pattern quan trọng:** Luôn dùng `IOptions<T>` thay vì `IConfiguration.GetValue<string>("key")` để tránh hardcoded strings

---

## Modern C# Patterns & Gợi Ý

Các pattern C# hiện đại (.NET 8+) đang dùng và nên dùng trong project:

### 1. Primary Constructors (C# 12)

```csharp
// ✅ Controller — primary constructor + DI
public class AuthController(AuthService authService, IOptions<JwtConfig> jwtConfig)
    : ControllerBase
{
    private readonly JwtConfig _jwtConfig = jwtConfig.Value;
}

// ✅ Service — primary constructor thay vì field backing field boilerplate
public class AuthService(AppDbContext dbContext, IOptions<JwtConfig> jwtOptions)
{
    private readonly JwtConfig _jwtConfig = jwtOptions.Value;

    public async Task<User> Register(string username, string password)
    {
        // dùng _dbContext, _jwtConfig trực tiếp
    }
}
```

**Rules:**
- Dùng cho tất cả services, controllers (trừ khi cần logic phức tạp trong constructor)
- Không dùng primary constructor nếu cần `ILogger<T>` — logger nên là field riêng với `LoggerMessage` source-gen

### 2. Records cho DTOs (thay vì class)

```csharp
// ✅ Record — immutable, value equality, concise
public record LoginRequest(string Username, string Password, bool RememberMe);
public record RegisterRequest(string Username, string Password);
public record UserResponse(int Id, string Username, string Role);
public record StatusResponse(bool NeedsRegister, bool RegisterEnabled);

// ❌ Class — boilerplate, mutable
public class LoginRequest
{
    public string Username { get; init; } = string.Empty;
    public string Password { get; init; } = string.Empty;
    public bool RememberMe { get; init; }
}
```

**Khi nào dùng:**
- Request/Response DTOs → **record**
- Entities (EF Core) → **class** (cần mutation cho change tracking)
- Config models → **class** (IOptions<T> binding cần setter)

### 3. Pattern Matching cho Error Handling

```csharp
// ✅ Switch expression — gọn hơn if/else chain
return authResult switch
{
    { IsSuccess: true } => Ok(ApiResponse<UserResponse>.Ok(MapUser(authResult.User))),
    { Code: AuthErrors.InvalidCredentials } => Unauthorized(ApiResponse.Fail(authResult.Code)),
    { Code: AuthErrors.UsernameExists } => Conflict(ApiResponse.Fail(authResult.Code)),
    _ => StatusCode(500, ApiResponse.Fail(AuthErrors.InternalError))
};

// ✅ Exception filter trong catch
catch (AuthException ex) when (ex.Code == AuthErrors.InvalidCredentials)
{
    return Unauthorized(ApiResponse.Fail(ex.Code, "Invalid username or password"));
}
catch (AuthException ex) when (ex.Code == AuthErrors.UsernameExists)
{
    return Conflict(ApiResponse.Fail(ex.Code));
}
```

### 4. Collection Expressions (C# 12)

```csharp
// ✅ [] syntax — clear hơn new List<T>()
public List<string> GetScopes() => ["read", "write", "admin"];
public string[] GetRoles() => ["user", "admin"];

// Spread operator ..
var allItems = [.. existingItems, .. newItems];
```

### 5. Raw String Literals (C# 11)

```csharp
// ✅ Raw string — không cần escape, giữ nguyên indent
var sql = """
    SELECT u.id, u.username, u.role
    FROM users u
    WHERE u.username = {0}
    """;

// JSON string trong test
var json = """
    {
        "success": true,
        "data": { "id": 1, "username": "admin" }
    }
    """;
```

### 6. Optional: Source Generators cho Logger

```csharp
// LoggerMessage attribute — zero allocation at runtime
public static partial class LogMessages
{
    [LoggerMessage(LogLevel.Information, "User {Username} logged in from {Ip}")]
    public static partial void LogUserLogin(ILogger logger, string username, string ip);

    [LoggerMessage(LogLevel.Warning, "Token reuse detected for user {UserId}")]
    public static partial void LogTokenReuse(ILogger logger, int userId);
}
```

Dùng khi cần hiệu suất cao. Với request đơn giản thì `ILogger<T>.LogInformation()` là đủ.

### 7. Nullable Reference Types Best Practices

```csharp
// ✅ Không ép kiểu — dùng pattern matching
if (payload is { userId: > 0 }) { /* hợp lệ */ }

// ✅ ?? throw pattern cho config bắt buộc
private readonly string _jwtSecret = jwtConfig.Secret
    ?? throw new InvalidOperationException("JWT Secret is required");

// ✅ Không dùng ! (null-forgiving operator) trừ interop
// ❌ var user = FindUser()!;
// ✅ if (user is { } userObj) { /* dùng userObj */ }
```

### 8. target-typed new + Toán tử điều kiện (C# 9+)

```csharp
// ✅ target-typed new — bỏ redundant type name
ApiResponse<UserResponse> response = new()
{
    Success = true,
    Data = userData
};

// ✅ Conditional access — gọn hơn if null check
var jti = jwtToken.Claims.FirstOrDefault(c => c.Type == JwtClaims.Jti)?.Value;
var ip = headers["x-forwarded-for"].FirstOrDefault()?.Split(",")[0].Trim();
```

### 9. Cấu trúc file gợi ý

```
backend/
├── Controllers/
│   └── AuthController.cs          # Controller + DTO records cùng file (nếu DTO nhỏ)
├── Services/
│   └── AuthService.cs             # Business logic, inject DbContext
├── Models/
│   ├── User.cs                    # Entity class (EF Core)
│   ├── RefreshToken.cs
│   └── Setting.cs
├── Data/
│   └── NmxDbContext.cs
├── Config/
│   ├── AppConfig.cs               # Config class (có setter)
│   └── JwtConfig.cs
├── Constants/
│   └── AuthConstants.cs           # Hằng số static class
├── Exceptions/
│   └── AuthException.cs
├── Responses/                     # (có thể gộp vào Controllers nếu ít)
│   ├── ApiResponse.cs
│   └── ApiResponse{T}.cs
├── Middleware/
│   ├── ExceptionMiddleware.cs
│   └── JsonErrorMiddleware.cs
├── Validation/
│   ├── IValidationSchema.cs
│   ├── ValidateAttribute.cs
│   ├── ValidationRule.cs
│   └── Schemas/
│       ├── LoginSchema.cs
│       └── RegisterSchema.cs
└── Program.cs
```

### Tổng kết — Áp dụng vào Project

| Pattern | Đang dùng? | Nên dùng? | Ghi chú |
|---------|-----------|-----------|---------|
| Primary constructor | ✅ Controller | ✅ Services | Tiết kiệm boilerplate |
| Record DTOs | ❌ class | ✅ record | Immutable, ngắn gọn |
| Pattern matching | ⚠️ Partial | ✅ Full | Switch expression cho error mapping |
| Collection expressions | ❌ | ✅ | `[]` syntax |
| Raw string literals | ❌ | ✅ | SQL, JSON trong code |
| Source-gen Logger | ❌ | ⚠️ Optional | Chỉ khi cần performance |
| Nullable reference types | ✅ | ✅ | Đã dùng, keep it up |