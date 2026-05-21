import { defineAddon } from "@namorix/core"
import { registerAddon } from "../"
import { NmxIconSvgSymbol } from "@namorix/ui"
import { SystemMonitor } from "./SystemMonitor"

registerAddon(
  defineAddon(
    {
      id: "system-monitor",
      displayName: "System Monitor",
      description: "System monitor",
      icon: NmxIconSvgSymbol.APP_SYSTEM_MONITOR,
    },
    SystemMonitor,
  ),
)
