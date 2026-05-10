import type { Response } from "express"
import { apiSuccess, HttpStatus, type ApiResponse } from "@namorix/shared"

export const sendSuccess = <T>(
  res: Response,
  data: T,
  status: HttpStatus = HttpStatus.OK,
): Response<ApiResponse<T>> =>
  res.status(status).json(apiSuccess(data)) as Response<ApiResponse<T>>

/**
 * Send an error response with a specific HTTP status code
 * @param res
 * @param error {@link apiAuthError} | {@link apiSystemError} | {@link apiValidateError}
 * @param status
 */
export const sendError = (
  res: Response,
  error: ApiResponse,
  status: HttpStatus,
) => res.status(status).json(error)
