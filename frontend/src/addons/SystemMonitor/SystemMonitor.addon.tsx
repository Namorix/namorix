import { defineAddon, LocaleKeys } from "@namorix/core"
import { registerAddon } from "../"
import { NmxIconSvgSymbol } from "@namorix/ui"
import { SystemMonitor } from "./SystemMonitor"

registerAddon(
  defineAddon(
    {
      id: "system-monitor",
      displayName: "System Monitor",
      description:
        "Track system resource usage, performance metrics, and running processes",
      localeKey: LocaleKeys.systemMonitor,
      icon: NmxIconSvgSymbol.APP_SYSTEM_MONITOR,
    },
    SystemMonitor,
  ),
)
