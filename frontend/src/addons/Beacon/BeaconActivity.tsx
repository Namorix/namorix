import React, { useCallback, useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import {
  NmxAlign,
  NmxButton,
  type NmxFallback,
  NmxIconFont,
  NmxIconFontSymbol,
  type NmxLogEntry,
  NmxLogList,
  NmxPagination,
} from "@namorix/ui"
import { useDateTimeFormat, usePageSize } from "@namorix/core"
import { beaconController } from "./beacon.controller"
import {
  BeaconActivityCodes,
  BeaconErrorCodes,
  type BcnActivityLogDto,
  bcnErrorDetail,
} from "./Beacon.types"

const ACTIVITY_CODES = { ...BeaconActivityCodes, ...BeaconErrorCodes }

const LEVEL_SEMANTIC = {
  info: "info",
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

  const fetchActivity = useCallback(async (pg: number, size: number) => {
    setLoading(true)
    setError(undefined)
    setPage(pg)

    beaconController
      .listActivity(pg, size)
      .then((res) => {
        setItems(res.items)
        setTotal(res.total)
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchActivity(page, pageSize).catch(setError)
    }, 0)
    return () => clearTimeout(timeout)
  }, [page, pageSize, fetchActivity])

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

    return t(ACTIVITY_CODES[row.code] ?? row.code, {
      ...params,
      detail: bcnErrorDetail(params),
    })
  }

  const entries: NmxLogEntry[] = items.map((row) => ({
    id: row.id,
    time: dateTime(row.timestamp),
    message: row.hostname
      ? `${renderMessage(row)} · ${row.hostname}`
      : renderMessage(row),
    semantic: LEVEL_SEMANTIC[row.level],
    markupToHtmlEnabled: true,
  }))

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
        <NmxButton onClick={() => fetchActivity(page, pageSize)}>
          <NmxIconFont symbol={NmxIconFontSymbol.REFRESH} />
          <span>{t("addon.beacon.activity.refresh")}</span>
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
              setLoading(true)
              setError(undefined)
              setPage(pg)
            }}
          />
        )}
      </div>
    </>
  )
}
