import React, { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { trafficController, type TrafficEndpoint } from "./traffic.controller"
import type {
  NmxDataTableColumn,
  NmxDataTableFallback,
} from "../../../packages/ui/src/Components/NmxDataTable/NmxDataTable.type"
import { NmxBadge, NmxDataTable, type NmxSemanticColor } from "@namorix/ui"
import { type HttpMethod, HttpMethods } from "@namorix/core"

function methodToSemantic(method: HttpMethod): NmxSemanticColor {
  return method === HttpMethods.POST
    ? "success"
    : method === HttpMethods.PUT || method === HttpMethods.PATCH
      ? "warning"
      : method === HttpMethods.DELETE
        ? "error"
        : "info"
}

export const NetworkTrafficEndpoints: React.FC = () => {
  const { t } = useTranslation()
  const [endpoints, setEndpoints] = useState<TrafficEndpoint[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState()

  useEffect(() => {
    trafficController
      .listEndpoints()
      .then(setEndpoints)
      .finally(() => setLoading(false))
      .catch((err) => setError(err))
  }, [])

  if (loading) {
    return <div>Loading</div>
  }

  const columns: NmxDataTableColumn<TrafficEndpoint>[] = [
    {
      header: t("addon.networkTraffic.endpoints.method"),
      renderCell: (row) => (
        <NmxBadge
          semantic={methodToSemantic(row.method)}
          bgEnabled={false}
          className="nmx-addon-network-traffic__endpoints-badge"
        >
          {row.method}
        </NmxBadge>
      ),
      alignHeader: "center",
      alignCell: "center",
      grow: 1,
      disableEllipsisCell: true,
    },
    {
      header: t("addon.networkTraffic.endpoints.label"),
      renderCell: (row) => row.label,
      grow: 2,
    },
    {
      header: t("addon.networkTraffic.endpoints.path"),
      renderCell: (row) => row.path,
      grow: 3,
    },
    {
      header: t("addon.networkTraffic.endpoints.enabled"),
      renderCell: (row) => (
        <NmxBadge
          semantic={row.isEnabled ? "success" : "error"}
          bgEnabled={false}
          className="nmx-addon-network-traffic__endpoints-badge"
        >
          {String(row.isEnabled)}
        </NmxBadge>
      ),
      grow: 1,
    },
  ]

  const fallbackCondition: NmxDataTableFallback[] = [
    {
      state: "loading",
      condition: loading,
      content: t("addon.networkTraffic.endpoints.fallbacks.loading"),
    },
    {
      state: "error",
      condition: error,
      content: t("addon.networkTraffic.endpoints.fallbacks.error"),
    },
    {
      state: "empty",
      condition: !endpoints || endpoints.length <= 0,
      content: t("addon.networkTraffic.endpoints.fallbacks.empty"),
    },
  ]

  const onRowClick = (row: TrafficEndpoint) => {
    console.log(row)
  }

  return (
    <div className="nmx-addon-network-traffic__endpoints">
      <NmxDataTable
        columns={columns}
        rows={endpoints}
        clickableRows
        onRowClick={onRowClick}
        fallbackConditions={fallbackCondition}
      />
    </div>
  )
}
