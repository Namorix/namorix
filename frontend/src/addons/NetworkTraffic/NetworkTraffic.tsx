import React from "react"
import {
  NmxIconFontSymbol,
  NmxRailList,
  NmxRailContent,
  NmxRail,
} from "@namorix/ui"
import { NetworkTrafficOverview } from "./NetworkTrafficOverview"
import { useTranslation } from "react-i18next"
import { Show, useTabCache } from "@namorix/core"
import { NetworkTrafficEndpoints } from "./NetworkTrafficEndpoints"

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
  const { activeTab, setActiveTab, isMounted } = useTabCache<Tab>("overview")
  const { t } = useTranslation()

  return (
    <div className="nmx-addon-root nmx-addon-network-traffic">
      <NmxRail>
        <NmxRailList
          title={t("addon.networkTraffic.title")}
          items={TABS}
          t={t}
          activeKey={activeTab}
          onActiveTabChange={(key) => setActiveTab(key as Tab)}
        />
        <NmxRailContent className="nmx-addon-network-traffic__content">
          {isMounted("overview") && (
            <Show when={activeTab === "overview"}>
              <NetworkTrafficOverview />
            </Show>
          )}
          {isMounted("endpoints") && (
            <Show when={activeTab === "endpoints"}>
              <NetworkTrafficEndpoints />
            </Show>
          )}
        </NmxRailContent>
      </NmxRail>
    </div>
  )
}
