export const SignalRGroups = {
  Traffic: "traffic",
  Logs: "logs",
} as const

export const SignalREvent = {
  TrafficNewLogs: SignalRGroups.Traffic + ":new-logs",
  TrafficStatsInit: SignalRGroups.Traffic + ":stats-init",
  LogsNewEntry: SignalRGroups.Logs + ":new-entry",
  LogsHistory: SignalRGroups.Logs + ":history",
  SystemConfigChanged: "system:config-changed",
  UserThemeChanged: "user:theme-changed",
} as const

export type BucketData = {
  hour: number
  requests: number
  errors: number
  avgDurationMs: number
  avgSizeBytes: number
}

export type TrafficLogsFlushed = {
  totalRequests: number
  errorCount: number
  avgDurationMs: number
  avgResponseSizeBytes: number
}

export type ConfigChanged = { key: string }
export type ThemeChanged = { themeId: string }

export type SignalRGroups = (typeof SignalRGroups)[keyof typeof SignalRGroups]
export type SignalREvent = (typeof SignalREvent)[keyof typeof SignalREvent]
