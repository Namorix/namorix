import { useEffect, useState } from "react"
import { startConnection, stopConnection } from "./signalr.service"
import type { SignalRStatus } from "./types"

export function useSignalR(active: boolean) {
  const [status, setStatus] = useState<SignalRStatus>("disconnected")

  useEffect(() => {
    if (!active) return
    let mounted = true

    startConnection().then(() => {
      if (!mounted) return
      setStatus("connected")
    })

    return () => {
      mounted = false
      stopConnection().catch(() => {
        if (mounted) setStatus("disconnected")
      })
    }
  }, [active])

  return status
}
