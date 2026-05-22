import { useEffect, useState } from "react"
import { HubConnectionState } from "@microsoft/signalr"
import {
  addStatusHandler,
  removeStatusHandler,
  getConnectionState,
} from "./signalr.service"
import type { SignalRStatus } from "./types"

export function useSignalRStatus(): SignalRStatus {
  const [status, setStatus] = useState<SignalRStatus>(() => {
    const state = getConnectionState()
    if (state === HubConnectionState.Connected) return "connected"
    if (state === HubConnectionState.Reconnecting) return "reconnecting"
    return "disconnected"
  })

  useEffect(() => {
    addStatusHandler(setStatus)
    return () => removeStatusHandler(setStatus)
  }, [])

  return status
}
