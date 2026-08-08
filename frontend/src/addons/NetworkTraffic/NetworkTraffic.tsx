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
  NmxButtonRefresh,
  NmxButtonLive,
  NmxMenuButton,
} from "@namorix/ui"
import { NetworkTrafficOverview } from "./NetworkTrafficOverview"
import { useTranslation } from "react-i18next"
import { NetworkTrafficLogs } from "./NetworkTrafficLogs"
import { NetworkTrafficThreats } from "./NetworkTrafficThreats"
import type { TrafficSource } from "./traffic.controller"

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

export type NetworkTrafficSource = "all" | TrafficSource

export const NetworkTraffic: React.FC = () => {
  const { t } = useTranslation()
  const [filterLogs, setFilterLogs] = useState("")
  const [live, setLive] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)
  const [source, setSource] = useState<NetworkTrafficSource>("all")
  const searchSuggestions = useMemo(() => {
    return SUGGESTIONS_META.map((s) => ({
      key: s.key,
      label: t(s.label),
      description: t(s.description),
    }))
  }, [t])

  return (
    <NmxAddonRoot>
      <NmxToolbar<NetworkTrafficTab> defaultTab="overview">
        <NmxToolbarHeader>
          <NmxToolbarList items={TABS} t={t} />
          <NmxToolbarActions tabKeys={["logs"]}>
            <NmxSearchInput
              onChange={(filter) => {
                if (filter.length <= 0 && filter !== filterLogs)
                  setFilterLogs(filter)
              }}
              onSubmit={setFilterLogs}
              placeholder={t("addon.networkTraffic.searchPlaceholder")}
              suggestions={searchSuggestions}
            />
            <NmxMenuButton
              semantic="primary"
              options={[
                {
                  value: "all",
                  label: t("addon.networkTraffic.logs.sourceOptions.all"),
                  icon: NmxIconFontSymbol.FILTER,
                },
                {
                  value: "api",
                  label: t("addon.networkTraffic.logs.sourceOptions.api"),
                  icon: NmxIconFontSymbol.API,
                },
                {
                  value: "proxy",
                  label: t("addon.networkTraffic.logs.sourceOptions.proxy"),
                  icon: NmxIconFontSymbol.PROXY,
                },
              ]}
              onSelect={(value) => setSource(value as NetworkTrafficSource)}
            >
              {t("addon.networkTraffic.logs.sourceFilter")}
            </NmxMenuButton>
            <NmxButtonRefresh onClick={() => setRefreshKey((k) => k + 1)} />
            <NmxButtonLive live={live} onToggle={() => setLive((l) => !l)} />
          </NmxToolbarActions>
        </NmxToolbarHeader>
        <NmxToolbarContent<NetworkTrafficTab> tabKey="overview">
          <NetworkTrafficOverview />
        </NmxToolbarContent>
        <NmxToolbarContent<NetworkTrafficTab> tabKey="logs">
          <NetworkTrafficLogs
            filterSearch={filterLogs}
            refreshKey={refreshKey}
            live={live}
            source={source}
          />
        </NmxToolbarContent>
        <NmxToolbarContent<NetworkTrafficTab> tabKey="threats">
          <NetworkTrafficThreats />
        </NmxToolbarContent>
      </NmxToolbar>
    </NmxAddonRoot>
  )
}
