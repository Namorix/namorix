import { useEffect } from "react"
import { getConnection } from "./signalr.service"
import type { SignalREvent } from "./constants"

export function useSignalREvent<T = unknown>(
  eventName: SignalREvent,
  handler: (data: T) => void,
) {
  useEffect(() => {
    const conn = getConnection()
    if (!conn) return

    conn.on(eventName, handler)
    return () => {
      conn.off(eventName)
    }
  }, [eventName, handler])
}
