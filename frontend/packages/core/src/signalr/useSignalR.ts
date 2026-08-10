import { useEffect, useState } from "react"
import { resolveHubPath, startConnection, stopConnection } from "./signalr.service"
import type { SignalRStatus } from "./types"

export function useSignalR(active: boolean, hubPath: string = resolveHubPath()) {
  const [status, setStatus] = useState<SignalRStatus>("disconnected")

  useEffect(() => {
    if (!active) return
    let mounted = true

    startConnection(hubPath).then(() => {
      if (!mounted) return
      setStatus("connected")
    })

    return () => {
      mounted = false
      stopConnection(hubPath).catch(() => {
        if (mounted) setStatus("disconnected")
      })
    }
  }, [active, hubPath])

  return status
}
