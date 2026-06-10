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
