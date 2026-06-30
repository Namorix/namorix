import React from "react"
import { useTranslation } from "react-i18next"
import {
  NmxAddonRoot,
  NmxIconFontSymbol,
  NmxRail,
  type NmxRailItemData,
  NmxRailList,
} from "@namorix/ui"
import { AddonGrid } from "./AddonGrid"

export type PackageCenterTab = "all" | "installed" | "updated"

const TABS: NmxRailItemData<PackageCenterTab>[] = [
  {
    key: "all",
    icon: NmxIconFontSymbol.APPS,
    label: "addon.packageCenter.tabs.all",
  },
  {
    key: "installed",
    icon: NmxIconFontSymbol.CHECK,
    label: "addon.packageCenter.tabs.installed",
  },
  {
    key: "updated",
    icon: NmxIconFontSymbol.REFRESH,
    label: "addon.packageCenter.tabs.updated",
  },
]

export const PackageCenter: React.FC = () => {
  const { t } = useTranslation()

  return (
    <NmxAddonRoot>
      <NmxRail<PackageCenterTab> defaultTab="all">
        <NmxRailList items={TABS} t={t} />
        <AddonGrid />
      </NmxRail>
    </NmxAddonRoot>
  )
}
