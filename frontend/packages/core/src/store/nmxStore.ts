import type { NmxStoreKey, NmxStoreValue } from "./types"

type Listener = (value: unknown) => void

const state: NmxStoreValue = {
  user: null,
  theme: null,
  connectionStatus: "disconnected",
  needsRegister: false,
  registerEnabled: false,
  config: {},
  appearance: {},
}

const listeners = new Map<string, Set<Listener>>()

export const nmxStore = {
  get<K extends NmxStoreKey>(key: K): NmxStoreValue[K] {
    return state[key]
  },

  set<K extends NmxStoreKey>(key: K, value: NmxStoreValue[K]): void {
    state[key] = value
    listeners.get(key)?.forEach((fn) => fn(value))
  },

  subscribe<K extends NmxStoreKey>(
    key: K,
    fn: (value: NmxStoreValue[K]) => void,
  ): () => void {
    if (!listeners.has(key)) {
      listeners.set(key, new Set())
    }

    listeners.get(key)!.add(fn as Listener)
    return () => {
      listeners.get(key)?.delete(fn as Listener)
    }
  },
}
