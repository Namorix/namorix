import React from "react"
import { useLauncherStore } from "../../stores"
import { useShallow } from "zustand/react/shallow"
import { useLauncherSearch } from "./useLauncherSearch"
import { LauncherView } from "./LauncherView"
import { useOpenWindow } from "../WindowFrame/useOpenWindow"
import { rectToOrigin, type WindowRectType } from "../../types/windowing"
import type { OnOpenApp } from "../../types"

export const Launcher: React.FC = () => {
  const openWindow = useOpenWindow()
  const { isOpen, close } = useLauncherStore(
    useShallow((state) => ({ isOpen: state.isOpen, close: state.close })),
  )

  const { query, setQuery, items, searchRef } = useLauncherSearch(isOpen)

  if (!isOpen) {
    return null
  }

  const handleOpenApp: OnOpenApp = (
    id,
    displayName,
    icon,
    rect,
    defaultWidth,
    defaultHeight,
    preferFullSize,
  ) => {
    const originRect: WindowRectType | undefined = rect
      ? rectToOrigin(rect)
      : undefined

    openWindow(
      id,
      displayName,
      icon,
      originRect,
      defaultWidth,
      defaultHeight,
      preferFullSize,
    )
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
