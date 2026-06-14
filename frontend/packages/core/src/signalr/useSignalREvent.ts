import { useEffect } from "react"
import { getConnection } from "./signalr.service"
import type { SignalREvent } from "./constants"

export function useSignalREvent<
  T = unknown,
  SE extends SignalREvent | (string & {}) = SignalREvent,
>(eventName: SE, handler: (data: T) => void) {
  useEffect(() => {
    const conn = getConnection()
    if (!conn) return

    conn.on(eventName, handler)
    return () => {
      conn.off(eventName, handler)
    }
  }, [eventName, handler])
}
