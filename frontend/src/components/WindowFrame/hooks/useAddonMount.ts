import { useEffect, useRef } from "react"
import { resolveAddon } from "../../../addons"
import type { AddonContext } from "@namorix/core"
import type { WindowId } from "../../../store"

export const useAddonMount = (appId: WindowId) => {
  const mountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const addon = resolveAddon(appId)
    if (!addon || !mountRef.current) {
      return
    }

    const context: AddonContext = {
      addonId: appId,
      locale: "en",
      theme: "dark",
    }

    addon.entry.mount(mountRef.current, context)

    if (import.meta.env.DEV) {
      setTimeout(() => {
        const children = mountRef.current?.children

        if (!children || children.length === 0) {
          return
        }

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
      addon.entry.unmount()
    }
  }, [appId])

  return { mountRef }
}
