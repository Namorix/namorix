import {
  defineAddon,
  NmxAddonId,
  NmxAddonLocaleKeys,
  UserRole,
} from "@namorix/core"
import { registerAddon } from "../"
import { LogViewer } from "./LogViewer"
import { NmxIconSvgSymbol } from "@namorix/ui"

registerAddon(
  defineAddon(
    {
      id: NmxAddonId.logViewer,
      displayName: "Logs Viewer",
      description:
        "View and filter system logs by severity level, source, and time range",
      localeKey: NmxAddonLocaleKeys.logViewer,
      icon: NmxIconSvgSymbol.APP_LOGS,
      role: UserRole.Admin,
    },
    LogViewer,
  ),
)
