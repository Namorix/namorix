function format(
  dateTime: Date,
  timeFormat: string,
  dateFormat: string,
): { time: string; date: string } {
  const pad = (n: number) => String(n).padStart(2, "0")
  const is24h = timeFormat === "HH:mm"
  const hours = pad(dateTime.getHours())
  const hours12 = pad(dateTime.getHours() % 12 || 12)
  const ampm = dateTime.getHours() >= 12 ? "PM" : "AM"

  const time = is24h
    ? `${hours}:${pad(dateTime.getMinutes())}`
    : `${hours12}:${pad(dateTime.getMinutes())} ${ampm}`

  let date: string
  switch (dateFormat) {
    case "MM/DD/YYYY":
      date = `${pad(dateTime.getMonth() + 1)}/${pad(dateTime.getDate())}/${dateTime.getFullYear()}`
      break
    case "YYYY-MM-DD":
      date = `${dateTime.getFullYear()}-${pad(dateTime.getMonth() + 1)}-${pad(dateTime.getDate())}`
      break
    default:
      date = `${pad(dateTime.getDate())}/${pad(dateTime.getMonth() + 1)}/${dateTime.getFullYear()}`
  }

  return { time, date }
}

export function formatDateTime(
  input: Date | string,
  timeFormat: string,
  dateFormat: string,
) {
  const dateTime = typeof input === "string" ? new Date(input) : input
  return format(dateTime, timeFormat, dateFormat)
}

export function formatTimestamp(
  input: Date | string,
  timeFormat: string,
  dateFormat: string,
) {
  const dateTime = typeof input === "string" ? new Date(input) : input
  const { time, date } = format(dateTime, timeFormat, dateFormat)
  const pad = (n: number) => String(n).padStart(2, "0")
  const seconds = pad(dateTime.getSeconds())
  return `${time}:${seconds} - ${date}`
}

export function formatDuration(ms: number): string {
  return ms >= 1000 ? `${(ms / 1000).toFixed(2)}s` : `${ms}ms`
}

export function formatSize(bytes: number): string {
  return bytes >= 1024 ? `${(bytes / 1024).toFixed(1)}KB` : `${bytes}B`
}

export function formatRelativeTime(
  input: Date | string,
  t: (key: string, opts?: Record<string, unknown>) => string,
): string {
  const dateTime = typeof input === "string" ? new Date(input) : input
  const diffMs = Date.now() - dateTime.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)

  if (diffMin < 1) return t("core:common.time.justNow")
  if (diffMin < 60) return t("core:common.time.minAgo", { count: diffMin })
  if (diffHour < 24) return t("core:common.time.hoursAgo", { count: diffHour })
  if (diffDay < 7) return t("core:common.time.daysAgo", { count: diffDay })

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(dateTime)
}

export function formatBytes(bytes: number): string {
  const units = ["B", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"]
  let unit = 0
  let size = bytes
  while (size >= 1024 && unit < units.length - 1) {
    size /= 1024
    unit++
  }
  return unit <= 1
    ? `${size.toFixed(0)}${units[unit]}`
    : `${size.toFixed(1)}${units[unit]}`
}

export function formatBytesSec(
  bytes: number | null | undefined,
): string | null {
  if (bytes == null) return null
  return formatBytes(bytes) + "/s"
}

export function formatUptime(seconds: number | undefined): string | null {
  if (seconds == null) return null
  const y = Math.floor(seconds / (86400 * 365.25))
  const d = Math.floor((seconds % (86400 * 365.25)) / 86400)
  const h = Math.floor((seconds % 86400) / 3600)
  const m = Math.floor((seconds % 3600) / 60)

  if (y > 0) return `${y}y ${d}d`
  if (d > 0) return `${d}d ${h.toString().padStart(2, "0")}h`
  if (h > 0)
    return `${h.toString().padStart(2, "0")}h ${m.toString().padStart(2, "0")}m`
  return `${m}m`
}
