import { ValidationErrorCode } from "../types"
import {
  emitValidationError,
  type MetaType,
  type TFunction,
} from "./validation-messages"

export const ValidationFields = {
  USERNAME: "username",
  PASSWORD: "password",
  CONFIRM_PASSWORD: "confirmPassword",
} as const

export type ValidationFields =
  (typeof ValidationFields)[keyof typeof ValidationFields]

type FieldType = ValidationFields | (string & {})

export class ValidationRunner {
  private _t: TFunction
  private _firstError: string | null = null

  constructor(t: TFunction) {
    this._t = t
  }

  required(field: FieldType, value: string): this {
    if (!this._firstError && value.length <= 0) {
      this._firstError = emitValidationError(
        this._t,
        ValidationErrorCode.REQUIRED,
        field,
      )
    }
    return this
  }

  minLength(field: FieldType, value: string, count: number): this {
    if (!this._firstError && value.length < count) {
      this._firstError = emitValidationError(
        this._t,
        ValidationErrorCode.TOO_SHORT,
        field,
        { count },
      )
    }
    return this
  }

  maxLength(field: FieldType, value: string, count: number): this {
    if (!this._firstError && value.length > count) {
      this._firstError = emitValidationError(
        this._t,
        ValidationErrorCode.TOO_LONG,
        field,
        { count },
      )
    }
    return this
  }

  range(
    field: FieldType,
    value: string | number,
    min: number,
    max: number,
  ): this {
    if (this._firstError) {
      return this
    }

    const v = Number(value)
    if (v < min || v > max) {
      this._firstError = emitValidationError(
        this._t,
        ValidationErrorCode.OUT_OF_RANGE,
        field,
        { min, max },
      )
    }
    return this
  }

  equal(field: FieldType, value: string, expected: string): this {
    if (!this._firstError && value !== expected) {
      this._firstError = emitValidationError(
        this._t,
        ValidationErrorCode.MISMATCH,
        field,
      )
    }
    return this
  }

  custom(
    predicate: boolean,
    code: ValidationErrorCode,
    field: FieldType,
    meta?: MetaType,
  ): this {
    if (!this._firstError && predicate) {
      this._firstError = emitValidationError(this._t, code, field, meta)
    }
    return this
  }

  first(): string | null {
    return this._firstError
  }
}

export function validate(t: TFunction): ValidationRunner {
  return new ValidationRunner(t)
}
