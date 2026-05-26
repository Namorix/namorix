export type NmxSpacing = "xs" | "sm" | "md" | "lg" | "xl"
export type NmxButtonVariant = "outline" | "filled" | "text" | "ghost"
export type NmxSemanticColor =
  | "primary"
  | "trace"
  | "debug"
  | "info"
  | "warning"
  | "error"
  | "fatal"
  | "success"

export type NmxCxInput =
  | string
  | undefined
  | null
  | false
  | Record<string, boolean>
