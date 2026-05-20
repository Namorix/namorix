import React, { useState } from "react"
import {
  NmxIconFontSymbol,
  NmxRailList,
  NmxRailContent,
  NmxRail,
} from "@namorix/ui"
import { NetworkTrafficOverview } from "./NetworkTrafficOverview"
import { useTranslation } from "react-i18next"

type Tab = "overview" | "endpoints" | "logs" | "threats"

const TABS: Array<{ key: Tab; icon: NmxIconFontSymbol; label: string }> = [
  {
    key: "overview",
    icon: NmxIconFontSymbol.STATS,
    label: "addon.networkTraffic.tabs.overview",
  },
  {
    key: "endpoints",
    icon: NmxIconFontSymbol.NODES,
    label: "addon.networkTraffic.tabs.endpoints",
  },
  {
    key: "logs",
    icon: NmxIconFontSymbol.LOGS,
    label: "addon.networkTraffic.tabs.logs",
  },
  {
    key: "threats",
    icon: NmxIconFontSymbol.SECURITY,
    label: "addon.networkTraffic.tabs.threats",
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
        <NmxRailContent className="nmx-addon-network-traffic__content">
          {activeTab === "overview" && <NetworkTrafficOverview />}
        </NmxRailContent>
      </NmxRail>
    </div>
  )
}
