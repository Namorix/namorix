import type {
  AddonEntry,
  AddonContext,
  ExternalAddonManifest,
} from "@namorix/core"

export function createExternalAddonEntry(
  manifest: ExternalAddonManifest,
): AddonEntry {
  return {
    mount(container: HTMLElement, context: AddonContext) {
      const iframe = document.createElement("iframe")
      iframe.src =
        context.containerUrl ?? `http://localhost:${manifest.hostPort}`
      iframe.className = "nmx-external-addon-frame"
      iframe.allow = "cross-origin-isolated"
      container.appendChild(iframe)
    },
    unmount(container: HTMLElement) {
      container.querySelector("iframe")?.remove()
    },
  }
}
