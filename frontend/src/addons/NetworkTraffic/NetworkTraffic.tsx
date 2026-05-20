import React, { useState } from "react"
import {
  NmxIconFontSymbol,
  NmxRailList,
  NmxRailContent,
  NmxRail,
} from "@namorix/ui"
import { NetworkTrafficOverviewTab } from "./NetworkTrafficOverviewTab"
import { useTranslation } from "react-i18next"

type Tab = "overview" | "endpoints" | "logs" | "threats"

const TABS: Array<{ key: Tab; icon: NmxIconFontSymbol; label: string }> = [
  {
    key: "overview",
    icon: NmxIconFontSymbol.STATS,
    label: "addon.network-traffic.tabs.overview",
  },
  {
    key: "endpoints",
    icon: NmxIconFontSymbol.NODES,
    label: "addon.network-traffic.tabs.endpoints",
  },
  {
    key: "logs",
    icon: NmxIconFontSymbol.LOGS,
    label: "addon.network-traffic.tabs.logs",
  },
  {
    key: "threats",
    icon: NmxIconFontSymbol.SECURITY,
    label: "addon.network-traffic.tabs.threats",
  },
]
export const NetworkTraffic: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>("overview")
  const { t } = useTranslation()

  return (
    <div className="nmx-addon-root nmx-addon-network-traffic">
      <NmxRail>
        <NmxRailList
          title="Network Traffic"
          items={TABS}
          t={t}
          activeKey={activeTab}
          onActiveTabChange={(key) => setActiveTab(key as Tab)}
        />
        <NmxRailContent>
          {activeTab === "overview" && <NetworkTrafficOverviewTab />}
        </NmxRailContent>
      </NmxRail>
    </div>
  )
}
