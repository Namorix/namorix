import { loadRemote, registerRemotes } from "@module-federation/runtime"
import type { AddonEntry, ExternalAddonManifest } from "../addons"

export function createExternalAddonEntry(
  manifest: ExternalAddonManifest,
): AddonEntry {
  let unmount: (() => void) | null = null
  return {
    async mount(container: HTMLElement, context) {
      const baseUrl = `http://localhost:${manifest.hostPort}`
      const remoteName = `addon_${manifest.id}`
      registerRemotes([
        {
          name: remoteName,
          entry: `${baseUrl}/mf-manifest.json`,
        },
      ])
      const Addon = await loadRemote(`${remoteName}/Addon`)
      unmount = Addon.mount(container, { ...context, mode: "widget" })
    },
    unmount() {
      unmount?.()
    },
  }
}
