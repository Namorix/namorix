import { useEffect, useState } from "react"
import { HubConnectionState } from "@microsoft/signalr"
import {
  addStatusHandler,
  getConnectionState,
  removeStatusHandler,
  resolveHubPath,
} from "./signalr.service"
import type { SignalRStatus } from "./types"

export function useSignalRStatus(hubPath: string = resolveHubPath()): SignalRStatus {
  const [status, setStatus] = useState<SignalRStatus>(() => {
    const state = getConnectionState(hubPath)
    if (state === HubConnectionState.Connected) return "connected"
    if (state === HubConnectionState.Reconnecting) return "reconnecting"
    return "disconnected"
  })

  useEffect(() => {
    addStatusHandler(setStatus, hubPath)
    return () => removeStatusHandler(setStatus, hubPath)
  }, [hubPath])

  return status
}
