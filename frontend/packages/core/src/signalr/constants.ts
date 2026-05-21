export const SignalRGroups = {
  Traffic: "traffic",
} as const

export const SignalREvent = {
  TrafficNewLogs: SignalRGroups.Traffic + ":new-logs",
  SystemConfigChanged: "system:config-changed",
  UserThemeChanged: "user:theme-changed",
} as const

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
