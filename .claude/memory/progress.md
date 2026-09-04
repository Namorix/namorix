# Version History — September 2026

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
