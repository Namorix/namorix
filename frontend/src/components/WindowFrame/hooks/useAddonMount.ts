import { useEffect, useRef } from "react"
import { resolveAddon } from "../../../addons"
import { type AddonContext, nmxStore } from "@namorix/core"
import type { WindowId } from "../../../store"

export const useAddonMount = (appId: WindowId) => {
  const mountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = mountRef.current
    const addon = resolveAddon(appId)
    if (!addon || !container) return

    const context: AddonContext = {
      addonId: appId,
      nmxStore,
    }

    addon.entry.mount(container, context)

    if (import.meta.env.DEV) {
      setTimeout(() => {
        const children = container.children

        if (!children || children.length === 0) return

        if (children.length === 1) {
          const root = children[0]
          if (root && !root.classList.contains("nmx-addon-root")) {
            console.warn(
              `[AddonMount] Addon "${appId}" root element is missing class "nmx-addon-root".`,
            )
          }
        }
      }, 0)
    }

    return () => {
      const entryToUnmount = addon.entry
      queueMicrotask(() => {
        entryToUnmount.unmount(container)
      })
    }
  }, [appId])

  return { mountRef }
}
