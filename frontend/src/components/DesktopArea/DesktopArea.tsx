import React, { useMemo } from "react"
import { addonToItems, listAddons } from "../../addons"
import { DesktopAreaView } from "./DesktopAreaView"
import { useOpenWindow } from "../WindowFrame/useOpenWindow"
import { rectToOrigin } from "../../types/windowing"

export const DesktopArea: React.FC = () => {
  const openWindow = useOpenWindow()

  const addons = useMemo(() => listAddons().map(addonToItems), [])

  return (
    <DesktopAreaView
      addons={addons}
      onIconOpen={(
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
      }}
    />
  )
}
