import React from "react"
import { useTranslation } from "react-i18next"
import {
  NmxAddonRoot,
  NmxIconFontSymbol,
  NmxToolbar,
  NmxToolbarContent,
  NmxToolbarHeader,
  type NmxToolbarItemData,
  NmxToolbarList,
} from "@namorix/ui"
import { WardenOverview } from "./WardenOverview"
import { WardenActivity } from "./WardenActivity"
import { WardenRules } from "./WardenRules"

export type WardenTab = "overview" | "activity" | "bans" | "rules"

const TABS: NmxToolbarItemData<WardenTab>[] = [
  {
    key: "overview",
    label: "addon.warden.tabs.overview",
    icon: NmxIconFontSymbol.STATS,
  },
  {
    key: "activity",
    label: "addon.warden.tabs.activity",
    icon: NmxIconFontSymbol.ACTIVITY,
  },
  {
    key: "rules",
    label: "addon.warden.tabs.rules",
    icon: NmxIconFontSymbol.TASK,
  },
]

export const Warden: React.FC = () => {
  const { t } = useTranslation()

  return (
    <NmxAddonRoot>
      <NmxToolbar<WardenTab> defaultTab="overview">
        <NmxToolbarHeader>
          <NmxToolbarList items={TABS} t={t} />
        </NmxToolbarHeader>
        <NmxToolbarContent<WardenTab> tabKey="overview">
          <WardenOverview />
        </NmxToolbarContent>
        <NmxToolbarContent<WardenTab> tabKey="activity">
          <WardenActivity />
        </NmxToolbarContent>
        <NmxToolbarContent<WardenTab> tabKey="rules">
          <WardenRules />
        </NmxToolbarContent>
      </NmxToolbar>
    </NmxAddonRoot>
  )
}
