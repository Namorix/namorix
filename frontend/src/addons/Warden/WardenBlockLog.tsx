import React from "react"
import { useTranslation } from "react-i18next"
import {
  type NmxFallback,
  type NmxLogEntry,
  NmxLogList,
  type NmxSemanticColor,
} from "@namorix/ui"
import { useDateTimeFormat } from "@namorix/core"
import type { WdSecurityEvent, WdSeverity } from "./Warden.types"

export interface WardenBlockLogProps {
  events: WdSecurityEvent[]
  loading?: boolean
}

const SEVERITY_SEMANTIC: Record<WdSeverity, NmxSemanticColor> = {
  info: "info",
  warning: "warning",
  critical: "error",
}

export const WardenBlockLog: React.FC<WardenBlockLogProps> = ({
  events,
  loading,
}) => {
  const { t } = useTranslation()
  const { dateTime } = useDateTimeFormat()

  const entries: NmxLogEntry[] = events.map((row) => ({
    id: row.id,
    time: dateTime(row.timestamp),
    message: `${row.sourceIp ?? "—"} · ${t(
      `addon.warden.eventTypes.${row.eventType}`,
      { defaultValue: row.eventType },
    )}${row.count > 1 ? ` ×${row.count}` : ""}`,
    semantic: SEVERITY_SEMANTIC[row.severity],
  }))

  const fallbackConditions: NmxFallback[] = [
    {
      state: "loading",
      condition: loading,
      content: t("addon.warden.log.fallbacks.loading"),
    },
    {
      state: "empty",
      condition: !loading && events.length === 0,
      content: t("addon.warden.log.fallbacks.empty"),
    },
  ]

  return (
    <NmxLogList
      items={entries}
      contained
      fallbackConditions={fallbackConditions}
      className="nmx-addon-page__data-table"
    />
  )
}
