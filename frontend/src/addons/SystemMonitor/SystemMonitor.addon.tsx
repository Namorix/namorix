import { defineAddon, NmxAddonId, NmxAddonLocaleKeys } from "@namorix/core"
import { registerAddon } from "../"
import { NmxIconSvgSymbol } from "@namorix/ui"
import { SystemMonitor } from "./SystemMonitor"

registerAddon(
  defineAddon(
    {
      id: NmxAddonId.systemMonitor,
      name: "System Monitor",
      description:
        "Track system resource usage, performance metrics, and running processes",
      localeKey: NmxAddonLocaleKeys.systemMonitor,
      icon: NmxIconSvgSymbol.APP_SYSTEM_MONITOR,
    },
    SystemMonitor,
  ),
)
