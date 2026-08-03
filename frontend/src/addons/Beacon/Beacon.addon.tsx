import { defineAddon, NmxAddonId, NmxAddonLocaleKeys, registerAddon } from "../"
import { NmxIconSvgSymbol } from "@namorix/ui"
import { Beacon } from "./Beacon"

registerAddon(
  defineAddon(
    {
      id: NmxAddonId.beacon,
      name: "Beacon",
      description: "Updates your DNS when your IP changes",
      localeKey: NmxAddonLocaleKeys.beacon,
      icon: NmxIconSvgSymbol.APP_BEACON,
    },
    Beacon,
  ),
)
