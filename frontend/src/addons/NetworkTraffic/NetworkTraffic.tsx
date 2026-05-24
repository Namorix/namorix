import React, { useState } from "react"
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
  type NmxSearchSuggestion,
} from "@namorix/ui"
import { NetworkTrafficOverview } from "./NetworkTrafficOverview"
import { useTranslation } from "react-i18next"
import { NetworkTrafficLogs } from "./NetworkTrafficLogs"
import { NetworkTrafficThreats } from "./NetworkTrafficThreats"

export type NetworkTrafficTab = "overview" | "logs" | "threats"

const TABS: NmxToolbarItemData<NetworkTrafficTab>[] = [
  {
    key: "overview",
    icon: NmxIconFontSymbol.STATS,
    label: "addon.networkTraffic.tabs.overview",
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

const searchSuggestions: NmxSearchSuggestion[] = [
  { key: "m=", label: "method", description: "filter by HTTP method" },
  { key: "p=", label: "path", description: "filter by URL path" },
  {
    key: "s=",
    label: "status",
    description: "status code (200) or range (2xx)",
  },
  { key: "ip=", label: "IP", description: "filter by IP prefix" },
  { key: "d=", label: "date", description: "d=>2026-06-07 or d=2026-06-07" },
  { key: "t=", label: "time", description: "t=>11:20 or t=11:20:22" },
]

export const NetworkTraffic: React.FC = () => {
  const { t } = useTranslation()
  const [filterLogs, setFilterLogs] = useState("")

  return (
    <NmxAddonRoot className="nmx-addon-network-traffic">
      <NmxToolbar<NetworkTrafficTab> defaultTab="overview">
        <NmxToolbarHeader className="nmx-addon-network-traffic__toolbar-header">
          <NmxToolbarList items={TABS} t={t} />
          <NmxToolbarActions
            tabKeys={["logs"]}
            className="nmx-addon-network-traffic__toolbar-actions"
          >
            <NmxSearchInput
              onChange={(filter) => {
                if (filter.length <= 0 && filter !== filterLogs)
                  setFilterLogs(filter)
              }}
              onSubmit={setFilterLogs}
              placeholder={t("addon.networkTraffic.searchPlaceholder")}
              suggestions={searchSuggestions}
            />
          </NmxToolbarActions>
        </NmxToolbarHeader>
        <NmxToolbarContent<NetworkTrafficTab> tabKey="overview">
          <NetworkTrafficOverview />
        </NmxToolbarContent>
        <NmxToolbarContent<NetworkTrafficTab> tabKey="logs">
          <NetworkTrafficLogs filterSearch={filterLogs} />
        </NmxToolbarContent>
        <NmxToolbarContent<NetworkTrafficTab> tabKey="threats">
          <NetworkTrafficThreats />
        </NmxToolbarContent>
      </NmxToolbar>
    </NmxAddonRoot>
  )
}
