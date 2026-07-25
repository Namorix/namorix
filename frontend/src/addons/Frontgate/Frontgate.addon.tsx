import { defineAddon, NmxAddonId, NmxAddonLocaleKeys, registerAddon } from "../"
import { NmxIconSvgSymbol } from "@namorix/ui"
import { Frontgate } from "./Frontgate"

registerAddon(
  defineAddon(
    {
      id: NmxAddonId.frontgate,
      name: "Frontgate",
      description:
        "Routes traffic to your addons through custom domains and subdomains — no more remembering ports",
      localeKey: NmxAddonLocaleKeys.frontgate,
      icon: NmxIconSvgSymbol.APP_FRONTGATE,
    },
    Frontgate,
  ),
)
