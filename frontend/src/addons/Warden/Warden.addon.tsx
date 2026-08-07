import { defineAddon, NmxAddonId, NmxAddonLocaleKeys, registerAddon } from "../"
import { NmxIconSvgSymbol } from "@namorix/ui"
import { UserRole } from "@namorix/core"
import { Warden } from "./Warden"

registerAddon(
  defineAddon(
    {
      id: NmxAddonId.warden,
      name: "Warden",
      description: "Host-level firewall and intrusion protection",
      localeKey: NmxAddonLocaleKeys.warden,
      icon: NmxIconSvgSymbol.APP_WARDEN,
      role: UserRole.Admin,
    },
    Warden,
  ),
)
