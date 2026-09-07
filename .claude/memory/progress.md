# Version History — September 2026

## 2026-09-07 — Settings → Docker tab (Desktop domain + container/network name) + addon container network_mode host + dev Vite proxy mọi Host

| Package | Version | Changes |
|---------|---------|---------|
| Namorix.Core | 0.61.0 → 0.62.0 | MODIFIED: `Constants/Settings.cs` +`SettingKeys.DesktopContainerName = "desktop_container_name"` / `DesktopNetworkName = "desktop_network_name"`. `Extensions/DevViteReverseProxyExtensions.cs` — dev proxy route bỏ host match (`Hosts: ["localhost","127.0.0.1"]`) → catch-all mọi Host (proxy tới Vite qua IP/hostname LAN, không chỉ localhost). |
| Namorix.Server | 0.79.0 → 0.80.0 | NEW: `Controllers/SettingsController.cs` +`GET/PUT /api/settings/docker` (`DockerSettingsResponse`/`DockerSettingsRequest` — `desktopDomain`/`containerName`/`networkName`); `Services/SettingsService.cs` +`Get/SetDesktopContainerName` +`Get/SetDesktopNetworkName` (upsert DB, fallback `BackendConfig.ContainerName/NetworkName`), inject `IOptions<BackendConfig>`; `Get/SetAllAsync` bỏ `desktopDomain` (tách sang docker). MODIFIED: `Services/DockerService.cs` `CreateContainerAsync` `NetworkMode = "host"` (bỏ bridge network create + port bindings + extra hosts); `Services/AddonTaskExecutor.cs` `DesktopApiUrl`/`DesktopGrpcUrl` = `http://127.0.0.1:{port}` (bỏ `ParseCatalogPorts`/`EnsureNetworkExistsAsync`/host-gateway) — addon container chia sẻ network namespace desktop. `appsettings.json` `Backend.NetworkName` `namorix-net` → `namorix_default`. |
| @namorix/core | 0.67.3 → 0.67.4 | MODIFIED: `apiRoutes.ts` +`ApiSettingsRoutes.docker` (`API_SETTINGS_BASE + "/docker"`); `version.ts` `NmxAddonVersions.settings` 1.1.0 → 1.2.0. |
| @namorix/ui | 0.50.0 → 0.51.0 | MODIFIED: `Primitives/NmxIcon/NmxIconFont.types.ts` +`DOCKER` icon symbol (`ic-docker`). |
| @namorix/styles | 0.59.0 → 0.60.0 | MODIFIED: icomoon rebuild (`variables.scss` +`$ic-docker: "\e947"`; `fonts.scss`/`_font-face.scss`/`selection.json`). |
| frontend | 0.91.0 → 0.92.0 | NEW: `addons/Settings/SettingsDocker.tsx` (tab "Docker" admin-only — Desktop domain + container name + network name, load/save/reset-on-fail). MODIFIED: `Settings.tsx` +tab Docker +`ADMIN_TABS = ["system","docker"]`; `settings.controller.ts` +`getDocker()`/`setDocker()`, getSystem/setSystem bỏ `desktopDomain`; `SettingsSystem.tsx` bỏ section "Domain" (chuyển sang Docker); `en.json` +keys `addon.settings.tabs.docker`/`addon.settings.docker.*`, bỏ `addon.settings.system.desktopDomain*`. |

## 2026-09-07 — Desktop Domain setting + push config-update qua gRPC cho addon OAuth redirect (DesktopConfigMessage) + DockerService tmpfs /tmp

| Package | Version | Changes |
|---------|---------|---------|
| Namorix.Core | 0.60.0 → 0.61.0 | NEW: `Grpc/DesktopConfigMessage.cs` — `ShellMessage.type = "config-update"` với JSON payload `{"desktopDomain":"http(s)://host:port"}` (helper `ConfigUpdate(string?)`/`ParseDesktopDomain(string)`). MODIFIED: `Grpc/AddonChannelClient.cs` +`BrowserOrigin` (capture từ config-update trong `ReceiveLoopAsync`); `AddonSession/AddonSessionAuthService.cs` `BuildLoginUrlAsync` dùng `channel.BrowserOrigin ?? config.DesktopApiUrl` làm base URL cho authorize endpoint — browser mở được (không còn `host.docker.internal`); `Constants/Settings.cs` +`SettingKeys.DesktopDomain = "desktop_domain"`. |
| Namorix.Server | 0.78.4 → 0.79.0 | NEW (Desktop Domain): `Services/SettingsService.cs` +`GetDesktopDomain()`/`SetDesktopDomain()` (đọc/ghi thẳng DB, upsert Setting row `desktop_domain`); `Controllers/SettingsController.cs` GetSystem/SetSystem +`DesktopDomain` (4-tuple → DTO), sau Set broadcast `DesktopConfigMessage.ConfigUpdate`; `Services/AddonChannelManager.cs` +`BroadcastAsync(ShellMessage)`; `Services/Grpc/AddonChannelService.cs` push config-update best-effort sau khi `ctx.ResponseStream` sẵn sàng. FIXED: `Services/DockerService.cs` `CreateContainerAsync` +`Tmpfs {"/tmp" = "rw"}` — addon container `ReadonlyRootfs` trước bị crash DataProtection key-ring (`Read-only file system : '/tmp/'` — `Path.GetTempFileName()` không ghi được). |
| frontend | 0.90.2 → 0.91.0 | NEW: `addons/Settings/SettingsSystem.tsx` section "Domain" (`NmxSettingsSection` + `NmxFormInput` Desktop domain, state `desktopDomain` load/save/reset-on-fail); `addons/Settings/settings.controller.ts` types +`desktopDomain`; `i18n/locales/en.json` +`addon.settings.system.desktopDomainSection/desktopDomain/desktopDomainDesc`. |

## 2026-09-05 — Frontgate: fix JsonException object cycle khi add proxy RequestCert (FrontgateAudit.JsonOptions)

| Package | Version | Changes |
|---------|---------|---------|
| Namorix.Server | 0.78.3 → 0.78.4 | FIXED: `Services/Frontgate/FrontgateAudit.cs` — `JsonOptions` thiếu `ReferenceHandler.IgnoreCycles` → add proxy với "request new certificate" (RequestCert) crash `System.Text.Json.JsonException: A possible object cycle was detected`. Root cause: sau `SaveChangesAsync` EF relationship fixup gắn `FgReverseProxyRule.Certificate` (nav tới cert mới tạo đang tracked) → cycle `rule → Certificate → CertificateDomains → FgCertificateDomain.Certificate → cert → …`; audit `JsonSerializer.Serialize(rule, FrontgateAudit.JsonOptions)` (Web defaults, không IgnoreCycles — khác MVC options trong `Namorix.Core` đã IgnoreCycles) ném exception → `ExceptionMiddleware` log "Unhandled exception". Fix: +`ReferenceHandler = ReferenceHandler.IgnoreCycles` vào `FrontgateAudit.JsonOptions`. |

## 2026-09-04 — About addon hiện version runtime backend (AboutController) + ApiAboutRoutes

| Package | Version | Changes |
|---------|---------|---------|
| Namorix.Server | 0.78.2 → 0.78.3 | NEW: `Controllers/AboutController.cs` — `GET /api/about` trả `AssemblyInformationalVersion` của Namorix.Core + Namorix.Server lúc runtime (không bake từ vite nữa). Fix kiểu lệch version giữa frontend bundle bake (vite đọc csproj lúc build) và backend thực tế đang chạy (vd image cũ báo 0.77.0 dù csproj 0.78.2). |
| @namorix/core | 0.67.2 → 0.67.3 | MODIFIED: `apiRoutes.ts` — +`ApiAboutRoutes` (`base = API_BASE + "/about"`). |
| frontend | 0.90.1 → 0.90.2 | NEW: `addons/About/about.controller.ts` — `aboutController.getInfo()` qua `coreConfig.http`. MODIFIED: `addons/About/About.tsx` — `useEffect` gọi `getInfo()` khi mount; 2 dòng meta Namorix.Core/Namorix.Server lấy từ runtime (`info?.core`/`info?.server`) fallback về hằng baked `__BACKEND_*__` khi load/lỗi. |

## 2026-09-04 — Frontgate: fix redirect loop HTTP→HTTPS khi bật Force SSL (RewriteRedirectLocationMiddleware)

| Package | Version | Changes |
|---------|---------|---------|
| Namorix.Server | 0.78.1 → 0.78.2 | FIXED: `Middleware/Frontgate/RewriteRedirectLocationMiddleware.cs` — vòng lặp redirect `ERR_TOO_MANY_REDIRECT` khi rule bật Force SSL. Root cause: middleware rewrite `Location` do `ForceSslMiddleware` sinh ra (301 `http→https`) dùng `Request.Scheme` làm fallback cho scheme → vì chính request đang là http (điều kiện để ForceSsl bắn) nên scheme của Location absolute bị hạ ngược về `http://` → browser quay lại http → loop. Fix: chỉ override scheme khi có header `X-Forwarded-Proto` (proxy đáng tin báo public scheme); Location absolute (vd 301 của ForceSsl) giữ nguyên scheme đích, chỉ rewrite host/port. |
