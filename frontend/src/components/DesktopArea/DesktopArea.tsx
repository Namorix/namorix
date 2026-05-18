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
  }))

  return (
    <DesktopAreaView
      icons={icons}
      onIconOpen={(id) => {
        const icon = icons.find((ic) => ic.id === id)

        if (!icon) {
          return
        }

        openWindow(id, icon.label, icon.icon)
      }}
    />
  )
}
