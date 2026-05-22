import type { ValidationErrorMeta } from "./validate"
import type { ApiErrorCode } from "./error"

export type ApiResponse<T = null> =
  | {
      success: true
      data: T
    }
  | {
      success: false
      error: string
      code?: ApiErrorCode
      field?: string
      meta?: ValidationErrorMeta
    }
