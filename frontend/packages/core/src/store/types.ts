import type { AppearanceSettings, User } from "../types"
import type { SignalRStatus } from "../signalr"

export interface NmxStoreValue {
  user: User | null
  theme: string | null
  connectionStatus: SignalRStatus
  registerEnabled: boolean
  needsRegister: boolean
  config: Record<string, unknown>
  appearance: AppearanceSettings | null
}

export type NmxStoreKey = keyof NmxStoreValue

export const NmxStoreKeys: { [K in NmxStoreKey]: K } = {
  user: "user",
  theme: "theme",
  connectionStatus: "connectionStatus",
  registerEnabled: "registerEnabled",
  needsRegister: "needsRegister",
  config: "config",
  appearance: "appearance",
}
