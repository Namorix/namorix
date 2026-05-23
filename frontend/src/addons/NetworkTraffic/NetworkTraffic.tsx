import React, { useEffect, useRef, useState } from "react"
import {
  NmxIconFontSymbol,
  type NmxToolbarItemData,
  NmxToolbar,
  NmxToolbarList,
  NmxToolbarContent,
  NmxToolbarHeader,
  NmxAddonRoot,
  NmxToolbarActions,
  NmxSearchInput,
} from "@namorix/ui"
import { NetworkTrafficOverview } from "./NetworkTrafficOverview"
import { useTranslation } from "react-i18next"
import { NetworkTrafficEndpoints } from "./NetworkTrafficEndpoints"
import { NetworkTrafficLogs } from "./NetworkTrafficLogs"
import { NetworkTrafficThreats } from "./NetworkTrafficThreats"

export type NetworkTrafficTab = "overview" | "endpoints" | "logs" | "threats"

const TABS: NmxToolbarItemData<NetworkTrafficTab>[] = [
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
  const { t } = useTranslation()
  const [filter, setFilter] = useState<string>("")

  return (
    <NmxAddonRoot className="nmx-addon-network-traffic">
      <NmxToolbar<NetworkTrafficTab>
        defaultTab="endpoints"
        onTabChange={() => setFilter("")}
      >
        <NmxToolbarHeader className="nmx-addon-network-traffic__toolbar-header">
          <NmxToolbarList items={TABS} t={t} />
          <NmxToolbarActions<NetworkTrafficTab>
            tabKeys={["logs", "endpoints"]}
            className="nmx-addon-network-traffic__toolbar-actions"
          >
            <NmxSearchInput
              value={filter}
              onChange={setFilter}
              placeholder={t("addon.networkTraffic.searchPlaceholder")}
            />
          </NmxToolbarActions>
        </NmxToolbarHeader>
        <NmxToolbarContent<NetworkTrafficTab> tabKey="overview">
          <NetworkTrafficOverview />
        </NmxToolbarContent>
        <NmxToolbarContent<NetworkTrafficTab> tabKey="endpoints">
          <NetworkTrafficEndpoints />
        </NmxToolbarContent>
        <NmxToolbarContent<NetworkTrafficTab> tabKey="logs">
          <NetworkTrafficLogs filterSearch={filter} />
        </NmxToolbarContent>
        <NmxToolbarContent<NetworkTrafficTab> tabKey="threats">
          <NetworkTrafficThreats />
        </NmxToolbarContent>
      </NmxToolbar>
    </NmxAddonRoot>
  )
}
