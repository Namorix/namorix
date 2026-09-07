# Version History — September 2026

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
