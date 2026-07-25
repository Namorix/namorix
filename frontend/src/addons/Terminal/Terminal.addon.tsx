import { defineAddon, NmxAddonId, NmxAddonLocaleKeys, registerAddon } from "../"
import { NmxIconSvgSymbol } from "@namorix/ui"
import { Terminal } from "./Terminal"
import { UserRole } from "@namorix/core"

registerAddon(
  defineAddon(
    {
      id: NmxAddonId.terminal,
      name: "Terminal",
      description: "Command-line terminal with shell access",
      localeKey: NmxAddonLocaleKeys.terminal,
      icon: NmxIconSvgSymbol.APP_TERMINAL,
      role: UserRole.Admin,
    },
    Terminal,
  ),
)
