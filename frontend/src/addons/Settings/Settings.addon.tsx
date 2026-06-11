import { defineAddon, NmxAddonId, NmxAddonLocaleKeys } from "@namorix/core"
import { registerAddon } from "../"
import { NmxIconSvgSymbol } from "@namorix/ui"
import { Settings } from "./Settings"

registerAddon(
  defineAddon(
    {
      id: NmxAddonId.settings,
      displayName: "Settings",
      description:
        "Configure appearance, system preferences, and account settings",
      localeKey: NmxAddonLocaleKeys.settings,
      icon: NmxIconSvgSymbol.APP_SETTINGS,
    },
    Settings,
  ),
)
