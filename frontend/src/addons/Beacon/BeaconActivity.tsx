import React, { useCallback, useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import {
  NmxAlertDialog,
  NmxAlign,
  NmxButton,
  type NmxFallback,
  NmxIconFont,
  NmxIconFontSymbol,
  type NmxLogEntry,
  NmxLogList,
  NmxPagination,
  type NmxSemanticColor,
  useActiveTab,
} from "@namorix/ui"
import { nmxToast, useDateTimeFormat, usePageSize } from "@namorix/core"
import { beaconController } from "./beacon.controller"
import {
  BeaconActivityCodes,
  BeaconErrorCodes,
  type BcnActivityLogDto,
  bcnErrorDetail,
} from "./Beacon.types"
import { ServerSignalREvents, useServerSignalREvent } from "../../signalr"
import type { BeaconTab } from "./Beacon"

const ACTIVITY_CODES = { ...BeaconActivityCodes, ...BeaconErrorCodes }

const LEVEL_SEMANTIC: Record<string, NmxSemanticColor> = {
  info: "info",
  success: "success",
  warn: "warning",
  error: "error",
} as const

export const BeaconActivity: React.FC = () => {
  const { t } = useTranslation()
  const { dateTime } = useDateTimeFormat()
  const { pageSize, setPageSize, options: pageSizeOptions } = usePageSize()
  const [items, setItems] = useState<BcnActivityLogDto[]>([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<unknown>()
  const [confirmClear, setConfirmClear] = useState(false)
  const [clearing, setClearing] = useState(false)
  const activeTab = useActiveTab<BeaconTab>()

  const fetchActivity = useCallback(
    async (pg: number, size: number) => {
      setError(undefined)
      setPage(pg)

      if (items.length === 0) {
        setLoading(true)
      }

      beaconController
        .listActivity(pg, size)
        .then((res) => {
          setItems(res.items)
          setTotal(res.total)
        })
        .finally(() => setLoading(false))
    },
    [items.length],
  )

  useEffect(() => {
    if (activeTab !== "activity") return

    const timeout = setTimeout(() => {
      fetchActivity(page, pageSize).catch(setError)
    }, 0)
    return () => clearTimeout(timeout)
  }, [page, pageSize, fetchActivity, activeTab])

  useServerSignalREvent(
    ServerSignalREvents.BeaconActivityCreated,
    useCallback(() => {
      fetchActivity(page, pageSize).catch(nmxToast.error)
    }, [fetchActivity, page, pageSize]),
  )

  useServerSignalREvent(
    ServerSignalREvents.BeaconHostnamesRefreshed,
    useCallback(() => {
      fetchActivity(page, pageSize).catch(nmxToast.error)
    }, [fetchActivity, page, pageSize]),
  )

  const renderMessage = (row: BcnActivityLogDto): string => {
    if (!row.code) return "—"
    let params: Record<string, unknown> = {}
    if (row.paramsJson) {
      try {
        params = JSON.parse(row.paramsJson) as Record<string, unknown>
      } catch {
        params = {}
      }
    }

    if (typeof params.retryAt === "string")
      params.retryAt = dateTime(params.retryAt)

    const providerLabel = params.provider
      ? t(`addon.beacon.providers.${params.provider}`, {
          defaultValue: String(params.provider),
        })
      : undefined

    return t(ACTIVITY_CODES[row.code] ?? row.code, {
      ...params,
      provider: providerLabel,
      detail: bcnErrorDetail(params),
    })
  }

  const handleClearConfirm = useCallback(() => {
    setClearing(true)
    beaconController
      .clearActivity()
      .then((res) => {
        nmxToast.success(
          t("addon.beacon.activity.feedback.clearSuccess", {
            count: res.deleted,
          }),
        )
        setConfirmClear(false)
        return fetchActivity(1, pageSize)
      })
      .catch(() =>
        nmxToast.error(t("addon.beacon.activity.feedback.clearError")),
      )
      .finally(() => setClearing(false))
  }, [fetchActivity, pageSize, t])

  const entries: NmxLogEntry[] = items.map((row) => {
    const label =
      row.host && row.host === row.domain
        ? row.domain
        : [row.host, row.domain].filter(Boolean).join(" · ")

    return {
      id: row.id,
      time: dateTime(row.timestamp),
      message: label ? `${renderMessage(row)} · ${label}` : renderMessage(row),
      semantic: LEVEL_SEMANTIC[row.level],
      markupToHtmlEnabled: true,
    }
  })

  const fallbackConditions: NmxFallback[] = [
    {
      state: "loading",
      condition: loading,
      content: t("addon.beacon.activity.fallbacks.loading"),
    },
    {
      state: "error",
      condition: error,
      content: t("addon.beacon.activity.fallbacks.error"),
    },
    {
      state: "empty",
      condition: !loading && items.length === 0,
      content: t("addon.beacon.activity.fallbacks.empty"),
    },
  ]

  const totalPages = Math.ceil(total / pageSize)

  return (
    <>
      <NmxAlign direction="row" justify="end">
        {entries.length > 0 && (
          <NmxButton semantic="error" onClick={() => setConfirmClear(true)}>
            <NmxIconFont symbol={NmxIconFontSymbol.DELETE} />
            <span>{t("addon.beacon.activity.actions.clear")}</span>
          </NmxButton>
        )}
        <NmxButton onClick={() => fetchActivity(page, pageSize)}>
          <NmxIconFont symbol={NmxIconFontSymbol.REFRESH} />
          <span>{t("addon.beacon.activity.actions.refresh")}</span>
        </NmxButton>
      </NmxAlign>

      <div className="nmx-addon-beacon__list">
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
              setError(undefined)
              setPage(1)
            }}
            onPageChange={(pg) => {
              setError(undefined)
              setPage(pg)
            }}
          />
        )}
      </div>

      <NmxAlertDialog
        open={confirmClear}
        title={t("addon.beacon.activity.actions.clear")}
        confirmLabel={t("addon.beacon.activity.actions.clear")}
        confirmSemantic="error"
        onClose={() => setConfirmClear(false)}
        onConfirm={handleClearConfirm}
        loading={clearing}
      >
        <p>{t("addon.beacon.activity.feedback.clearConfirm")}</p>
      </NmxAlertDialog>
    </>
  )
}
