import type {
  AddonEntry,
  AddonContext,
  ExternalAddonManifest,
} from "@namorix/core"
import { loadRemote, registerRemotes } from "@module-federation/runtime"

interface AddonModule {
  mount(container: HTMLElement, context: AddonContext): () => void
}

export function createExternalAddonEntry(
  manifest: ExternalAddonManifest,
): AddonEntry {
  let unmount: (() => void) | null = null

  return {
    async mount(container: HTMLElement, context: AddonContext) {
      const baseUrl =
        context.containerUrl ?? `http://localhost:${manifest.hostPort}`

      const remoteName = `addon_${manifest.id}`

      registerRemotes([
        {
          name: remoteName,
          entry: `${baseUrl}/mf-manifest.json`,
        },
      ])

      const Addon = (await loadRemote(`${remoteName}/Addon`)) as AddonModule

      unmount = Addon.mount(container, context)
    },
    unmount() {
      unmount?.()
    },
  }
}
