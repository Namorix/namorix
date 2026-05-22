import { defineAddon, UserRole } from "@namorix/core"
import { registerAddon } from "../"
import { NmxIconSvgSymbol } from "@namorix/ui"
import { NetworkTraffic } from "./NetworkTraffic"

registerAddon(
  defineAddon(
    {
      id: "network-traffic",
      displayName: "Network Traffic",
      description: "Network traffic",
      icon: NmxIconSvgSymbol.APP_NETWORK_TRAFFIC,
      defaultWidth: 1200,
      defaultHeight: 500,
      role: UserRole.Admin,
    },
    NetworkTraffic,
  ),
)
