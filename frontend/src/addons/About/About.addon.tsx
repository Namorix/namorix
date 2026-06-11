import { defineAddon, NmxAddonId, NmxAddonLocaleKeys } from "@namorix/core"
import { registerAddon } from "../"
import { NmxIconSvgSymbol } from "@namorix/ui"
import { About } from "./About"

registerAddon(
  defineAddon(
    {
      id: NmxAddonId.about,
      displayName: "About",
      description:
        "View system information, version details, and legal notices",
      localeKey: NmxAddonLocaleKeys.about,
      icon: NmxIconSvgSymbol.APP_ABOUT,
      defaultWidth: 450,
      defaultHeight: 770,
    },
    About,
  ),
)
