import { useEffect } from "react"
import {
  type ConfigChanged,
  NMX_APPEARANCE_DEFAULTS_KEY,
  nmxToast,
  SignalREvent,
  type UserSettingsChanged,
  useSignalREvent,
  useUserStore,
} from "@namorix/core"
import { authController } from "../controllers"

export function useAppearanceSync() {
  const user = useUserStore()

  useEffect(() => {
    authController.loadAppearance().catch((err) => nmxToast.error(err))
  }, [user])

  useSignalREvent(SignalREvent.SystemConfigChanged, (data: ConfigChanged) => {
    if (data.key === NMX_APPEARANCE_DEFAULTS_KEY) {
      authController.loadAppearance().catch((err) => nmxToast.error(err))
    }
  })

  useSignalREvent(
    SignalREvent.UserSettingsChanged,
    (data: UserSettingsChanged) => {
      if (user?.id === data.userId) {
        authController.loadAppearance().catch((err) => nmxToast.error(err))
      }
    },
  )
}
