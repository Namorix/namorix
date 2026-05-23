import React from "react"
import { useLauncherSearch } from "./useLauncherSearch"
import { LauncherView } from "./LauncherView"
import { useOpenWindow } from "../WindowFrame"
import { rectToOrigin, type OnOpenApp } from "../../types"
import {
  closeAllWindows,
  closeLauncher,
  selectorLauncherIsOpen,
  useAppDispatch,
  useAppSelector,
  type WindowRect,
} from "../../store"
import { authController } from "../../controllers"
import { useNavigate } from "react-router-dom"
import { useUserStore } from "@namorix/core"

export const Launcher: React.FC = () => {
  const dispatch = useAppDispatch()
  const openWindow = useOpenWindow()
  const isOpen = useAppSelector(selectorLauncherIsOpen)
  const user = useUserStore()
  const navigate = useNavigate()

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

  const handleLogout = async () => {
    close()
    dispatch(closeAllWindows())
    await authController.logout()
    navigate("/login")
  }

  return (
    <LauncherView
      items={items}
      query={query}
      user={user}
      onQueryChange={setQuery}
      onClearQuery={() => setQuery("")}
      onLogout={handleLogout}
      onOpenApp={handleOpenApp}
      searchRef={searchRef}
      onClose={close}
    />
  )
}
