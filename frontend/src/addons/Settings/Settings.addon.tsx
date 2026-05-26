import { defineAddon, LocaleKeys } from "@namorix/core"
import { registerAddon } from "../"
import { NmxIconSvgSymbol } from "@namorix/ui"
import { Settings } from "./Settings"

registerAddon(
  defineAddon(
    {
      id: "settings",
      displayName: "Settings",
      description:
        "Configure appearance, system preferences, and account settings",
      localeKey: LocaleKeys.settings,
      icon: NmxIconSvgSymbol.APP_SETTINGS,
    },
    Settings,
  ),
)
