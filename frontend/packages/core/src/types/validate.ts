export interface ValidationErrorMeta {
  [key: string]: unknown
  minLength?: number
  maxLength?: number
  min?: number
  max?: number
  pattern?: RegExp
  enum?: unknown[]
}
