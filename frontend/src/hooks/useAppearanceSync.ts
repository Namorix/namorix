import { useEffect } from "react"
import {
  type ConfigChanged,
  NMX_APPEARANCE_DEFAULTS_KEY,
  SignalREvent,
  type UserSettingsChanged,
  useSignalREvent,
  useUserStore,
} from "@namorix/core"
import { authController, loadAppearanceSystem } from "../controllers"

export function useAppearanceSync() {
  const user = useUserStore()

  useEffect(() => {
    if (!user) {
      loadAppearanceSystem().catch(() => {})
    } else {
      authController.loadAppearance().catch(() => {})
    }
  }, [user])

  useSignalREvent(SignalREvent.SystemConfigChanged, (data: ConfigChanged) => {
    if (data.key === NMX_APPEARANCE_DEFAULTS_KEY) {
      loadAppearanceSystem().catch(() => {})
    }
  })

  useSignalREvent(
    SignalREvent.UserSettingsChanged,
    (data: UserSettingsChanged) => {
      if (user?.id === data.userId) {
        authController.loadAppearance().catch(() => {})
      }
    },
  )
}
