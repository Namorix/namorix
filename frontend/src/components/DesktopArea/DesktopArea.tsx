import React, { useEffect, useMemo } from "react"
import {
  addonToItems,
  type ExternalAddonManifest,
  listAddons,
  registerAddon,
} from "../../addons"
import { DesktopAreaView } from "./DesktopAreaView"
import { useOpenWindow } from "../WindowFrame"
import { type AddonItem, type OnOpenApp, rectToOrigin } from "../../types"
import { nmxToast, useUserStore } from "@namorix/core"
import {
  selectorCatalog,
  selectorExternalAddons,
  selectorExternalAddonsOrder,
  setAddons,
  setCatalog,
  useAppDispatch,
  useAppSelector,
} from "../../store"
import { NmxIconSvgSymbol } from "@namorix/ui"
import { addonController, mapDtoToManifest } from "../../controllers"
import { createExternalAddonEntry } from "../../services"

export interface DesktopAddonItem extends AddonItem {
  disabled?: boolean
}

export const DesktopArea: React.FC = () => {
  const openWindow = useOpenWindow()
  const user = useUserStore()
  const catalogRecord = useAppSelector(selectorCatalog)
  const dispatch = useAppDispatch()
  const externalAddonsMap = useAppSelector(selectorExternalAddons)
  const externalAddonsOrder = useAppSelector(selectorExternalAddonsOrder)

  const addons = useMemo((): DesktopAddonItem[] => {
    const builtin = listAddons(user?.role).map(addonToItems)
    const external: DesktopAddonItem[] = externalAddonsOrder
      .map((id) => externalAddonsMap[id])
      .filter((a): a is ExternalAddonManifest => !!a)
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

    if (externalAddonsMap[item.id] && !item.disabled) {
      const manifest = externalAddonsMap[item.id]!
      const catalogEntry = catalogRecord[item.id]
      const port =
        manifest.status === "running"
          ? manifest.hostPort
          : catalogEntry?.ports?.[0]?.container

      if (port) {
        registerAddon({
          manifest: {
            id: item.id,
            name: item.name,
            icon: item.icon,
          },
          entry: createExternalAddonEntry(manifest),
        })
      }
    }

    openWindow(item, rectToOrigin(rect))
  }

  const handleDisabledClick = (addon: AddonItem) => {
    addonController.start(addon.id).catch((err) => nmxToast.error(err))
  }

  useEffect(() => {
    addonController
      .list()
      .then((list) => {
        dispatch(setAddons(list.map(mapDtoToManifest)))
      })
      .catch((err) => nmxToast.error(err))
  }, [dispatch])

  useEffect(() => {
    addonController
      .refreshCatalog()
      .then((data) => {
        dispatch(setCatalog(data))
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
