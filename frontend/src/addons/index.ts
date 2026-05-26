export * from "./registry"

import type { AddonModule } from "@namorix/core"
import type { AddonItem } from "../types"

import "./About/About.addon"
import "./LogViewer/LogViewer.addon"
import "./Settings/Settings.addon"
import "./SystemMonitor/SystemMonitor.addon"
import "./NetworkTraffic/NetworkTraffic.addon"
import "./FileManager/FileManager.addon"
import "./Terminal/Terminal.addon"

export const addonToItems = (addon: AddonModule): AddonItem => ({
  id: addon.manifest.id,
  displayName: addon.manifest.displayName,
  description: addon.manifest.description,
  localeKey: addon.manifest.localeKey,
  icon: addon.manifest.icon,
  defaultWidth: addon.manifest.defaultWidth,
  defaultHeight: addon.manifest.defaultHeight,
  preferFullSize: addon.manifest.preferFullSize,
})
