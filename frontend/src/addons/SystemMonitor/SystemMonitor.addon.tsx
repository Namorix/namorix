import type { AddonEntry, NmxAddonManifest } from "@namorix/core"
import { registerAddon } from "../"
import { createRoot, type Root } from "react-dom/client"
import { NmxIconSvgSymbol } from "@namorix/ui"
import { SystemMonitor } from "./SystemMonitor"

const manifest: NmxAddonManifest = {
  id: "system-monitor",
  displayName: "System Monitor",
  description: "System monitor",
  icon: NmxIconSvgSymbol.APP_SYSTEM_MONITOR,
}

let root: Root | null = null

const entry: AddonEntry = {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  mount(container, _context) {
    root = createRoot(container)
    root.render(<SystemMonitor />)
  },

  unmount() {
    root?.unmount()
    root = null
  },
}

registerAddon({ manifest, entry })
