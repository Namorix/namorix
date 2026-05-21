import { useState } from "react"
import {
  SignalREvent,
  SignalRGroups,
  type TrafficLogsFlushed,
  useSignalREvent,
  useSignalRGroup,
} from "@namorix/core"

export function useTrafficStatsPolling(historySize = 20) {
  const [stats, setStats] = useState<TrafficLogsFlushed | null>(null)
  const [history, setHistory] = useState<TrafficLogsFlushed[]>([])

  useSignalRGroup(SignalRGroups.Traffic, true)
  useSignalREvent<TrafficLogsFlushed>(SignalREvent.TrafficNewLogs, (data) => {
    setStats(data)
    setHistory((prev) => [...prev, data].slice(-historySize))
  })

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
