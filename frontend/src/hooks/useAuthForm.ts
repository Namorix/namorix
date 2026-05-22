import { useCallback, useState } from "react"
import type { NmxInlineAlertState } from "@namorix/ui"
import type { TFunction } from "@namorix/core"
import { ApiError, formatApiError } from "@namorix/core"

export function useAuthForm() {
  const [busy, setBusy] = useState(false)
  const [alert, setAlert] = useState<NmxInlineAlertState | null>(null)

  const handlerError = useCallback(
    (err: unknown, t: TFunction, genericKey: string) => {
      if (err instanceof ApiError) {
        setAlert({
          semantic: "error",
          message: formatApiError(t, err) ?? t(genericKey),
        })
      } else if (err instanceof Error) {
        setAlert({ semantic: "error", message: err })
      } else {
        setAlert({ semantic: "error", message: t(genericKey) })
      }
    },
    [setAlert],
  )

  return { busy, setBusy, alert, setAlert, handlerError }
}
