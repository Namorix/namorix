import { defineAddon, LocaleKeys } from "@namorix/core"
import { registerAddon } from "../"
import { NmxIconSvgSymbol } from "@namorix/ui"
import { About } from "./About"

registerAddon(
  defineAddon(
    {
      id: "about",
      displayName: "About",
      description:
        "View system information, version details, and legal notices",
      localeKey: LocaleKeys.about,
      icon: NmxIconSvgSymbol.APP_ABOUT,
      defaultWidth: 450,
      defaultHeight: 750,
    },
    About,
  ),
)
