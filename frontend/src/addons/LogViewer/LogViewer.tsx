import React, { useCallback, useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import {
  SignalRGroups,
  SignalREvent,
  useSignalRGroup,
  useSignalREvent,
  usePageSize,
  type LogEntry,
  type LogLevel,
  type LogGroup,
} from "@namorix/core"
import {
  NmxBadge,
  NmxDataTable,
  NmxPagination,
  NmxSelect,
  type NmxDataTableColumn,
  type NmxDataTableFallback,
  type NmxSemanticColor,
  NmxSearchInput,
  NmxButton,
  NmxHorizontalWrap,
  NmxHorizontalWrapItem,
  NmxAddonRoot,
} from "@namorix/ui"
import { logController } from "./log.controller"
import { formatTimestamp } from "../NetworkTraffic/utils"

const LEVEL_OPTIONS = [
  { value: "", label: "addon.logViewer.allLevels" },
  { value: "2", label: "addon.logViewer.levels.info" },
  { value: "3", label: "addon.logViewer.levels.warn" },
  { value: "4", label: "addon.logViewer.levels.error" },
  { value: "5", label: "addon.logViewer.levels.fatal" },
]

const LEVEL_TYPES: Record<
  number,
  { level: LogLevel; semantic: NmxSemanticColor }
> = {
  0: { level: "trace", semantic: "info" },
  1: { level: "debug", semantic: "info" },
  2: { level: "info", semantic: "info" },
  3: { level: "warn", semantic: "warning" },
  4: { level: "error", semantic: "error" },
  5: { level: "fatal", semantic: "error" },
}

const GROUP_TYPES: Record<
  number,
  {
    group: LogGroup
    semantic: NmxSemanticColor
  }
> = {
  0: { group: "core", semantic: "info" },
  1: { group: "app", semantic: "primary" },
  2: { group: "controller", semantic: "success" },
  3: { group: "auth", semantic: "warning" },
  4: { group: "database", semantic: "error" },
  5: { group: "misc", semantic: "info" },
}

export const LogViewer: React.FC = () => {
  const { t } = useTranslation()
  const { pageSize, setPageSize, options: pageSizeOptions } = usePageSize()
  const [entries, setEntries] = useState<LogEntry[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<unknown>()
  const [level, setLevel] = useState("")
  const [source, setSource] = useState("")
  const prevFilterRef = useRef("")

  useSignalRGroup(SignalRGroups.Logs, true)

  const fetchLogs = useCallback(
    async (pg: number, lvl: string, src: string, size: number) => {
      setLoading(true)
      setPage(pg)

      logController
        .listLogs(pg, size, lvl || undefined, src || undefined)
        .then((res) => {
          setEntries(res.entries)
          setTotal(res.total)
        })
        .finally(() => setLoading(false))
    },
    [],
  )

  useEffect(() => {
    const isNewFilter = prevFilterRef.current !== source
    if (isNewFilter) prevFilterRef.current = source
    const pg = isNewFilter ? 1 : page

    const timeout = setTimeout(() => {
      fetchLogs(pg, level, source, pageSize).catch(setError)
    }, 0)
    return () => clearTimeout(timeout)
  }, [source, page, pageSize, level, fetchLogs])

  useSignalREvent<LogEntry[]>(SignalREvent.LogsNewEntry, (newEntries) => {
    setEntries((prev) => [...newEntries, ...prev].slice(0, pageSize))
    setTotal((prev) => prev + newEntries.length)
  })

  const columns: NmxDataTableColumn<LogEntry>[] = [
    {
      header: t("addon.logViewer.level"),
      renderCell: (row) => (
        <NmxBadge semantic={LEVEL_TYPES[row.level]?.semantic ?? "info"}>
          {(LEVEL_TYPES[row.level]?.level ?? "info").toUpperCase()}
        </NmxBadge>
      ),
      grow: 1,
      alignHeader: "center",
      alignCell: "center",
      disableEllipsisCell: true,
    },
    {
      header: t("addon.logViewer.group"),
      renderCell: (row) => (
        <NmxBadge semantic={GROUP_TYPES[row.group]?.semantic ?? "info"}>
          {GROUP_TYPES[row.group]?.group}
        </NmxBadge>
      ),
      grow: 1,
      alignHeader: "center",
      alignCell: "center",
      disableEllipsisCell: true,
    },
    {
      header: t("addon.logViewer.source"),
      renderCell: (row) => row.source,
      grow: 2,
      hideBelow: "md",
    },
    {
      header: t("addon.logViewer.message"),
      renderCell: (row) => row.message,
      grow: 4,
    },
    {
      header: t("addon.logViewer.timestamp"),
      renderCell: (row) => formatTimestamp(row.timestamp),
      grow: 1,
      disableEllipsisCell: true,
      hideBelow: "lg",
    },
  ]

  const fallbackConditions: NmxDataTableFallback[] = [
    {
      state: "loading",
      condition: loading && entries.length === 0,
      content: t("addon.logViewer.fallbacks.loading"),
    },
    {
      state: "error",
      condition: error,
      content: t("addon.logViewer.fallbacks.error"),
    },
    {
      state: "empty",
      condition: !loading && entries.length === 0,
      content: t("addon.logViewer.fallbacks.empty"),
    },
  ]

  const totalPages = Math.ceil(total / pageSize)

  return (
    <NmxAddonRoot>
      <NmxHorizontalWrap>
        <NmxHorizontalWrapItem>
          <NmxSelect
            value={level}
            options={LEVEL_OPTIONS.map((o) => ({
              value: o.value,
              label: t(o.label),
            }))}
            onChange={(v) => {
              setLevel(v)
              setPage(1)
            }}
          />
          <NmxButton
            label={t("addon.logViewer.refresh")}
            onClick={() => fetchLogs(1, level, source, pageSize)}
          />
        </NmxHorizontalWrapItem>
        <NmxHorizontalWrapItem pushRight>
          <NmxSearchInput
            value={source}
            onChange={(v) => {
              setSource(v)
              setPage(1)
            }}
            onSubmit={(v) => fetchLogs(1, level, v, pageSize)}
            placeholder={t("addon.logViewer.sourcePlaceholder")}
          />
        </NmxHorizontalWrapItem>
      </NmxHorizontalWrap>

      <NmxDataTable
        columns={columns}
        rows={entries}
        fallbackConditions={fallbackConditions}
      />

      {total > 0 && (
        <NmxPagination
          page={page}
          totalPages={totalPages}
          totalItems={total}
          pageSize={pageSize}
          pageSizeOptions={pageSizeOptions}
          className="nmx-addon-page__pagination"
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
    </NmxAddonRoot>
  )
}
