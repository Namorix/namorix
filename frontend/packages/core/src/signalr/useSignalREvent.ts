import { useEffect, useRef } from "react"
import { getSignalrClient, resolveHubPath } from "./signalr.service"
import type { SignalREvent } from "./constants"

export function useSignalREvent<
  T = unknown,
  SE extends SignalREvent | (string & {}) = SignalREvent,
>(eventName: SE, handler: (data: T) => void, hubPath: string = resolveHubPath()) {
  const saveHandler = useRef(handler)

  useEffect(() => {
    saveHandler.current = handler
  }, [handler])

  useEffect(() => {
    const client = getSignalrClient(hubPath)
    const wrapped = (data: T) => saveHandler.current(data)

    client.on(eventName, wrapped)
    return () => client.off(eventName, wrapped)
  }, [eventName, hubPath])
}
