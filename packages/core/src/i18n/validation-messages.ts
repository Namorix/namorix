import { ApiError } from "../http"
import { AuthErrorCode, ValidationErrorCode } from "@namorix/shared"

export type TFunction = (
  key: string,
  options?: Record<string, unknown>,
) => string
export type MetaType = Record<string, unknown>

export interface ValidationMessage {
  key: string
  params: Record<string, unknown>
}

export interface ValidationRule {
  predicate: boolean
  code: ValidationErrorCode
  field: string
  meta?: MetaType
}

export function createValidationMessage(
  code: ValidationErrorCode,
  fieldKey: string,
  meta?: MetaType,
): ValidationMessage {
  const params: Record<string, unknown> = { $field: fieldKey, ...meta }

  let key: string
  switch (code) {
    case ValidationErrorCode.REQUIRED:
      key = "common.validation.required"
      break
    case ValidationErrorCode.TOO_SHORT:
      key = "common.validation.min"
      break
    case ValidationErrorCode.TOO_LONG:
      key = "common.validation.max"
      break
    case ValidationErrorCode.OUT_OF_RANGE:
      key = "common.validation.range"
      break
    case ValidationErrorCode.MISMATCH:
      key = "common.validation.mismatch"
      break
    default:
      key = "common.validation.invalidFormat"
  }
  return { key, params }
}

export function formatValidationMessage(
  t: TFunction,
  message: ValidationMessage,
  customField?: string,
): string {
  let field: string
  if (customField) {
    field = customField
  } else {
    const fullKey = `common.fields.${message.params.$field as string}`
    const translated = t(fullKey)
    // Key not exists -> use raw field name
    field = translated === fullKey ? String(message.params.$field) : translated
  }
  return t(message.key, { ...message.params, field })
}

export function emitValidationError(
  t: TFunction,
  code: ValidationErrorCode,
  fieldKey: string,
  meta?: MetaType,
  customField?: string,
): string {
  return formatValidationMessage(
    t,
    createValidationMessage(code, fieldKey, meta),
    customField,
  )
}

export function resolveValidationError(
  err: ApiError,
): ValidationMessage | null {
  const code = err.code
  if (
    !code ||
    !Object.values(ValidationErrorCode).includes(code as ValidationErrorCode)
  ) {
    return null
  }

  const params: Record<string, unknown> = {
    $field: err.field ?? "unknown",
  }

  switch (code) {
    case ValidationErrorCode.REQUIRED:
      return { key: "common.validation.required", params }
    case ValidationErrorCode.TOO_SHORT:
      return {
        key: "common.validation.min",
        params: { ...params, count: err.meta?.minLength },
      }
    case ValidationErrorCode.TOO_LONG:
      return {
        key: "common.validation.max",
        params: { ...params, count: err.meta?.maxLength },
      }
    case ValidationErrorCode.OUT_OF_RANGE:
      return {
        key: "common.validation.range",
        params: { ...params, min: err.meta?.min ?? 0, max: err.meta?.max ?? 0 },
      }
    case ValidationErrorCode.INVALID_FORMAT:
    case ValidationErrorCode.INVALID_TYPE:
    case ValidationErrorCode.INVALID_ENUM:
      return { key: "common.validation.invalidFormat", params }
    default:
      return null
  }
}

export function resolveAuthError(err: ApiError): ValidationMessage | null {
  const code = err.code
  if (!code || !Object.values(AuthErrorCode).includes(code as AuthErrorCode)) {
    return null
  }

  let key: string
  switch (code) {
    case AuthErrorCode.INVALID_CREDENTIALS:
      key = "common.auth.errors.invalidCredentials"
      break
    case AuthErrorCode.USERNAME_EXISTS:
      key = "common.auth.errors.usernameExists"
      break
    case AuthErrorCode.UNAUTHORIZED:
      key = "common.auth.errors.unauthorized"
      break
    case AuthErrorCode.REGISTER_CLOSED:
      key = "common.auth.errors.registerClosed"
      break
    default:
      return null
  }

  return { key, params: {} }
}

export function formatValidationError(
  t: TFunction,
  err: ApiError,
  customField?: string,
): string | null {
  const resolved = resolveValidationError(err)
  if (!resolved) {
    return null
  }

  const field =
    customField ?? t(`common.fields.${resolved.params.$field as string}`)
  return t(resolved.key, { ...resolved.params, field })
}

export function formatAuthError(t: TFunction, err: ApiError): string | null {
  const resolved = resolveAuthError(err)
  return resolved ? t(resolved.key) : null
}

export function formatApiError(t: TFunction, err: ApiError): string | null {
  return formatValidationError(t, err) ?? formatAuthError(t, err)
}

export function runValidation(
  t: TFunction,
  rules: ValidationRule[],
): string | null {
  for (const rule of rules) {
    if (rule.predicate) {
      return emitValidationError(t, rule.code, rule.field, rule.meta)
    }
  }
  return null
}
