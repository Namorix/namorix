import React from "react"
import { createRoot, type Root } from "react-dom/client"
import type { AddonContext, AddonEntry, NmxAddonManifest } from "./types"
import { AddonContextProvider } from "./context"

type NmxComponent = React.ComponentType<object>

export function defineAddon(
  manifest: NmxAddonManifest,
  Component: NmxComponent,
): { manifest: NmxAddonManifest; entry: AddonEntry } {
  let root: Root | null = null

  return {
    manifest,
    entry: {
      mount(container: HTMLElement, context: AddonContext) {
        root = createRoot(container)
        root.render(
          <AddonContextProvider value={context}>
            <Component />
          </AddonContextProvider>,
        )
      },

      unmount() {
        root?.unmount()
        root = null
      },
    },
  }
}
