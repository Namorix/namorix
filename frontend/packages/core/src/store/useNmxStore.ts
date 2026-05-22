import type { NmxStoreKey, NmxStoreValue } from "./types"
import { useEffect, useState } from "react"
import { nmxStore } from "./nmxStore"

export function useNmxStore<K extends NmxStoreKey>(key: K): NmxStoreValue[K] {
  const [value, setValue] = useState(() => nmxStore.get(key))

  useEffect(() => {
    nmxStore.subscribe(key, setValue)
  }, [key])
  return value
}
