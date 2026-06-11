import React from "react"
import { createRoot, type Root } from "react-dom/client"
import type { AddonContext, AddonEntry, NmxAddonManifest } from "./types"
import { AddonContextProvider } from "./context"
import { Provider } from "react-redux"

type NmxComponent = React.ComponentType<object>

const rootMap = new WeakMap<HTMLElement, Root>()

export function defineAddon(
  manifest: NmxAddonManifest,
  Component: NmxComponent,
): { manifest: NmxAddonManifest; entry: AddonEntry } {
  return {
    manifest,
    entry: {
      mount(container: HTMLElement, context: AddonContext) {
        const root = createRoot(container)
        rootMap.set(container, root)
        root.render(
          <AddonContextProvider value={context}>
            {context.store ? (
              <Provider store={context.store}>
                <Component />
              </Provider>
            ) : (
              <Component />
            )}
          </AddonContextProvider>,
        )
      },

      unmount(container: HTMLElement) {
        const root = rootMap.get(container)
        if (root) {
          root.unmount()
          rootMap.delete(container)
        }
      },
    },
  }
}
