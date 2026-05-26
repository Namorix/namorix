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
  type NmxDataTableColumn,
  type NmxDataTableFallback,
  type NmxSemanticColor,
  NmxSearchInput,
  NmxHorizontalWrap,
  NmxHorizontalWrapItem,
  NmxAddonRoot,
  NmxSelectMultiple,
  NmxButtonRefresh,
  NmxButtonLive,
} from "@namorix/ui"
import { logController } from "./log.controller"
import { formatTimestamp } from "../NetworkTraffic/utils"

const LEVEL_CHIPS: Array<{
  value: string
  label: string
  semantic: NmxSemanticColor
}> = [
  { value: "0", label: "addon.logViewer.levels.trace", semantic: "trace" },
  { value: "1", label: "addon.logViewer.levels.debug", semantic: "debug" },
  { value: "2", label: "addon.logViewer.levels.info", semantic: "info" },
  { value: "3", label: "addon.logViewer.levels.warn", semantic: "warning" },
  { value: "4", label: "addon.logViewer.levels.error", semantic: "error" },
  { value: "5", label: "addon.logViewer.levels.fatal", semantic: "fatal" },
]

const LEVEL_TYPES: Record<
  number,
  { level: LogLevel; semantic: NmxSemanticColor }
> = {
  0: { level: "trace", semantic: "trace" },
  1: { level: "debug", semantic: "debug" },
  2: { level: "info", semantic: "info" },
  3: { level: "warn", semantic: "warning" },
  4: { level: "error", semantic: "error" },
  5: { level: "fatal", semantic: "fatal" },
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
  5: { group: "misc", semantic: "trace" },
}

export const LogViewer: React.FC = () => {
  const { t } = useTranslation()
  const { pageSize, setPageSize, options: pageSizeOptions } = usePageSize()
  const [entries, setEntries] = useState<LogEntry[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<unknown>()
  const [levels, setLevels] = useState<string[]>(
    LEVEL_CHIPS.map((c) => c.value),
  )
  const [source, setSource] = useState("")
  const prevFilterRef = useRef("")

  useSignalRGroup(SignalRGroups.Logs, true)

  const fetchLogs = useCallback(
    async (pg: number, lvls: string[], src: string, size: number) => {
      setLoading(true)
      setPage(pg)

      logController
        .listLogs(pg, size, lvls || undefined, src || undefined)
        .then((res) => {
          setEntries(res.entries)
          setTotal(res.total)
        })
        .finally(() => setLoading(false))
    },
    [],
  )

  // const toggleLevel = (v: string) => {
  //   setLevels((prev) =>
  //     prev.includes(v) ? prev.filter((l) => l !== v) : [...prev, v],
  //   )
  //   setPage(1)
  // }

  useEffect(() => {
    const isNewFilter = prevFilterRef.current !== source
    if (isNewFilter) prevFilterRef.current = source
    const pg = isNewFilter ? 1 : page

    const timeout = setTimeout(() => {
      fetchLogs(pg, levels, source, pageSize).catch(setError)
    }, 0)
    return () => clearTimeout(timeout)
  }, [source, page, pageSize, levels, fetchLogs])

  useSignalREvent<LogEntry[]>(SignalREvent.LogsNewEntry, (newEntries) => {
    setEntries((prev) => [...newEntries, ...prev].slice(0, pageSize))
    setTotal((prev) => prev + newEntries.length)
  })

  const columns: NmxDataTableColumn<LogEntry>[] = [
    {
      header: t("addon.logViewer.level"),
      renderCell: (row) => {
        return (
          <NmxBadge semantic={LEVEL_TYPES[row.level]?.semantic ?? "info"}>
            {(LEVEL_TYPES[row.level]?.level ?? "info").toUpperCase()}
          </NmxBadge>
        )
      },
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
      enableUserSelectCell: true,
    },
    {
      header: t("addon.logViewer.message"),
      renderCell: (row) => row.message,
      grow: 4,
      enableUserSelectCell: true,
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
      <NmxHorizontalWrap className="nmx-addon-log-viewer__horizontal-wrap">
        <NmxHorizontalWrapItem className="nmx-addon-log-viewer__actions">
          <NmxSelectMultiple
            values={levels}
            options={LEVEL_CHIPS.map((o) => ({
              value: o.value,
              label: t(o.label),
            }))}
            onChange={(v) => {
              setLevels(v)
              setPage(1)
            }}
            placeholder={t("addon.logViewer.allLevels")}
            className="nmx-addon-log-viewer__log-level"
          />
          <NmxButtonRefresh />
          <NmxButtonLive live={true} />
        </NmxHorizontalWrapItem>
        <NmxHorizontalWrapItem
          pushRight
          className="nmx-addon-log-viewer__search"
        >
          <NmxSearchInput
            value={source}
            onChange={(v) => {
              setSource(v)
              setPage(1)
            }}
            onSubmit={(v) => fetchLogs(1, levels, v, pageSize)}
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
