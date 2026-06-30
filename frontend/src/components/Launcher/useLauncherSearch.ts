import { useEffect, useMemo, useRef, useState } from "react"
import { addonToItems, listAddons } from "../../addons"
import type { AddonItem } from "../../types"
import { useUserStore } from "@namorix/core"
import { resolveAddonLocaleTitle } from "../../utils"
import { useTranslation } from "react-i18next"

export const useLauncherSearch = (isOpen: boolean) => {
  const { t } = useTranslation()
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

    return all.filter((addon) => {
      const title = resolveAddonLocaleTitle(t, addon) ?? addon.name
      return title.toLowerCase().includes(query.toLowerCase())
    })
  }, [query, t, user?.role])

  return { query, setQuery, items, searchRef }
}
