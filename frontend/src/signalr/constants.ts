export const ServerSignalRGroups = {
  SystemMonitor: "system-monitor",
} as const

export const ServerSignalREvent = {
  SystemMonitorStatsUpdate: ServerSignalRGroups.SystemMonitor + ":stats-update",
}

export type ServerSignalRGroupsType =
  (typeof ServerSignalRGroups)[keyof typeof ServerSignalRGroups]
export type ServerSignalREventType =
  (typeof ServerSignalREvent)[keyof typeof ServerSignalREvent]
