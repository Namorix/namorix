import React from "react"
import {
  NmxAddonRoot,
  NmxIconFontSymbol,
  NmxRail,
  NmxRailContent,
  NmxRailList,
} from "@namorix/ui"
import type { NmxRailItemData } from "@namorix/ui"
import { UserRole, useUserStore } from "@namorix/core"
import { useTranslation } from "react-i18next"
import { SettingsAppearance } from "./SettingsAppearance"
import { SettingsSystem } from "./SettingsSystem"
import { SettingsDocker } from "./SettingsDocker"
import { SettingsAccount } from "./SettingsAccount"

type Tab = "appearance" | "system" | "docker" | "account"

const TABS: NmxRailItemData<Tab>[] = [
  {
    key: "appearance",
    icon: NmxIconFontSymbol.APPEARANCE,
    label: "addon.settings.tabs.appearance",
  },
  {
    key: "system",
    icon: NmxIconFontSymbol.SETTING,
    label: "addon.settings.tabs.system",
  },
  {
    key: "docker",
    icon: NmxIconFontSymbol.DOCKER,
    label: "addon.settings.tabs.docker",
  },
  {
    key: "account",
    icon: NmxIconFontSymbol.USER,
    label: "addon.settings.tabs.account",
  },
]

const ADMIN_TABS: Tab[] = ["system", "docker"]

export const Settings: React.FC = () => {
  const { t } = useTranslation()
  const user = useUserStore()
  const isAdmin = user?.role === UserRole.Admin
  const tabs = isAdmin
    ? TABS
    : TABS.filter((t) => !ADMIN_TABS.includes(t.key))
  return (
    <NmxAddonRoot className="nmx-addon-setting">
      <NmxRail<Tab> defaultTab="appearance">
        <NmxRailList title={t("addon.settings.title")} items={tabs} t={t} />
        <NmxRailContent<Tab> tabKey="appearance">
          <SettingsAppearance />
        </NmxRailContent>
        <NmxRailContent<Tab> tabKey="system">
          <SettingsSystem />
        </NmxRailContent>
        <NmxRailContent<Tab> tabKey="docker">
          <SettingsDocker />
        </NmxRailContent>
        <NmxRailContent<Tab> tabKey="account">
          <SettingsAccount />
        </NmxRailContent>
      </NmxRail>
    </NmxAddonRoot>
  )
}
