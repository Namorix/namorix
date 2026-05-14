import type { ValidationErrorMeta } from "./validate"

export type ApiResponse<T = null> =
  | {
      success: true
      data: T
    }
  | {
      success: false
      error: string
      code?: string
      field?: string
      meta?: ValidationErrorMeta
    }
