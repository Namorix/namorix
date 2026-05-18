import React from "react"
import { listAddons } from "../../addons"
import { DesktopAreaView } from "./DesktopAreaView"
import type { DesktopIconData } from "./DesktopArea.types"
import { useOpenWindow } from "../WindowFrame/useOpenWindow"

export const DesktopArea: React.FC = () => {
  const openWindow = useOpenWindow()

  const icons: DesktopIconData[] = listAddons().map((addon) => ({
    id: addon.manifest.id,
    icon: addon.manifest.icon,
    label: addon.manifest.displayName,
    defaultWidth: addon.manifest.defaultWidth,
    defaultHeight: addon.manifest.defaultHeight,
    preferFullSize: addon.manifest.preferFullSize,
  }))

  return (
    <DesktopAreaView
      icons={icons}
      onIconOpen={(id, rect, defaultWidth, defaultHeight, preferFullSize) => {
        const icon = icons.find((ic) => ic.id === id)

        if (!icon || !rect) {
          return
        }

        openWindow(
          id,
          icon.label,
          icon.icon,
          {
            x: rect.x,
            y: rect.y,
            width: rect.width,
            height: rect.height,
          },
          defaultWidth,
          defaultHeight,
          preferFullSize,
        )
      }}
    />
  )
}
