import { defineAddon } from "@namorix/core"
import { registerAddon } from "../"
import { NmxIconSvgSymbol } from "@namorix/ui"
import { Settings } from "./Settings"

registerAddon(
  defineAddon(
    {
      id: "settings",
      displayName: "Settings",
      description: "Setting system",
      icon: NmxIconSvgSymbol.APP_SETTINGS,
    },
    Settings,
  ),
)
