import { useEffect, useMemo, useRef, useState } from "react"
import { addonToItems, listAddons } from "../../addons"
import type { AddonItem } from "../../types"
import { useUserStore } from "@namorix/core"

export const useLauncherSearch = (isOpen: boolean) => {
  const [query, setQuery] = useState("")
  const user = useUserStore()
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    searchRef.current?.focus()
  }, [isOpen])

  const items = useMemo<AddonItem[]>(() => {
    const all: AddonItem[] = listAddons(user?.role).map(addonToItems)

    if (!query.trim()) {
      return all
    }

    return all.filter((addon) =>
      addon.displayName.toLowerCase().includes(query.toLowerCase()),
    )
  }, [query, user?.role])

  return { query, setQuery, items, searchRef }
}
