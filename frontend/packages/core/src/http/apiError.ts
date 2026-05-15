import type { ApiResponse, ValidationErrorMeta } from "../types"

export class ApiError extends Error {
  code?: string
  field?: string
  meta?: ValidationErrorMeta

  constructor(
    error: string,
    code?: string,
    field?: string,
    meta?: ValidationErrorMeta,
  ) {
    super(error)
    this.code = code
    this.field = field
    this.meta = meta
  }

  static fromResponse(data: ApiResponse): ApiError {
    if (data.success) {
      throw new Error("Cannot create ApiError from success response")
    }
    return new ApiError(data.error, data.code, data.field, data.meta)
  }
}
