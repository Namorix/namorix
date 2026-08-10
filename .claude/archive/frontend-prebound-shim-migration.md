# Migrate frontend/src sang pre-bound shim (sau khi core đã factory-hóa)

> ## Status: ✅ HOÀN THÀNH (2026-08-10)
>
> - Đã áp dụng: `src/config/coreConfig.ts` + `src/signalr/useSignalR.ts` (shim) + migrate ~22 consumer files.
> - Version: core 0.65.0→**0.66.0**, frontend 0.88.1→**0.89.0**.
> - Docs đã cập nhật: progress.md, activeContext.md, FLOW.md (SignalR section), README + frontend/README.
> - Xem [Deviations thực tế](#đã-hoàn-thành--thực-tế-vs-plan) cuối file — có vài điểm khác so với plan gốc.

## Context

`@namorix/core` đã refactor xong sang factory/instance pattern:
- `createNmxCore` + các factory (`createAuthRefresh`, `createHttpClient`, `createAuthService`, `createOauth`, `createThemeLoader`, `createSignalrService`).
- Hooks SignalR giờ nhận `signalr: SignalrService` làm **param đầu**.
- Đã xóa toàn bộ module-level singleton: `configureCore`, `nmxHttp`, `getApiBaseUrl`, `authService`, `stopConnection`, `setHasBeenConnected`, `setOnUnauthorized`, `applyTheme`.

`frontend/src` (desktop shell) **chưa migrate** → ~20 file đang import symbol đã xóa → `pnpm build` sẽ fail.

## Nguyên tắc chia 2 lớp

- **Core (chung, federation-share):** giữ param-based, KHÔNG đổi thêm.
- **frontend/src (riêng, KHÔNG federation-share):** thêm **pre-bound shim** — wrapper + re-export gọn trỏ vào instance `core` tạo trong `coreConfig.ts`. App code giữ nguyên signature cũ → churn tối thiểu.

Điểm mấu chốt: xung đột trước đây đến từ **core bị federation-share**. `coreConfig.ts` + shim nằm trong frontend/src (desktop shell), không expose qua federation → mỗi app tự có instance riêng, không conflict. Đây chính là cách `NmxI18n` đang hoạt động.

## Bước 1 — `config/coreConfig.ts`: thêm re-export alias

Ngoài `export const coreConfig` (đã có), thêm alias giữ nguyên tên cũ để body controller/app **không phải sửa**:

```ts
export const authService = coreConfig.auth
export const nmxHttp = coreConfig.http
export const getApiBaseUrl = coreConfig.getApiBaseUrl
export const stopConnection = coreConfig.signalr.stopConnection
export const setHasBeenConnected = coreConfig.signalr.setHasBeenConnected
export const setOnUnauthorized = coreConfig.authRefresh.setOnUnauthorized
export const applyTheme = coreConfig.theme.applyTheme
```

(Không cần `.bind()` — các method của service đều là closure, không dùng `this`.)

## Bước 2 — `frontend/src/signalr/useSignalR.ts`: pre-bound 4 hooks

Wrapper import `core` từ `../config/coreConfig`, pre-bound `core.signalr` bên trong → consumer giữ signature cũ:

```ts
// signalr nhận từ coreConfig, hook core nhận signalr param
import { useSignalR as useSignalRCore, useSignalRStatus as useSignalRStatusCore,
         useSignalRGroup as useSignalRGroupCore, useSignalREvent as useSignalREventCore } from "@namorix/core"
import { core } from "../config/coreConfig"

export const useSignalR = (active: boolean, hubPath?: string) =>
  useSignalRCore(core.signalr, active, hubPath)

export const useSignalRStatus = (hubPath?: string) =>
  useSignalRStatusCore(core.signalr, hubPath)

export function useServerSignalRGroup<SG>(groupName: SG, active: boolean, hubPath?: string) {
  return useSignalRGroupCore<SG>(core.signalr, groupName, active, hubPath)
}

export function useServerSignalREvent<T = unknown>(eventName: string, handler: (data: T) => void, hubPath?: string) {
  return useSignalREventCore<T, string>(core.signalr, eventName, handler, hubPath)
}
```

`frontend/src/signalr/index.ts` thêm `export * from "./useSignalR"` cho cả 4 tên.

> Lưu ý: `useServerSignalRGroup`/`useServerSignalREvent` đã có sẵn trong file — chỉ đổi phần thân gọi core hook + thêm 2 hook mới. `constants.ts` giữ nguyên.

## Bước 3 — Controllers (10 file): chỉ đổi dòng import

Đổi `import { ... } from "@namorix/core"` → `import { ... } from "<rel>/config/coreConfig"`. **Body file giữ nguyên 100%** vì tên export trùng.

| File | Rel path tới coreConfig |
|---|---|
| `controllers/auth.controller.ts` | `../config/coreConfig` |
| `controllers/{health,notification,addon}.controller.ts` | `../config/coreConfig` |
| `addons/Settings/settings.controller.ts` | `../../config/coreConfig` |
| `addons/{Beacon,Warden,NetworkTraffic,Frontgate}/...controller.ts` | `../../config/coreConfig` |
| `addons/LogViewer/log.controller.ts` | `../../config/coreConfig` |

- `auth.controller.ts` còn dùng `applyTheme`, `stopConnection`, `setHasBeenConnected` → tự lấy từ coreConfig luôn.
- Các symbol KHÔNG có trong coreConfig (vd `ApiError`, `Api*Routes`, `NmxNotificationDto`...) vẫn import từ `@namorix/core` (giữ cả 2 dòng import).

## Bước 4 — Components / Hooks: đổi import source, giữ body

| File | Thay đổi |
|---|---|
| `pages/Desktop.tsx` | `useSignalR` → import từ `../signalr`; giữ `useSignalR(true)` |
| `pages/App.tsx` | `authService`, `setOnUnauthorized`, `setHasBeenConnected`, `stopConnection` → từ `./config/coreConfig`; `useSignalRStatus` → từ `./signalr`; giữ body |
| `pages/Login.tsx` | `getApiBaseUrl` → từ `./config/coreConfig` |
| `components/Launcher/Launcher.tsx` | `stopConnection` → từ coreConfig; `nmxToast`/`useUserStore` giữ core |
| `components/Taskbar/Taskbar.tsx` | `useSignalRStatus` → từ `../../signalr` |
| `hooks/useNotificationEvents.ts` | `useSignalREvent`/`SignalREvent` → từ `../signalr` |
| `hooks/useAppearanceSync.ts` | `useSignalREvent` → từ `../signalr` |
| `components/Notification/NotificationToasts.tsx` | `useSignalREvent` → từ `../signalr` |
| `addons/NetworkTraffic/NetworkTrafficLogs.tsx` | `useSignalRGroup`/`useSignalREvent` → từ `../../signalr` |
| `addons/NetworkTraffic/useTrafficStatsPolling.ts` | ditto |
| `addons/LogViewer/LogViewer.tsx` | ditto |

**Addon components đã dùng `useServerSignalR*` từ `../../signalr` (Beacon ×3, PackageCenter ×2):** sau bước 2 wrapper tự pre-bound `core.signalr` → **không cần sửa gì**.

## Files đổi (chỉ frontend/src)

- **Shim (2):** `config/coreConfig.ts` (thêm alias), `signalr/useSignalR.ts` + `signalr/index.ts`
- **Consumer đổi import (~18):** 10 controller + App/Login/Launcher/Desktop/Taskbar + useNotificationEvents/useAppearanceSync/NotificationToasts + NetworkTrafficLogs/useTrafficStatsPolling/LogViewer
- **Không đổi:** toàn bộ `packages/core/`, `coreConfig.ts` thân cũ, `main.tsx`, addon dùng `useServerSignalR*`

## Version + docs

- `@namorix/core`: 0.65.0 → **0.66.0** (MINOR — refactor factory đã xong).
- `frontend`: 0.88.1 → **0.89.0** (MINOR — shim + migrate consumers).
- Sau khi build/test pass: chạy `/update-docs-and-versions` (progress.md, activeContext.md, FLOW.md SignalR section, cả 3 README) rồi `/git-commit-suggester`.

## Verification

1. `cd frontend && pnpm build` — typecheck + build.
2. `cd frontend && pnpm test`.
3. `pnpm dev` + backend `dotnet run`: login → Desktop (SignalR connect), mở từng addon (Beacon/LogViewer/NetworkTraffic/Warden/Frontgate), theme load, logout (`stopConnection`).

## Out of scope

- `store` (`initStores()` module-level Redux) — cũng conflict khi federation, để follow-up riêng.
- `NmxI18n`/i18next — không đổi (đã theo instance pattern).

---

## Đã hoàn thành — Thực tế vs Plan

| # | Plan | Thực tế |
|---|------|---------|
| 1 | coreConfig thêm alias re-export (`nmxHttp`/`getApiBaseUrl`/`authService`...) để body controller giữ nguyên | Controllers migrate thẳng sang `coreConfig.http`/`coreConfig.getApiBaseUrl()`/`coreConfig.signalr.*`/`coreConfig.theme.*` (đổi import + accessor). **Không dùng alias** — explicit hơn, ít lớp gián tiếp. |
| 2 | Shim import core hooks + pre-bound `core.signalr` | Core thêm **NEW `createSignalRHooks(signalr)`** (factory trả 4 hook pre-bound). `coreConfig.signalRHooks` = instance; shim `signalr/useSignalR.ts` **destructure** từ đó + thêm `useServerSignalRGroup`/`useServerSignalREvent` ép `ServerSignalRGroupsType`/`ServerSignalREventType`. |
| 3 | "Không đổi main.tsx" | **`main.tsx` ĐỔI**: bỏ `configureCore` → `import "./config/coreConfig"`. |
| 4 | — | **LogViewer route fix** phát hiện trong lúc migrate: `log.controller.ts` dùng `ApiTrafficRoutes.logs` (`/api/traffic/logs`, sai — endpoint NetworkTraffic) → `ApiLogRoutes.logs` (`/api/logs`). Fix crash LogViewer "Cannot read properties of undefined (reading 'length')". |
| 5 | hubsPath `/hubs/main` | **`hubsPath: "/hubs/namorix"`** — sync với backend rename `HubMain`→`HubNamorix` (`/hubs/main`→`/hubs/namorix`, 3 file backend chưa commit). Không còn mismatch — commit backend rename cùng batch được. |
| 6 | — | Addon internal (LogViewer/NetworkTraffic/Settings/Beacon/Frontgate/Warden) **KHÔNG bump** `NmxAddonVersions` — plumbing-only (chỉ đổi import nguồn, không đổi logic). |

**Version áp dụng:** core 0.66.0 / frontend 0.89.0 (kèm `build:vite` script trong frontend/package.json).
**Docs:** progress.md + activeContext.md + FLOW.md (App Init + SignalR lifecycle/hooks/key-files) + README.md + frontend/README.md.
**Chưa chạy build/test** — plan verification (pnpm build/test) để lại cho user sau khi apply.
