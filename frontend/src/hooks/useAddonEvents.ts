import { updateAddonStatus, useAppDispatch } from "../store"
import { ServerSignalREvent, useServerSignalREvent } from "../signalr"
import type { AddonContainerStatus } from "@namorix/core"

export const useAddonEvents = () => {
  const dispatch = useAppDispatch()

  useServerSignalREvent<{ addonId: string; status: AddonContainerStatus }>(
    ServerSignalREvent.AddonStatusChanged,
    (data) => {
      dispatch(updateAddonStatus(data))
    },
  )
}
