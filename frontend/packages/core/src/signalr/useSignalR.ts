import { useEffect, useState } from "react"
import { startConnection, stopConnection } from "./signalr.service"

export type SignalRStatus = "connected" | "reconnecting" | "disconnected"

export function useSignalR(active: boolean) {
  const [status, setStatus] = useState<SignalRStatus>("disconnected")

  useEffect(() => {
    if (!active) return
    let mounted = true

    startConnection()
      .then(() => {
        if (!mounted) return
        setStatus("connected")
      })
      .catch(() => {
        if (mounted) setStatus("disconnected")
      })

    return () => {
      mounted = false
      stopConnection()
    }
  }, [active])

  return status
}
