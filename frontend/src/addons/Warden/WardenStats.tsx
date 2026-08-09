import React from "react"
import { useTranslation } from "react-i18next"
import { NmxGrid, NmxIconFontSymbol, NmxStatCard } from "@namorix/ui"
import type { WdStats } from "./Warden.types"

export interface WardenStatsProps {
  stats: WdStats | null
}

export const WardenStats: React.FC<WardenStatsProps> = ({ stats }) => {
  const { t } = useTranslation()

  return (
    <NmxGrid cols={3}>
      <NmxStatCard
        icon={NmxIconFontSymbol.SECURITY}
        label={t("addon.warden.stats.activeRules")}
        value={stats?.activeRules ?? null}
      />
      <NmxStatCard
        icon={NmxIconFontSymbol.ERROR}
        semantic="error"
        label={t("addon.warden.stats.blockedToday")}
        value={stats?.blockedToday ?? null}
      />
      <NmxStatCard
        icon={NmxIconFontSymbol.NETWORK}
        label={t("addon.warden.stats.openPorts")}
        value={stats?.openPorts ?? null}
      />
    </NmxGrid>
  )
}
