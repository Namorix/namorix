import { apiSystemError, HttpStatus, SystemErrorCode } from "@namorix/shared"
import type { Request, Response, NextFunction } from "express"
import { sendError } from "@namorix/backend-core"

interface BodyParserError extends Error {
  type?: string
}

export function handleJsonError(
  err: BodyParserError,
  _req: Request,
  res: Response,
  next: NextFunction,
) {
  if (err.type === "entity.parse.failed") {
    sendError(
      res,
      apiSystemError("Invalid JSON", SystemErrorCode.INTERNAL_ERROR),
      HttpStatus.BAD_REQUEST,
    )
    return
  }
  next(err)
}
