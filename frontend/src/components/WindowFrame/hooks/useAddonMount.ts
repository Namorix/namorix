import { useLayoutEffect, useRef, useState } from "react"
import { type AddonContext, resolveAddon } from "../../../addons"
import { nmxStore } from "@namorix/core"
import { store, type WindowId } from "../../../store"

export const useAddonMount = (appId: WindowId) => {
  const mountRef = useRef<HTMLDivElement>(null)
  const [isLoading, setIsLoading] = useState(false)

  useLayoutEffect(() => {
    const container = mountRef.current
    const addon = resolveAddon(appId)
    if (!addon || !container) return

    const context: AddonContext = {
      addonId: appId,
      nmxStore,
      store,
    }

    const result = addon.entry.mount(container, context)
    let aborted = false

    if (result instanceof Promise) {
      setIsLoading(true)
      result.finally(() => {
        if (!aborted) setIsLoading(false)
      })
    }

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
      aborted = true
      const entryToUnmount = addon.entry
      queueMicrotask(() => {
        entryToUnmount.unmount(container)
      })
    }
  }, [appId])

  return { mountRef, isLoading }
}
