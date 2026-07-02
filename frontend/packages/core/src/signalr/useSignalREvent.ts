import { useEffect, useRef } from "react"
import { getConnection } from "./signalr.service"
import type { SignalREvent } from "./constants"

export function useSignalREvent<
  T = unknown,
  SE extends SignalREvent | (string & {}) = SignalREvent,
>(eventName: SE, handler: (data: T) => void) {
  const saveHandler = useRef(handler)

  useEffect(() => {
    saveHandler.current = handler
  }, [handler])

  useEffect(() => {
    console.log("[useSignalREvent] register", eventName)
    const wrapped = (data: T) => saveHandler.current(data)

    const conn = getConnection()
    if (conn) {
      conn.on(eventName, wrapped)
      return () => {
        console.log("[useSignalREvent] unregister", eventName)
        conn.off(eventName, wrapped)
      }
    }
  }, [eventName])
}
