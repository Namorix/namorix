import type { AddonEntry, NmxAddonManifest } from "@namorix/core"
import { registerAddon } from "../"
import { createRoot, type Root } from "react-dom/client"
import { NmxIconSvgSymbol } from "@namorix/ui"
import { NetworkTraffic } from "./NetworkTraffic"

const manifest: NmxAddonManifest = {
  id: "network-traffic",
  displayName: "Network Traffic",
  description: "Network traffic",
  icon: NmxIconSvgSymbol.APP_NETWORK_TRAFFIC,
}

let root: Root | null = null

const entry: AddonEntry = {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  mount(container, _context) {
    root = createRoot(container)
    root.render(<NetworkTraffic />)
  },

  unmount() {
    root?.unmount()
    root = null
  },
}

registerAddon({ manifest, entry })
