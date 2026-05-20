# Reusable UI Components Plan

## Context

Từ mẫu LogViewer UI, xác định 5 component có thể tách thành `@namorix/ui` primitives để dùng lại cho NetworkTraffic, LogViewer, và các addon/data-view khác sau này.

## Components

### 1. NmxBadge — Severity/Status Badge

**Loại:** Primitive (single file)

**Props:**
```typescript
interface NmxBadgeProps extends WithBaseProps, WithSemanticColor {
  // Kế thừa semantic: "primary" | "error" | "warning" | "success" | "info"
  // Dùng cxSemantic("nmx-badge", semantic)
}
```

**CSS:** `nmx-badge` — inline-flex, pill shape (`--nmx-radius-full`), font-size xs, letter-spacing wide, font-weight medium, font-sans. Dùng `semantic-variants` mixin từ SCSS.

**Dùng lại:** log level badge, HTTP status, endpoint status, trạng thái bất kỳ.

---

### 2. NmxChip — Toggleable Filter Chip

**Loại:** Primitive (single file)

**Props:**
```typescript
interface NmxChipProps extends WithBaseProps, WithSemanticColor {
  active?: boolean           // toggle state
  onClick?: () => void       // click handler
}
```

**CSS:** `nmx-chip` — height 24px, `--nmx-radius-full` pill, font-size xs, font-weight medium, border. Active state dùng semantic color. Off state dùng `opacity: .35` (giống mẫu).

**Dùng lại:** severity filter, status filter, tag filter trong bất kỳ data view nào.

---

### 3. NmxPulseDot — Animated Status Dot

**Loại:** Primitive (single file)

**Props:**
```typescript
interface NmxPulseDotProps extends WithBaseProps {
  status?: "live" | "stopped" | "error"
}
```

**CSS:** `nmx-pulse-dot` — 6px circle, border-radius 50%, inline-block. `@keyframes nmx-pulse` (opacity 1 ↔ 0.3).

**Dùng lại:** live indicator, connection status, realtime monitoring.

---

### 4. NmxPagination — Pagination Controls

**Loại:** Primitive (single file)

**Props:**
```typescript
interface NmxPaginationProps extends WithBaseProps {
  page: number
  totalPages: number
  totalItems: number
  pageSize: number
  onPageChange: (page: number) => void
  disabled?: boolean
}
```

**CSS:** `nmx-pagination` — flex container, height 26px button, border-radius 5px, font-size xs.

**Dùng lại:** tất cả data table có phân trang (logs, traffic, user list...).

---

### 5. NmxDataTable — Structured Data Table (Composite)

**Loại:** Composite (multi-file)

**Sub-components:**
- `NmxDataTable` — root container (scrollable)
- `NmxDataTable.Head` — header area
- `NmxDataTable.Body` — scrollable body
- `NmxDataTable.Row` — data row (grid layout)
- `NmxDataTable.Cell` — cell

**Props:**
```typescript
// Root — nhận columns string = CSS grid-template-columns value
interface NmxDataTableProps extends WithBaseProps {
  columns: string   // VD: "160px 100px minmax(0, 1fr)"
}
```

**Cơ chế layout:** Root set `--nmx-dt-columns` từ `columns` prop, Head & Row dùng `grid-template-columns: var(--nmx-dt-columns)`.

**Usage pattern:**
```tsx
<NmxDataTable columns="160px 100px minmax(0, 1fr)">
  <NmxDataTable.Head>
    <NmxDataTable.Row>
      <NmxDataTable.Cell>Time</NmxDataTable.Cell>
      <NmxDataTable.Cell>Severity</NmxDataTable.Cell>
      <NmxDataTable.Cell>Message</NmxDataTable.Cell>
    </NmxDataTable.Row>
  </NmxDataTable.Head>
  <NmxDataTable.Body>
    {logs.map(log => (
      <NmxDataTable.Row key={log.id} onClick={() => selectLog(log)}>
        <NmxDataTable.Cell>{log.timestamp}</NmxDataTable.Cell>
        <NmxDataTable.Cell><NmxBadge semantic="info">{log.level}</NmxBadge></NmxDataTable.Cell>
        <NmxDataTable.Cell>{log.message}</NmxDataTable.Cell>
      </NmxDataTable.Row>
    ))}
  </NmxDataTable.Body>
</NmxDataTable>
```

**Dùng lại:** LogViewer, NetworkTraffic logs & endpoint list, bảng dữ liệu bất kỳ.

---

## Files to Create

| # | Component | Files |
|---|-----------|-------|
| 1 | NmxBadge | `ui/src/Primitives/NmxBadge.tsx` + `styles/src/base/components/badge.scss` |
| 2 | NmxChip | `ui/src/Primitives/NmxChip.tsx` + `styles/src/base/components/chip.scss` |
| 3 | NmxPulseDot | `ui/src/Primitives/NmxPulseDot.tsx` + `styles/src/base/components/pulse-dot.scss` |
| 4 | NmxPagination | `ui/src/Primitives/NmxPagination.tsx` + `styles/src/base/components/pagination.scss` |
| 5 | NmxDataTable | 6 files: `Components/NmxDataTable/{NmxDataTable.tsx, Head, Body, Row, Cell, index.ts}` + `components/data-table.scss` |

## Files to Modify

| # | File | Change |
|---|------|--------|
| 1 | `ui/src/Primitives/index.ts` | Add exports for Badge, Chip, PulseDot, Pagination |
| 2 | `ui/src/Components/index.ts` | Add `export * from "./NmxDataTable"` |
| 3 | `styles/src/base/components/index.scss` | Add 5 `@forward` entries |

## Implementation Order

1. **NmxBadge** — đơn giản nhất, pattern reference
2. **NmxChip** — kế thừa pattern + active state
3. **NmxPulseDot** — component nhỏ nhất, CSS animation
4. **NmxPagination** — có logic page tính toán
5. **NmxDataTable** — composite, phức tạp nhất

## SCSS Conventions

- Dùng `semantic-variants` mixin cho variant màu
- Class: `nmx-badge`, `nmx-chip`, `nmx-pulse-dot`, `nmx-pagination`, `nmx-data-table`
- Element: `nmx-data-table__head/__body/__row/__cell`
- Component-scoped CSS vars: `--nmx-badge-*`, `--nmx-chip-*`, `--nmx-dt-*`

## Verification

1. `cd frontend && pnpm build` — build thành công
2. NmxDataTable scroll đúng, rows hover
3. NmxPagination prev/next disabled ở đầu/cuối
4. NmxChip toggle active state
5. NmxPulseDot animate khi status="live"
