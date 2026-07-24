import { UserRole } from "@namorix/core"
import { defineAddon, NmxAddonId, NmxAddonLocaleKeys, registerAddon } from "../"
import { LogViewer } from "./LogViewer"
import { NmxIconSvgSymbol } from "@namorix/ui"

registerAddon(
  defineAddon(
    {
      id: NmxAddonId.logViewer,
      name: "Logs Viewer",
      description:
        "View and filter system logs by severity level, source, and time range",
      localeKey: NmxAddonLocaleKeys.logViewer,
      icon: NmxIconSvgSymbol.APP_LOGS,
      role: UserRole.Admin,
    },
    LogViewer,
  ),
)
