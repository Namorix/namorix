import React from "react"
import {
  NmxAddonRoot,
  NmxIconFontSymbol,
  NmxRail,
  NmxRailContent,
  type NmxRailItemData,
  NmxRailList,
} from "@namorix/ui"
import { BeaconHostnames } from "./BeaconHostnames"
import { BeaconActivity } from "./BeaconActivity"
import { BeaconSettings } from "./BeaconSettings"
import { useTranslation } from "react-i18next"
import { ServerSignalRGroups, useServerSignalRGroup } from "../../signalr"

export type BeaconTab = "hostnames" | "activity" | "settings"
const TABS: NmxRailItemData<BeaconTab>[] = [
  {
    key: "hostnames",
    icon: NmxIconFontSymbol.HOSTNAME,
    label: "addon.beacon.tabs.hostnames",
  },
  {
    key: "activity",
    icon: NmxIconFontSymbol.ACTIVITY,
    label: "addon.beacon.tabs.activity",
  },
  {
    key: "settings",
    icon: NmxIconFontSymbol.SLIDERS,
    label: "addon.beacon.tabs.settings",
  },
]

export const Beacon: React.FC = () => {
  const { t } = useTranslation()

  useServerSignalRGroup(ServerSignalRGroups.Beacon, true)

  return (
    <NmxAddonRoot>
      <NmxRail<BeaconTab> defaultTab="hostnames">
        <NmxRailList items={TABS} t={t} />
        <NmxRailContent<BeaconTab>
          tabKey="hostnames"
          spacingHorizontalDisabled={true}
          spacingVerticalDisabled={true}
          className="nmx-addon-beacon__page"
        >
          <BeaconHostnames />
        </NmxRailContent>
        <NmxRailContent<BeaconTab>
          tabKey="activity"
          spacingHorizontalDisabled={true}
          spacingVerticalDisabled={true}
          className="nmx-addon-beacon__page"
        >
          <BeaconActivity />
        </NmxRailContent>
        <NmxRailContent<BeaconTab>
          tabKey="settings"
          className="nmx-addon-beacon__page"
        >
          <BeaconSettings />
        </NmxRailContent>
      </NmxRail>
    </NmxAddonRoot>
  )
}
