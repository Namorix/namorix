export * from "./registry"

import type { AddonModule } from "@namorix/core"
import type { AddonItem } from "../types"

import "./About/About.addon"
import "./LogViewer/LogViewer.addon"
import "./Settings/Settings.addon"
import "./NetworkTraffic/NetworkTraffic.addon"
import "./SystemMonitor/SystemMonitor.addon"
import "./FileManager/FileManager.addon"
import "./Terminal/Terminal.addon"
import "./PackageCenter/PackageCenter.addon"

export const addonToItems = (addon: AddonModule): AddonItem => ({
  ...addon.manifest,
  id: addon.manifest.id,
})
