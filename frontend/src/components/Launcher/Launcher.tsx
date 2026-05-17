import React from "react"
import { useLauncherStore, useWindowsStore } from "../../stores"
import { useShallow } from "zustand/react/shallow"
import { useLauncherSearch } from "./useLauncherSearch"
import { LauncherView } from "./LauncherView"

export const Launcher: React.FC = () => {
  const openWindow = useWindowsStore((state) => state.openWindow)
  const { isOpen, close } = useLauncherStore(
    useShallow((state) => ({ isOpen: state.isOpen, close: state.close })),
  )

  const { query, setQuery, items, searchRef } = useLauncherSearch(isOpen)

  if (!isOpen) {
    return null
  }

  const handleOpenApp = (id: string, label: string, icon?: React.ReactNode) => {
    openWindow(id, label, icon)
    close()
  }

  return (
    <LauncherView
      items={items}
      query={query}
      onQueryChange={setQuery}
      onClearQuery={() => setQuery("")}
      onOpenApp={handleOpenApp}
      searchRef={searchRef}
      onClose={close}
    />
  )
}
