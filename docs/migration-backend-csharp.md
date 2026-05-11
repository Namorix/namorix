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
namorix/
├── backend/                 # Desktop backend (C# .NET)
│   ├── src/
│   │   ├── Namorix.Core/   # Shared package (desktop + addon backends dùng chung)
│   │   │   ├── Auth/        # JWT, session
│   │   │   ├── Errors/      # ApiResponse, error codes
│   │   │   ├── Middleware/  # CORS, cookie, csrf
│   │   │   ├── Config/      # Env loading
│   │   │   └── Utils/       # getClientIP, logging
│   │   └── Namorix.Api/    # Desktop-specific (không share)
│   │       ├── Handlers/    # Auth handlers (desktop only)
│   │       ├── Db/          # DB operations (desktop schema)
│   │       └── ...
│   └── Namorix.Api.sln
│
├── frontend/
│   ├── packages/
│   │   └── core/            # @namorix/core (browser client lib)
│   └── src/                 # Shell UI (React)
```

## Phân biệt Namorix.Core vs Namorix.Api

| Package | Desktop | Addon | Share |
|---------|---------|-------|-------|
| `Namorix.Core` (shared) | Reference | Reference | **Có** — addon developers dùng |
| `Namorix.Api` (desktop) | Dùng nội bộ | Không thấy | **Không** |

### Namorix.Core — Shared Package

Addon developers reference khi viết addon backend bằng C#:
```xml
<PackageReference Include="Namorix.Core" Version="1.0.0" />
```

Chứa những thứ addon cần dùng chung:
- JWT verify
- Error codes, ApiResponse format
- Middleware (CORS, cookie)
- Config loading
- getClientIP utility

### Namorix.Api — Desktop Only

Những thứ chỉ desktop backend cần:
- Auth handlers (signIn, signUp, signOut, etc.)
- Database operations với desktop schema
- Settings service
- Cleanup jobs

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

## Dependencies

```xml
<!-- Namorix.Api.csproj -->
<PackageReference Include="Microsoft.AspNetCore.OpenApi" Version="8.0.0" />
<PackageReference Include="Microsoft.EntityFrameworkCore.Sqlite" Version="8.0.0" />
<PackageReference Include="Microsoft.EntityFrameworkCore.Design" Version="8.0.0" />
<PackageReference Include="System.IdentityModel.Tokens.Jwt" Version="7.0.0" />
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
- [ ] Create .NET solution
- [ ] Create Namorix.Core and Namorix.Api projects
- [ ] Add NuGet packages

### Phase 2: Namorix.Core — Shared Package
- [ ] Auth/ — JWT verify
- [ ] Errors/ — ApiResponse, error codes
- [ ] Config/ — Env loading
- [ ] Utils/ — getClientIP
- [ ] Middleware/ — CORS, cookie helpers

### Phase 3: Namorix.Api — DB
- [ ] EF Core models (User, RefreshToken, Setting)
- [ ] DbContext
- [ ] DB operations

### Phase 4: Namorix.Api — Auth Handlers
- [ ] Auth handlers (signIn, signUp, signOut, etc.)
- [ ] Route registration
- [ ] Response helpers

### Phase 5: Middleware
- [ ] CSRF double-submit
- [ ] Trust proxy

### Phase 6: Entry Point
- [ ] Program.cs wiring
- [ ] Graceful startup

### Phase 7: Testing
- [ ] Test all endpoints
- [ ] Compare with TypeScript backend responses

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| API style | Minimal API | Lightweight, no controllers |
| ORM | EF Core | Type-safe, migrations |
| SQLite driver | Microsoft.EntityFrameworkCore.Sqlite | Official Microsoft |
| WebSocket | System.Net.WebSockets | Built-in |

## Notes

- `@namorix/backend-core` → deprecated
- Decorator pattern from TypeScript → endpoint routing in C#
- Validation → inline or FluentValidation
- Addon viết bằng C# reference `Namorix.Core` để dùng chung utilities