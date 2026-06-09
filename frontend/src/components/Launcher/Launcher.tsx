import React, { useEffect } from "react"
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
import { nmxToast, useUserStore } from "@namorix/core"
import { useTranslation } from "react-i18next"

export const Launcher: React.FC = () => {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const openWindow = useOpenWindow()
  const isOpen = useAppSelector(selectorLauncherIsOpen)
  const user = useUserStore()
  const navigate = useNavigate()

  const { query, setQuery, items, searchRef } = useLauncherSearch(isOpen)

  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") dispatch(closeLauncher())
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, dispatch])

  if (!isOpen) {
    return null
  }

  const close = () => dispatch(closeLauncher())

  const handleOpenApp: OnOpenApp = (
    id,
    displayName,
    localeKey,
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
      localeKey,
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
    nmxToast.success(t("auth.logout.success"))
    navigate("/login")
  }

  return (
    <LauncherView
      items={items}
      query={query}
      user={user}
      onQueryChange={setQuery}
      onLogout={handleLogout}
      onOpenApp={handleOpenApp}
      searchRef={searchRef}
      onClose={close}
    />
  )
}
