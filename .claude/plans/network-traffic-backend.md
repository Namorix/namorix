# NetworkTraffic Backend Plan

## Context

Add network traffic monitoring to Namorix. Core backend intercepts HTTP requests via middleware, logs to `TrafficLogs` table. External addons push logs via gRPC stream to core. Frontend addon queries aggregated data via a controller.

**Phases:** Phase 1 = core local monitoring (models → middleware → controller). Phase 2 (cuối plan) = attribute auto-scan + gRPC addon transport.

## Files to Create

| # | File | Purpose |
|---|------|---------|
| 1 | `Namorix.Core/Models/TrafficEndpoint.cs` | Registered endpoint (method, path, label, addonId FK) |
| 2 | `Namorix.Core/Models/TrafficAddress.cs` | Normalized IP address (IP string → int ID) |
| 3 | `Namorix.Core/Models/TrafficLog.cs` | Captured request log (status, duration, size, TrafficAddressId FK) |
| 4 | `Namorix.Adapters/Services/TrafficMonitorService.cs` | CRUD endpoints + query logs + aggregate stats |
| 5 | `Namorix.Server/Controllers/TrafficMonitorController.cs` | Admin API for endpoints + logs |
| 6 | `Namorix.Server/Middleware/TrafficMonitorMiddleware.cs` | Intercept requests, match registry, write to channel |
| 7 | `Namorix.Core/Infrastructure/TrafficBuffer.cs` | Singleton `Channel<TrafficLog>` (bounded 50K, DropOldest) |
| 8 | `Namorix.Workers/TrafficFlushWorker.cs` | BackgroundService — drain channel, batch INSERT every 5s or 100 items |
| 9 | `Namorix.Workers/TrafficCleanupWorker.cs` | BackgroundService — delete logs older than 30 days, runs daily |
| 10 | `Namorix.Core/Attributes/TrafficMonitorAttribute.cs` | Marker attribute for controllers/actions |

## Files to Modify

| # | File | Change |
|---|------|--------|
| 8 | `Namorix.Adapters/Persistence/AppDbContext.cs` | Add `DbSet<TrafficEndpoint>`, `DbSet<TrafficAddress>`, `DbSet<TrafficLog>`; unique index on `TrafficEndpoint(Method, Path)` (Method là int, Path là string), unique index on `TrafficAddress(Ip)` |
| 9 | `Namorix.Server/Extensions/ApplicationBuilderExtensions.cs` | Add `UseTrafficMonitor()` extension method |
| 10 | `Namorix.Server/Program.cs` | Register `TrafficMonitorService` scoped, `TrafficCleanupWorker` hosted; call `app.UseTrafficMonitor()` in pipeline |
| 11 | Migrations (auto via `dotnet ef migrations add`) | Create tables |

## Model Design

```csharp
// TrafficEndpoint.cs
public class TrafficEndpoint
{
    public int Id { get; init; }

    [MaxLength(20)]
    public string Method { get; init; } = string.Empty;   // GET, POST, PUT, DELETE

    [MaxLength(500)]
    public string Path { get; init; } = string.Empty;     // "/api/auth/login"

    [MaxLength(200)]
    public string? Label { get; init; }                   // Human-readable label

    [MaxLength(100)]
    public string? AddonId { get; init; }                 // null = system endpoint, "network-traffic" = addon
    public AddonManifest? Addon { get; init; }            // Navigation to addon manifest

    public bool IsEnabled { get; init; } = true;
    public DateTime CreatedAt { get; init; } = DateTime.UtcNow;
}

// TrafficAddress.cs
public class TrafficAddress
{
    public long Id { get; init; }

    [MaxLength(50)]
    public string Ip { get; init; } = string.Empty;

    public ICollection<TrafficLog> TrafficLogs { get; init; } = new List<TrafficLog>();
}

// TrafficLog.cs
public class TrafficLog
{
    public long Id { get; init; }

    public int EndpointId { get; init; }
    public TrafficEndpoint? Endpoint { get; init; }

    public int StatusCode { get; init; }
    public long DurationMs { get; init; }
    public long ResponseSizeBytes { get; init; }

    public long? TrafficAddressId { get; init; }            // FK to TrafficAddress
    public TrafficAddress? TrafficAddress { get; init; }

    public int? UserId { get; init; }                     // Null if not authenticated

    public DateTime Timestamp { get; init; } = DateTime.UtcNow;
}
```

All fields are numeric except Method and Path — efficient for SQLite storage and aggregation queries.

## Middleware Logic

```
App start
  → First request loads all enabled endpoints into static HashSet
  → Subsequent requests hit RAM only

Request comes in
  → Record startTime = DateTime.UtcNow
  → await next(context)  // Run downstream pipeline
  → durationMs = (DateTime.UtcNow - startTime).TotalMilliseconds
  → Check (Method, Path) in static HashSet (O(1), no DB)
  → If matched: write TrafficLog to Channel (non-blocking, ~1μs)
  → If not matched: skip (no log)
```

**TrafficBuffer** — bounded channel shared between middleware and flush worker:

```csharp
public static class TrafficBuffer
{
    public static readonly Channel<TrafficLog> Channel =
        System.Threading.Channels.Channel.CreateBounded<TrafficLog>(
            new BoundedChannelOptions(50000)
            {
                FullMode = BoundedChannelFullMode.DropOldest
            });
}
```

`DropOldest` when buffer full → never blocks requests, accepts losing old logs over slowing the app.

**TrafficFlushWorker** — blocks on `WaitToReadAsync` (5s timeout), drains up to 100 items, batch INSERTs:

```csharp
public class TrafficFlushWorker(IServiceScopeFactory scopeFactory) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken ct)
    {
        var batch = new List<TrafficLog>(100);
        while (!ct.IsCancellationRequested)
        {
            // Wait for at least 1 item or 5s timeout
            using var cts = CancellationTokenSource.CreateLinkedTokenSource(ct);
            cts.CancelAfter(TimeSpan.FromSeconds(5));
            try { await TrafficBuffer.Channel.Reader.WaitToReadAsync(cts.Token); }
            catch (OperationCanceledException) { }

            // Drain up to 100 items
            while (batch.Count < 100 && TrafficBuffer.Channel.Reader.TryRead(out var log))
                batch.Add(log);

            if (batch.Count == 0) continue;

            using var scope = scopeFactory.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            db.TrafficLogs.AddRange(batch);
            await db.SaveChangesAsync(ct);
            batch.Clear();
        }
    }
}
```

In-memory cache via `static HashSet<(string Method, string Path)>` with double-check locking (lazy load on first request). Cache invalidated by `TrafficMonitorService` when admin registers/removes endpoints — service calls `TrafficMonitorMiddleware.AddToRegistry()` / `RemoveFromRegistry()` static methods.

```csharp
public class TrafficMonitorMiddleware(RequestDelegate next)
{
    private static readonly HashSet<(string Method, string Path)> _registry = [];
    private static readonly Lock _lock = new();
    private static bool _loaded;

    public async Task InvokeAsync(HttpContext context, AppDbContext db)
    {
        if (!_loaded)
        {
            lock (_lock)
            {
                if (!_loaded)
                {
                    var endpoints = db.TrafficEndpoints
                        .Where(e => e.IsEnabled)
                        .Select(e => new { e.Method, e.Path })
                        .ToList();
                    foreach (var e in endpoints)
                        _registry.Add((e.Method, e.Path));
                    _loaded = true;
                }
            }
        }
        // ... record timing, call next, check registry, log
    }

    public static void AddToRegistry(string method, string path)
    {
        lock (_lock) _registry.Add((method, path));
    }

    public static void RemoveFromRegistry(string method, string path)
    {
        lock (_lock) _registry.Remove((method, path));
    }
}
```

Middleware placed AFTER `UseAuth()` so `HttpContext.User` is populated.

**Auto-registration via `[TrafficMonitor]` attribute:**

```csharp
// TrafficMonitorAttribute.cs
[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method)]
public class TrafficMonitorAttribute : Attribute
{
    public string? Label { get; init; }
}
```

Controllers được gắn `[TrafficMonitor]` hoặc `[TrafficMonitor(Label = "Login")]` sẽ được auto-scan lúc app start (trong `UseTrafficMonitor()`). Attribute trên class = tất cả actions của controller đó được register. Attribute trên method = chỉ action đó.

```csharp
// Ví dụ sử dụng
[TrafficMonitor]
[ApiController]
[Route("api/auth")]
public class AuthController(...) : ControllerBase { }
```

Scan logic (trong `ApplicationBuilderExtensions` hoặc helper riêng) — lấy tất cả `ControllerBase` types từ assembly, đọc `[Route]` + `[HttpGet]`/`[HttpPost]`/etc để extract method + path, upsert vào `TrafficEndpoints`. Chạy một lần lúc startup, đồng thời load vào static HashSet cho middleware.

**Design decision — opt-in via attribute:** Endpoints must have `[TrafficMonitor]` to be logged. No manual register needed on deploy.

**Retention:** Auto-cleanup logs older than 30 days via `TrafficCleanupWorker` (same `IServiceScopeFactory` pattern as `TokenCleanupWorker`):

```csharp
public class TrafficCleanupWorker(IServiceScopeFactory scopeFactory) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken ct)
    {
        while (!ct.IsCancellationRequested)
        {
            using var scope = scopeFactory.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var cutoff = DateTime.UtcNow.AddDays(-30);
            await db.TrafficLogs.Where(l => l.Timestamp < cutoff).ExecuteDeleteAsync(ct);
            await Task.Delay(TimeSpan.FromDays(1), ct);
        }
    }
}
```

## Service Design

```csharp
public class TrafficMonitorService(AppDbContext dbContext)
{
    // Endpoint registry
    Task<TrafficEndpoint> RegisterEndpoint(string method, string path, string? label)
    Task RemoveEndpoint(int id)
    Task<List<TrafficEndpoint>> ListEndpoints()

    // Logs (paginated, date-range filterable)
    Task<(List<TrafficLog> items, long total)> GetLogs(int page, int pageSize, int? endpointId, DateTime? from, DateTime? to)

    // Aggregate stats with date range
    Task<TrafficStats> GetStats(DateTime? from, DateTime? to)
    Task ClearLogs(DateTime? before)
}

// TrafficStats DTO — all numeric
public class TrafficStats
{
    public long TotalRequests { get; init; }
    public long ErrorCount { get; init; }          // 4xx + 5xx
    public double AvgDurationMs { get; init; }
    public double AvgResponseSizeBytes { get; init; }
    public Dictionary<string, long> StatusCodes { get; init; }  // "200": 150, "404": 3...
    public List<EndpointStats> ByEndpoint { get; init; }
}

public class EndpointStats
{
    public int EndpointId { get; init; }
    public string Path { get; init; } = "";
    public string Method { get; init; } = "";
    public long Count { get; init; }
    public double AvgDurationMs { get; init; }
    public double ErrorRate { get; init; }
}
```

## Controller API

```
[ApiController] [RequireAdmin] [Route("api/traffic")]

GET    /api/traffic/endpoints            — ListEndpoints()
POST   /api/traffic/endpoints            — RegisterEndpoint(method, path, label)
DELETE /api/traffic/endpoints/{id}        — RemoveEndpoint(id)
GET    /api/traffic/logs?page=&size=&ep=&from=&to= — GetLogs()
GET    /api/traffic/stats?from=&to=               — GetStats()
DELETE /api/traffic/logs?before=                  — ClearLogs()
```

## Implementation Order

### Phase 1 — Core Local Monitoring

1. **Models** — `TrafficEndpoint.cs` + `TrafficAddress.cs` + `TrafficLog.cs`
3. **AppDbContext** — add `DbSet`s + unique indexes
4. **Migration** — `dotnet ef migrations add AddNetworkTraffic`
5. **Infrastructure** — `TrafficBuffer.cs`
6. **Service** — `TrafficMonitorService.cs`
7. **Middleware** — `TrafficMonitorMiddleware.cs`
8. **Controller** — `TrafficMonitorController.cs`
9. **Workers** — `TrafficFlushWorker.cs` + `TrafficCleanupWorker.cs`
10. **DI + Pipeline** — `Program.cs` + `ApplicationBuilderExtensions.cs`

### Phase 2 — Attribute + gRPC (cuối plan)

10. **Attribute** — `TrafficMonitorAttribute.cs` + scan on startup
11. **Proto** — `traffic.proto`
12. **TrafficClientWorker** + **TrafficClientExtensions** (addon side)
13. **TrafficGrpcService** (core side)
14. **NuGet** — `Grpc.AspNetCore`, `Google.Protobuf`, `Grpc.Tools`
15. **DI** — `AddGrpc()` + `MapGrpcService<>()`

## Verification

1. `dotnet build` — no compile errors
2. `dotnet ef database update` — tables created
3. Start backend, hit any endpoint (e.g. `/api/auth/status`)
4. Register that endpoint via `POST /api/traffic/endpoints`
5. Hit it again, then `GET /api/traffic/logs` — should see the logged request
6. `GET /api/traffic/stats` — should show aggregated metrics

---

## Phase 2 — gRPC Addon Transport (cuối plan)

Addon gửi traffic log về core qua gRPC stream. Core nhận, resolve endpoint + IP, push vào `TrafficBuffer` dùng chung.

### Files to Create

| # | File | Purpose |
|---|------|---------|
| 1 | `Namorix.Core/Protos/traffic.proto` | `TrafficLogMessage`, `TrafficService.StreamLogs` RPC |
| 2 | `Namorix.Core/Traffic/TrafficClientOptions.cs` | Config: `CoreEndpoint`, `AddonId` |
| 3 | `Namorix.Core/Traffic/TrafficClientWorker.cs` | BackgroundService — drain buffer, push qua gRPC stream |
| 4 | `Namorix.Core/Extensions/TrafficClientExtensions.cs` | `AddNamorixTraffic(options)` extension method |
| 5 | `Namorix.Server/GrpcServices/TrafficGrpcService.cs` | gRPC server — nhận stream, resolve, push vào buffer |

### Proto

```protobuf
syntax = "proto3";
option csharp_namespace = "Namorix.Core.Protos";

service TrafficService {
    rpc StreamLogs(stream TrafficLogMessage) returns (Ack);
}

message TrafficLogMessage {
    string addon_id            = 1;
    string method              = 2;
    string path                = 3;
    int32  status_code         = 4;
    int64  duration_ms         = 5;
    int64  response_size_bytes = 6;
    string client_ip           = 7;
    int32  user_id             = 8;
    int64  timestamp_utc_ticks = 9;
}

message Ack {
    bool ok = 1;
}
```

### TrafficClientWorker (addon side)

```
App start → mở gRPC channel tới CoreEndpoint → mở StreamLogs stream
Loop:
  → WaitToReadAsync TrafficBuffer (block hoặc 5s timeout)
  → Drain tối đa 100 items
  → WriteAsync từng item vào stream
  → Nếu stream lỗi → reconnect exponential backoff (1s, 2s, 4s, max 30s)
  → Log trong buffer không bị mất — tiếp tục drain sau reconnect
```

### TrafficGrpcService (core side)

```
Nhận TrafficLogMessage từ stream
  → Lookup EndpointId từ (AddonId, Method, Path)
      → Chưa có → auto-register TrafficEndpoint với AddonId
      → Cache Dictionary<(addon, method, path), int>
  → Lookup TrafficAddressId từ client_ip
      → Chưa có → insert TrafficAddress
      → Cache Dictionary<string, long>
  → Build TrafficLog object
  → Push vào TrafficBuffer.Channel
  → Trả Ack { ok = true }
```

### Addon Registration

```csharp
// Addon Program.cs
builder.Services.AddNamorixTraffic(options =>
{
    options.CoreEndpoint = "https://core:5000";
    options.AddonId      = "my-addon";
});

app.UseTrafficMonitor();
```

### Files to Modify

| # | File | Change |
|---|------|--------|
| 1 | `Namorix.Server/Program.cs` | `builder.Services.AddGrpc()` + `app.MapGrpcService<TrafficGrpcService>()` |
| 2 | `Namorix.Core/Namorix.Core.csproj` | NuGet: `Grpc.AspNetCore`, `Google.Protobuf`, `Grpc.Tools` |

### Scope

- `TrafficClientWorker` — chỉ addon, core KHÔNG dùng
- `TrafficGrpcService` — chỉ core, addon KHÔNG có
- `TrafficBuffer`, `TrafficMonitorAttribute`, `TrafficMonitorMiddleware` — dùng ở cả hai
- Core middleware giữ nguyên — log request local trực tiếp qua Channel, không qua gRPC

---

## Phase 3 — Frontend Addon UI

Addon hiển thị dữ liệu từ backend controller (`GET /api/traffic/stats`, `GET /api/traffic/logs`).

### Layout

```
┌─ Header ──────────────────────────────────────┐
│  Network Traffic   [date range]  [refresh]     │
└───────────────────────────────────────────────┘
┌─ Stats Row ───────────────────────────────────┐
│  Total Req  │  Error Rate  │  Avg Latency  │  Top Addon  │
└───────────────────────────────────────────────┘
┌─ Charts ──────────────────────────────────────┐
│  Request timeline (line)  │  Status dist (bar) │
└───────────────────────────────────────────────┘
┌─ Endpoint Table ──────────────────────────────┐
│  Method | Path | Label | Addon | Reqs | Error | Latency  │
└───────────────────────────────────────────────┘
┌─ Log Table ───────────────────────────────────┐
│  Time | Method | Path | Status | IP | Latency | User  │
└───────────────────────────────────────────────┘
```

### Stats Row

4 card: Total Requests / Error Rate (đỏ nếu >5%) / Avg Latency / Top Addon

### Charts

- **Request Timeline:** line chart theo giờ/ngày, overlay total vs error, click point → filter log table
- **Status Distribution:** bar chart 2xx/3xx/4xx/5xx

### Endpoint Table

| Method | Path | Label | Addon | Requests | Error Rate | Avg Latency | Actions |
|---|---|---|---|---|---|---|---|
| GET | /api/users | User List | core | 1,204 | 0.2% | 12ms | Toggle / Delete |

- Filter + sort, toggle enable/disable, inline form add endpoint

### Log Table

| Time | Method | Path | Status | IP | Latency | User | Addon |
|---|---|---|---|---|---|---|---|

- Paginated 50/page, filter theo method/status/endpoint/IP/addon/date
- Row 5xx đỏ, 4xx vàng, click row expand detail

### Phụ

- Auto-refresh toggle — poll stats mỗi 30s
- Clear logs button + confirm dialog
- Export CSV nếu cần

### Không làm

- Real-time websocket — poll 30s đủ cho monitoring
- IP geolocation — overkill homelab
- Alert/notification — addon riêng sau
