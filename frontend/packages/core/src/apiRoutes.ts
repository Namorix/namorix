export const HUB_MAIN = "/hubs/main"

export const API_BASE = "/api"
export const API_AUTH_BASE = API_BASE + "/auth"
export const API_USER_BASE = API_BASE + "/user"
export const API_TRAFFIC_BASE = API_BASE + "/traffic"
export const API_SETTINGS_BASE = API_BASE + "/settings"

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
}

export const ThemeRoutes = {
  themes: "/themes/{id}/{path}",
}
