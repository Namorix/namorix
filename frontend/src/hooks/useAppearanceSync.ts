import { useEffect } from "react"
import {
  type ConfigChanged,
  NMX_APPEARANCE_DEFAULTS_KEY,
  nmxToast,
  SignalREvent,
  type UserSettingsChanged,
  useUserStore,
} from "@namorix/core"
import { authController } from "../controllers"
import { useSignalREvent } from "../signalr"

export function useAppearanceSync() {
  const user = useUserStore()

  useEffect(() => {
    authController.loadAppearance().catch(nmxToast.error)
  }, [user])

  useSignalREvent(SignalREvent.SystemConfigChanged, (data: ConfigChanged) => {
    if (data.key === NMX_APPEARANCE_DEFAULTS_KEY) {
      authController.loadAppearance().catch(nmxToast.error)
    }
  })

  useSignalREvent(
    SignalREvent.UserSettingsChanged,
    (data: UserSettingsChanged) => {
      if (user?.id === data.userId) {
        authController.loadAppearance().catch(nmxToast.error)
      }
    },
  )
}
