import React from "react"
import { useLauncherSearch } from "./useLauncherSearch"
import { LauncherView } from "./LauncherView"
import { useOpenWindow } from "../WindowFrame"
import { rectToOrigin, type OnOpenApp } from "../../types"
import {
  closeLauncher,
  selectorLauncherIsOpen,
  useAppDispatch,
  useAppSelector,
  type WindowRect,
} from "../../store"

export const Launcher: React.FC = () => {
  const dispatch = useAppDispatch()
  const openWindow = useOpenWindow()
  const isOpen = useAppSelector(selectorLauncherIsOpen)

  const { query, setQuery, items, searchRef } = useLauncherSearch(isOpen)

  if (!isOpen) {
    return null
  }

  const close = () => dispatch(closeLauncher())

  const handleOpenApp: OnOpenApp = (
    id,
    displayName,
    icon,
    rect,
    defaultWidth,
    defaultHeight,
    preferFullSize,
  ) => {
    const originRect: WindowRect | undefined = rect
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
