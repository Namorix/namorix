import {
  type ApiErrorCode,
  AuthErrorCode,
  SystemErrorCode,
  ValidationErrorCode,
} from "./error"
import type { ApiResponse } from "./api"

export const apiSuccess = <T>(data: T): ApiResponse<T> => ({
  success: true,
  data,
})

const createApiError =
  <T extends ApiErrorCode>() =>
  (
    error: string,
    code?: T,
    field?: string,
    meta?: Record<string, unknown>,
  ): ApiResponse & { code?: T } => ({
    success: false,
    error,
    code,
    field,
    ...(meta && { meta }),
  })

/** @see {@link AuthErrorCode} */
export const apiAuthError = createApiError<AuthErrorCode>()

/** @see {@link SystemErrorCode} */
export const apiSystemError = createApiError<SystemErrorCode>()

/** @see {@link ValidationErrorCode} */
export const apiValidateError = createApiError<ValidationErrorCode>()
