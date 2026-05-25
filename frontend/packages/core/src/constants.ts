export const NMX_COOKIE_ACCESS_KEY = "nmx_access_token"
export const NMX_COOKIE_REFRESH_KEY = "nmx_refresh_token"
export const NMX_COOKIE_CSRF_KEY = "nmx_csrf_token"

export const NMX_THEME_CSS_ID = "nmx-themes-css"
export const NMX_THEME_STORAGE_KEY = "nmx-themes-id"
export const NMX_THEME_CSS_PATH_KEY = "nmx-themes-css-url"

export const AuthConstraints = {
  username: { minLength: 1, maxLength: 32 },
  password: { minLength: 8 },
}

export const HttpMethods = {
  GET: "GET",
  POST: "POST",
  PUT: "PUT",
  PATCH: "PATCH",
  DELETE: "DELETE",
  HEAD: "HEAD",
  OPTIONS: "OPTIONS",
} as const

export type LogLevel = "trace" | "debug" | "info" | "warn" | "error" | "fatal"

export const PaginationDefaults = {
  defaultPageSize: 30,
  pageSizeOptions: [10, 20, 30, 50, 100],
  storageKey: "nmx_page_size",
}

export type HttpMethods = (typeof HttpMethods)[keyof typeof HttpMethods]
