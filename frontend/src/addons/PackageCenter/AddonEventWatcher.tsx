import React, { useCallback, useEffect, useRef } from "react"
import { useTranslation } from "react-i18next"
import {
  removeAddon,
  selectorExternalAddons,
  updateAddonStatus,
  useAppDispatch,
  useAppSelector,
} from "../../store"
import { type AddonContainerStatus, nmxToast } from "@namorix/core"
import { ServerSignalREvent, useServerSignalREvent } from "../../signalr"

export const AddonEventWatcher: React.FC = () => {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const externalAddonsMap = useAppSelector(selectorExternalAddons)
  const addonMapRef = useRef(externalAddonsMap)

  useEffect(() => {
    addonMapRef.current = externalAddonsMap
    console.log(externalAddonsMap)
  }, [externalAddonsMap])

  const handler = useCallback(
    (data: { addonId: string; status: AddonContainerStatus }) => {
      console.log("Watcher changed", data)

      const name = addonMapRef.current[data.addonId]?.name ?? data.addonId
      if (data.status === "uninstalling") {
        dispatch(removeAddon(data.addonId))
        nmxToast.success(t("addon.packageCenter.success.uninstalled", { name }))
        return
      }
      dispatch(
        updateAddonStatus({ addonId: data.addonId, status: data.status }),
      )
    },
    [dispatch, t],
  )

  // useServerSignalREvent(ServerSignalREvent.AddonStatusChanged, handler)
  return null
}
