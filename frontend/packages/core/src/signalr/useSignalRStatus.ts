import { useEffect, useState } from "react"
import { HubConnectionState } from "@microsoft/signalr"
import type { SignalrService } from "./signalr.service"
import type { SignalRStatus } from "./types"

export function useSignalRStatus(
  signalr: SignalrService,
  hubPath?: string,
): SignalRStatus {
  const [status, setStatus] = useState<SignalRStatus>(() => {
    const state = signalr.getConnectionState(hubPath)
    if (state === HubConnectionState.Connected) return "connected"
    if (state === HubConnectionState.Reconnecting) return "reconnecting"
    return "disconnected"
  })

  useEffect(() => {
    signalr.addStatusHandler(setStatus, hubPath)
    return () => signalr.removeStatusHandler(setStatus, hubPath)
  }, [hubPath, signalr])

  return status
}
