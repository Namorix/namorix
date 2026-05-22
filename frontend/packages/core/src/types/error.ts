export const AuthErrorCodes = {
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
  USERNAME_EXISTS: "USERNAME_EXISTS",
  UNAUTHORIZED: "UNAUTHORIZED",
  REGISTER_CLOSED: "REGISTER_CLOSED",
} as const

export const HttpErrorCodes = {
  NOT_FOUND: "NOT_FOUND",
  INTERNAL_ERROR: "INTERNAL_ERROR",
  CONNECTION_LOST: "CONNECTION_LOST",
} as const

export const MiddlewareErrorCodes = {
  CSRF_TOKEN_MISMATCH: "CSRF_TOKEN_MISMATCH",
  UNSUPPORTED_MEDIA_TYPE: "UNSUPPORTED_MEDIA_TYPE",
  INVALID_REQUEST_BODY: "INVALID_REQUEST_BODY",
  RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED",
  UNTRUSTED_PROXY: "UNTRUSTED_PROXY",
} as const

export const ValidationErrorCodes = {
  REQUIRED: "REQUIRED",
  TOO_SHORT: "TOO_SHORT",
  TOO_LONG: "TOO_LONG",
  MISMATCH: "MISMATCH",
  INVALID_FORMAT: "INVALID_FORMAT",
  INVALID_TYPE: "INVALID_TYPE",
  OUT_OF_RANGE: "OUT_OF_RANGE",
  INVALID_ENUM: "INVALID_ENUM",
} as const

export type AuthErrorCodes =
  (typeof AuthErrorCodes)[keyof typeof AuthErrorCodes]
export type HttpErrorCodes =
  (typeof HttpErrorCodes)[keyof typeof HttpErrorCodes]
export type MiddlewareErrorCodes =
  (typeof MiddlewareErrorCodes)[keyof typeof MiddlewareErrorCodes]
export type ValidationErrorCodes =
  (typeof ValidationErrorCodes)[keyof typeof ValidationErrorCodes]
export type ApiErrorCode =
  | AuthErrorCodes
  | HttpErrorCodes
  | MiddlewareErrorCodes
  | ValidationErrorCodes
