# Namorix Backend

ASP.NET Core 10 API server for the Namorix desktop shell. Handles authentication, OAuth2 authorization server, addon Docker lifecycle, gRPC bidirectional streaming, SignalR realtime events, flat file storage for traffic/logs, and security middleware.

## Tech Stack

| Component | Technology |
|-----------|------------|
| Runtime | .NET 10 |
| Framework | ASP.NET Core 10 |
| ORM | Entity Framework Core |
| Database | SQLite |
| JWT | System.IdentityModel.Tokens.Jwt |
| Password | BCrypt.Net-Next |
| Realtime | SignalR |
| Server-to-server | gRPC (bidirectional streaming) |
| Docker | Docker.DotNet |
| Addon protocol | Module Federation (widget), OAuth2 standalone (full app) |

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

Server runs at `http://localhost:5001` (REST API + SignalR) and `http://localhost:5002` (gRPC).

## Project Structure

```
backend/
├── Makefile                          # Build/EF shortcuts
├── Namorix.sln                       # Solution file
├── Directory.Build.props             # Shared build properties
├── Directory.Packages.props          # Centralized package management
└── src/
    ├── Namorix.Core/                 # Shared infrastructure (class library)
    │   ├── Attributes/
    │   │   └── TrafficMonitorAttribute.cs
    │   ├── Config/
    │   │   ├── AppConfig.cs          # Root config (CsrfEnabled, SecureCookie, AllowedOrigins)
    │   │   ├── BackendConfig.cs      # Backend port, container/network name, registration token TTL
    │   │   ├── JwtConfig.cs          # JWT settings (Secret, Issuer, Audience, expiration)
    │   │   └── AddonCatalogConfig.cs # Catalog URL, TTL, sync interval
    │   ├── Constants/
    │   │   ├── Auth.cs               # AuthConstraints (username/password/email/name rules)
    │   │   ├── Cookie.cs             # Cookie names
    │   │   ├── Docker.cs             # Docker event/state/filter constants + labels
    │   │   ├── Error.cs              # Error codes (Http, Auth, Middleware, Validation, Addon, OAuth)
    │   │   ├── ExemptPaths.cs        # Middleware bypass paths for OAuth
    │   │   ├── Http.cs               # HttpContextKeys
    │   │   ├── HttpHeaders.cs        # Header names
    │   │   ├── Jwt.cs                # JWT claims
    │   │   ├── Log.cs                # Log level constants
    │   │   ├── Notification.cs       # Notification type keys
    │   │   ├── OAuth.cs              # OAuth grant types, env vars, defaults
    │   │   ├── Settings.cs           # SettingKeys, AppearanceSettingKeys, AppearanceDefaults
    │   │   ├── SignalR.cs            # SignalR hub routes, event names
    │   │   ├── Time.cs               # Time constants
    │   │   ├── User.cs               # Role constants
    │   │   └── Validation.cs         # ValidationMeta
    │   ├── Controllers/
    │   │   ├── LogController.cs      # Log query with level/source filters, pagination
    │   │   └── TrafficMonitorController.cs  # Traffic stats query
    │   ├── Data/
    │   │   └── AppearanceOptionsData.cs  # Static valid appearance options
    │   ├── Exceptions/
    │   │   └── AuthException.cs      # Custom exception with error code
    │   ├── Extensions/
    │   │   ├── ApplicationBuilderExtensions.cs  # Core middleware pipeline wrapper
    │   │   └── ServiceCollectionExtensions.cs   # DI registration + DbContext + SignalR + CSRF + ValidationFilter
    │   ├── Filters/
    │   │   ├── TrafficLogFilter.cs
    │   │   ├── TrafficLogFilterParser.cs
    │   │   ├── TrafficMonitorFilter.cs
    │   │   └── ValidationFilter.cs   # Global action filter replacing auto-400 model binding
    │   ├── FlatFile/
    │   │   ├── FlatFileOptions.cs
    │   │   ├── FlatFileStore.cs      # Rotating flat file storage engine
    │   │   ├── IFlatFileSerializer.cs
    │   │   ├── IFlatFileStore.cs
    │   │   ├── LogEntrySerializer.cs
    │   │   └── TrafficLogSerializer.cs
    │   ├── Grpc/
    │   │   ├── AddonChannelClient.cs             # gRPC client with OAuth2 token + duplex stream
    │   │   ├── AddonChannelClientExtensions.cs   # DI registration for gRPC client
    │   │   └── RetryConnectHostedService.cs      # Auto-reconnect base class
    │   ├── Helpers/
    │   │   └── NetworkHelper.cs
    │   ├── Hubs/
    │   │   ├── HubContextExtensions.cs
    │   │   ├── NmxHub.cs             # Base SignalR hub
    │   │   ├── NmxHubFilter.cs       # Hub connection filter (auth + error handling)
    │   │   ├── SignalRLogNotifier.cs
    │   │   ├── SignalRNotificationNotifier.cs
    │   │   ├── SignalRSystemNotifier.cs
    │   │   ├── SignalRTrafficNotifier.cs
    │   │   └── SignalRUserSettingsNotifier.cs
    │   ├── Infrastructure/
    │   │   ├── CountingStream.cs
    │   │   ├── ILogNotifier.cs
    │   │   ├── INotificationNotifier.cs
    │   │   ├── ISystemNotifier.cs
    │   │   ├── ITrafficNotifier.cs
    │   │   ├── IUserSettingsNotifier.cs
    │   │   ├── LogBuffer.cs
    │   │   ├── SignalREvents.cs
    │   │   └── TrafficBuffer.cs
    │   ├── IO/
    │   │   └── DataDirectory.cs
    │   ├── Logger/
    │   │   ├── FileLogger.cs
    │   │   └── FileLoggerProvider.cs
    │   ├── Middleware/
    │   │   ├── CsrfMiddleware.cs           # Double-submit CSRF protection
    │   │   ├── ExceptionMiddleware.cs      # Global exception handler
    │   │   ├── JsonErrorMiddleware.cs      # Consistent JSON error responses
    │   │   ├── NotFoundMiddleware.cs       # Catch-all 404 handler
    │   │   ├── RequireAdminAttribute.cs
    │   │   ├── RequireAuthAttribute.cs
    │   │   └── SecurityHeadersMiddleware.cs
    │   ├── Models/
    │   │   ├── AddonInstallation.cs    # Installed addon (Docker container reference)
    │   │   ├── Notification.cs         # Notification entity (i18n key + params)
    │   │   ├── OAuthAuthorizationCode.cs  # PKCE authorization code
    │   │   ├── OAuthRegistration.cs    # Addon self-registration token
    │   │   ├── OAuthToken.cs           # Issued OAuth token
    │   │   ├── Permission.cs
    │   │   ├── RefreshToken.cs         # Refresh token entity
    │   │   ├── Setting.cs              # Key-value settings entity
    │   │   ├── ThemeManifest.cs        # Theme metadata (name, css, tags, isBuiltIn)
    │   │   ├── User.cs                 # User entity (includes ThemeId)
    │   │   ├── UserPermission.cs
    │   │   └── UserSetting.cs          # Per-user appearance settings
    │   ├── OAuth/
    │   │   ├── NmxAddonConfig.cs            # Addon-side env var config
    │   │   ├── NmxOAuth2Client.cs           # Addon self-registration + token caching
    │   │   ├── NmxOAuth2ServiceCollectionExtensions.cs  # DI extension
    │   │   ├── OAuthResponse.cs             # Token/error response DTOs
    │   │   ├── OAuthEndpoints.cs            # Endpoint URL constants
    │   │   └── NmxOAuthException.cs
    │   ├── Protos/
    │   │   └── addon_channel.proto          # gRPC bidirectional streaming definition
    │   ├── Responses/
    │   │   └── ApiResponse.cs               # Typed ApiResponse<T>
    │   ├── Services/
    │   │   ├── LogService.cs                # Flat file log query service
    │   │   └── TrafficMonitorService.cs     # Traffic data collection + aggregation
    │   ├── Validation/
    │   │   ├── IValidationSchema.cs
    │   │   ├── ValidateAttribute.cs
    │   │   ├── ValidationRule.cs
    │   │   └── Schemas/
    │   │       ├── LoginSchema.cs
    │   │       ├── RegisterSchema.cs
    │   │       ├── ChangePasswordSchema.cs
    │   │       ├── SetSettingsSchema.cs     # Appearance settings DTO + validation
    │   │       └── UpdateProfileSchema.cs
    │   └── Workers/
    │       ├── LogCleanupWorker.cs
    │       ├── LogFlushWorker.cs
    │       ├── TrafficCleanupWorker.cs
    │       ├── TrafficFlushWorker.cs
    │       └── TrafficStatsWorker.cs
    └── Namorix.Server/               # Web app — Persistence + Services + API + Workers
        ├── Program.cs                # App startup, Kestrel config (2 ports), DI, middleware
        ├── Persistence/
        │   └── AppDbContext.cs       # EF Core DbContext
        ├── Migrations/               # EF Core migrations
        ├── Constants/
        │   ├── Addon.cs              # Addon task phase constants, error codes
        │   ├── Beacon.cs             # Beacon codes (BcnErrorCodes/BcnActivityCodes/BcnParam/BcnCredentialParam/BcnHttpClientNames/BcnHeaderKey)
        │   ├── Frontgate.cs          # Frontgate error codes (FgErrorCodes)
        │   ├── Warden.cs             # Warden codes (WdErrorCodes/WdEventTypes/WdSecurityProfile/WdThresholdFactors/WdThresholdRules)
        │   └── ServerSignalR.cs      # Server-specific SignalR event names + groups (incl. beacon, frontgate, warden)
        ├── Extensions/
        │   └── ApplicationBuilderExtensions.cs  # Server middleware pipeline wrapper
        ├── Middleware/
        │   ├── AuthMiddleware.cs         # Session validation
        │   ├── OAuth2Middleware.cs       # OAuth bearer token validation (private_key_jwt)
        │   ├── RequirePermissionAttribute.cs
        │   ├── TrustedProxyMiddleware.cs
        │   └── Frontgate/
        │       ├── ForceSslMiddleware.cs             # HTTP → HTTPS redirect trên proxy port
        │       ├── AcmeChallengeMiddleware.cs        # Serve .well-known/acme-challenge token (LE HTTP-01)
        │       ├── AccessControlMiddleware.cs        # Access policy enforcement (IP allow/deny, Geo, BasicAuth)
        │       ├── BlockCommonExploitsMiddleware.cs  # Block common exploit signatures
        │       ├── BlockWebSocketMiddleware.cs       # Block WebSocket upgrades theo policy
        │       ├── HstsMiddleware.cs                 # Strict-Transport-Security header
        │       ├── ProxyTrafficMiddleware.cs         # Proxy traffic metrics (source = Proxy)
        │       ├── RateLimitMiddleware.cs            # Per-rule rate limiting trên proxy port
        │       └── RewriteRedirectLocationMiddleware.cs  # Rewrite Location header trên proxy redirect
        ├── Hubs/
        │   ├── MainHub.cs               # Real-time events (system stats, addon, notifications, beacon, frontgate, warden groups)
        │   ├── SignalRAddonNotifier.cs
        │   ├── SignalRSystemMonitorNotifier.cs
        │   ├── SignalRBeaconNotifier.cs # IBeaconNotifier (activity-created / hostname-status-changed / refreshed / hostname-changed)
        │   ├── SignalRFrontgateNotifier.cs # IFrontgateNotifier (cert-status-changed / rule-changed / dry-run-changed / cert-changed, group frontgate)
        │   └── SignalRWardenNotifier.cs # IWardenNotifier (new-event → group warden)
        ├── Infrastructure/
        │   ├── IAddonNotifier.cs
        │   ├── ISystemMonitorNotifier.cs
        │   ├── IFrontgateNotifier.cs   # Frontgate notifier (cert status, rule/dry-run/cert changed)
        │   ├── IWardenNotifier.cs      # Warden notifier (new-event)
        │   └── IHeraldNotifier.cs      # Warden Herald notifications (ruleApplied/ruleRemoved — scoped, resolve từ singleton qua IServiceScopeFactory)
        ├── Models/                  # Grouped theo addon domain
        │   ├── Addon/               # AddonCatalogEntry, AddonInstallation, AddonTask
        │   ├── Beacon/              # BcnHostname, BcnSettings, BcnActivityLog, BcnProviderConfig, BcnProviderInfo
        │   ├── Frontgate/           # FgReverseProxyRule, FgCertificate(+Domain), FgAccessPolicy, FgReverseProxyLocation, FgAuditLog, FgRuleSnapshot (runtime — dry-run rollback)
        │   ├── Warden/              # WdFirewallRule, WdSecurityEvent, WdSettings
        │   └── Catalog/             # Catalog DTOs (AddonManifestDto, CatalogIndex, PortDto)
        ├── Services/
        │   ├── AuthService.cs               # Login, Register, RefreshToken, RevokeToken, VerifyAccessToken
        │   ├── PermissionService.cs         # User permission management
        │   ├── SettingsService.cs       # System settings, appearance defaults, trusted proxies
        │   ├── UserSettingsService.cs   # User appearance settings (IMemoryCache)
        │   ├── ThemeService.cs          # Built-in theme list
        │   ├── NotificationService.cs   # Notification CRUD, pagination, SignalR push
        │   ├── UserService.cs           # User CRUD (email, name, password)
        │   ├── DockerService.cs         # Docker containers, images, networks via Unix socket
        │   ├── AddonService.cs          # Addon installation CRUD
        │   ├── AddonTaskQueue.cs        # Channel-based task queue for addon operations
        │   ├── AddonTaskExecutor.cs     # Start/Stop/Uninstall with Docker calls + status updates
        │   ├── CatalogService.cs        # Catalog index fetch + manifest sync + TTL caching
        │   ├── OAuthService.cs          # OAuth2 authorization server (authorization_code + PKCE, client_credentials + private_key_jwt)
        │   ├── AddonChannelManager.cs   # gRPC channel connection tracking (ConcurrentDictionary)
        │   ├── PublicIpService.cs       # Public IP detection (auto/ipify.org) — shared Beacon/Frontgate
        │   ├── Beacon/                  # DDNS — BcnHostnameService (update logic), BcnUpdateQueue, BcnProbeQueue,
        │   │                            #   Providers/ (6 built-in + custom get/rest, resolver, secret protector, DNS resolver)
        │   ├── Frontgate/               # FrontgateProxyConfigProvider (YARP), AcmeCertQueue (LE worker),
        │   │                            #   AcmeChallengeStore, AcmeDryRunService, DnsLookupChecker,
        │   │                            #   FrontgateAccessService (access policy eval), GeoIpService (MaxMind.GeoIP2),
        │   │                            #   FrontgateAudit (audit log write + push), SniCertProvider (SNI cert lookup)
        │   ├── Warden/                  # WdFirewallService (iptables/nftables enforcement + Herald), WdEventService (publish WdSecurityEvent + notify),
        │   │                            #   HeraldNotifier (ruleApplied/ruleRemoved admin notifications)
        │   └── Grpc/
        │       └── AddonChannelService.cs  # gRPC bidirectional stream handler + interceptor auth
        ├── Controllers/
        │   ├── AuthController.cs        # 7 auth endpoints (login, register, logout, session, refresh, status, logout-all)
        │   ├── Frontgate/               # ReverseProxyController (CRUD + dry-run confirm/cancel),
        │   │                            #   AccessPolicyController (CRUD), CertificateController (LE HTTP-01 + dry-run, retry/renew, custom, download),
        │   │                            #   AuditLogController (audit list/clear), GeoIpController (GeoIP DB status/upload/rollback)
        │   ├── Warden/                  # WdController (rules CRUD/toggle + settings + stats), WdEventController (events list filter IP/type/severity + clear)
        │   ├── BcnController.cs         # Beacon DDNS (hostnames CRUD/toggle/check/test, activity, providers, settings)
        │   ├── HealthController.cs      # Health check endpoint
        │   ├── SettingsController.cs    # System settings + appearance defaults + options
        │   ├── ThemeController.cs       # Theme list
        │   ├── UserController.cs        # Profile, password, settings (all validated)
        │   ├── PermissionController.cs  # User permission management
        │   ├── UserPermissionController.cs
        │   ├── NotificationController.cs  # Notification list, unread, mark read, delete
        │   ├── OAuthController.cs       # OAuth2 endpoints (authorize, token, refresh, revoke)
        │   └── AddonController.cs       # Addon install/start/stop/uninstall/list/catalog
        └── Workers/
            ├── TokenCleanupWorker.cs            # Cleans expired tokens every 24h
            ├── LogCleanupWorker.cs               # Cleans old log files
            ├── SystemMonitorStatsWorker.cs       # System metrics collection (CPU, memory, disk, IO, network)
            ├── DockerMonitorWorker.cs             # Docker event stream + container health checks + orphan cleanup
            ├── CatalogSyncWorker.cs               # Background catalog sync with retry
            ├── Beacon/                           # BcnCheckWorker (DDNS loop → BcnHostnameService),
            │                                     #   BcnActivityCleanupWorker (activity pruning)
            ├── Frontgate/                        # FgCertPendingResetWorker (Pending → Error on startup),
            │                                     #   FgCertRenewWorker (auto-renew), FgDryRunRollbackWorker (dry-run rollback),
            │                                     #   FgAuditCleanupWorker (audit pruning), FgBackendHealthWorker (upstream health)
            └── Warden/                           # WdThresholdWorker (auto-ban theo security profile), WdBanCleanupWorker (gỡ ban hết hạn)
```

## API Endpoints

### Auth (`/api/auth`)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/login` | Login with username + password. Body: `{ username, password, rememberMe? }` |
| POST | `/api/auth/register` | Register new user. Body: `{ username, password, email, name }` |
| POST | `/api/auth/logout` | Clear cookies, revoke refresh token |
| POST | `/api/auth/logout-all` | Revoke all refresh tokens for current user |
| GET | `/api/auth/session` | Validate access token, return user info |
| POST | `/api/auth/refresh` | Rotate tokens (fingerprint + IP check) |
| GET | `/api/auth/status` | Return `{ needsRegister, registerEnabled }` |

### Settings (`/api/settings`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/settings/system` | Admin | System config (proxies, origins, register) |
| PUT | `/api/settings/system` | Admin | Set system config |
| GET | `/api/settings/appearance` | Public | System default appearance settings |
| GET | `/api/settings/appearance/merged` | Public | Merged appearance (defaults + user overrides, userId from cookie) |
| PUT | `/api/settings/appearance` | Admin | Set system default appearance (validated) |
| GET | `/api/settings/appearance/options` | RequireAuth | Valid appearance options (accent colors, etc.) |

### User (`/api/user`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/user/settings` | RequireAuth | Get user's appearance settings |
| PUT | `/api/user/settings` | RequireAuth | Save user appearance settings (validated) |
| PUT | `/api/user/profile` | RequireAuth | Update email + name (validated) |
| PUT | `/api/user/password` | RequireAuth | Change password |

### Notification (`/api/notifications`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/notifications` | RequireAuth | List notifications (paginated: `page`, `pageSize`) |
| GET | `/api/notifications/unread-count` | RequireAuth | Get unread notification count |
| POST | `/api/notifications/{id}/read` | RequireAuth | Mark notification as read |
| POST | `/api/notifications/read-all` | RequireAuth | Mark all as read |
| DELETE | `/api/notifications/{id}` | RequireAuth | Delete a notification |

### Permission (`/api/permission`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/permission/user/{userId}` | RequireAuth | Get permissions for a user |
| PUT | `/api/permission/user/{userId}` | RequireAuth | Set user permissions |

### OAuth (`/api/oauth`) — Authorization Server

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/oauth/authorize` | Authorize endpoint (PKCE + session check + login redirect) |
| POST | `/api/oauth/token` | Token endpoint (authorization_code + PKCE + client_credentials) |
| POST | `/api/oauth/token/refresh` | Refresh addon token via cookie rotation |
| POST | `/api/oauth/revoke` | Revoke OAuth token + disconnect gRPC channel |

### Addon (`/api/addon`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/addon` | RequireAuth | List installed addons |
| POST | `/api/addon/install` | RequireAuth | Install addon from Docker image |
| POST | `/api/addon/{id}/start` | RequireAuth | Start addon container |
| POST | `/api/addon/{id}/stop` | RequireAuth | Stop addon container |
| POST | `/api/addon/{id}/remove` | RequireAuth | Uninstall addon |
| GET | `/api/addon/catalog` | RequireAuth | Get cached addon catalog |
| POST | `/api/addon/catalog/sync` | RequireAuth | Refresh catalog from remote |

### Health (`/api/health`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check |

### Frontgate (`/api/frontgate`) — Reverse Proxy

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/frontgate/reverse-proxy` | Admin | List reverse proxy rules (paginated: `page`, `pageSize`) |
| POST | `/api/frontgate/reverse-proxy` | Admin | Create rule (source, destination, features, access; dry-run với `DryRun` + `DryRunMinutes` 1/5/10) |
| PUT | `/api/frontgate/reverse-proxy/{id}` | Admin | Update rule, triggers YARP runtime reload |
| DELETE | `/api/frontgate/reverse-proxy/{id}` | Admin | Delete rule, triggers YARP runtime reload |
| POST | `/api/frontgate/reverse-proxy/{id}/dry-run/confirm` | Admin | Xác nhận dry-run rule (giữ nguyên Active) |
| POST | `/api/frontgate/reverse-proxy/{id}/dry-run/cancel` | Admin | Hủy dry-run rule (rollback snapshot qua `FgRuleSnapshot`) |

### Frontgate Access Policies (`/api/frontgate/access-policies`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/frontgate/access-policies` | Admin | List access policies (ipAllowlist/geoBlock/basicAuth/ipDenylist) |
| POST | `/api/frontgate/access-policies` | Admin | Create policy (rules = CIDR / ISO codes / `{username,password}` cho basicAuth) |
| PUT | `/api/frontgate/access-policies/{id}` | Admin | Update policy (giữ hash cũ khi password trống) |
| DELETE | `/api/frontgate/access-policies/{id}` | Admin | Delete policy (lỗi `PolicyInUse` nếu đang được rule dùng) |

### Frontgate Certificates (`/api/frontgate/certificates`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/frontgate/certificates` | Admin | List certificates (paginated) |
| GET | `/api/frontgate/certificates/all` | Admin | All certificates (flat) |
| POST | `/api/frontgate/certificates/letsencrypt-http` | Admin | Create LE HTTP-01 cert (async queue, SignalR push) |
| POST | `/api/frontgate/certificates/letsencrypt-http/dry-run` | Admin | Test HTTP-01 challenge (staging, không phát hành cert) |
| POST | `/api/frontgate/certificates/custom` | Admin | Upload custom PEM cert |
| POST | `/api/frontgate/certificates/{id}/retry` | Admin | Retry cert ở trạng thái Pending/Error |
| POST | `/api/frontgate/certificates/{id}/renew` | Admin | Renew cert (SNI lookup + auto-renew qua `FgCertRenewWorker`) |
| GET | `/api/frontgate/certificates/{id}/download` | Admin | Download cert — zip `privatekey.pem` + `fullchain.pem` (`{name}.zip`; 404 `CertificateFilesMissing` nếu file thiếu) |
| DELETE | `/api/frontgate/certificates/{id}` | Admin | Delete cert |

### Frontgate GeoIP (`/api/frontgate/geoip`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/frontgate/geoip` | Admin | GeoIP DB status (file size, database type, build epoch, binary format version + backup meta: `hasBackup`, backup size/type/epoch) |
| POST | `/api/frontgate/geoip` | Admin | Upload MaxMind GeoIP2 `.mmdb` (`[RequestSizeLimit(50MB)]`) — probe-validate rồi backup hiện tại thành `.bak` + overwrite |
| POST | `/api/frontgate/geoip/rollback` | Admin | Rollback `.bak` về bản trước — copy back + **xóa `.bak`** (consumed — nút rollback ẩn sau khi dùng) |

### Frontgate Audit (`/api/frontgate/audit`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/frontgate/audit` | Admin | List audit log (paginated: `page`, `size`, filter `targetType`/`targetId`) |
| DELETE | `/api/frontgate/audit` | Admin | Clear audit log (ghi lại sự kiện AuditCleared) |

### Beacon (`/api/beacon`) — DDNS Updater

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/beacon/hostnames` | Admin | List hostnames (paginated) |
| POST | `/api/beacon/hostnames` | Admin | Create hostname (update-on-save qua `BcnUpdateQueue`) |
| PUT | `/api/beacon/hostnames/{id}` | Admin | Update hostname |
| DELETE | `/api/beacon/hostnames/{id}` | Admin | Delete hostname |
| POST | `/api/beacon/hostnames/{id}/toggle` | Admin | Enable/Disable (enable chạy update) |
| POST | `/api/beacon/hostnames/{id}/check` | Admin | Manual retry/update (force) |
| POST | `/api/beacon/hostnames/test` | Admin | Test provider config (update thật bằng IP hiện tại) |
| GET | `/api/beacon/activity` | Admin | Activity log (paginated) |
| DELETE | `/api/beacon/activity` | Admin | Clear activity log |
| GET | `/api/beacon/providers` | Admin | Provider catalog |
| GET/PUT | `/api/beacon/settings` | Admin | DDNS settings (interval, heartbeat, IP service, IPv6) |
| GET | `/api/beacon/status` | Admin | Status summary (healthy count, last check) |
| POST | `/api/beacon/refresh` | Admin | Probe all hostnames (authoritative DNS) |

### Warden (`/api/warden`) — Host-level Firewall

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/warden/rules` | Admin | List firewall rules |
| POST | `/api/warden/rules` | Admin | Create rule (name, sourceCidr, ports, protocol, action, enabled) |
| PUT | `/api/warden/rules/{id}` | Admin | Update rule |
| DELETE | `/api/warden/rules/{id}` | Admin | Delete rule |
| POST | `/api/warden/rules/{id}/toggle` | Admin | Enable/Disable rule |
| GET/PUT | `/api/warden/settings` | Admin | Firewall settings (firewallEnabled, securityProfile, customThresholdFactor, customDurationFactor) |
| GET | `/api/warden/stats` | Admin | Stats (activeRules, blockedToday, openPorts) |
| GET | `/api/warden/events` | Admin | Security events (paginated, filter IP/type/severity) |
| DELETE | `/api/warden/events` | Admin | Clear all security events (returns `{ deleted }`) |

> All endpoints except health, login, register, status, and some OAuth paths require authentication.

## Middleware Pipeline

Thứ tự middleware trong `Program.cs` (Kestrel 2-port: REST API + SignalR on 5001, gRPC on 5002):

### REST Pipeline (port 5001)
```
CORS → SecurityHeaders → TrustedProxy → Routing → CSRF → JsonError → Exception → **YARP Reverse Proxy** → Controllers
```

- **CORS**: Allow any origin + credentials (dev). `AllowedOrigins` from config + DB for production.
- **SecurityHeaders**: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `X-XSS-Protection: 1; mode=block`, `Referrer-Policy: strict-origin-when-cross-origin`.
- **TrustedProxy**: Chỉ trust `X-Forwarded-For` từ IP trong trusted list (Settings DB). Block untrusted proxy với 400.
- **CSRF**: Double-submit pattern — `nmx_csrf_token` cookie vs `X-CSRF-Token` header (disabled by default).
- **JsonErrorMiddleware + ExceptionMiddleware**: Convert errors to uniform JSON format.
- **ValidationFilter**: Global action filter — validates request body via schema attributes.
- **AuthMiddleware**: Session validation from HttpOnly cookies.
- **OAuth2Middleware**: Bearer token validation (private_key_jwt) for addon-to-server requests.

### gRPC Pipeline (port 5002)
```
gRPC → AddonChannelService → AddonChannelManager
```

## OAuth2 Authorization Server

Namorix backend acts as a full OAuth2 authorization server supporting:

| Grant Type | Usage | Details |
|-----------|-------|---------|
| `authorization_code` + PKCE | Browser (standalone addon) | `S256` code challenge, session-based authorize, code exchange with `code_verifier` |
| `client_credentials` + `private_key_jwt` | Server-to-server (addon backend) | RS256 signed JWT client assertion, token caching |

Flow:
```
1. Browser → GET /api/oauth/authorize?client_id=&redirect_uri=&response_type=code&code_challenge=S256
2. Server validates session, creates authorization code → redirect to addon with ?code=
3. Addon → POST /api/oauth/token with code + code_verifier → receives access_token
4. Addon uses Bearer token for API requests (validated by OAuth2Middleware)
```

## Configuration

### `appsettings.json`

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Data Source=namorix.db"
  },
  "Jwt": {
    "Secret": "<your-secret>",
    "AccessTokenExpirationSeconds": 900,
    "RefreshTokenExpirationDays": 7
  }
}
```

### Environment Variables (override appsettings — `__` separator for hierarchy)

| Variable | Config Path | Default | Description |
|----------|-------------|---------|-------------|
| `JWT__Secret` | Jwt.Secret | (required) | JWT signing key |
| `JWT__AccessTokenExpirationSeconds` | Jwt.AccessTokenExpirationSeconds | 900 | Access token TTL |
| `JWT__RefreshTokenExpirationDays` | Jwt.RefreshTokenExpirationDays | 7 | Refresh token TTL |
| `JWT__RefreshTokenExpirationDaysRemember` | Jwt.RefreshTokenExpirationDaysRemember | 90 | Remember-me TTL |
| `JWT__Issuer` | Jwt.Issuer | `Namorix` | JWT issuer claim |
| `JWT__Audience` | Jwt.Audience | `Namorix` | JWT audience claim |
| `ConnectionStrings__DefaultConnection` | ConnectionStrings.DefaultConnection | `Data Source=namorix.db` | SQLite connection string |
| `AppConfig__CsrfEnabled` | AppConfig.CsrfEnabled | false | Enable CSRF protection |
| `AppConfig__SecureCookie` | AppConfig.SecureCookie | false | Set true for HTTPS |
| `AppConfig__AllowedOrigins` | AppConfig.AllowedOrigins | (empty) | Comma-separated CORS origins; empty = allow all |
| `Backend__Port` | Backend.Port | 5001 | Backend listen port |
| `Backend__ContainerName` | Backend.ContainerName | `namorix-server` | Docker container name |
| `Backend__NetworkName` | Backend.NetworkName | `namorix-net` | Docker network name |
| `Backend__RegistrationTokenTtlMinutes` | Backend.RegistrationTokenTtlMinutes | 60 | Addon registration token TTL |
| `AddonCatalog__CatalogUrl` | AddonCatalog.CatalogUrl | (see appsettings) | Catalog manifest URL |
| `AddonCatalog__TtlSeconds` | AddonCatalog.TtlSeconds | 3600 | Catalog cache TTL |
| `AddonCatalog__SyncIntervalSeconds` | AddonCatalog.SyncIntervalSeconds | 3600 | Catalog sync interval |
| `AddonCatalog__RetryDelaySeconds` | AddonCatalog.RetryDelaySeconds | 60 | Catalog sync retry delay |

## Database

SQLite database file (`namorix.db`), tạo tự động khi chạy migrations.

### Models

- **User** — `id`, `username`, `password`, `role`, `email`, `name`, `createdAt`
- **RefreshToken** — `jti`, `userId`, `tokenHash`, `userAgent`, `fingerprint`, `ipAddress`, `lastUsedAt`, `expiresAt`, `rememberMe`
- **Setting** — `id`, `key` (PK), `value` (JSON)
- **UserSetting** — `id`, `userId`, `key`, `value` (appearance settings per user)
- **Permission** — `id`, `name`, `description`
- **UserPermission** — `userId`, `permissionId`
- **ThemeManifest** — `id`, `name`, `version`, `author`, `description`, `preview`, `tags`, `isBuiltIn`
- **Notification** — `id`, `userId`, `type`, `key`, `params?`, `source?`, `icon?`, `occurrences`, `lastOccurredAt`, `isRead`, `createdAt`
- **AddonInstallation** — `id`, `addonId`, `name`, `description`, `icon`, `image`, `hostPort`, `containerId`, `status`, `version`, `author`, `ports`, `installedAt`
- **AddonCatalogEntry** — `id`, `addonId`, `name`, `description`, `version`, `author`, `image`, `ports`, `boot`, `minCoreVersion`, `manifestUrl`, `cachedAt`
- **AddonTask** — `id`, `addonId`, `taskType`, `status`, `createdAt`, `completedAt`
- **OAuthAuthorizationCode** — `id`, `code`, `clientId`, `userId`, `scope`, `redirectUri`, `codeChallenge`, `codeChallengeMethod`, `expiresAt`
- **OAuthToken** — `id`, `tokenId`, `clientId`, `userId`, `type`, `expiresAt`
- **OAuthRegistration** — `id`, `clientId`, `token`, `expiresAt`
- **OAuthRefreshToken** — `id`, `clientId`, `tokenHash`, `expiresAt`, `createdAt`, `used`
- **FgReverseProxyRule** — `id`, `source`, `destinationScheme`, `destinationHost`, `destinationPort`, `access`, `status`, `dryRunExpiresAt` (dry-run), SSL/feature flags (WebSocketsSupport, CacheAssets, ForceSsl, Http2Support, HstsEnabled, HstsSubdomains, BlockCommonExploits, TrustForwardedProtoHeaders, AdditionalHeadersJson), `CertificateId` (FK), `AccessPolicyId` (FK)
- **FgCertificate** — `id`, `issuer`, `type` (Rsa/Ecdsa), `source` (LetsEncryptHttp/Custom), `status` (Pending/Active/Error), `dnsProviderId` (unused — DNS-01 dropped), `expiresAt`, `autoRenew`; PEM lưu file-based `data/pki/certs/{name}/` (privkey.pem + fullchain.pem); `CertificateDomains` (1:n SAN, cascade)
- **FgCertificateDomain** — `id`, `domain`, `certificateId` (FK, cascade)
- **FgAccessPolicy** — `id`, `name`, `type` (ipAllowlist/geoBlock/basicAuth/ipDenylist), `rulesJson` (CIDR/ISO array hoặc `{username,password}` basicAuth, password BCrypt hash)
- **FgReverseProxyLocation** — `id`, `ruleId` (FK), `path`, `scheme`, `forwardHost`, `forwardPort` (Cascade delete)
- **BcnHostname** — `id`, `host` (multi-tag comma: `@`, `www`, `*.example.com`), `domain` (FQDN), `providerId`, `kind`, `configJson` (encrypted secrets), `status` (updating/active/disabled/error), `currentIpv4/6`, `lastCheckedAt`, `lastUpdatedAt`, `lastError`, `backoffUntil`
- **BcnSettings** — `id` (=1), `checkIntervalMinutes`, `heartbeatIntervalHours`, `ipDetectionService`, `updateIpv6`
- **BcnActivityLog** — `id`, `timestamp`, `level`, `code`, `paramsJson`, `hostnameId` (FK, SetNull on delete)
- **WdFirewallRule** — `id`, `name`, `sourceCidr`, `ports`, `protocol` (any/tcp/udp/icmp), `action` (allow/deny), `enabled`, `auto`, `expiresAt`, `createdAt`
- **WdSecurityEvent** — `id`, `eventType`, `severity` (info/warning/critical), `sourceAddon`, `sourceIp`, `count`, `windowStart`, `detail?` (JSON), `timestamp` (index Ip + Timestamp)
- **WdSettings** — `id` (=1), `firewallEnabled`, `securityProfile` (low/medium/high/custom), `customThresholdFactor`, `customDurationFactor`

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
2. Session check → GET /api/auth/session → validate access token (NOT auto-refresh — trả về 401 nếu expired)
3. Token refresh → POST /api/auth/refresh → rotate tokens (fingerprint verification)
4. Logout → POST /api/auth/logout → clear cookies, revoke token jti
5. Logout-all → POST /api/auth/logout-all → revoke all user tokens
```

- Register: supports email + name fields (validated), unique constraints
- First user = admin (auto-register if no users exist, bypasses register_enabled lock)
- Access token: JWT, 15 phút (có thể cấu hình)
- Refresh token: random 64-byte, 7 ngày (mặc định) / 90 ngày (remember-me)
- Refresh rotation: old token bị revoke ngay khi refresh
- Fingerprint verification: nếu fingerprint thay đổi → revoke tất cả tokens (anti-theft)
- Token reuse detection: unknown jti → revoke tất cả user tokens

## Realtime Events (SignalR)

SignalR hub tại `/hubs/namorix` (HubNamorix):

| Event | Direction | Description |
|-------|-----------|-------------|
| `log:*` | Server → Client | Real-time log entry streaming |
| `traffic:*` | Server → Client | Network traffic data (TOTAL API + proxy, mỗi entry có `source`) |
| `system:config-changed` | Server → Client | Config changes (appearance defaults sync) |
| `user:settings-changed` | Server → Client | User settings changes (multi-tab sync) |
| `notification:received` | Server → Client | New notification push |
| `addon:status` | Server → Client | Addon container status changes |
| `addon:pending-task-changed` | Server → Client | Addon task progress |
| `addon:uninstalled` | Server → Client | Addon removed |
| `system-monitor:stats` | Server → Client | CPU, memory, disk, IO, network metrics |
| `beacon:activity-created` | Server → Client | Beacon activity log entry |
| `beacon:hostname-status-changed` | Server → Client | Beacon hostname status change |
| `beacon:hostnames-refreshed` | Server → Client | Beacon probe/refresh completed |
| `beacon:hostname-changed` | Server → Client | Beacon hostname CRUD (create/update/delete) |
| `frontgate:cert-status-changed` | Server → Client | Frontgate cert status change (retry/renew/worker) |
| `frontgate:rule-changed` | Server → Client | Frontgate reverse proxy rule CRUD |
| `frontgate:dry-run-changed` | Server → Client | Frontgate dry-run confirm/cancel/expire |
| `frontgate:cert-changed` | Server → Client | Frontgate cert CRUD |
| `frontgate:audit-created` | Server → Client | Frontgate audit log entry |
| `warden:new-event` | Server → Client | Warden security event push (id/eventType/severity/sourceAddon/sourceIp/count/timestamp — group `warden`) |

SignalR client auto-reconnects with exponential backoff (5s → 30s cap, infinite retry).

## gRPC Bidirectional Streaming

Addon backend ↔ Namorix backend communication qua port 5002 (HTTP/2):

- **AddonChannelService** — gRPC bidirectional stream for widget event forwarding + heartbeat
- **AddonChannelManager** — Tracks active gRPC connections per addon
- **Auth**: OAuth2 Bearer token (private_key_jwt) in gRPC metadata
- **Reconnect**: RetryConnectHostedService with configurable backoff

## Docker Integration

Namorix manages addon containers via Docker Unix socket (`Docker.DotNet`):

- **DockerService** — Container/image/network CRUD, health checks
- **DockerMonitorWorker** — Event stream monitoring + container state sync + orphan cleanup
- **AddonTaskExecutor** — Queued addon operations (start/stop/uninstall) with status notifications
- **Label convention**: `namorix-addon-id`, `namorix-version`, `namorix-description`, `namorix-author`

## Development

```bash
# Watch mode (hot reload)
dotnet watch run

# Build
dotnet build

# Run tests (when available)
dotnet test
```
