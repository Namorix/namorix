import React from "react"
import { useLauncherStore } from "../../stores"
import { useShallow } from "zustand/react/shallow"
import { useLauncherSearch } from "./useLauncherSearch"
import { LauncherView } from "./LauncherView"
import type { NmxIconSvgSymbol } from "@namorix/ui"
import { useOpenWindow } from "../WindowFrame/useOpenWindow"
import type { WindowRectType } from "../../types/windowing"

export const Launcher: React.FC = () => {
  const openWindow = useOpenWindow()
  const { isOpen, close } = useLauncherStore(
    useShallow((state) => ({ isOpen: state.isOpen, close: state.close })),
  )

  const { query, setQuery, items, searchRef } = useLauncherSearch(isOpen)

  if (!isOpen) {
    return null
  }

  const handleOpenApp = (
    id: string,
    label: string,
    icon?: NmxIconSvgSymbol,
    rect?: DOMRect,
    defaultWidth?: number,
    defaultHeight?: number,
    preferFullSize?: boolean,
  ) => {
    const originRect: WindowRectType | undefined = rect
      ? { x: rect.x, y: rect.y, width: rect.width, height: rect.height }
      : undefined

    openWindow(
      id,
      label,
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
