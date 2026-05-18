import type { AddonEntry, NmxAddonManifest } from "@namorix/core"
import { registerAddon } from "../"
import { createRoot, type Root } from "react-dom/client"
import { NmxIconSvgSymbol } from "@namorix/ui"
import { Settings } from "./Settings"

const manifest: NmxAddonManifest = {
  id: "settings",
  displayName: "Settings",
  description: "Setting system",
  icon: NmxIconSvgSymbol.APP_SETTINGS,
}

let root: Root | null = null

const entry: AddonEntry = {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  mount(container, _context) {
    root = createRoot(container)
    root.render(<Settings />)
  },

  unmount() {
    root?.unmount()
    root = null
  },
}

registerAddon({ manifest, entry })
