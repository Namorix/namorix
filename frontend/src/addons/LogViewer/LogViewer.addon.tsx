import type { AddonEntry, NmxAddonManifest } from "@namorix/core"
import { registerAddon } from "../"
import { createRoot, type Root } from "react-dom/client"
import { LogViewer } from "./LogViewer"
import { NmxIconSvgSymbol } from "@namorix/ui"

const manifest: NmxAddonManifest = {
  id: "log-viewer",
  displayName: "Logs",
  description: "Log system",
  icon: NmxIconSvgSymbol.APP_LOGS,
}

let root: Root | null = null

const entry: AddonEntry = {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
