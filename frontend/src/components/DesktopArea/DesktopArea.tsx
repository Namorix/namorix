import React, { useEffect, useMemo } from "react"
import { addonToItems, listAddons } from "../../addons"
import { DesktopAreaView } from "./DesktopAreaView"
import { useOpenWindow } from "../WindowFrame"
import { type AddonItem, type OnOpenApp, rectToOrigin } from "../../types"
import {
  type ExternalAddonManifest,
  nmxToast,
  useUserStore,
} from "@namorix/core"
import {
  selectorExternalAddons,
  selectorExternalAddonsOrder,
  setAddons,
  useAppDispatch,
  useAppSelector,
} from "../../store"
import { NmxIconSvgSymbol } from "@namorix/ui"
import { addonController, mapDtoToManifest } from "../../controllers"
import { useTranslation } from "react-i18next"

export interface DesktopAddonItem extends AddonItem {
  disabled?: boolean
}

export const DesktopArea: React.FC = () => {
  const { t } = useTranslation()
  const openWindow = useOpenWindow()
  const user = useUserStore()
  const dispatch = useAppDispatch()
  const externalAddonsMap = useAppSelector(selectorExternalAddons)
  const externalAddonsOrder = useAppSelector(selectorExternalAddonsOrder)

  const addons = useMemo((): DesktopAddonItem[] => {
    const builtin = listAddons(user?.role).map(addonToItems)
    const external: DesktopAddonItem[] = externalAddonsOrder
      .map((id) => externalAddonsMap[id])
      .filter((a): a is ExternalAddonManifest => !!a)
      .filter((a) => a.status !== "error")
      .map((a) => ({
        id: a.id,
        name: a.name,
        icon: a.icon ?? NmxIconSvgSymbol.APP_UNKNOWN,
        disabled: a.status !== "running",
      }))

    return [...builtin, ...external]
  }, [user, externalAddonsMap, externalAddonsOrder])

  const handleOpenApp: OnOpenApp = (item, rect) => {
    if (!rect) return
    openWindow(item, rectToOrigin(rect))
  }

  const handleDisabledClick = (addon: AddonItem) => {
    addonController
      .start(addon.id)
      .then(() => {
        nmxToast.success(
          t("addon.packageCenter.success.started", { name: addon.name }),
        )
      })
      .catch(() => {})
  }

  useEffect(() => {
    addonController
      .list()
      .then((list) => {
        dispatch(setAddons(list.map(mapDtoToManifest)))
      })
      .catch((err) => nmxToast.error(err))
  }, [dispatch])

  return (
    <DesktopAreaView
      addons={addons}
      onIconOpen={handleOpenApp}
      onDisabledIconClick={handleDisabledClick}
    />
  )
}
