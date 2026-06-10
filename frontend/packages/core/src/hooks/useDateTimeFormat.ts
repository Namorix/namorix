import { useMemo } from "react"
import { useAppearanceStore } from "../store"
import { formatDateTime, formatTimestamp } from "../utils"

export function useDateTimeFormat() {
  const timeFormat = useAppearanceStore()?.appearance_time_format ?? "HH:mm"
  const dateFormat =
    useAppearanceStore()?.appearance_date_format ?? "DD/MM/YYYY"

  return useMemo(
    () => ({
      clock: (input: Date | string) =>
        formatDateTime(input, timeFormat, dateFormat),
      timestamp: (input: Date | string) =>
        formatTimestamp(input, timeFormat, dateFormat),
    }),
    [timeFormat, dateFormat],
  )
}
