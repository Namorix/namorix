import { useEffect, useRef } from "react"
import { resolveAddon } from "../../addons"
import type { AddonContext } from "@namorix/core"

export const useAddonMount = (appId: string) => {
  const mountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const addon = resolveAddon(appId)
    if (!addon) {
      return
    }

    const context: AddonContext = {
      addonId: appId,
      locale: "en",
      theme: "dark",
    }

    if (mountRef.current) {
      addon.entry.mount(mountRef.current, context)
    }

    return () => {
      addon.entry.unmount()
    }
  }, [appId])

  return { mountRef }
}
