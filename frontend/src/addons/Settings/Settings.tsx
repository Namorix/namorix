import React from "react"
import { NmxBadge, NmxChip, NmxDataTable, NmxPagination } from "@namorix/ui"
import type { NmxDataTableColumn } from "../../../packages/ui/src/Components/NmxDataTable/NmxDataTable.type"

interface LogEntry {
  time: string
  level: "info" | "debug" | "warn" | "error"
  source: string
  message: string
}

const MOCK_LOGS: LogEntry[] = [
  {
    time: "2026-05-20 08:00:01",
    level: "info",
    source: "api-gateway",
    message: "Server started on :8080",
  },
  {
    time: "2026-05-20 08:00:02",
    level: "info",
    source: "auth",
    message: "Database connection established",
  },
  {
    time: "2026-05-20 08:00:05",
    level: "info",
    source: "system",
    message: "Loaded 48 route handlers",
  },
  {
    time: "2026-05-20 08:00:12",
    level: "debug",
    source: "api-gateway",
    message: "Config loaded from /etc/config.yaml",
  },
  {
    time: "2026-05-20 08:01:04",
    level: "info",
    source: "auth",
    message: "Token refreshed for user #4421",
  },
  {
    time: "2026-05-20 08:01:23",
    level: "warn",
    source: "network",
    message: "Certificate expires in 14 days",
  },
  {
    time: "2026-05-20 08:02:15",
    level: "info",
    source: "system",
    message: "Scheduled job 'cleanup' executed",
  },
  {
    time: "2026-05-20 08:02:44",
    level: "debug",
    source: "network",
    message: "Cache hit ratio 0.94",
  },
  {
    time: "2026-05-20 08:03:00",
    level: "info",
    source: "api-gateway",
    message: "Request GET /api/users 200 14ms",
  },
  {
    time: "2026-05-20 08:03:12",
    level: "warn",
    source: "network",
    message: "Memory usage at 78%",
  },
  {
    time: "2026-05-20 08:04:30",
    level: "error",
    source: "auth",
    message: "JWT validation failed: token expired",
  },
  {
    time: "2026-05-20 08:04:33",
    level: "debug",
    source: "api-gateway",
    message: "Connection pool size: 12",
  },
  {
    time: "2026-05-20 08:05:01",
    level: "info",
    source: "system",
    message: "Rate limit reset for client 10.0.0.5",
  },
  {
    time: "2026-05-20 08:06:18",
    level: "warn",
    source: "api-gateway",
    message: "Request queue depth: 512",
  },
  {
    time: "2026-05-20 08:06:55",
    level: "debug",
    source: "network",
    message: "TLS handshake completed in 3ms",
  },
  {
    time: "2026-05-20 08:07:00",
    level: "error",
    source: "system",
    message: "Failed to connect to Redis: ECONNREFUSED",
  },
  {
    time: "2026-05-20 08:07:30",
    level: "info",
    source: "network",
    message: "Webhook delivered to https://hooks.example.com",
  },
  {
    time: "2026-05-20 08:08:12",
    level: "warn",
    source: "auth",
    message: "Config fallback to defaults for key 'timeout'",
  },
  {
    time: "2026-05-20 08:09:45",
    level: "error",
    source: "api-gateway",
    message: "HTTP 502 from upstream after 3 retries",
  },
  {
    time: "2026-05-20 08:10:01",
    level: "info",
    source: "system",
    message: "Heap snapshot taken",
  },
  {
    time: "2026-05-20 08:11:22",
    level: "debug",
    source: "auth",
    message: "GC minor collection 11ms",
  },
  {
    time: "2026-05-20 08:12:05",
    level: "warn",
    source: "network",
    message: "Disk usage above threshold: 81%",
  },
  {
    time: "2026-05-20 08:13:00",
    level: "error",
    source: "system",
    message: "Database transaction rolled back",
  },
  {
    time: "2026-05-20 08:14:33",
    level: "info",
    source: "api-gateway",
    message: "Scheduled job 'sync' completed",
  },
  {
    time: "2026-05-20 08:15:17",
    level: "debug",
    source: "network",
    message: "Retry attempt 1/3",
  },
  {
    time: "2026-05-20 08:16:40",
    level: "warn",
    source: "api-gateway",
    message: "Slow query detected: 430ms",
  },
  {
    time: "2026-05-20 08:17:01",
    level: "error",
    source: "auth",
    message: "S3 upload failed: AccessDenied",
  },
]

const columns: NmxDataTableColumn<LogEntry>[] = [
  { header: "Time", grow: 1, renderCell: (row) => row.time },
  {
    header: "Severity",
    grow: 1,
    renderCell: (row) => (
      <NmxBadge
        semantic={
          row.level === "error"
            ? "error"
            : row.level === "warn"
              ? "warning"
              : row.level === "debug"
                ? "info"
                : "success"
        }
      >
        {row.level.toUpperCase()}
      </NmxBadge>
    ),
  },
  { header: "Source", grow: 1, renderCell: (row) => row.source },
  { header: "Message", grow: 2, renderCell: (row) => row.message },
]

export const Settings: React.FC = () => {
  return (
    <div className="nmx-addon-root nmx-addon-setting">
      <NmxChip semantic="error">ERROR</NmxChip>
      <NmxDataTable
        columns={columns}
        rows={MOCK_LOGS}
        onRowClick={(row) => console.log(row)}
        clickableRows
      />
      <NmxPagination page={2} totalPages={13} totalItems={312} pageSize={25} />
    </div>
  )
}
