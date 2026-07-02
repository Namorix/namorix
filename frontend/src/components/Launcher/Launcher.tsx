import React, { useEffect, useState } from "react"
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
import { nmxToast, stopConnection, useUserStore } from "@namorix/core"
import { useTranslation } from "react-i18next"
import { NmxAlertDialog } from "@namorix/ui"

export const Launcher: React.FC = () => {
  const { t } = useTranslation()
  const [confirmLogout, setConfirmLogout] = useState(false)

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

  const handleOpenApp: OnOpenApp = (item, rect) => {
    const originRect: WindowRect | undefined = rect
      ? rectToOrigin(rect)
      : undefined

    openWindow(item, originRect)
    close()
  }

  const handleLogoutClick = () => setConfirmLogout(true)
  const handleLogoutConfirm = async () => {
    close()
    dispatch(closeAllWindows())
    setConfirmLogout(false)
    await authController.logout()
    nmxToast.success(t("auth.logout.success"))
    await stopConnection()
    navigate("/login")
  }

  return (
    <>
      <LauncherView
        items={items}
        query={query}
        user={user}
        onQueryChange={setQuery}
        onLogout={handleLogoutClick}
        onOpenApp={handleOpenApp}
        searchRef={searchRef}
        onClose={close}
      />
      <NmxAlertDialog
        open={confirmLogout}
        title={t("auth.logout.confirmTitle")}
        description={t("auth.logout.confirmDescription")}
        confirmLabel={t("auth.logout.confirm")}
        cancelLabel={t("auth.logout.cancel")}
        onConfirm={handleLogoutConfirm}
        onClose={() => setConfirmLogout(false)}
        size="sm"
      />
    </>
  )
}
