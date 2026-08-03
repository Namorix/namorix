import type { ApiResponse, ValidationErrorMeta } from "../types"

export class ApiError extends Error {
  code?: string
  field?: string
  meta?: ValidationErrorMeta
  params?: Record<string, unknown>

  constructor(
    error: string,
    code?: string,
    field?: string,
    meta?: ValidationErrorMeta,
    params?: Record<string, unknown>,
  ) {
    super(error)
    this.code = code
    this.field = field
    this.meta = meta
    this.params = params
  }

  static fromResponse(data: ApiResponse): ApiError {
    if (data.success) {
      throw new Error("Cannot create ApiError from success response")
    }
    return new ApiError(
      data.error,
      data.code,
      data.field,
      data.meta,
      data.params,
    )
  }
}
