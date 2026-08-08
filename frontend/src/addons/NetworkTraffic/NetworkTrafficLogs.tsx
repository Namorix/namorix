import {
  NmxAlertDialog,
  NmxBadge,
  NmxDataTable,
  type NmxFallback,
  NmxMetaItem,
  NmxMetaList,
  NmxPagination,
} from "@namorix/ui"
import React, { useCallback, useEffect, useRef, useState } from "react"
import { trafficController, type TrafficLog } from "./traffic.controller"
import { useTranslation } from "react-i18next"
import type { NmxDataTableColumn } from "@namorix/ui"
import { methodToSemantic, statusToSemantic } from "./utils"
import {
  formatDuration,
  formatSize,
  SignalREvent,
  SignalRGroups,
  useDateTimeFormat,
  usePageSize,
  useSignalREvent,
  useSignalRGroup,
} from "@namorix/core"
import type { NetworkTrafficSource } from "./NetworkTraffic"

interface NetworkTrafficLogsProps {
  filterSearch?: string
  refreshKey?: number
  live?: boolean
  source?: NetworkTrafficSource
}

export const NetworkTrafficLogs: React.FC<NetworkTrafficLogsProps> = ({
  filterSearch,
  refreshKey,
  live,
  source = "all",
}) => {
  const { t } = useTranslation()
  const { dateTime } = useDateTimeFormat()
  const { pageSize, setPageSize, options: pageSizeOptions } = usePageSize()
  const [logs, setLogs] = useState<TrafficLog[]>([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [elapsedMs, setElapsedMs] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<unknown>()
  const [selectedLog, setSelectedLog] = useState<TrafficLog | null>(null)

  const prevFilterRef = useRef(filterSearch)
  const prevSourceRef = useRef(source)

  const fetchLogs = useCallback(
    async (pg: number, filter: string | undefined, size: number) => {
      setPage(pg)

      if (logs.length <= 0) {
        setLoading(true)
      }

      trafficController
        .listLogs(pg, size, filter, source === "all" ? undefined : source)
        .then((res) => {
          setLogs(res.items)
          setTotal(res.total)
          setElapsedMs(res.elapsedMs)
        })
        .finally(() => setLoading(false))
    },
    [logs.length, source],
  )

  useEffect(() => {
    const isNewFilter = prevFilterRef.current !== filterSearch
    if (isNewFilter) prevFilterRef.current = filterSearch

    const isNewSource = prevSourceRef.current !== source
    if (isNewSource) prevSourceRef.current = source

    const pg = isNewFilter || isNewSource ? 1 : page
    const timeout = setTimeout(() => {
      fetchLogs(pg, filterSearch, pageSize).catch(setError)
    }, 0)
    return () => clearTimeout(timeout)
  }, [filterSearch, page, live, pageSize, refreshKey, fetchLogs, source])

  useSignalRGroup(SignalRGroups.Traffic, !!live)

  useSignalREvent(SignalREvent.TrafficNewLogs, () => {
    if (live) {
      fetchLogs(1, filterSearch, pageSize).catch(setError)
    }
  })

  const columns: NmxDataTableColumn<TrafficLog>[] = [
    {
      header: t("addon.networkTraffic.logs.fields.statusCode"),
      renderCell: (row) => (
        <NmxBadge
          semantic={statusToSemantic(row.statusCode)}
          bgEnabled={false}
          size="sm"
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
      header: t("addon.networkTraffic.logs.fields.method"),
      renderCell: (row) => (
        <NmxBadge semantic={methodToSemantic(row?.method)} size="sm">
          {row?.method}
        </NmxBadge>
      ),
      grow: 1,
      alignHeader: "center",
      alignCell: "center",
      disableEllipsisCell: true,
    },
    {
      header: t("addon.networkTraffic.logs.fields.path"),
      renderCell: (row) => row?.path ?? "-",
      grow: 3,
      enableUserSelectCell: true,
    },
    {
      header: t("addon.networkTraffic.logs.fields.duration"),
      renderCell: (row) => formatDuration(row.durationMs),
      grow: 1,
      alignHeader: "center",
      alignCell: "center",
      disableEllipsisCell: true,
      hideBelow: "xl",
    },
    {
      header: t("addon.networkTraffic.logs.fields.size"),
      renderCell: (row) => formatSize(row.responseSizeBytes),
      grow: 1,
      alignHeader: "center",
      alignCell: "center",
      disableEllipsisCell: true,
      hideBelow: "xl",
    },
    {
      header: t("addon.networkTraffic.logs.fields.ip"),
      renderCell: (row) => row?.ip ?? "-",
      grow: 2,
      enableUserSelectCell: true,
    },
    {
      header: t("addon.networkTraffic.logs.fields.dateTime"),
      renderCell: (row) => dateTime(row.timestamp),
      grow: 2,
      disableEllipsisCell: true,
      hideBelow: "lg",
    },
  ]

  const fallbackConditions: NmxFallback[] = [
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
    <>
      <NmxDataTable
        columns={columns}
        rows={logs}
        fallbackConditions={fallbackConditions}
        className="nmx-addon-page__data-table"
        clickableRows={true}
        onRowClick={(log) => setSelectedLog(log)}
      />
      <NmxAlertDialog
        open={!!selectedLog}
        title={dateTime(selectedLog?.timestamp ?? "")}
        onClose={() => setSelectedLog(null)}
        size="md"
      >
        {selectedLog && (
          <NmxMetaList>
            <NmxMetaItem
              label={t("addon.networkTraffic.logs.fields.statusCode")}
            >
              <NmxBadge
                semantic={statusToSemantic(selectedLog.statusCode)}
                bgEnabled={false}
                size="sm"
              >
                {selectedLog.statusCode}
              </NmxBadge>
            </NmxMetaItem>
            <NmxMetaItem label={t("addon.networkTraffic.logs.fields.method")}>
              <NmxBadge
                semantic={methodToSemantic(selectedLog.method)}
                size="sm"
              >
                {selectedLog.method}
              </NmxBadge>
            </NmxMetaItem>
            <NmxMetaItem
              label={t("addon.networkTraffic.logs.fields.path")}
              value={selectedLog.path}
              useSelectEnabled={true}
            />
            <NmxMetaItem
              label={t("addon.networkTraffic.logs.fields.duration")}
              value={formatDuration(selectedLog.durationMs)}
            />
            <NmxMetaItem
              label={t("addon.networkTraffic.logs.fields.size")}
              value={formatSize(selectedLog.responseSizeBytes)}
            />
            <NmxMetaItem
              label={t("addon.networkTraffic.logs.fields.ip")}
              value={selectedLog.ip ?? "-"}
              useSelectEnabled={true}
            />
          </NmxMetaList>
        )}
      </NmxAlertDialog>
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
          onPageChange={(page) => {
            setLoading(true)
            setError(undefined)
            setPage(page)
          }}
        />
      )}
    </>
  )
}
