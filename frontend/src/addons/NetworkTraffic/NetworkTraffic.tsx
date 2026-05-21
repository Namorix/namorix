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
import { NetworkTrafficLogs } from "./NetworkTrafficLogs"
import { NetworkTrafficThreats } from "./NetworkTrafficThreats"
import type { NmxRailItemData } from "@namorix/ui"

type Tab = "overview" | "endpoints" | "logs" | "threats"

const TABS: NmxRailItemData<Tab>[] = [
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
          {isMounted("logs") && (
            <Show when={activeTab === "logs"}>
              <NetworkTrafficLogs />
            </Show>
          )}
          {isMounted("threats") && (
            <Show when={activeTab === "threats"}>
              <NetworkTrafficThreats />
            </Show>
          )}
        </NmxRailContent>
      </NmxRail>
    </div>
  )
}
