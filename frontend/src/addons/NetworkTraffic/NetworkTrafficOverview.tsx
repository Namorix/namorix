import React from "react"
import { useTrafficStatsPolling } from "./useTrafficStatsPolling"
import { NmxStatCard } from "@namorix/ui"
import { NmxGrid } from "@namorix/ui"
import { useTranslation } from "react-i18next"
import { NmxAddonPage } from "@namorix/ui"

const formatPct = (v: number) => `${v.toFixed(1)}%`

export const NetworkTrafficOverview: React.FC = () => {
  const { t } = useTranslation()
  const {
    stats,
    requestHistory,
    errorRateHistory,
    latencyHistory,
    sizeHistory,
  } = useTrafficStatsPolling(5000)

  return (
    <NmxAddonPage className="nmx-addon-network-traffic__overview">
      <NmxGrid cols={2}>
        <NmxStatCard
          semantic="success"
          label={t("addon.networkTraffic.overview.stats.totalRequests")}
          value={stats?.totalRequests}
          sparkData={requestHistory}
        />

        <NmxStatCard
          semantic="error"
          label={t("addon.networkTraffic.overview.stats.errorRate")}
          value={
            stats
              ? formatPct((stats.errorCount / stats.totalRequests) * 100)
              : null
          }
          sparkData={errorRateHistory}
        />

        <NmxStatCard
          semantic="warning"
          label={t("addon.networkTraffic.overview.stats.avgLatency")}
          value={
            stats?.avgDurationMs != null
              ? +stats.avgDurationMs.toFixed(2)
              : undefined
          }
          unit={t("addon.networkTraffic.overview.stats.avgLatencyUnit")}
          sparkData={latencyHistory}
        />

        <NmxStatCard
          semantic="info"
          label={t("addon.networkTraffic.overview.stats.avgSize")}
          value={stats ? (stats.avgResponseSizeBytes / 1024).toFixed(1) : null}
          unit={t("addon.networkTraffic.overview.stats.avgSizeUnit")}
          sparkData={sizeHistory}
        />
      </NmxGrid>
    </NmxAddonPage>
  )
}
