import { useEffect, useRef } from "react"
import {
  addStatusHandler,
  getConnection,
  removeStatusHandler,
} from "./signalr.service"
import type { SignalREvent } from "./constants"
import type { SignalRStatus } from "./types"

export function useSignalREvent<
  T = unknown,
  SE extends SignalREvent | (string & {}) = SignalREvent,
>(eventName: SE, handler: (data: T) => void) {
  const saveHandler = useRef(handler)

  useEffect(() => {
    saveHandler.current = handler
  }, [handler])

  useEffect(() => {
    const wrapped = (data: T) => saveHandler.current(data)

    const conn = getConnection()
    if (conn) {
      conn.on(eventName, wrapped)
      return () => conn.off(eventName, wrapped)
    }

    const onStatus = (status: SignalRStatus) => {
      if (status === "connected") {
        const c = getConnection()
        if (c) c.on(eventName, wrapped)
      }
    }

    addStatusHandler(onStatus)
    return () => removeStatusHandler(onStatus)
  }, [eventName])
}
