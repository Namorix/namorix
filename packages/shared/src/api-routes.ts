export const API_AUTH_BASE = "/api/auth"

export const ApiAuthRoutes = {
  status: API_AUTH_BASE + "/status",
  signin: API_AUTH_BASE + "/signin",
  signup: API_AUTH_BASE + "/signup",
  refresh: API_AUTH_BASE + "/refresh",
  signout: API_AUTH_BASE + "/signout",
  signoutAll: API_AUTH_BASE + "/signout-all",
  session: API_AUTH_BASE + "/session",
}
