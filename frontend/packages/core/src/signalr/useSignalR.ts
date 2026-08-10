import { useEffect, useState } from "react"
import type { SignalrService } from "./signalr.service"
import type { SignalRStatus } from "./types"

export function useSignalR(
  signalr: SignalrService,
  active: boolean,
  hubPath?: string,
) {
  const [status, setStatus] = useState<SignalRStatus>("disconnected")

  useEffect(() => {
    if (!active) return
    let mounted = true

    signalr.startConnection(hubPath).then(() => {
      if (!mounted) return
      setStatus("connected")
    })

    return () => {
      mounted = false
      signalr.stopConnection(hubPath).catch(() => {
        if (mounted) setStatus("disconnected")
      })
    }
  }, [active, hubPath, signalr])

  return status
}
