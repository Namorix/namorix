import {
  type ApiErrorCode,
  AuthErrorCodes,
  HttpErrorCodes,
  ValidationErrorCodes,
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

/** @see {@link AuthErrorCodes} */
export const apiAuthError = createApiError<AuthErrorCodes>()

/** @see {@link HttpErrorCodes} */
export const apiHttpError = createApiError<HttpErrorCodes>()

/** @see {@link ValidationErrorCodes} */
export const apiValidateError = createApiError<ValidationErrorCodes>()
