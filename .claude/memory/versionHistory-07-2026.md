# Version History — July 2026

## 2026-07-01 — AuthService concurrency fix, NmxGrid wrapping fix, SCSS tweaks

| Package | Version | Changes |
|---------|---------|---------|
| @namorix/styles | 0.33.0 → 0.33.1 | MODIFIED: `icon-svg.scss` — tweaks. `package-center.scss` — AddonGrid layout adjustments. Theme CSS rebuilt. |
| @namorix/ui | 0.24.0 → 0.24.1 | MODIFIED: `NmxGrid.tsx` — `repeat(N, 1fr)` → `repeat(auto-fill, minmax(...))` để wrap items khi container hẹp. |
| frontend | 0.49.0 → 0.49.1 | MODIFIED: `AddonGrid.tsx` — wrapping fix. |
| Namorix.Server | 0.42.0 → 0.42.1 | MODIFIED: `Services/AuthService.cs` — `RevokeAllUserTokens` dùng `ExecuteDeleteAsync` thay vì `RemoveRange` + `SaveChangesAsync` để tránh `DbUpdateConcurrencyException` khi concurrent revoke. |

## 2026-07-02 — Backend task queue, SignalR event fix, global addon events, AddonGrid refactor, NmxSpinner

| Package | Version | Changes |
|---------|---------|---------|
| @namorix/core | 0.38.0 → 0.39.0 | NEW: `http/error.ts`, `utils/markup.ts`, `utils/semver.ts`. MODIFIED: `addon/types.ts` — `AddonModule.globalComponent`. `addon/factory.tsx` — `defineAddon` extended with `globalComponent`. `http/apiError.ts` — `fromResponse` fallback (`data.error ?? data.code`). `http/client.ts` — unauthorized flow. `signalr/signalr.service.ts` — `intentionalStop` flag. `signalr/useSignalREvent.ts` — useRef handler, `[eventName]` deps. `types/error.ts` — new auth error types. |
| @namorix/styles | 0.33.1 → 0.34.0 | NEW: `base/components/spinner.scss`. MODIFIED: `base/components/loading.scss` → `loading-overlay.scss`. Icomoon rebuild. `package-center.scss` refactor. Theme CSS rebuilt. |
| @namorix/ui | 0.24.1 → 0.25.0 | NEW: `Primitives/NmxSpinner.tsx`. MODIFIED: `Primitives/NmxLoading.tsx` → `Components/NmxLoadingOverlay.tsx`. New icon type symbols. |
| frontend | 0.49.1 → 0.50.0 | NEW: `PackageCenter/AddonEventWatcher.tsx`, `addonError.ts`. MODIFIED: `Root.tsx` — global addon components. `App.tsx` — unauthorized handler. `registry.ts` — `listGlobalComponents()`. `AddonGrid.tsx` — 307-line refactor. `en.json` — new i18n keys. |
| Namorix.Core | 0.40.0 → 0.41.0 | MODIFIED: `Constants/Error.cs` — new error codes. `ApplicationBuilderExtensions.cs` — refactored. `Models/AddonInstallation.cs` — new fields (`PendingTaskId`, `LastStatusChangedAt`). |
| Namorix.Server | 0.42.1 → 0.43.0 | NEW: `AddonTask.cs`, `AddonTaskExecutor.cs`, `AddonTaskQueue.cs`. New migration `AddTaskFields`. MODIFIED: `AddonController.cs` — task endpoints. `DockerMonitorWorker.cs` — startup PendingTaskId cleanup. `AddonService.cs` — removed dead methods. `ServerSignalR.cs` — `AddonStatusChanged` event. |
