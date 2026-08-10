import { useEffect, useRef } from "react"
import type { SignalrService } from "./signalr.service"
import type { SignalREvent } from "./constants"

export function useSignalREvent<
  T = unknown,
  SE extends SignalREvent | (string & {}) = SignalREvent,
>(
  signalr: SignalrService,
  eventName: SE,
  handler: (data: T) => void,
  hubPath?: string,
) {
  const saveHandler = useRef(handler)

  useEffect(() => {
    saveHandler.current = handler
  }, [handler])

  useEffect(() => {
    const client = signalr.getSignalrClient(hubPath)
    const wrapped = (data: T) => saveHandler.current(data)

    client.on(eventName, wrapped)
    return () => client.off(eventName, wrapped)
  }, [eventName, hubPath, signalr])
}
