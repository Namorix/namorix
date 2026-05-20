import React from "react"
import { useTrafficStatsPolling } from "./useTrafficStatsPolling"
import { NmxStatCard } from "@namorix/ui"

const formatPct = (v: number) => `${v.toFixed(1)}%`

export const NetworkTrafficOverviewTab: React.FC = () => {
  const {
    stats,
    requestHistory,
    errorRateHistory,
    latencyHistory,
    sizeHistory,
  } = useTrafficStatsPolling(5000)

  return (
    <div className="nmx-network-traffic__overview">
      <div className="nmx-addon-network-traffic__stat-row">
        <NmxStatCard
          label="Total Requests"
          value={stats?.totalRequests}
          sparkData={requestHistory}
        />

        <NmxStatCard
          semantic="error"
          label="Error Rate"
          value={
            stats
              ? formatPct((stats.errorCount / stats.totalRequests) * 100)
              : null
          }
          sparkData={errorRateHistory}
        />

        <NmxStatCard
          label="Avg Latency"
          value={
            stats?.avgDurationMs != null
              ? +stats.avgDurationMs.toFixed(2)
              : undefined
          }
          unit="ms"
          sparkData={latencyHistory}
        />

        <NmxStatCard
          label="Avg Size"
          value={stats ? (stats.avgResponseSizeBytes / 1024).toFixed(1) : null}
          unit="KB"
          sparkData={sizeHistory}
        />
      </div>
    </div>
  )
}
