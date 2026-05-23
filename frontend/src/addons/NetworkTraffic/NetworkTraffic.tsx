import React, { useState } from "react"
import {
  NmxIconFontSymbol,
  type NmxToolbarItemData,
  NmxToolbar,
  NmxToolbarList,
  NmxIconFont,
  NmxToolbarContent,
  NmxToolbarHeader,
  NmxAddonRoot,
  NmxToolbarActions,
} from "@namorix/ui"
import { NetworkTrafficOverview } from "./NetworkTrafficOverview"
import { useTranslation } from "react-i18next"
import { NetworkTrafficEndpoints } from "./NetworkTrafficEndpoints"
import { NetworkTrafficLogs } from "./NetworkTrafficLogs"
import { NetworkTrafficThreats } from "./NetworkTrafficThreats"

type Tab = "overview" | "endpoints" | "logs" | "threats"

const TABS: NmxToolbarItemData<Tab>[] = [
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
  const [filter, setFilter] = useState("")

  return (
    <NmxAddonRoot className="nmx-addon-network-traffic">
      <NmxToolbar<Tab> defaultTab="endpoints">
        <NmxToolbarHeader>
          <NmxToolbarList items={TABS} t={t} />
          <NmxToolbarActions<Tab> tabKeys={["logs", "endpoints"]}>
            <NmxIconFont symbol={NmxIconFontSymbol.SEARCH} />
            <input
              type="text"
              placeholder="Filter..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </NmxToolbarActions>
        </NmxToolbarHeader>
        <NmxToolbarContent<Tab> tabKey="overview">
          <NetworkTrafficOverview />
        </NmxToolbarContent>
        <NmxToolbarContent<Tab> tabKey="endpoints">
          <NetworkTrafficEndpoints filter={filter} />
        </NmxToolbarContent>
        <NmxToolbarContent<Tab> tabKey="logs">
          <NetworkTrafficLogs filter={filter} />
        </NmxToolbarContent>
        <NmxToolbarContent<Tab> tabKey="threats">
          <NetworkTrafficThreats />
        </NmxToolbarContent>
      </NmxToolbar>
    </NmxAddonRoot>
  )
}
