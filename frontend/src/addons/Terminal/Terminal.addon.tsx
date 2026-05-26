import { defineAddon, LocaleKeys } from "@namorix/core"
import { registerAddon } from "../"
import { NmxIconSvgSymbol } from "@namorix/ui"
import { Terminal } from "./Terminal"

registerAddon(
  defineAddon(
    {
      id: "terminal",
      displayName: "Terminal",
      description: "Command-line terminal with shell access",
      localeKey: LocaleKeys.terminal,
      icon: NmxIconSvgSymbol.APP_TERMINAL,
    },
    Terminal,
  ),
)
