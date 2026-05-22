import React from "react"
import {
  NmxIconFontSymbol,
  NmxRail,
  NmxRailContent,
  NmxRailList,
} from "@namorix/ui"
import type { NmxRailItemData } from "@namorix/ui"
import { Show, UserRole, useTabCache, useUserStore } from "@namorix/core"
import { useTranslation } from "react-i18next"
import { SettingsAppearance } from "./SettingsAppearance"
import { SettingsSystem } from "./SettingsSystem"
import { SettingsAccount } from "./SettingsAccount"

type Tab = "appearance" | "system" | "account"

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
    key: "account",
    icon: NmxIconFontSymbol.USER,
    label: "addon.settings.tabs.account",
  },
]

export const Settings: React.FC = () => {
  const { t } = useTranslation()
  const { activeTab, setActiveTab, isMounted } = useTabCache<Tab>("appearance")
  const user = useUserStore()
  const isAdmin = user?.role === UserRole.Admin
  const tabs = isAdmin ? TABS : TABS.filter((t) => t.key !== "system")

  return (
    <div className="nmx-addon-root nmx-addon-setting">
      <NmxRail>
        <NmxRailList
          title={t("addon.settings.title")}
          items={tabs}
          t={t}
          activeKey={activeTab}
          onActiveTabChange={(key) => setActiveTab(key as Tab)}
        />
        <NmxRailContent className="nmx-addon-form">
          {isMounted("appearance") && (
            <Show when={activeTab === "appearance"}>
              <SettingsAppearance />
            </Show>
          )}
          {isMounted("system") && (
            <Show when={activeTab === "system"}>
              <SettingsSystem />
            </Show>
          )}
          {isMounted("account") && (
            <Show when={activeTab === "account"}>
              <SettingsAccount />
            </Show>
          )}
        </NmxRailContent>
      </NmxRail>
    </div>
  )
}
