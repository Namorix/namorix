import { defineAddon, NmxAddonLocaleKeys, UserRole } from "@namorix/core"
import { registerAddon } from "../"
import { NmxIconSvgSymbol } from "@namorix/ui"
import { NetworkTraffic } from "./NetworkTraffic"

registerAddon(
  defineAddon(
    {
      id: "network-traffic",
      displayName: "Network Traffic",
      description:
        "Monitor HTTP requests and network traffic with real-time filtering and analysis",
      localeKey: NmxAddonLocaleKeys.networkTraffic,
      icon: NmxIconSvgSymbol.APP_NETWORK_TRAFFIC,
      role: UserRole.Admin,
    },
    NetworkTraffic,
  ),
)
