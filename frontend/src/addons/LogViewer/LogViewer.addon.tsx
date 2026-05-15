import type { AddonEntry, NmxAddonManifest } from "@namorix/core"
import { registerAddon } from "../registry"
import { createRoot, type Root } from "react-dom/client"
import { LogViewer } from "./LogViewer"

const manifest: NmxAddonManifest = {
  id: "log-viewer",
  displayName: "Log Viewer",
  description: "Log system",
  icon: "📋",
}

let root: Root | null = null

const entry: AddonEntry = {
  mount(container, _context) {
    root = createRoot(container)
    root.render(<LogViewer />)
  },

  unmount() {
    root?.unmount()
    root = null
  },
}

registerAddon({ manifest, entry })
