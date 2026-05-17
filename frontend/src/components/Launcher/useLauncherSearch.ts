import { useEffect, useMemo, useRef, useState } from "react"
import type { LauncherAddonItem } from "./Launcher.types"
import { listAddons } from "../../addons"

export const useLauncherSearch = (isOpen: boolean) => {
  const [query, setQuery] = useState("")
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    searchRef.current?.focus()
  }, [isOpen])

  const items = useMemo<LauncherAddonItem[]>(() => {
    const all: LauncherAddonItem[] = listAddons().map((addon) => ({
      id: addon.manifest.id,
      displayName: addon.manifest.displayName,
      icon: addon.manifest.icon,
    }))

    if (!query.trim()) {
      return all
    }

    return all.filter((addon) =>
      addon.displayName.toLowerCase().includes(query.toLowerCase()),
    )
  }, [query])

  return { query, setQuery, items, searchRef }
}
