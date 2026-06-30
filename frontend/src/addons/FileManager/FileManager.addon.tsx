import { defineAddon, NmxAddonId, NmxAddonLocaleKeys } from "@namorix/core"
import { registerAddon } from "../"
import { NmxIconSvgSymbol } from "@namorix/ui"
import { FileManager } from "./FileManager"

registerAddon(
  defineAddon(
    {
      id: NmxAddonId.fileManager,
      name: "File Manager",
      description: "Browse and manage files and directories on the server",
      localeKey: NmxAddonLocaleKeys.fileManager,
      icon: NmxIconSvgSymbol.APP_FILE_MANAGER,
    },
    FileManager,
  ),
)
