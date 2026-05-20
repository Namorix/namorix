# Reusable UI Components — COMPLETED ✅

## Context

Từ mẫu LogViewer UI, xác định 5 component có thể tách thành `@namorix/ui` primitives để dùng lại cho NetworkTraffic, LogViewer, và các addon/data-view khác sau này.

**Thời gian:** 2026-05-20
**Packages:** @namorix/styles 0.9.0→0.10.0, @namorix/ui 0.6.4→0.7.0, frontend 0.12.0→0.12.1

---

## Components — All Implemented ✅

### 1. NmxBadge — Severity/Status Badge ✅
- **File:** `ui/src/Primitives/NmxBadge.tsx`
- **SCSS:** `styles/src/base/components/badge.scss`
- **Props:** `WithBaseProps + WithSemanticColor`, default semantic `"info"`
- **Deviation:** dùng `--nmx-radius-md` (không phải `--nmx-radius-full` như plan gốc), padding bằng spacing tokens, semantic variants dùng color-mix

### 2. NmxChip — Toggleable Filter Chip ✅
- **File:** `ui/src/Primitives/NmxChip.tsx`
- **SCSS:** `styles/src/base/components/chip.scss`
- **Props:** `active?: boolean, onClick?: () => void, WithSemanticColor`, kèm `role="button"` + keyboard handler
- **Deviation:** không có fixed height — dùng padding `--nmx-spacing-sm` / `--nmx-spacing-md`, hover opacity `0.6`

### 3. NmxPulseDot — Animated Status Dot ✅
- **File:** `ui/src/Primitives/NmxPulseDot.tsx`
- **SCSS:** `styles/src/base/components/pulse-dot.scss`
- **Props:** `status?: "live" | "stopped" | "error"` (default `"stopped"`)
- **Deviation:** dùng `inline-flex` thay `inline-block`, kích thước từ `--nmx-spacing-unit`, `border-radius: var(--nmx-radius-half)` (token mới)

### 4. NmxPagination — Pagination Controls ✅
- **File:** `ui/src/Primitives/NmxPagination.tsx`
- **SCSS:** `styles/src/base/components/pagination.scss`
- **Props:** `page, totalPages, totalItems, pageSize, onPageChange`
- **Icons:** Dùng `NmxIconFontSymbol.ARROW_PREV` / `ARROW_NEXT` (symbols mới)
- **Deviation:** không có fixed height — border-radius `--nmx-radius-sm`, border 0

### 5. NmxDataTable — Structured Data Table ✅
- **Files:** 3 files in `ui/src/Components/NmxDataTable/` (NmxDataTable.tsx, NmxDataTable.type.ts, index.ts)
- **SCSS:** `styles/src/base/components/data-table.scss`
- **Props:** data-driven API: `columns: NmxDataTableColumn<T>[]` (header + renderCell + grow), `rows: T[]`, `fallbackConditions`, `clickableRows`, `getRowClass`, `onRowClick`
- **Major deviation from plan gốc:** Không dùng children-based (Head/Body/Row/Cell sub-components). Thay bằng **data-driven API** tham khảo từ Lit implementation: `buildGridTemplateColumns()` chuyển `grow` → `minmax(0, Xfr)`, CSS `subgrid` cho rows, fallback state pattern.
- **Usage:**
```tsx
<NmxDataTable
  columns={[
    { header: "Time", renderCell: (r) => r.timestamp, grow: 0 },
    { header: "Severity", renderCell: (r) => <NmxBadge>{r.level}</NmxBadge>, grow: 0 },
    { header: "Message", renderCell: (r) => r.message, grow: 1 },
  ]}
  rows={logs}
  fallbackConditions={[{ condition: logs.length === 0, content: "No logs" }]}
  onRowClick={(log) => selectLog(log)}
/>
```

---

## Additional Changes Made Alongside

| Change | Reason |
|--------|--------|
| WindowFrame addon mount bug fix | `useAddonMount(winId)` → `useAddonMount(win?.app)` vì `resolveAddon` cần addon manifest ID |
| Settings addon expanded (+212 lines) | Từ scaffold → full implementation |
| New `addon.scss` component | Addon-related styles |
| New `--nmx-radius-half: 50%` token | Cho NmxPulseDot circle |
| New `ARROW_PREV`/`ARROW_NEXT` icon symbols | Cho NmxPagination |
| Icomoon rebuild + theme assets rebuild | Đồng bộ icon font |
| Version bumps | styles 0.10.0, ui 0.7.0, frontend 0.12.1 |

## Files Created
- `ui/src/Primitives/NmxBadge.tsx`
- `ui/src/Primitives/NmxChip.tsx`
- `ui/src/Primitives/NmxPulseDot.tsx`
- `ui/src/Primitives/NmxPagination.tsx`
- `ui/src/Components/NmxDataTable/` (3 files)
- `styles/src/base/components/badge.scss`
- `styles/src/base/components/chip.scss`
- `styles/src/base/components/pulse-dot.scss`
- `styles/src/base/components/pagination.scss`
- `styles/src/base/components/data-table.scss`
- `styles/src/base/components/addon.scss`

## Files Modified
- `ui/src/Primitives/index.ts` — exports for 4 primitives
- `ui/src/Components/index.ts` — export NmxDataTable
- `ui/src/Primitives/NmxIcon/NmxIconFont.types.ts` — ARROW_PREV, ARROW_NEXT
- `styles/src/base/components/index.scss` — 6 @forward entries
- `styles/src/base/tokens/spacing.scss` — --nmx-radius-half
- `frontend/src/components/WindowFrame/WindowFrame.tsx` — addon mount fix
- `frontend/src/addons/Settings/Settings.tsx` — expanded
- `frontend/packages/ui/package.json` — version 0.7.0
- `frontend/packages/styles/package.json` — version 0.10.0
- `frontend/package.json` — version 0.12.1
