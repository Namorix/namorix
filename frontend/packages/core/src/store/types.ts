import type { User } from "../types"
import type { SignalRStatus } from "../signalr"

export interface NmxStoreValue {
  user: User | null
  theme: string | null
  connectionStatus: SignalRStatus
  registerEnabled: boolean
  config: Record<string, unknown>
}

export type NmxStoreKey = keyof NmxStoreValue

export const NmxStoreKeys: { [K in NmxStoreKey]: K } = {
  user: "user",
  theme: "theme",
  connectionStatus: "connectionStatus",
  registerEnabled: "registerEnabled",
  config: "config",
}
