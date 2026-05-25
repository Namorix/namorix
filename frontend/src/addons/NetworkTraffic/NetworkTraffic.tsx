import React, { useMemo, useState } from "react"
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

const SUGGESTIONS_META: NmxSearchSuggestion[] = [
  {
    key: "m=",
    label: "addon.networkTraffic.search.m.label",
    description: "addon.networkTraffic.search.m.desc",
  },
  {
    key: "p=",
    label: "addon.networkTraffic.search.p.label",
    description: "addon.networkTraffic.search.p.desc",
  },
  {
    key: "s=",
    label: "addon.networkTraffic.search.s.label",
    description: "addon.networkTraffic.search.s.desc",
  },
  {
    key: "ip=",
    label: "addon.networkTraffic.search.ip.label",
    description: "addon.networkTraffic.search.ip.desc",
  },
  {
    key: "d=",
    label: "addon.networkTraffic.search.d.label",
    description: "addon.networkTraffic.search.d.desc",
  },
  {
    key: "t=",
    label: "addon.networkTraffic.search.t.label",
    description: "addon.networkTraffic.search.t.desc",
  },
]

export const NetworkTraffic: React.FC = () => {
  const { t } = useTranslation()
  const [filterLogs, setFilterLogs] = useState("")
  const searchSuggestions = useMemo(() => {
    return SUGGESTIONS_META.map((s) => ({
      key: s.key,
      label: t(s.label),
      description: t(s.description),
    }))
  }, [t])

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
