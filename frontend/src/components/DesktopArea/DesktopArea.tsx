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

  const handleOpenApp: OnOpenApp = (item, rect) => {
    if (!rect) return
    openWindow(item, rectToOrigin(rect))
  }

  return <DesktopAreaView addons={addons} onIconOpen={handleOpenApp} />
}
