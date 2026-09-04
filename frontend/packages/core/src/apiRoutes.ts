export const HUB_MAIN = "/hubs/namorix"

export const API_BASE = "/api"
export const API_ABOUT_BASE = API_BASE + "/about"
export const API_AUTH_BASE = API_BASE + "/auth"
export const API_USER_BASE = API_BASE + "/user"
export const API_TRAFFIC_BASE = API_BASE + "/traffic"
export const API_SETTINGS_BASE = API_BASE + "/settings"
export const API_NOTIFICATION_BASE = API_BASE + "/notifications"
export const API_ADDON_BASE = API_BASE + "/addons"
export const API_FRONTGATE_BASE = API_BASE + "/frontgate"
export const API_BEACON_BASE = API_BASE + "/beacon"
export const API_WARDEN_BASE = API_BASE + "/warden"
export const API_OAUTH_BASE = API_BASE + "/oauth"

export const ApiAboutRoutes = {
  base: API_ABOUT_BASE,
}

export const ApiAuthRoutes = {
  status: API_AUTH_BASE + "/status",
  login: API_AUTH_BASE + "/login",
  register: API_AUTH_BASE + "/register",
  refresh: API_AUTH_BASE + "/refresh",
  logout: API_AUTH_BASE + "/logout",
  logoutAll: API_AUTH_BASE + "/logout-all",
  session: API_AUTH_BASE + "/session",
}

export const ApiUserRoutes = {
  settings: API_USER_BASE + "/settings",
  profile: API_USER_BASE + "/profile",
  password: API_USER_BASE + "/password",
}

export const ApiMiddlewareRoutes = {
  health: API_BASE + "/health",
}

export const ApiThemeRoutes = {
  themes: API_BASE + "/themes",
}

export const ApiTrafficRoutes = {
  base: API_TRAFFIC_BASE,
  endpoints: API_TRAFFIC_BASE + "/endpoints",
  logs: API_TRAFFIC_BASE + "/logs",
  stats: API_TRAFFIC_BASE + "/stats",
}

export const ApiLogRoutes = {
  logs: API_BASE + "/logs",
}

export const ApiSettingsRoutes = {
  system: API_SETTINGS_BASE + "/system",
  appearanceOptions: API_SETTINGS_BASE + "/appearance/options",
  appearanceSystem: API_SETTINGS_BASE + "/appearance",
  appearanceMerged: API_SETTINGS_BASE + "/appearance/merged",
}

export const ApiNotificationRoutes = {
  base: API_NOTIFICATION_BASE,
  unreadCount: API_NOTIFICATION_BASE + "/unread-count",
  readAll: API_NOTIFICATION_BASE + "/read-all",
  deleteRead: API_NOTIFICATION_BASE + "/read",
}

export const ThemeRoutes = {
  themes: "/themes/{id}/{path}",
}

export const ApiAddonRoutes = {
  list: API_ADDON_BASE,
  install: API_ADDON_BASE + "/install",
  start: (id: string) => `${API_ADDON_BASE}/${id}/start`,
  stop: (id: string) => `${API_ADDON_BASE}/${id}/stop`,
  remove: (id: string) => `${API_ADDON_BASE}/${id}`,
  listCatalog: `${API_ADDON_BASE}/catalog`,
  syncCatalog: `${API_ADDON_BASE}/catalog/sync`,
} as const

export const ApiFrontgateRoutes = {
  reverseProxy: API_FRONTGATE_BASE + "/reverse-proxy",
  reverseProxyById: (id: string) => `${API_FRONTGATE_BASE}/reverse-proxy/${id}`,
  reverseProxyDryRunConfirm: (id: string) =>
    `${API_FRONTGATE_BASE}/reverse-proxy/${id}/dry-run/confirm`,
  reverseProxyDryRunCancel: (id: string) =>
    `${API_FRONTGATE_BASE}/reverse-proxy/${id}/dry-run/cancel`,

  certificates: API_FRONTGATE_BASE + "/certificates",
  certificatesAll: API_FRONTGATE_BASE + "/certificates/all",
  certificateUnusedDomains: `${API_FRONTGATE_BASE}/certificates/unused-domains`,
  certificateById: (id: string) => `${API_FRONTGATE_BASE}/certificates/${id}`,
  certificateRetry: (id: string) =>
    `${API_FRONTGATE_BASE}/certificates/${id}/retry`,
  certificateRenew: (id: string) =>
    `${API_FRONTGATE_BASE}/certificates/${id}/renew`,
  certificatesLetsEncryptHttp:
    API_FRONTGATE_BASE + "/certificates/letsencrypt-http",
  certificatesLetsEncryptHttpDryRun:
    API_FRONTGATE_BASE + "/certificates/letsencrypt-http/dry-run",
  certificatesCustom: API_FRONTGATE_BASE + "/certificates/custom",
  certificateDownload: (id: string) =>
    `${API_FRONTGATE_BASE}/certificates/${id}/download`,

  accessPolicies: API_FRONTGATE_BASE + "/access-policies",
  accessPolicyById: (id: string) =>
    `${API_FRONTGATE_BASE}/access-policies/${id}`,

  audit: API_FRONTGATE_BASE + "/audit",
  geoIp: API_FRONTGATE_BASE + "/geoip",
  geoIpRollback: API_FRONTGATE_BASE + "/geoip/rollback",
} as const

export const ApiBeaconRoutes = {
  hostnames: API_BEACON_BASE + "/hostnames",
  hostnameById: (id: string) => `${API_BEACON_BASE}/hostnames/${id}`,
  hostnameTest: API_BEACON_BASE + "/hostnames/test",
  activity: API_BEACON_BASE + "/activity",
  providers: API_BEACON_BASE + "/providers",
  settings: API_BEACON_BASE + "/settings",
  status: API_BEACON_BASE + "/status",
  refresh: API_BEACON_BASE + "/refresh",
  hostnameToggle: (id: string) => `${API_BEACON_BASE}/hostnames/${id}/toggle`,
  hostnameCheck: (id: string) => `${API_BEACON_BASE}/hostnames/${id}/check`,
}

export const ApiWardenRoutes = {
  rules: API_WARDEN_BASE + "/rules",
  ruleById: (id: number) => `${API_WARDEN_BASE}/rules/${id}`,
  ruleToggle: (id: number) => `${API_WARDEN_BASE}/rules/${id}/toggle`,
  settings: API_WARDEN_BASE + "/settings",
  stats: API_WARDEN_BASE + "/stats",
  events: API_WARDEN_BASE + "/events",
} as const

export const ApiOauthRoutes = {
  status: API_OAUTH_BASE + "/status",
  login: API_OAUTH_BASE + "/login",
}
