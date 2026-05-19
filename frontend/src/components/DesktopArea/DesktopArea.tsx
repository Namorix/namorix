import React, { useMemo } from "react"
import { addonToItems, listAddons } from "../../addons"
import { DesktopAreaView } from "./DesktopAreaView"
import { useOpenWindow } from "../WindowFrame"
import { type OnOpenApp, rectToOrigin } from "../../types"

export const DesktopArea: React.FC = () => {
  const openWindow = useOpenWindow()

  const addons = useMemo(() => listAddons().map(addonToItems), [])

  const handleOpenApp: OnOpenApp = (
    id,
    displayName,
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
      icon,
      rectToOrigin(rect),
      defaultWidth,
      defaultHeight,
      preferFullSize,
    )
  }

  return <DesktopAreaView addons={addons} onIconOpen={handleOpenApp} />
}
