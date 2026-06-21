# Merge Namorix.Adapters vào Namorix.Server

## Goal

Flatten backend structure: gộp Persistence (DbContext, Migrations) + Services từ `Namorix.Adapters` vào `Namorix.Server`. Xoá hẳn project `Namorix.Adapters`.

**Lý do:** Không cần tách persistence layer riêng — project nhỏ, single SQLite instance, không có multi-database hay multi-tenant.

---

## Current Structure

```
backend/src/
├── Namorix.Core/              # Models, Config, Middleware, Hubs, Extensions (giữ nguyên)
├── Namorix.Adapters/           # 11 files — sẽ xoá
│   ├── Namorix.Adapters.csproj
│   ├── Persistence/
│   │   └── AppDbContext.cs
│   ├── Services/
│   │   ├── AuthService.cs
│   │   ├── NotificationService.cs
│   │   ├── PermissionService.cs
│   │   ├── SettingsService.cs
│   │   ├── ThemeService.cs
│   │   ├── UserService.cs
│   │   └── UserSettingsService.cs
│   └── Migrations/
│       ├── 20260621011355_InitialCreate.cs
│       ├── 20260621011355_InitialCreate.Designer.cs
│       └── AppDbContextModelSnapshot.cs
└── Namorix.Server/             # 20 files — nhận thêm
    ├── Controllers/ (8 files)
    ├── Middleware/ (3 files)
    ├── Workers/ (3 files)
    ├── Hubs/ (2 files)
    ├── Extensions/ (1 file)
    ├── Infrastructure/ (1 file)
    ├── Constants/ (1 file)
    └── Program.cs
```

Dependency hiện tại: `Server → Adapters → Core`

## Steps

### Step 1: Copy files từ Adapters vào Server

Copy nguyên cấu trúc folder vào Server:
```
Namorix.Server/
├── Persistence/
│   └── AppDbContext.cs          # từ Adapters/Persistence/
├── Services/
│   ├── AuthService.cs           # từ Adapters/Services/
│   ├── NotificationService.cs
│   ├── PermissionService.cs
│   ├── SettingsService.cs
│   ├── ThemeService.cs
│   ├── UserService.cs
│   └── UserSettingsService.cs
└── Migrations/
    ├── 20260621011355_InitialCreate.cs
    ├── 20260621011355_InitialCreate.Designer.cs
    └── AppDbContextModelSnapshot.cs
```

### Step 2: Đổi namespace trong các file đã copy

| Namespace cũ | Namespace mới |
|---|---|
| `Namorix.Adapters.Persistence` | `Namorix.Server.Persistence` |
| `Namorix.Adapters.Services` | `Namorix.Server.Services` |
| `Namorix.Adapters.Migrations` | `Namorix.Server.Migrations` |

Áp dụng cho:
- `AppDbContext.cs`
- 7 services files
- 3 migration files

### Step 3: Cập nhật Server files — using directives

| File | Thay đổi |
|------|----------|
| `Program.cs` | `Namorix.Adapters.Persistence` → `Namorix.Server.Persistence` |
| `Program.cs` | `Namorix.Adapters.Services` → `Namorix.Server.Services` |
| `AuthController.cs` | `Namorix.Adapters.Services` → `Namorix.Server.Services` |
| `UserController.cs` | same |
| `SettingsController.cs` | same |
| `NotificationController.cs` | same |
| `PermissionController.cs` | same |
| `UserPermissionController.cs` | same |
| `ThemeController.cs` | same |
| `AuthMiddleware.cs` | `Namorix.Adapters.Services` → `Namorix.Server.Services` |
| `TrustedProxyMiddleware.cs` | same |
| `RequirePermissionAttribute.cs` | same |
| `TokenCleanupWorker.cs` | `Namorix.Adapters.Persistence` → `Namorix.Server.Persistence` |
| `NotificationCleanupWorker.cs` | same |

### Step 4: Cập nhật Core string reference

`Namorix.Core/FlatFile/LogEntrySerializer.cs:81`:
```
"Namorix.Adapters.Services.AuthService" → "Namorix.Server.Services.AuthService"
```

### Step 5: Merge `.csproj`

`Namorix.Server.csproj` hiện tại:
```xml
<ProjectReference Include="..\Namorix.Adapters\Namorix.Adapters.csproj" />
<PackageReference Include="Microsoft.EntityFrameworkCore.Design" />
```

Cần thêm package từ `Namorix.Adapters.csproj`:
```xml
<PackageReference Include="BCrypt.Net-Next" />
<PackageReference Include="Microsoft.EntityFrameworkCore" />
<PackageReference Include="Microsoft.EntityFrameworkCore.Sqlite" />
<PackageReference Include="Microsoft.Extensions.Caching.Memory" />
<PackageReference Include="System.IdentityModel.Tokens.Jwt" />
```

Và giữ lại `Microsoft.EntityFrameworkCore.Design`.

### Step 6: Cập nhật Makefile

```makefile
# Cũ:
EF_PROJECT = --project src/Namorix.Adapters
# Mới:
EF_PROJECT = --project src/Namorix.Server
```

### Step 7: Xoá Adapters khỏi solution + disk

- `Namorix.sln`: xoá dòng Project `{FAE04EC0...}` của Namorix.Adapters
- Xoá folder `backend/src/Namorix.Adapters/`

### Step 8: Generate migration mới

Vì DbContext đã đổi assembly, migration cũ không dùng được. Cần:

```bash
rm -rf src/Namorix.Server/Migrations/
dotnet ef migrations add InitialCreate --project src/Namorix.Server
```

**Lưu ý:** Migration mới sẽ khác với migration cũ vì model snapshot tính từ DbContext hiện tại. Cần kiểm tra xem có field/model nào thay đổi không.

---

## Files Changed (Summary)

| File | Action |
|------|--------|
| `Namorix.Server/Persistence/AppDbContext.cs` | **New** (copy + namespace) |
| `Namorix.Server/Services/AuthService.cs` | **New** (copy + namespace) |
| `Namorix.Server/Services/NotificationService.cs` | **New** (copy + namespace) |
| `Namorix.Server/Services/PermissionService.cs` | **New** (copy + namespace) |
| `Namorix.Server/Services/SettingsService.cs` | **New** (copy + namespace) |
| `Namorix.Server/Services/ThemeService.cs` | **New** (copy + namespace) |
| `Namorix.Server/Services/UserService.cs` | **New** (copy + namespace) |
| `Namorix.Server/Services/UserSettingsService.cs` | **New** (copy + namespace) |
| `Namorix.Server/Migrations/*` | **New** (regenerate) |
| `Namorix.Server/Program.cs` | **Edit** (using directives) |
| `Namorix.Server/Controllers/*Controller.cs` (6 files) | **Edit** (using) |
| `Namorix.Server/Middleware/*.cs` (3 files) | **Edit** (using) |
| `Namorix.Server/Workers/TokenCleanupWorker.cs` | **Edit** (using) |
| `Namorix.Server/Workers/NotificationCleanupWorker.cs` | **Edit** (using) |
| `Namorix.Server/Namorix.Server.csproj` | **Edit** (add packages, remove Adapters ref) |
| `Namorix.Core/FlatFile/LogEntrySerializer.cs` | **Edit** (string literal) |
| `Namorix.sln` | **Edit** (remove Adapters) |
| `Makefile` | **Edit** (EF_PROJECT path) |
| `Namorix.Adapters/*` | **Delete** (entire folder) |

## No Changes

- `Namorix.Core.csproj` — giữ nguyên
- `Namorix.Core/*` — chỉ sửa 1 string literal
- Controllers logic — không đổi, chỉ sửa import

## Version Bumps

| Package | Version | Reason |
|---------|---------|--------|
| Namorix.Server | 0.37.2 → 0.38.0 | Restructure: merge Adapters, regenerate migration |
