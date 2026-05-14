export const API_BASE = "/api"
export const API_AUTH_BASE = API_BASE + "/auth"

export const ApiAuthRoutes = {
  status: API_AUTH_BASE + "/status",
  login: API_AUTH_BASE + "/login",
  register: API_AUTH_BASE + "/register",
  refresh: API_AUTH_BASE + "/refresh",
  logout: API_AUTH_BASE + "/logout",
  logoutAll: API_AUTH_BASE + "/logout-all",
  session: API_AUTH_BASE + "/session",
}

export const ApiMiddlewareRoutes = {
  health: API_BASE + "/health",
}
