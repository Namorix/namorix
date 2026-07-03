export const ServerSignalRGroups = {
  SystemMonitor: "system-monitor",
  Addon: "addon",
} as const

export const ServerSignalREvent = {
  SystemMonitorStatsUpdate: ServerSignalRGroups.SystemMonitor + ":stats-update",
  AddonStatusChanged: ServerSignalRGroups.Addon + ":status-changed",
  AddonPendingTaskChanged: ServerSignalRGroups.Addon + ":pending-task-changed",
  AddonUninstalled: ServerSignalRGroups.Addon + ":uninstalled",
}

export type ServerSignalRGroupsType =
  (typeof ServerSignalRGroups)[keyof typeof ServerSignalRGroups]
export type ServerSignalREventType =
  (typeof ServerSignalREvent)[keyof typeof ServerSignalREvent]
