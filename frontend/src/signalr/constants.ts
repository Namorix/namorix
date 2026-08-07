export const ServerSignalRGroups = {
  SystemMonitor: "system-monitor",
  Addon: "addon",
  Beacon: "beacon",
  Frontgate: "frontgate",
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
  FrontgateCertStatusChanged:
    ServerSignalRGroups.Frontgate + ":cert-status-changed",
}

export type ServerSignalRGroupsType =
  (typeof ServerSignalRGroups)[keyof typeof ServerSignalRGroups]
export type ServerSignalREventType =
  (typeof ServerSignalREvent)[keyof typeof ServerSignalREvent]
