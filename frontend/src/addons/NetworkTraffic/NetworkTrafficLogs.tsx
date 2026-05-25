import { NmxBadge, NmxDataTable, NmxPagination } from "@namorix/ui"
import React, { useCallback, useEffect, useRef, useState } from "react"
import { trafficController, type TrafficLog } from "./traffic.controller"
import { useTranslation } from "react-i18next"
import type { NmxDataTableColumn, NmxDataTableFallback } from "@namorix/ui"
import {
  formatDuration,
  formatSize,
  formatTimestamp,
  methodToSemantic,
  statusToSemantic,
} from "./utils"
import { NmxAddonPage } from "@namorix/ui"
import { usePageSize } from "@namorix/core"

interface NetworkTrafficLogsProps {
  filterSearch?: string
}

export const NetworkTrafficLogs: React.FC<NetworkTrafficLogsProps> = ({
  filterSearch,
}) => {
  const { t } = useTranslation()
  const { pageSize, setPageSize, options: pageSizeOptions } = usePageSize()
  const [logs, setLogs] = useState<TrafficLog[]>([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [elapsedMs, setElapsedMs] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<unknown>()
  const prevFilterRef = useRef(filterSearch)

  const fetchLogs = useCallback(
    async (pg: number, filter: string | undefined, size: number) => {
      setLoading(true)
      setPage(pg)

      trafficController
        .listLogs(pg, size, filter)
        .then((res) => {
          setLogs(res.items)
          setTotal(res.total)
          setElapsedMs(res.elapsedMs)
        })
        .finally(() => setLoading(false))
    },
    [],
  )

  useEffect(() => {
    const isNewFilter = prevFilterRef.current !== filterSearch
    if (isNewFilter) prevFilterRef.current = filterSearch
    const pg = isNewFilter ? 1 : page

    const timeout = setTimeout(() => {
      fetchLogs(pg, filterSearch, pageSize).catch(setError)
    }, 0)
    return () => clearTimeout(timeout)
  }, [filterSearch, page, pageSize, fetchLogs])

  const columns: NmxDataTableColumn<TrafficLog>[] = [
    {
      header: t("addon.networkTraffic.logs.statusCode"),
      renderCell: (row) => (
        <NmxBadge
          semantic={statusToSemantic(row.statusCode)}
          bgEnabled={false}
          className="nmx-addon-network-traffic__badge"
        >
          {row.statusCode}
        </NmxBadge>
      ),
      grow: 1,
      alignHeader: "center",
      alignCell: "center",
      disableEllipsisCell: true,
    },
    {
      header: t("addon.networkTraffic.logs.method"),
      renderCell: (row) => (
        <NmxBadge
          semantic={methodToSemantic(row?.method)}
          className="nmx-addon-network-traffic__badge"
        >
          {row?.method}
        </NmxBadge>
      ),
      grow: 1,
      alignHeader: "center",
      alignCell: "center",
      disableEllipsisCell: true,
    },
    {
      header: t("addon.networkTraffic.logs.path"),
      renderCell: (row) => row?.path ?? "-",
      grow: 3,
    },
    {
      header: t("addon.networkTraffic.logs.duration"),
      renderCell: (row) => formatDuration(row.durationMs),
      grow: 1,
      alignHeader: "center",
      alignCell: "center",
      disableEllipsisCell: true,
      hideBelow: "xl",
    },
    {
      header: t("addon.networkTraffic.logs.size"),
      renderCell: (row) => formatSize(row.responseSizeBytes),
      grow: 1,
      alignHeader: "center",
      alignCell: "center",
      disableEllipsisCell: true,
      hideBelow: "xl",
    },
    {
      header: t("addon.networkTraffic.logs.ip"),
      renderCell: (row) => row?.ip ?? "-",
      grow: 2,
    },
    {
      header: t("addon.networkTraffic.logs.timestamp"),
      renderCell: (row) => formatTimestamp(row.timestamp),
      grow: 2,
      disableEllipsisCell: true,
      hideBelow: "lg",
    },
  ]

  const fallbackConditions: NmxDataTableFallback[] = [
    {
      state: "loading",
      condition: loading,
      content: t("addon.networkTraffic.logs.fallbacks.loading"),
    },
    {
      state: "error",
      condition: error,
      content: t("addon.networkTraffic.logs.fallbacks.error"),
    },
    {
      state: "empty",
      condition: !loading && logs.length === 0,
      content: t("addon.networkTraffic.logs.fallbacks.empty"),
    },
  ]

  const totalPages = Math.ceil(total / pageSize)

  return (
    <NmxAddonPage className="nmx-addon-network-traffic__logs">
      <NmxDataTable
        columns={columns}
        rows={logs}
        fallbackConditions={fallbackConditions}
        className="nmx-addon-page__data-table"
      />
      {total > 0 && (
        <NmxPagination
          page={page}
          totalPages={totalPages}
          totalItems={total}
          elapsedMs={elapsedMs}
          pageSize={pageSize}
          pageSizeOptions={pageSizeOptions}
          onPageSizeChange={(size) => {
            setPageSize(size)
            setError(undefined)
            setPage(1)
          }}
          className="nmx-addon-page__pagination nmx-addon-network-traffic__pagination"
          onPageChange={(page) => {
            setLoading(true)
            setError(undefined)
            setPage(page)
          }}
        />
      )}
    </NmxAddonPage>
  )
}
