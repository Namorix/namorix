import { defineAddon, LocaleKeys, UserRole } from "@namorix/core"
import { registerAddon } from "../"
import { LogViewer } from "./LogViewer"
import { NmxIconSvgSymbol } from "@namorix/ui"

registerAddon(
  defineAddon(
    {
      id: "log-viewer",
      displayName: "Logs Viewer",
      description:
        "View and filter system logs by severity level, source, and time range",
      localeKey: LocaleKeys.logViewer,
      icon: NmxIconSvgSymbol.APP_LOGS,
      role: UserRole.Admin,
    },
    LogViewer,
  ),
)
