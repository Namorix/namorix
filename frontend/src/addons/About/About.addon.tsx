import { defineAddon } from "@namorix/core"
import { registerAddon } from "../"
import { NmxIconSvgSymbol } from "@namorix/ui"
import { About } from "./About"

registerAddon(
  defineAddon(
    {
      id: "about",
      displayName: "About",
      description: "About Namorix",
      icon: NmxIconSvgSymbol.APP_ABOUT,
      defaultWidth: 450,
      defaultHeight: 610,
    },
    About,
  ),
)
