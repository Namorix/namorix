import {
  NmxBadge,
  NmxDataTable,
  NmxPagination,
  useActiveTab,
} from "@namorix/ui"
import React, { useCallback, useEffect, useState } from "react"
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
import type { NetworkTrafficTab } from "./NetworkTraffic"

const PAGE_SIZE = 30

interface NetworkTrafficLogsProps {
  filterSearch?: string
}

export const NetworkTrafficLogs: React.FC<NetworkTrafficLogsProps> = ({
  filterSearch,
}) => {
  const { t } = useTranslation()
  const [logs, setLogs] = useState<TrafficLog[]>([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<unknown>()
  const activeTab = useActiveTab<NetworkTrafficTab>()

  const fetchLogs = useCallback(async (pg: number, filter: string) => {
    setLoading(true)

    trafficController
      .listLogs(pg, PAGE_SIZE, filter)
      .then((res) => {
        setLogs(res.items)
        setTotal(res.total)
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (activeTab !== "logs" || !filterSearch || filterSearch.length <= 0)
      return

    const timeout = setTimeout(() => {
      console.log("NetworkTrafficLogs", filterSearch, activeTab)
      setLoading(true)
      setPage(1)

      fetchLogs(1, filterSearch).catch((err) => console.error(err))
    }, 500)
    return () => clearTimeout(timeout)
  }, [filterSearch, activeTab, fetchLogs])

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
          semantic={methodToSemantic(row.endpoint?.method)}
          className="nmx-addon-network-traffic__badge"
        >
          {row?.endpoint?.method}
        </NmxBadge>
      ),
      grow: 1,
      alignHeader: "center",
      alignCell: "center",
      disableEllipsisCell: true,
    },
    {
      header: t("addon.networkTraffic.logs.path"),
      renderCell: (row) => row.endpoint?.path ?? "-",
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
      renderCell: (row) => row.trafficAddress?.ip ?? "-",
      grow: 2,
    },
    {
      header: t("addon.networkTraffic.logs.timestamp"),
      renderCell: (row) => formatTimestamp(row.timestamp),
      grow: 2,
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

  const totalPages = Math.ceil(total / PAGE_SIZE)
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
          pageSize={PAGE_SIZE}
          className="nmx-addon-page__pagination"
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
