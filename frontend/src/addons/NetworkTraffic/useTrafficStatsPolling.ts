import { useEffect, useState } from "react"
import { trafficController, type TrafficStats } from "./traffic.controller"

export function useTrafficStatsPolling(intervalMs = 30000, historySize = 20) {
  const [stats, setStats] = useState<TrafficStats | null>(null)
  const [history, setHistory] = useState<TrafficStats[]>([])

  useEffect(() => {
    let running = true

    const poll = () => {
      trafficController
        .getStats()
        .then((s) => {
          if (!running) {
            return
          }

          setStats(s)
          setHistory((prev) => [...prev.slice(1 - historySize + 1), s])
        })
        .catch(console.error)
    }

    poll()
    const id = setInterval(poll, intervalMs)
    return () => {
      running = false
      clearInterval(id)
    }
  }, [historySize, intervalMs])

  const requestHistory = history.map((s) => s.totalRequests)
  const errorRateHistory = history.map((s) =>
    s.totalRequests > 0 ? (s.errorCount / s.totalRequests) * 100 : 0,
  )
  const latencyHistory = history.map((s) => s.avgDurationMs)
  const sizeHistory = history.map((s) => s.avgResponseSizeBytes / 1024)

  return {
    stats,
    requestHistory,
    errorRateHistory,
    latencyHistory,
    sizeHistory,
  }
}
