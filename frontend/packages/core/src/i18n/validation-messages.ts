import { ApiError } from "../http"
import {
  AuthErrorCodes,
  MiddlewareErrorCodes,
  ValidationErrorCodes,
} from "../types"

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
  code: ValidationErrorCodes
  field: string
  meta?: MetaType
}

export function createValidationMessage(
  code: ValidationErrorCodes,
  fieldKey: string,
  meta?: MetaType,
): ValidationMessage {
  const params: Record<string, unknown> = { $field: fieldKey, ...meta }

  let key: string
  switch (code) {
    case ValidationErrorCodes.REQUIRED:
      key = "common.validation.required"
      break
    case ValidationErrorCodes.TOO_SHORT:
      key = "common.validation.min"
      break
    case ValidationErrorCodes.TOO_LONG:
      key = "common.validation.max"
      break
    case ValidationErrorCodes.OUT_OF_RANGE:
      key = "common.validation.range"
      break
    case ValidationErrorCodes.MISMATCH:
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
  code: ValidationErrorCodes,
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
    !Object.values(ValidationErrorCodes).includes(code as ValidationErrorCodes)
  ) {
    return null
  }

  const params: Record<string, unknown> = {
    $field: err.field ?? "unknown",
  }

  switch (code) {
    case ValidationErrorCodes.REQUIRED:
      return { key: "common.validation.required", params }
    case ValidationErrorCodes.TOO_SHORT:
      return {
        key: "common.validation.min",
        params: { ...params, count: err.meta?.minLength },
      }
    case ValidationErrorCodes.TOO_LONG:
      return {
        key: "common.validation.max",
        params: { ...params, count: err.meta?.maxLength },
      }
    case ValidationErrorCodes.OUT_OF_RANGE:
      return {
        key: "common.validation.range",
        params: { ...params, min: err.meta?.min ?? 0, max: err.meta?.max ?? 0 },
      }
    case ValidationErrorCodes.INVALID_FORMAT:
    case ValidationErrorCodes.INVALID_TYPE:
    case ValidationErrorCodes.INVALID_ENUM:
      return { key: "common.validation.invalidFormat", params }
    default:
      return null
  }
}

export function resolveAuthError(err: ApiError): ValidationMessage | null {
  const code = err.code
  if (
    !code ||
    !Object.values(AuthErrorCodes).includes(code as AuthErrorCodes)
  ) {
    return null
  }

  let key: string
  switch (code) {
    case AuthErrorCodes.INVALID_CREDENTIALS:
      key = "common.auth.errors.invalidCredentials"
      break
    case AuthErrorCodes.USERNAME_EXISTS:
      key = "common.auth.errors.usernameExists"
      break
    case AuthErrorCodes.EMAIL_EXISTS:
      key = "common.auth.errors.emailExists"
      break
    case AuthErrorCodes.NAME_EXISTS:
      key = "common.auth.errors.nameExists"
      break
    case AuthErrorCodes.UNAUTHORIZED:
      key = "common.auth.errors.unauthorized"
      break
    case AuthErrorCodes.REGISTER_CLOSED:
      key = "common.auth.errors.registerClosed"
      break
    case AuthErrorCodes.INCORRECT_PASSWORD:
      key = "common.auth.errors.incorrectPassword"
      break
    case AuthErrorCodes.PASSWORD_CHANGE_FAILED:
      key = "common.auth.errors.passwordChangeFailed"
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
  return (
    formatValidationError(t, err) ??
    formatAuthError(t, err) ??
    formatMiddlewareError(t, err)
  )
}

export function formatMiddlewareError(
  t: TFunction,
  err: ApiError,
): string | null {
  if (err.code === MiddlewareErrorCodes.UNTRUSTED_PROXY) {
    return t("common.errors.untrustedProxy")
  }
  return null
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

export function resolveError(
  t: TFunction,
  err: unknown,
  genericKey: string,
): string {
  if (err instanceof ApiError) {
    return formatApiError(t, err) ?? t(genericKey)
  }
  if (err instanceof Error) {
    return err.message
  }
  return t(genericKey)
}
