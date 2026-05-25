export type LogLevel = "trace" | "debug" | "info" | "warn" | "error" | "fatal"

export type LogGroup =
  | "core"
  | "app"
  | "controller"
  | "auth"
  | "database"
  | "misc"

export type LogEntry = {
  level: number
  source: string
  group: number
  message: string
  timestamp: string
}
