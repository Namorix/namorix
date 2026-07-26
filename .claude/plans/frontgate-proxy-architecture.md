# Frontgate Proxy Architecture Plan

## Stack Decision: YARP

Use **YARP (Yet Another Reverse Proxy)** — Microsoft's official reverse proxy library — integrated directly into the ASP.NET Core pipeline:

- `AddReverseProxy()` + `MapReverseProxy()` — chạy chung process với backend, không cần Nginx/HAProxy riêng
- Config runtime qua `IProxyConfigProvider` — đọc từ DB (`FgReverseProxyRule` table), áp dụng ngay không cần restart
- Forward WebSocket, gRPC (HTTP/2), HTTP/1.1 built-in
- Load balancing, health check, retry policy có sẵn

### So với Nginx-generated config

| Tiêu chí | YARP | Nginx |
|----------|------|-------|
| Chạy chung process .NET | Chung | Riêng |
| Update rule runtime | Native, không cần reload | Cần `nginx -s reload` |
| WebSocket/HTTP2 | Built-in | Built-in |
| Debug/log | Cùng Serilog pipeline | Log riêng |
| TLS/SNI cert | Tự code | Native |

## Entity Design

### Core Entities

```
FgReverseProxyRule ──[CertificateId]──> FgCertificate    (nhiều rule dùng chung 1 cert)
FgReverseProxyRule ──[AccessPolicyId]──> FgAccessPolicy  (nhiều rule dùng chung 1 policy)
FgReverseProxyRule ── 1:n ──> FgReverseProxyLocation     (Custom Locations sub-routing)
```

### Các bảng đã tạo

| Table | Fields | Status |
|-------|--------|--------|
| `FgReverseProxyRules` | Id, Source, DestinationScheme, DestinationHost, DestinationPort, CertificateId (FK), Access, AccessPolicyId (FK), WebSocketsSupport, CacheAssets, ForceSsl, Http2Support, HstsEnabled, HstsSubdomains, TrustForwardedProtoHeaders, AdditionalHeadersJson, Status, CreatedAt, UpdatedAt | ✅ |
| `FgCertificates` | Id, Domain, Issuer, Type, PrivateKeyEncrypted, CertificateChain, ExpiresAt, AutoRenew, CreatedAt | ✅ |
| `FgAccessPolicies` | Id, Name, Type, RulesJson, CreatedAt | ✅ |
| `FgReverseProxyLocations` | Id, RuleId (FK), Path, Scheme, ForwardHost, ForwardPort (Cascade delete) | ✅ |

### ReverseProxyRule fields

| Field | Type | Ghi chú | Status |
|-------|------|---------|--------|
| `DestinationScheme` | string | "http"/"https" | ✅ |
| `DestinationHost` | string | host: tách từ Destination cũ | ✅ |
| `DestinationPort` | int | port: tách từ Destination cũ | ✅ |
| `WebSocketsSupport` | bool | WebSocket upgrade (mặc định true) | ✅ |
| `CacheAssets` | bool | Cache static assets | ✅ |
| `ForceSsl` | bool | Redirect HTTP→HTTPS | ✅ |
| `Http2Support` | bool | HTTP/2 to backend | ✅ |
| `HstsEnabled` | bool | HSTS header | ✅ |
| `HstsSubdomains` | bool | includeSubDomains | ✅ |
| `TrustForwardedProtoHeaders` | bool | Per-rule trust X-Forwarded-Proto (khác TrustedProxyMiddleware global) | ✅ |
| `AdditionalHeadersJson` | string? | YARP transforms escape hatch | ✅ |
| `BlockCommonExploits` | bool | WAF rule-set cơ bản | ✅ |

## YARP Transforms (2 layers)

Layer 1 — **TrustedProxyMiddleware (global)**: xử lý X-Forwarded-* từ request bên ngoài vào Frontgate, whitelist IP-based.

Layer 2 — **YARP built-in transforms**: tự động forward X-Forwarded-*, X-Real-IP header khi gửi request từ Frontgate tới backend addon. Có thể kiểm soát per-rule qua `AdditionalHeadersJson` field.

Không có "raw custom config" kiểu Nginx — đây là design decision bảo mật, thay bằng structured transforms + escape hatch có kiểm soát.

### YARP Feature Implementation Notes

Tất cả các flag đều implement được bằng C#/YARP, không cần Nginx hay config bên ngoài:

| Flag | Implementation Approach |
|------|----------------------|
| **WebSocketsSupport** | YARP built-in — tự động xử lý upgrade request, chỉ cần không disable |
| **ForceSsl** | Middleware trước `MapReverseProxy()` — check `HttpContext.Request.Scheme`, redirect 301 nếu không phải HTTPS |
| **CacheAssets** | YARP transform: `ResponseHeaderAppendTransform("Cache-Control", "public, max-age=86400")` kết hợp path condition |
| **Http2Support** | YARP cluster config — dùng `HttpVersionPolicy.RequestVersionOrHigher`, tự động fallback nếu backend không hỗ trợ |
| **HstsEnabled / HstsSubdomains** | Middleware hoặc YARP transform — thêm header `Strict-Transport-Security: max-age=31536000` (+ `includeSubDomains`) per-rule |
| **TrustForwardedProtoHeaders** | YARP mặc định tự động thêm `X-Forwarded-*` headers. Có thể disable transform per-route nếu backend không tin cậy |
| **BlockCommonExploits** | Middleware inspect request trước YARP — Regex pattern cho SQL injection, XSS, path traversal → 403 nếu khớp |

### Enums
- `ProxyAccessMode`: Public, Private, Restricted, BasicAuth
- `ProxyRuleStatus`: Inactive, Active, Error
- `CertificateType`: Rsa, Ecdsa
- `AccessPolicyType`: IpAllowlist, GeoBlock, BasicAuth

## Current Status

### ✅ Implemented (Phase 0 — Foundation)
- [x] **Backend models**: FgReverseProxyRule, FgCertificate, FgAccessPolicy (`Namorix.Server.Models`)
- [x] **Migration**: `AddFgTables` — creates all 3 Fg_ tables with FKs + indexes
- [x] **AppDbContext**: relationships (Certificate 1:n, AccessPolicy 1:n, SetNull delete)
- [x] **apiRoutes**: `ApiFrontgateRoutes` (`/api/frontgate/reverse-proxy`)
- [x] **Frontend controller**: `frontgateController.listRules()` with pagination
- [x] **Backend controller**: `FrontgateController.ListRules` (GET, RequireAdmin, paginated)
- [x] **FrontgateReverseProxy UI**: NmxDataTable list, pagination, detail dialog, add dialog form
- [x] **NmxFormField**: `inline` prop added
- [x] **form.scss**: `.nmx-form-field--inline` style (flex-row, align-center)
- [x] **TrustedProxyMiddleware**: notification to admin when untrusted proxy blocked (SemaphoreSlim)

### ✅ Completed (Phase 0.5 — Schema hoàn thiện)
- [x] **Tách Destination**: `Destination` (string) → `DestinationScheme` + `DestinationHost` + `DestinationPort`
- [x] **Thêm fields**: WebSocketsSupport, CacheAssets, ForceSsl, Http2Support, HstsEnabled, HstsSubdomains, TrustForwardedProtoHeaders, AdditionalHeadersJson
- [x] **FgReverseProxyLocation model**: bảng con cho path-based sub-routing (Cascade delete)
- [x] **Migration**: `UpdateFgReverseProxyRule` — schema update
- [x] **Frontend interface**: cập nhật ReverseProxyRule trong frontgate.controller.ts

### 🔜 Phase 1 — Core Proxy
- [x] **FrontgateProxyConfigProvider**: `IProxyConfigProvider` đọc active rules từ DB, build clusters/routes với YARP transforms
- [x] **YARP DI registration**: `AddSingleton<FrontgateProxyConfigProvider>()`, `AddReverseProxy()`, singleton `IProxyConfigProvider`
- [x] **MapReverseProxy()**: `configureEndpoints` callback trong `UseNamorixCore`, Server register `endpoints.MapReverseProxy()` mà không cần Core reference YARP
- [x] **Frontgate CRUD API**: Create (POST), Read (GET list), Update (PUT), Delete (DELETE) — tất cả gọi `UpdateAsync()` sau khi save
- [x] **Frontend controller**: `createRule`, `updateRule`, `deleteRule` + `CreateReverseProxyRulePayload`
- [x] **NmxTabs component**: generic tab bar với controlled/uncontrolled pattern
- [x] **NmxFormRow**: flex row component cho form layout
- [x] **NmxFormField.rowFlex**: prop để set flex trong row
- [x] **NmxAlertDialog.flush** (`noSpacingBody`): tắt padding body dialog
- [x] **NmxAlertDialog.extraAction**: thêm `extraActionLabel` + `onExtraAction` cho nút phụ bên trái footer
- [x] **NmxSelect Floating UI migration**: chuyển từ native `<select>` sang custom div-based dropdown với `@floating-ui/react` (`useFloating`, `FloatingPortal`, `useClick`, `useDismiss`, `useListNavigation`), `renderOption` prop, keyboard nav
- [x] **NmxKeyValueEditor component**: key-value pair editor dạng bảng (Name + Value header, delete row), SCSS trong `@namorix/styles`
- [x] **Add dialog UI**: 4 tabs (General/Headers/Locations/Advanced), reset form, destination row layout
- [x] **General tab**: Source, Destination row, Certificate (None + Request new), Status, Force SSL
- [x] **Advanced tab**: gộp Features (WebSockets, Cache Assets, HTTP/2) + Security (HSTS + Subdomains, Trust Forwarded Proto, Block Common Exploits, Access select)
- [x] **Headers tab**: NmxKeyValueEditor với empty state, nút Add Header qua `extraAction` của dialog
- [x] **Status field**: formStatus state + statusOptions select (General tab)
- [x] **Certificate selector**: options gồm None + Request a new Certificate + real certs từ API
- [x] **BlockCommonExploits field**: thêm model, migration, API, frontend interface
- [x] **Certificate API**: `GET /api/frontgate/certificates` + `CertificateItem` interface + `listCertificates()`
- [x] **i18n keys**: `certificate`, `certificatePlaceholder`, `certificateNone`, `certificateRequestNew`, `trustForwardedProto`, `headerName`, `headerValue`, `additionalHeaders`, `statusOptions`, `accessOptions`, `addHeader`, `emptyHeaders`, `headers`, `locations`, `addLocation`, `emptyLocations`
- [x] **Locations CRUD API**: backend xử lý `Locations` list trong CreateRule/UpdateRule, xóa cũ + thêm mới, Cascade delete
- [x] **Locations UI**: card-based sub-routing editor (path + delete row, scheme/host/port row) trong Locations tab riêng
- [x] **Additional Headers YARP transform**: backend deserial `AdditionalHeadersJson` + thêm RequestHeader transforms trong `FrontgateProxyConfigProvider`
- [ ] **Form submit + validation**: `onConfirm` gọi `frontgateController.createRule()` với form data, client-side validation, error display
- [ ] **Edit dialog**: pre-filled form + `editingRule` state, gọi `frontgateController.updateRule()`
- [ ] **Delete with confirmation**: nút delete + confirmation dialog
- [ ] **ForceSsl redirect middleware**: middleware check per-rule ForceSsl, redirect 301 HTTP→HTTPS trước MapReverseProxy
### 🔜 Phase 2 — Certificate Management

Thư viện ACME: **Certes** (`Certes` NuGet) — giao tiếp với Let's Encrypt, xử lý HTTP-01/DNS-01 challenge, tự động cấp và renew cert.

- [ ] Let's Encrypt ACME integration (Certes — HTTP-01 / DNS-01 challenge)
- [ ] Wildcard cert support (DNS-01 bắt buộc cho `*.namorix.local`)
- [ ] Auto-renew worker (`IHostedService`)
- [ ] Kestrel SNI certificate binding (ServerOptionsSelectionCallback)
- [ ] Frontgate UI: Certificate tab (list, add, delete)

### 🔜 Phase 3 — Access Control
- [ ] IP Allowlist/Denylist (qua AccessPolicy)
- [ ] Geo-block via MaxMind GeoIP2 .NET
- [ ] HTTP Basic Auth
- [ ] **Self-lockout prevention**: simulate request từ admin IP trước khi save, chặn nếu rule mới khóa mất admin
- [ ] **Dry-run mode**: apply rule set tạm thời, tự rollback sau N giây nếu admin không confirm
- [ ] Frontgate UI: Access tab (manage policies)

### 🔜 Phase 4 — Advanced Features
- [ ] TCP/UDP Stream forwarding (non-HTTP addon)
- [ ] Redirection Hosts (301/302)
- [ ] 404 Default Host
- [ ] Custom Error Pages (502/503 per rule)
- [ ] Audit log (ai sửa rule gì, lúc nào)
- [ ] 2FA (TOTP) cho Frontgate admin

### 🔜 Phase 5 — Edge Cases
- [ ] Docker addon expose port tự động update rule
- [ ] Rate limiting per rule
- [ ] Health check backend per rule
- [ ] Metrics + real-time traffic stats
