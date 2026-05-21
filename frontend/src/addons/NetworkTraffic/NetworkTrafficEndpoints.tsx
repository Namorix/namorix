import React, { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { trafficController, type TrafficEndpoint } from "./traffic.controller"
import type {
  NmxDataTableColumn,
  NmxDataTableFallback,
} from "../../../packages/ui/src/Components/NmxDataTable/NmxDataTable.type"
import { NmxBadge, NmxDataTable } from "@namorix/ui"
import { methodToSemantic } from "./utils"

export const NetworkTrafficEndpoints: React.FC = () => {
  const { t } = useTranslation()
  const [endpoints, setEndpoints] = useState<TrafficEndpoint[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState()

  useEffect(() => {
    trafficController
      .listEndpoints()
      .then(setEndpoints)
      .catch((err) => setError(err))
      .finally(() => setLoading(false))
  }, [])

  const columns: NmxDataTableColumn<TrafficEndpoint>[] = [
    {
      header: t("addon.networkTraffic.endpoints.method"),
      renderCell: (row) => (
        <NmxBadge
          semantic={methodToSemantic(row.method)}
          bgEnabled={false}
          className="nmx-addon-network-traffic__badge"
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
          className="nmx-addon-network-traffic__badge"
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
