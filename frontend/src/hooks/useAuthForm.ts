import { useCallback, useState } from "react"
import type { NmxSemanticColor } from "@namorix/ui"
import type { TFunction } from "@namorix/core"
import { ApiError, formatApiError } from "@namorix/core"

export function useAuthForm() {
  const [busy, setBusy] = useState(false)
  const [alertVariant, setAlertSemantic] = useState<NmxSemanticColor>("info")
  const [alertMessage, setAlertMessage] = useState<string | null>()

  const setAlert = useCallback(
    (
      semantic: NmxSemanticColor,
      message: string | null,
      busy: boolean = false,
    ) => {
      setAlertSemantic(semantic)
      setAlertMessage(message)
      setBusy(busy)
    },
    [setAlertSemantic, setAlertMessage, setBusy],
  )

  const handlerError = useCallback(
    (err: unknown, t: TFunction, genericKey: string) => {
      if (err instanceof ApiError) {
        setAlert("error", formatApiError(t, err) ?? t(genericKey))
      } else if (err instanceof Error) {
        setAlert("error", err.message)
      } else {
        setAlert("error", t(genericKey))
      }
    },
    [setAlert],
  )

  return { busy, alertVariant, alertMessage, setAlert, handlerError }
}
