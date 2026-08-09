import React, { useCallback, useEffect, useState } from "react"
import {
  NmxAlign,
  NmxButton,
  type NmxFallback,
  NmxIconFont,
  NmxIconFontSymbol,
  type NmxLogEntry,
  NmxLogList,
  NmxPagination,
  type NmxSemanticColor,
} from "@namorix/ui"
import { useTranslation } from "react-i18next"
import type { WdSecurityEvent, WdSeverity } from "./Warden.types"
import { nmxToast, useDateTimeFormat, usePageSize } from "@namorix/core"
import { wardenController } from "./warden.controller"

const SeveritySemantic: Record<WdSeverity, NmxSemanticColor> = {
  info: "info",
  warning: "warning",
  critical: "error",
}

export const WardenActivity: React.FC = () => {
  const { t } = useTranslation()
  const [events, setEvents] = useState<WdSecurityEvent[]>([])
  const [eventsLoading, setEventsLoading] = useState(true)
  const { dateTime } = useDateTimeFormat()
  const { pageSize, setPageSize, options: pageSizeOptions } = usePageSize()
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)

  const fetchEvents = useCallback((pg: number, size: number) => {
    if (events.length <= 0) setEventsLoading(true)
    wardenController
      .listEvents({ page: pg, size })
      .then((res) => {
        setEvents(res.items)
        setTotal(res.total)
      })
      .finally(() => setEventsLoading(false))
      .catch(nmxToast.error)
  }, [])

  const entries: NmxLogEntry[] = events.map((row) => ({
    id: row.id,
    time: dateTime(row.timestamp),
    message: `${row.sourceIp ?? "—"} · ${t(
      `addon.warden.pages.activity.eventTypes.${row.eventType}`,
      { defaultValue: row.eventType },
    )}${row.count > 1 ? ` ×${row.count}` : ""}`,
    semantic: SeveritySemantic[row.severity],
  }))

  useEffect(() => {
    const timeout = setTimeout(() => fetchEvents(page, pageSize), 0)
    return () => clearTimeout(timeout)
  }, [page, pageSize, fetchEvents])

  const fallbackConditions: NmxFallback[] = [
    {
      state: "loading",
      condition: eventsLoading,
      content: t("addon.warden.pages.activity.fallbacks.loading"),
    },
    {
      state: "empty",
      condition: !eventsLoading && events.length === 0,
      content: t("addon.warden.pages.activity.fallbacks.empty"),
    },
  ]

  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="nmx-addon-warden__page">
      <NmxAlign direction="row" justify="end">
        <NmxButton onClick={() => fetchEvents(page, pageSize)}>
          <NmxIconFont symbol={NmxIconFontSymbol.REFRESH} />
          <span>{t("addon.warden.pages.overview.actions.refresh")}</span>
        </NmxButton>
      </NmxAlign>

      <div className="nmx-addon-warden__list">
        <NmxLogList
          items={entries}
          contained
          fallbackConditions={fallbackConditions}
          className="nmx-addon-page__data-table"
        />

        {total > 0 && (
          <NmxPagination
            page={page}
            totalPages={totalPages}
            totalItems={total}
            pageSize={pageSize}
            pageSizeOptions={pageSizeOptions}
            onPageSizeChange={(size) => {
              setPageSize(size)
              setPage(1)
            }}
            onPageChange={setPage}
          />
        )}
      </div>
    </div>
  )
}
