import React, { useCallback, useEffect, useRef } from "react"
import { useTranslation } from "react-i18next"
import {
  removeAddon,
  selectorExternalAddons,
  updateAddonStatus,
  useAppDispatch,
  useAppSelector,
} from "../../store"
import { type AddonStatusPayload, nmxToast } from "@namorix/core"
import { ServerSignalREvent, useServerSignalREvent } from "../../signalr"
import { formatAddonErrorCode } from "./addonError"

export const AddonEventWatcher: React.FC = () => {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const externalAddonsMap = useAppSelector(selectorExternalAddons)
  const addonMapRef = useRef(externalAddonsMap)

  useEffect(() => {
    addonMapRef.current = externalAddonsMap
  }, [externalAddonsMap])

  useServerSignalREvent<AddonStatusPayload>(
    ServerSignalREvent.AddonStatusChanged,
    useCallback(
      (data: AddonStatusPayload) => {
        const addon = addonMapRef.current[data.addonId]
        const name = addon?.name ?? data.addonId
        dispatch(updateAddonStatus(data))

        if (data.status === "running") {
          nmxToast.success(t("addon.packageCenter.success.started", { name }))
        } else if (data.status === "stopped") {
          nmxToast.success(t("addon.packageCenter.success.stopped", { name }))
        } else if (data.status === "error") {
          nmxToast.error(
            data.lastErrorCode
              ? formatAddonErrorCode(t, data.lastErrorCode, name)
              : t("addon.packageCenter.errors.generic", { name }),
          )
        }
      },
      [dispatch, t],
    ),
  )

  useServerSignalREvent<{ addonId: string }>(
    ServerSignalREvent.AddonUninstalled,
    useCallback(
      (data) => {
        const name = addonMapRef.current[data.addonId]?.name ?? data.addonId
        dispatch(removeAddon(data.addonId))
        nmxToast.success(t("addon.packageCenter.success.uninstalled", { name }))
      },
      [dispatch, t],
    ),
  )

  return null
}
