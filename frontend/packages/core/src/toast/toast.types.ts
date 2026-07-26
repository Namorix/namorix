export type NmxToastType = "success" | "error" | "warning" | "info"
export type NmxToastDuration = "long" | "short"

export interface NmxToastEvent {
  id: string
  message: unknown
  type: NmxToastType
  duration: NmxToastDuration
}
