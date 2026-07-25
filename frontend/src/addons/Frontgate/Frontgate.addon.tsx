import { defineAddon, NmxAddonId, NmxAddonLocaleKeys, registerAddon } from "../"
import { NmxIconSvgSymbol } from "@namorix/ui"
import { Frontgate } from "./Frontgate"
import { UserRole } from "@namorix/core"

registerAddon(
  defineAddon(
    {
      id: NmxAddonId.frontgate,
      name: "Frontgate",
      description:
        "Routes traffic to your addons through custom domains and subdomains — no more remembering ports",
      localeKey: NmxAddonLocaleKeys.frontgate,
      icon: NmxIconSvgSymbol.APP_FRONTGATE,
      role: UserRole.Admin,
    },
    Frontgate,
  ),
)
