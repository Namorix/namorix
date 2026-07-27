export * from "./registry"
export * from "./context"
export * from "./factory"
export * from "./types"

import type { AddonItem } from "../types"
import type { AddonModule } from "./types"

import "./About/About.addon"
import "./LogViewer/LogViewer.addon"
import "./Settings/Settings.addon"
import "./NetworkTraffic/NetworkTraffic.addon"
import "./SystemMonitor/SystemMonitor.addon"
import "./FileManager/FileManager.addon"
import "./Terminal/Terminal.addon"
import "./PackageCenter/PackageCenter.addon"
import "./Frontgate/Frontgate.addon"
import "./Beacon/Beacon.addon"

export const addonToItems = (addon: AddonModule): AddonItem => ({
  ...addon.manifest,
  id: addon.manifest.id,
})
