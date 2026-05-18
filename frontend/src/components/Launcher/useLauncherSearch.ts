import { useEffect, useMemo, useRef, useState } from "react"
import { addonToItems, listAddons } from "../../addons"
import type { AddonItem } from "../../types"

export const useLauncherSearch = (isOpen: boolean) => {
  const [query, setQuery] = useState("")
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    searchRef.current?.focus()
  }, [isOpen])

  const items = useMemo<AddonItem[]>(() => {
    const all: AddonItem[] = listAddons().map(addonToItems)

    if (!query.trim()) {
      return all
    }

    return all.filter((addon) =>
      addon.displayName.toLowerCase().includes(query.toLowerCase()),
    )
  }, [query])

  return { query, setQuery, items, searchRef }
}
