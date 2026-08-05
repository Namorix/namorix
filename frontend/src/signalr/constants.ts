export const ServerSignalRGroups = {
  SystemMonitor: "system-monitor",
  Addon: "addon",
  Beacon: "beacon",
} as const

export const ServerSignalREvent = {
  SystemMonitorStatsUpdate: ServerSignalRGroups.SystemMonitor + ":stats-update",
  AddonStatusChanged: ServerSignalRGroups.Addon + ":status-changed",
  AddonPendingTaskChanged: ServerSignalRGroups.Addon + ":pending-task-changed",
  AddonUninstalled: ServerSignalRGroups.Addon + ":uninstalled",
  BeaconHostnameStatusChanged:
    ServerSignalRGroups.Beacon + ":hostname-status-changed",
  BeaconActivityCreated: ServerSignalRGroups.Beacon + ":activity-created",
  BeaconHostnamesRefreshed: ServerSignalRGroups.Beacon + ":hostnames-refreshed",
}

export type ServerSignalRGroupsType =
  (typeof ServerSignalRGroups)[keyof typeof ServerSignalRGroups]
export type ServerSignalREventType =
  (typeof ServerSignalREvent)[keyof typeof ServerSignalREvent]
