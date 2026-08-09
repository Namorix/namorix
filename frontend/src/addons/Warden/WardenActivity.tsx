import React, { useCallback, useEffect, useMemo, useState } from "react"
import {
  NmxAlertDialog,
  NmxAlign,
  NmxButton,
  type NmxFallback,
  NmxIconFont,
  NmxIconFontSymbol,
  type NmxLogEntry,
  NmxLogList,
  NmxMetaItem,
  NmxMetaList,
  NmxPagination,
  type NmxSemanticColor,
  useActiveTab,
} from "@namorix/ui"
import { useTranslation } from "react-i18next"
import type { WdSecurityEvent, WdSeverity } from "./Warden.types"
import { nmxToast, useDateTimeFormat, usePageSize } from "@namorix/core"
import { wardenController } from "./warden.controller"
import {
  ServerSignalREvent,
  ServerSignalRGroups,
  useServerSignalREvent,
  useServerSignalRGroup,
} from "../../signalr"
import type { WardenTab } from "./Warden"

const SeveritySemantic: Record<WdSeverity, NmxSemanticColor> = {
  info: "info",
  warning: "warning",
  critical: "error",
}

export const WardenActivity: React.FC = () => {
  const { t } = useTranslation()
  const activeTab = useActiveTab<WardenTab>()
  const [events, setEvents] = useState<WdSecurityEvent[]>([])
  const [eventsLoading, setEventsLoading] = useState(true)
  const { dateTime } = useDateTimeFormat()
  const { pageSize, setPageSize, options: pageSizeOptions } = usePageSize()
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [selected, setSelected] = useState<WdSecurityEvent | null>(null)
  const [confirmClear, setConfirmClear] = useState(false)
  const [clearing, setClearing] = useState(false)

  const fetchEvents = useCallback(
    (pg: number, size: number) => {
      if (events.length <= 0) setEventsLoading(true)
      wardenController
        .listEvents({ page: pg, size })
        .then((res) => {
          setEvents(res.items)
          setTotal(res.total)
        })
        .finally(() => setEventsLoading(false))
        .catch(nmxToast.error)
    },
    [events.length],
  )

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
    if (activeTab !== "activity") return
    const timeout = setTimeout(() => fetchEvents(page, pageSize), 0)
    return () => clearTimeout(timeout)
  }, [page, pageSize, fetchEvents, activeTab])

  useServerSignalRGroup(ServerSignalRGroups.Warden, true)
  useServerSignalREvent(ServerSignalREvent.WardenNewEvent, () => {
    fetchEvents(page, pageSize)
  })

  const handleClearConfirm = useCallback(() => {
    setClearing(true)
    wardenController
      .clearEvents()
      .then((res) => {
        nmxToast.success(
          t("addon.warden.pages.activity.feedback.clearSuccess", {
            count: res.deleted,
          }),
        )
        setConfirmClear(false)
        return fetchEvents(1, pageSize)
      })
      .catch(() =>
        nmxToast.error(t("addon.warden.pages.activity.feedback.clearError")),
      )
      .finally(() => setClearing(false))
  }, [fetchEvents, pageSize, t])

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

  const detailEntries = useMemo(() => {
    if (!selected?.detailJson) return null
    try {
      const parsed = JSON.parse(selected.detailJson) as Record<string, unknown>
      if (typeof parsed !== "object" || parsed === null) {
        return null
      }

      return Object.entries(parsed).map(([k, v]) => ({
        key: k,
        value: typeof v === "object" ? JSON.stringify(v) : String(v),
      }))
    } catch {
      return null
    }
  }, [selected])

  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="nmx-addon-warden__page">
      <NmxAlign direction="row" justify="end">
        <NmxButton onClick={() => setConfirmClear(true)} semantic="error">
          <NmxIconFont symbol={NmxIconFontSymbol.DELETE} />
          <span>{t("addon.warden.pages.activity.actions.clear")}</span>
        </NmxButton>
        <NmxButton onClick={() => fetchEvents(page, pageSize)}>
          <NmxIconFont symbol={NmxIconFontSymbol.REFRESH} />
          <span>{t("addon.warden.pages.activity.actions.refresh")}</span>
        </NmxButton>
      </NmxAlign>

      <div className="nmx-addon-warden__list">
        <NmxLogList
          items={entries}
          contained
          fallbackConditions={fallbackConditions}
          className="nmx-addon-page__data-table"
          onItemClick={(item) =>
            setSelected(events.find((e) => e.id === item.id) ?? null)
          }
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

      <NmxAlertDialog
        open={selected !== null}
        title={t(
          `addon.warden.pages.activity.eventTypes.${selected?.eventType}`,
          {
            defaultValue: selected?.eventType,
          },
        )}
        closeLabel={t("addon.warden.pages.activity.detail.actions.close")}
        onClose={() => setSelected(null)}
      >
        {selected && (
          <div className="nmx-addon-warden__activity-meta-list">
            <NmxMetaList>
              <NmxMetaItem
                label={t("addon.warden.pages.activity.detail.fields.sourceIp")}
                value={selected.sourceIp ?? "—"}
                alignValue="end"
              />
              <NmxMetaItem
                label={t(
                  "addon.warden.pages.activity.detail.fields.sourceAddon",
                )}
                value={selected.sourceAddon}
                alignValue="end"
              />
              <NmxMetaItem
                label={t("addon.warden.pages.activity.detail.fields.severity")}
                value={selected.severity}
                semantic={SeveritySemantic[selected.severity]}
                alignValue="end"
              />
              <NmxMetaItem
                label={t("addon.warden.pages.activity.detail.fields.count")}
                value={String(selected.count)}
                alignValue="end"
              />
              {selected.count > 1 && (
                <NmxMetaItem
                  label={t(
                    "addon.warden.pages.activity.detail.fields.windowStart",
                  )}
                  value={dateTime(selected.windowStart)}
                  alignValue="end"
                />
              )}
              <NmxMetaItem
                label={t("addon.warden.pages.activity.detail.fields.timestamp")}
                value={dateTime(selected.timestamp)}
                alignValue="end"
              />
            </NmxMetaList>
            <NmxMetaList contained={true}>
              {detailEntries?.map(({ key, value }) => (
                <NmxMetaItem
                  key={key}
                  label={key}
                  value={value}
                  alignValue="end"
                />
              ))}
            </NmxMetaList>
          </div>
        )}
      </NmxAlertDialog>

      <NmxAlertDialog
        open={confirmClear}
        title={t("addon.warden.pages.activity.actions.clear")}
        confirmLabel={t("addon.warden.pages.activity.actions.clear")}
        confirmSemantic="error"
        onClose={() => setConfirmClear(false)}
        onConfirm={handleClearConfirm}
        loading={clearing}
      >
        <p>{t("addon.warden.pages.activity.feedback.clearConfirm")}</p>
      </NmxAlertDialog>
    </div>
  )
}
