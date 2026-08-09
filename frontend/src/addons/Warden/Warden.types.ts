export type WdRuleAction = "allow" | "deny"
export type WdProtocol = "any" | "tcp" | "udp" | "icmp"
export type WdSeverity = "info" | "warning" | "critical"
export type WdSecurityProfile = "low" | "medium" | "high" | "custom"

export const WardenErrorCodes: Record<string, string> = {
  WD_RULE_NOT_FOUND: "addon.warden.errors.ruleNotFound",
  WD_IP_ALREADY_BANNED: "addon.warden.errors.ipAlreadyBanned",
  WD_INVALID_CIDR: "addon.warden.errors.invalidCidr",
  WD_INVALID_PORTS: "addon.warden.errors.invalidPorts",
}

export interface WdFirewallRule {
  id: number
  name: string
  sourceCidr: string | null
  ports: string | null
  protocol: WdProtocol
  action: WdRuleAction
  enabled: boolean
  auto: boolean
  priority: number | null
  expiresAt: string | null
  createdAt: string
}

export interface WdSecurityEvent {
  id: number
  eventType: string
  severity: WdSeverity
  sourceAddon: string
  sourceIp: string
  count: number
  windowStart: string
  detailJson: string | null
  timestamp: string
}

export interface WdSettings {
  id: number
  firewallEnabled: boolean
  profile: WdSecurityProfile
  updatedAt: string
}

export interface WdStats {
  activeRules: number
  blockedToday: number
  openPorts: number
}

export interface WdEventQuery {
  page?: number
  size?: number
  ip?: string
  type?: string
  severity?: WdSeverity
}
