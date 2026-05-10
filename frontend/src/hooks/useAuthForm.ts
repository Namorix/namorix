import { useCallback, useState } from "react"
import type { NmxInlineAlertVariant } from "@namorix/ui/Primitives"
import type { TFunction } from "@namorix/core"
import { ApiError, formatApiError } from "@namorix/core"

export function useAuthForm() {
  const [busy, setBusy] = useState(false)
  const [alertVariant, setAlertVariant] =
    useState<NmxInlineAlertVariant>("info")
  const [alertMessage, setAlertMessage] = useState<string | null>()

  const setAlert = useCallback(
    (
      variant: NmxInlineAlertVariant,
      message: string | null,
      busy: boolean = false,
    ) => {
      setAlertVariant(variant)
      setAlertMessage(message)
      setBusy(busy)
    },
    [setAlertVariant, setAlertMessage, setBusy],
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
