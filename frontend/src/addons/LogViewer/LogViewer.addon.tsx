import { defineAddon } from "@namorix/core"
import { registerAddon } from "../"
import { LogViewer } from "./LogViewer"
import { NmxIconSvgSymbol } from "@namorix/ui"

registerAddon(
  defineAddon(
    {
      id: "log-viewer",
      displayName: "Logs",
      description: "Log system",
      icon: NmxIconSvgSymbol.APP_LOGS,
      defaultWidth: 100,
      defaultHeight: 100,
      preferFullSize: true,
    },
    LogViewer,
  ),
)
