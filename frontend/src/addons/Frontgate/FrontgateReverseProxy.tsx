import React, { useCallback, useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import {
  NmxAlertDialog,
  NmxBadge,
  NmxButton,
  NmxDataTable,
  type NmxDataTableColumn,
  type NmxDataTableFallback,
  NmxForm,
  NmxFormField,
  NmxFormInput,
  NmxFormRow,
  NmxIconFont,
  NmxIconFontSymbol,
  NmxPagination,
  NmxSelect,
  type NmxSelectData,
  type NmxTab,
  NmxTabs,
  NmxToggle,
} from "@namorix/ui"
import { usePageSize } from "@namorix/core"
import {
  type CreateReverseProxyRulePayload,
  frontgateController,
  type ReverseProxyRule,
} from "./frontgate.controller"

type FG_TABS = "general" | "features" | "security"

const tabs: NmxTab<FG_TABS>[] = [
  { value: "general", label: "General" },
  { value: "features", label: "Features" },
  { value: "security", label: "Security" },
]

const initalForm: CreateReverseProxyRulePayload = {
  source: "",
  destinationScheme: "http",
  destinationHost: "",
  destinationPort: 3000,
  http2Support: false,
  hstsEnabled: false,
  access: "public",
}

export const FrontgateReverseProxy: React.FC = () => {
  const { t } = useTranslation()
  const { pageSize, setPageSize, options: pageSizeOptions } = usePageSize()
  const [rules, setRules] = useState<ReverseProxyRule[]>([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<unknown>()

  const [showAddDialog, setShowAddDialog] = useState(false)
  const [activeTab, setActiveTab] = useState<FG_TABS>("general")

  const [formSource, setFormSource] = useState(initalForm.source)
  const [formScheme, setFormScheme] = useState(initalForm.destinationScheme)
  const [formHost, setFormHost] = useState(initalForm.destinationHost)
  const [formPort, setFormPort] = useState(initalForm.destinationPort)
  const [formHttp2, setFormHttp2] = useState(initalForm.http2Support)
  const [formForceSsl, setFormForceSsl] = useState(false)
  const [formHsts, setFormHsts] = useState(initalForm.hstsEnabled)
  const [formAccess, setFormAccess] = useState(initalForm.access)
  const [formStatus, setFormStatus] = useState("active")

  const fetchRules = useCallback(async (pg: number, size: number) => {
    setLoading(true)
    setError(undefined)
    setPage(pg)

    frontgateController
      .listRules(pg, size)
      .then((res) => {
        setRules(res.items)
        setTotal(res.total)
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchRules(page, pageSize).catch(setError)
    }, 0)
    return () => clearTimeout(timeout)
  }, [page, pageSize, fetchRules])

  const resetForm = useCallback(() => {
    setFormSource(initalForm.source)
    setFormScheme(initalForm.destinationScheme)
    setFormHost(initalForm.destinationHost)
    setFormPort(initalForm.destinationPort)
    setFormHttp2(initalForm.http2Support)
    setFormHsts(initalForm.hstsEnabled)
    setFormAccess(initalForm.access)
  }, [])

  const handleDialogOpen = useCallback(() => {
    resetForm()
    setShowAddDialog(true)
  }, [resetForm])

  const handleDialogClose = useCallback(() => {
    resetForm()
    setShowAddDialog(false)
  }, [resetForm])

  const columns: NmxDataTableColumn<ReverseProxyRule>[] = [
    {
      header: t("addon.frontgate.pages.reverseProxy.fields.source"),
      renderCell: (row) => row.source,
      grow: 3,
      enableUserSelectCell: true,
    },
    {
      header: t("addon.frontgate.pages.reverseProxy.fields.destination"),
      renderCell: (row) =>
        `${row.destinationScheme}://${row.destinationHost}:${row.destinationPort}`,
      grow: 3,
      enableUserSelectCell: true,
    },
    {
      header: t("addon.frontgate.pages.reverseProxy.fields.ssl"),
      renderCell: (row) => (
        <NmxBadge semantic={row.ssl ? "success" : "default"} size="sm">
          {row.ssl ? "HTTPS" : "HTTP"}
        </NmxBadge>
      ),
      grow: 1,
      alignHeader: "center",
      alignCell: "center",
      disableEllipsisCell: true,
    },
    {
      header: t("addon.frontgate.pages.reverseProxy.fields.access"),
      renderCell: (row) => (
        <NmxBadge
          semantic={row.access === "public" ? "warning" : "info"}
          size="sm"
        >
          {row.access}
        </NmxBadge>
      ),
      grow: 1,
      alignHeader: "center",
      alignCell: "center",
      disableEllipsisCell: true,
    },
    {
      header: t("addon.frontgate.pages.reverseProxy.fields.status"),
      renderCell: (row) => (
        <NmxBadge
          semantic={
            row.status === "active"
              ? "success"
              : row.status === "error"
                ? "error"
                : "default"
          }
          size="sm"
        >
          {row.status}
        </NmxBadge>
      ),
      grow: 1,
      alignHeader: "center",
      alignCell: "center",
      disableEllipsisCell: true,
    },
  ]

  const fallbackConditions: NmxDataTableFallback[] = [
    {
      state: "loading",
      condition: loading,
      content: t("addon.frontgate.pages.reverseProxy.fallbacks.loading"),
    },
    {
      state: "error",
      condition: error,
      content: t("addon.frontgate.pages.reverseProxy.fallbacks.error"),
    },
    {
      state: "empty",
      condition: !loading && rules.length === 0,
      content: t("addon.frontgate.pages.reverseProxy.fallbacks.empty"),
    },
  ]

  const schemeOptions: NmxSelectData[] = [
    { value: "http", label: "http://" },
    { value: "https", label: "https://" },
  ]

  const accessOptions: NmxSelectData[] = [
    { value: "public", label: "Public" },
    { value: "private", label: "Private" },
    { value: "restricted", label: "Restricted" },
    { value: "basicAuth", label: "Basic Auth" },
  ]

  const statusOptions: NmxSelectData[] = [
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
  ]

  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="nmx-addon-frontgate__page">
      <div className="nmx-addon-frontgate__actions">
        <NmxButton onClick={() => handleDialogOpen()}>
          <NmxIconFont symbol={NmxIconFontSymbol.ADD} />
          <span>
            {t("addon.frontgate.pages.reverseProxy.actions.addProxy")}
          </span>
        </NmxButton>
      </div>
      <div className="nmx-addon-frontgate__list">
        <NmxDataTable
          columns={columns}
          rows={rules}
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

      <NmxAlertDialog
        open={showAddDialog}
        title={t("addon.frontgate.pages.reverseProxy.actions.addProxy")}
        onClose={() => handleDialogClose()}
        size="md"
        noSpacingBody={true}
        onConfirm={() => {
          setShowAddDialog(false)
        }}
        confirmLabel={t("addon.frontgate.pages.reverseProxy.actions.save")}
      >
        <NmxTabs tabs={tabs} value={activeTab} onChange={setActiveTab} />
        {activeTab === "general" && (
          <NmxForm className="nmx-addon-frontgate__form">
            <NmxFormField
              label={t("addon.frontgate.pages.reverseProxy.fields.source")}
              required
            >
              <NmxFormInput
                value={formSource}
                onValueChange={setFormSource}
                placeholder={t(
                  "addon.frontgate.pages.reverseProxy.fields.sourcePlaceholder",
                )}
              />
            </NmxFormField>
            <NmxFormRow>
              <NmxFormField
                label={t(
                  "addon.frontgate.pages.reverseProxy.fields.destinationScheme",
                )}
                required
                rowFlex="0 0 auto"
              >
                <NmxSelect
                  value={formScheme}
                  options={schemeOptions}
                  onChange={setFormScheme}
                />
              </NmxFormField>
              <NmxFormField
                label={t(
                  "addon.frontgate.pages.reverseProxy.fields.destinationHost",
                )}
                rowFlex={1}
                required
              >
                <NmxFormInput
                  value={formHost}
                  onValueChange={setFormHost}
                  placeholder={t(
                    "addon.frontgate.pages.reverseProxy.fields.destinationHostPlaceholder",
                  )}
                />
              </NmxFormField>
              <NmxFormField
                label={t(
                  "addon.frontgate.pages.reverseProxy.fields.destinationPort",
                )}
                required
                rowFlex="0 0 100px"
              >
                <NmxFormInput
                  value={formPort}
                  onValueChange={setFormPort}
                  placeholder="3000"
                  type="number"
                />
              </NmxFormField>
            </NmxFormRow>
            <NmxFormField
              label={t("addon.frontgate.pages.reverseProxy.fields.access")}
            >
              <NmxSelect
                value={formAccess}
                options={
                  [
                    { value: "public", label: "Public" },
                    { value: "private", label: "Private" },
                    { value: "restricted", label: "Restricted" },
                    { value: "basicAuth", label: "Basic Auth" },
                  ] as NmxSelectData[]
                }
                onChange={setFormAccess}
              />
            </NmxFormField>
            <NmxFormField
              label={t("addon.frontgate.pages.reverseProxy.fields.hstsEnabled")}
              inline
            >
              <NmxToggle checked={formHsts} onCheckedChanged={setFormHsts} />
            </NmxFormField>
            <NmxFormField
              label={t(
                "addon.frontgate.pages.reverseProxy.fields.http2Support",
              )}
              inline
            >
              <NmxToggle checked={formHttp2} onCheckedChanged={setFormHttp2} />
            </NmxFormField>
          </NmxForm>
        )}
      </NmxAlertDialog>
    </div>
  )
}
