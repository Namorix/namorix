import type { Request, Response, NextFunction } from "express"
import { sendError } from "../utils"
import {
  apiValidateError,
  HttpStatus,
  ValidationErrorCode,
  type ValidationErrorMeta,
} from "@namorix/shared"

type FieldType = "string" | "number" | "boolean"

export interface Rule {
  required?: boolean
  type?: FieldType
  minLength?: number
  maxLength?: number
  min?: number
  max?: number
  pattern?: RegExp
  trim?: boolean
  enum?: unknown[]
}

export type Schema = Record<string, Rule>

function validateField(
  _field: string,
  value: unknown,
  rule: Rule,
): { code?: ValidationErrorCode; meta?: ValidationErrorMeta } | null {
  if (
    rule.required &&
    (value === undefined || value === null || value === "")
  ) {
    return { code: ValidationErrorCode.REQUIRED }
  }

  if (value === undefined || value === null) {
    return null
  }

  if (rule.type && typeof value !== rule.type) {
    return { code: ValidationErrorCode.INVALID_TYPE }
  }

  if (rule.trim && typeof value === "string") {
    value = value.trim()
    if (value === "") {
      return { code: ValidationErrorCode.REQUIRED }
    }
  }

  if (typeof value === "string") {
    if (rule.minLength !== undefined && value.length < rule.minLength) {
      return {
        code: ValidationErrorCode.TOO_SHORT,
        meta: { minLength: rule.minLength },
      }
    }

    if (rule.maxLength !== undefined && value.length > rule.maxLength) {
      return {
        code: ValidationErrorCode.TOO_LONG,
        meta: { maxLength: rule.maxLength },
      }
    }

    if (rule.pattern && !rule.pattern.test(value)) {
      return {
        code: ValidationErrorCode.INVALID_FORMAT,
        meta: { pattern: rule.pattern },
      }
    }
  }

  if (typeof value === "number") {
    if (rule.min !== undefined && value < rule.min) {
      return { code: ValidationErrorCode.OUT_OF_RANGE, meta: { min: rule.min } }
    }

    if (rule.max !== undefined && value > rule.max) {
      return { code: ValidationErrorCode.OUT_OF_RANGE, meta: { max: rule.max } }
    }
  }

  if (rule.enum && !rule.enum.includes(value)) {
    return { code: ValidationErrorCode.INVALID_ENUM, meta: { enum: rule.enum } }
  }

  return null
}

export function validate(schema: Schema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const body = req.body as Record<string, unknown>
    for (const [field, rule] of Object.entries(schema)) {
      let value = body[field]
      if (rule.trim && typeof value === "string") {
        value = value.trim()
        body[field] = value
      }

      const result = validateField(field, value, rule)
      if (result) {
        sendError(
          res,
          apiValidateError(
            "Validation failed",
            result.code,
            field,
            result.meta,
          ),
          HttpStatus.BAD_REQUEST,
        )
        return
      }
    }
    next()
  }
}
