import { defineAddon, NmxAddonId, NmxAddonLocaleKeys } from "@namorix/core"
import { registerAddon } from "../"
import { NmxIconSvgSymbol } from "@namorix/ui"
import { Terminal } from "./Terminal"

registerAddon(
  defineAddon(
    {
      id: NmxAddonId.terminal,
      displayName: "Terminal",
      description: "Command-line terminal with shell access",
      localeKey: NmxAddonLocaleKeys.terminal,
      icon: NmxIconSvgSymbol.APP_TERMINAL,
    },
    Terminal,
  ),
)
