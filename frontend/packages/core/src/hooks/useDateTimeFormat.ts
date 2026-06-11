import { useMemo } from "react"
import { useAppearanceStore } from "../store"
import { formatDateTime, formatRelativeTime, formatTimestamp } from "../utils"
import { useTranslation } from "react-i18next"

export function useDateTimeFormat() {
  const timeFormat = useAppearanceStore()?.appearance_time_format ?? "HH:mm"
  const dateFormat =
    useAppearanceStore()?.appearance_date_format ?? "DD/MM/YYYY"
  const { t } = useTranslation()

  return useMemo(
    () => ({
      clock: (input: Date | string) =>
        formatDateTime(input, timeFormat, dateFormat),
      timestamp: (input: Date | string) =>
        formatTimestamp(input, timeFormat, dateFormat),
      relativeTime: (input: Date | string) => formatRelativeTime(input, t),
    }),
    [timeFormat, dateFormat, t],
  )
}
