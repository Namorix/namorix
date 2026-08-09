export const ServerSignalRGroups = {
  SystemMonitor: "system-monitor",
  Addon: "addon",
  Beacon: "beacon",
  Frontgate: "frontgate",
  Warden: "warden",
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
  BeaconHostnameChanged: ServerSignalRGroups.Beacon + ":hostname-changed",
  FrontgateCertStatusChanged:
    ServerSignalRGroups.Frontgate + ":cert-status-changed",
  FrontgateRuleChanged: ServerSignalRGroups.Frontgate + ":rule-changed",
  FrontgateDryRunChanged: ServerSignalRGroups.Frontgate + ":dry-run-changed",
  FrontgateCertChanged: ServerSignalRGroups.Frontgate + ":cert-changed",
  FrontgateAuditCreated: ServerSignalRGroups.Frontgate + ":audit-created",
  WardenNewEvent: ServerSignalRGroups.Warden + ":new-event",
}

export type ServerSignalRGroupsType =
  (typeof ServerSignalRGroups)[keyof typeof ServerSignalRGroups]
export type ServerSignalREventType =
  (typeof ServerSignalREvent)[keyof typeof ServerSignalREvent]
