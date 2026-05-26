import React, { useMemo } from "react"
import { addonToItems, listAddons } from "../../addons"
import { DesktopAreaView } from "./DesktopAreaView"
import { useOpenWindow } from "../WindowFrame"
import { type OnOpenApp, rectToOrigin } from "../../types"
import { useUserStore } from "@namorix/core"

export const DesktopArea: React.FC = () => {
  const openWindow = useOpenWindow()
  const user = useUserStore()

  const addons = useMemo(() => listAddons(user?.role).map(addonToItems), [user])

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
    if (!rect) {
      return
    }

    openWindow(
      id,
      displayName,
      localeKey,
      icon,
      rectToOrigin(rect),
      defaultWidth,
      defaultHeight,
      preferFullSize,
    )
  }

  return <DesktopAreaView addons={addons} onIconOpen={handleOpenApp} />
}
