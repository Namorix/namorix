import { defineAddon, NmxAddonLocaleKeys } from "@namorix/core"
import { registerAddon } from "../"
import { NmxIconSvgSymbol } from "@namorix/ui"
import { FileManager } from "./FileManager"

registerAddon(
  defineAddon(
    {
      id: "file-manager",
      displayName: "File Manager",
      description: "Browse and manage files and directories on the server",
      localeKey: NmxAddonLocaleKeys.fileManager,
      icon: NmxIconSvgSymbol.APP_FILE_MANAGER,
    },
    FileManager,
  ),
)
