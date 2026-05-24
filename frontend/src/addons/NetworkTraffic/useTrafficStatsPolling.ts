import { useState } from "react"
import {
  type BucketData,
  SignalREvent,
  SignalRGroups,
  type TrafficLogsFlushed,
  useSignalREvent,
  useSignalRGroup,
} from "@namorix/core"

export function useTrafficStatsPolling() {
  const [stats, setStats] = useState<TrafficLogsFlushed | null>(null)
  const [buckets, setBuckets] = useState<BucketData[]>([])

  useSignalRGroup(SignalRGroups.Traffic, true)
  useSignalREvent<{ stats: TrafficLogsFlushed; buckets: BucketData[] }>(
    SignalREvent.TrafficStatsInit,
    (data) => {
      setStats(data.stats)
      setBuckets(data.buckets)
    },
  )

  useSignalREvent<{ stats: TrafficLogsFlushed; bucket: BucketData }>(
    SignalREvent.TrafficNewLogs,
    (data) => {
      setStats(data.stats)
      setBuckets((prev) => {
        const next = [...prev]
        next[data.bucket.hour] = data.bucket
        return next
      })
    },
  )

  const requestHistory = buckets.map((b) => b.requests)
  const errorRateHistory = buckets.map((b) =>
    b.requests > 0 ? (b.errors / b.requests) * 100 : 0,
  )

  const latencyHistory = buckets.map((b) => b.avgDurationMs)
  const sizeHistory = buckets.map((b) => b.avgSizeBytes / 1024)

  return {
    stats,
    buckets,
    requestHistory,
    errorRateHistory,
    latencyHistory,
    sizeHistory,
  }
}
