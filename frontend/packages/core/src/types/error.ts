export const AuthErrorCode = {
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
  USERNAME_EXISTS: "USERNAME_EXISTS",
  UNAUTHORIZED: "UNAUTHORIZED",
  REGISTER_CLOSED: "REGISTER_CLOSED",
} as const

export const SystemErrorCode = {
  INTERNAL_ERROR: "INTERNAL_ERROR",
  NOT_FOUND: "NOT_FOUND",
  CSRF_MISMATCH: "CSRF_MISMATCH",
} as const

export const ValidationErrorCode = {
  REQUIRED: "REQUIRED",
  TOO_SHORT: "TOO_SHORT",
  TOO_LONG: "TOO_LONG",
  MISMATCH: "MISMATCH",
  INVALID_FORMAT: "INVALID_FORMAT",
  INVALID_TYPE: "INVALID_TYPE",
  OUT_OF_RANGE: "OUT_OF_RANGE",
  INVALID_ENUM: "INVALID_ENUM",
} as const

export type AuthErrorCode = (typeof AuthErrorCode)[keyof typeof AuthErrorCode]
export type SystemErrorCode =
  (typeof SystemErrorCode)[keyof typeof SystemErrorCode]
export type ValidationErrorCode =
  (typeof ValidationErrorCode)[keyof typeof ValidationErrorCode]
export type ApiErrorCode = AuthErrorCode | SystemErrorCode | ValidationErrorCode
