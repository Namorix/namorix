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
  NmxKeyValueEditor,
  NmxPagination,
  NmxSelect,
  type NmxSelectData,
  type NmxTab,
  NmxTabs,
  NmxToggle,
} from "@namorix/ui"
import { nmxToast, usePageSize } from "@namorix/core"
import {
  type CertificateItem,
  type CreateReverseProxyRulePayload,
  frontgateController,
  type ReverseProxyRule,
  type ReverseProxyRuleAccess,
  type ReverseProxyRuleStatus,
} from "./frontgate.controller"

type FrontgateTab = "general" | "headers" | "locations" | "advanced"

interface LocationRow {
  path: string
  scheme: string
  forwardHost: string
  forwardPort: number
}

const tabs: NmxTab<FrontgateTab>[] = [
  {
    value: "general",
    label: "addon.frontgate.pages.reverseProxy.tabs.general",
    icon: NmxIconFontSymbol.SLIDERS,
  },
  {
    value: "headers",
    label: "addon.frontgate.pages.reverseProxy.tabs.headers",
    icon: NmxIconFontSymbol.CODE,
  },
  {
    value: "locations",
    label: "addon.frontgate.pages.reverseProxy.tabs.locations",
    icon: NmxIconFontSymbol.NODES,
  },
  {
    value: "advanced",
    label: "addon.frontgate.pages.reverseProxy.tabs.advanced",
    icon: NmxIconFontSymbol.ADVANCED,
  },
]

const initialForm: CreateReverseProxyRulePayload = {
  source: "",
  destinationScheme: "http",
  destinationHost: "",
  destinationPort: 3000,
  http2Support: false,
  hstsEnabled: false,
  hstsSubdomains: false,
  access: "public",
  webSocketsSupport: false,
  cacheAssets: false,
  forceSsl: false,
  trustForwardedProtoHeaders: true,
  blockCommonExploits: false,
}

const CERT_REQUEST_NEW = "__request_new__"

export const FrontgateReverseProxy: React.FC = () => {
  const { t } = useTranslation()
  const { pageSize, setPageSize, options: pageSizeOptions } = usePageSize()
  const [rules, setRules] = useState<ReverseProxyRule[]>([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<unknown>()

  const [showAddDialog, setShowAddDialog] = useState(false)
  const [activeTab, setActiveTab] = useState<FrontgateTab>("general")

  // General tab
  const [formSource, setFormSource] = useState(initialForm.source)
  const [formScheme, setFormScheme] = useState(initialForm.destinationScheme)
  const [formHost, setFormHost] = useState(initialForm.destinationHost)
  const [formPort, setFormPort] = useState(initialForm.destinationPort)
  const [formCertificateId, setFormCertificateId] = useState("")
  const [formForceSsl, setFormForceSsl] = useState(initialForm.forceSsl)
  const [formStatus, setFormStatus] = useState("active")

  const [certificates, setCertificates] = useState<CertificateItem[]>([])
  const [certificateOptions, setCertificateOptions] = useState<NmxSelectData[]>(
    [],
  )

  // Headers tab
  const [formHeaders, setFormHeaders] = useState<
    { key: string; value: string }[]
  >([])

  // Locations tab
  const [formLocations, setFormLocations] = useState<LocationRow[]>([])

  // Advanced tab
  const [formWebSockets, setFormWebSockets] = useState(
    initialForm.webSocketsSupport,
  )
  const [formCacheAssets, setFormCacheAssets] = useState(
    initialForm.cacheAssets,
  )
  const [formHttp2, setFormHttp2] = useState(initialForm.http2Support)
  const [formAdditionalHeaders, setFormAdditionalHeaders] = useState("")

  const [formHsts, setFormHsts] = useState(initialForm.hstsEnabled)
  const [formHstsSub, setFormHstsSub] = useState(initialForm.hstsSubdomains)
  const [formTrustForwardedProto, setFormTrustForwardedProto] = useState(
    initialForm.trustForwardedProtoHeaders,
  )
  const [formBlockExploits, setFormBlockExploits] = useState(
    initialForm.blockCommonExploits,
  )
  const [formAccess, setFormAccess] = useState(initialForm.access)

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

  useEffect(() => {
    frontgateController
      .listCertificates()
      .then((certs) => {
        setCertificates(certs)
        setCertificateOptions([
          {
            value: "",
            label: t(
              "addon.frontgate.pages.reverseProxy.fields.certificateNone",
            ),
          },
          {
            value: CERT_REQUEST_NEW,
            label: t(
              "addon.frontgate.pages.reverseProxy.fields.certificateRequestNew",
            ),
          },
          ...certs.map((c) => ({
            value: c.id,
            label: `${c.domain} (${c.issuer})`,
          })),
        ])
      })
      .catch((err) => nmxToast.error(err))
  }, [t])

  const resetForm = useCallback(() => {
    setFormSource(initialForm.source)
    setFormScheme(initialForm.destinationScheme)
    setFormHost(initialForm.destinationHost)
    setFormPort(initialForm.destinationPort)
    setFormCertificateId("")
    setFormForceSsl(initialForm.forceSsl)

    setFormWebSockets(initialForm.webSocketsSupport)
    setFormCacheAssets(initialForm.cacheAssets)
    setFormHttp2(initialForm.http2Support)
    setFormAdditionalHeaders("")

    setFormHsts(initialForm.hstsEnabled)
    setFormHstsSub(initialForm.hstsSubdomains)
    setFormTrustForwardedProto(initialForm.trustForwardedProtoHeaders)
    setFormBlockExploits(initialForm.blockCommonExploits)
    setFormAccess(initialForm.access)

    setFormHeaders([])

    setFormLocations([])
  }, [])

  const handleDialogOpen = useCallback(() => {
    resetForm()
    setShowAddDialog(true)
  }, [resetForm])

  const handleDialogClose = useCallback(() => {
    resetForm()
    setShowAddDialog(false)
  }, [resetForm])

  const updateLocation = useCallback(
    (
      idx: number,
      field: "path" | "scheme" | "forwardHost" | "forwardPort",
      value: string | number,
    ) => {
      setFormLocations((prev) =>
        prev.map((loc, i) => (i === idx ? { ...loc, [field]: value } : loc)),
      )
    },
    [],
  )

  const removeLocation = useCallback((idx: number) => {
    setFormLocations((prev) => prev.filter((_, i) => i !== idx))
  }, [])

  const serializeHeaders = useCallback(() => {
    const valid = formHeaders.filter((h) => h.key.trim())
    return valid.length > 0
      ? JSON.stringify(
          Object.fromEntries(valid.map((h) => [h.key.trim(), h.value])),
        )
      : undefined
  }, [formHeaders])

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

  const accessOptions: NmxSelectData<ReverseProxyRuleAccess>[] = [
    {
      value: "public",
      label: t(
        "addon.frontgate.pages.reverseProxy.fields.accessOptions.public",
      ),
    },
    {
      value: "private",
      label: t(
        "addon.frontgate.pages.reverseProxy.fields.accessOptions.private",
      ),
    },
    {
      value: "restricted",
      label: t(
        "addon.frontgate.pages.reverseProxy.fields.accessOptions.restricted",
      ),
    },
    {
      value: "basicAuth",
      label: t(
        "addon.frontgate.pages.reverseProxy.fields.accessOptions.basicAuth",
      ),
    },
  ]

  const statusOptions: NmxSelectData<ReverseProxyRuleStatus>[] = [
    {
      value: "active",
      label: t(
        "addon.frontgate.pages.reverseProxy.fields.statusOptions.active",
      ),
    },
    {
      value: "inactive",
      label: t(
        "addon.frontgate.pages.reverseProxy.fields.statusOptions.inactive",
      ),
    },
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
        noBodyScrollbar={true}
        onConfirm={() => {
          setShowAddDialog(false)
        }}
        confirmLabel={t("addon.frontgate.pages.reverseProxy.actions.save")}
        extraActionLabel={
          activeTab === "headers"
            ? t("addon.frontgate.pages.reverseProxy.actions.addHeader")
            : activeTab === "locations"
              ? t("addon.frontgate.pages.reverseProxy.actions.addLocation")
              : undefined
        }
        onExtraAction={() => {
          if (activeTab === "headers") {
            setFormHeaders((prev) => [...prev, { key: "", value: "" }])
          } else if (activeTab === "locations") {
            setFormLocations((prev) => [
              ...prev,
              { path: "", scheme: "http", forwardHost: "", forwardPort: 0 },
            ])
          }
        }}
      >
        <NmxTabs tabs={tabs} value={activeTab} onChange={setActiveTab} t={t} />
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
                  value={formPort.toString()}
                  onValueChange={(p) => setFormPort(parseInt(p))}
                  placeholder="3000"
                  type="number"
                />
              </NmxFormField>
            </NmxFormRow>
            <NmxFormField
              label={t("addon.frontgate.pages.reverseProxy.fields.certificate")}
            >
              <NmxSelect
                value={formCertificateId}
                options={certificateOptions}
                onChange={setFormCertificateId}
                placeholder={t(
                  "addon.frontgate.pages.reverseProxy.fields.certificatePlaceholder",
                )}
              />
            </NmxFormField>
            <NmxFormField
              label={t("addon.frontgate.pages.reverseProxy.fields.status")}
            >
              <NmxSelect
                value={formStatus}
                options={statusOptions}
                onChange={setFormStatus}
              />
            </NmxFormField>
            <NmxFormField
              label={t("addon.frontgate.pages.reverseProxy.fields.forceSsl")}
              inline
            >
              <NmxToggle
                checked={formForceSsl}
                onCheckedChanged={setFormForceSsl}
              />
            </NmxFormField>
          </NmxForm>
        )}

        {activeTab === "headers" && (
          <NmxForm className="nmx-addon-frontgate__form">
            {formHeaders.length <= 0 ? (
              <div className="nmx-addon-frontgate__empty">
                {t("addon.frontgate.pages.reverseProxy.fallbacks.emptyHeaders")}
              </div>
            ) : (
              <NmxKeyValueEditor
                values={formHeaders}
                onChange={setFormHeaders}
                keyPlaceholder="X-Custom-Header"
                valuePlaceholder="value"
                keyLabel={t(
                  "addon.frontgate.pages.reverseProxy.fields.headerName",
                )}
                valueLabel={t(
                  "addon.frontgate.pages.reverseProxy.fields.headerValue",
                )}
              />
            )}
          </NmxForm>
        )}

        {activeTab === "locations" && (
          <NmxForm className="nmx-addon-frontgate__form">
            {formLocations.length <= 0 ? (
              <div className="nmx-addon-frontgate__empty">
                {t(
                  "addon.frontgate.pages.reverseProxy.fallbacks.emptyLocations",
                )}
              </div>
            ) : (
              <div className="nmx-addon-frontgate__location-editor">
                {formLocations.map((loc, idx) => (
                  <div
                    key={idx}
                    className="nmx-addon-frontgate__location-editor__card"
                  >
                    <NmxFormRow className="nmx-addon-frontgate__location-editor__card-row">
                      <NmxFormField label="Path" rowFlex={1}>
                        <div className="nmx-addon-frontgate__location-editor__path">
                          <NmxFormInput
                            value={loc.path}
                            onValueChange={(v) =>
                              updateLocation(idx, "path", v)
                            }
                            placeholder="/webhook"
                          />
                          <NmxButton
                            variant="ghost"
                            onClick={() => removeLocation(idx)}
                          >
                            <NmxIconFont symbol={NmxIconFontSymbol.DELETE} />
                          </NmxButton>
                        </div>
                      </NmxFormField>
                    </NmxFormRow>
                    <NmxFormRow className="nmx-addon-frontgate__location-editor__card-row">
                      <NmxFormField label="Scheme" rowFlex="0 0 100px">
                        <NmxSelect
                          value={loc.scheme}
                          options={schemeOptions}
                          onChange={(v) => updateLocation(idx, "scheme", v)}
                        />
                      </NmxFormField>
                      <NmxFormField label="Forward Host" rowFlex={1}>
                        <NmxFormInput
                          value={loc.forwardHost}
                          onValueChange={(v) =>
                            updateLocation(idx, "forwardHost", v)
                          }
                          placeholder="192.168.1.20"
                        />
                      </NmxFormField>
                      <NmxFormField label="Port" rowFlex="0 0 100px">
                        <NmxFormInput
                          value={String(loc.forwardPort)}
                          onValueChange={(v) =>
                            updateLocation(idx, "forwardPort", parseInt(v) || 0)
                          }
                          placeholder="8080"
                          type="number"
                        />
                      </NmxFormField>
                    </NmxFormRow>
                  </div>
                ))}
              </div>
            )}
          </NmxForm>
        )}

        {activeTab === "advanced" && (
          <NmxForm className="nmx-addon-frontgate__form">
            <NmxFormField
              label={t(
                "addon.frontgate.pages.reverseProxy.fields.webSocketsSupport",
              )}
              inline
            >
              <NmxToggle
                checked={formWebSockets}
                onCheckedChanged={setFormWebSockets}
              />
            </NmxFormField>
            <NmxFormField
              label={t("addon.frontgate.pages.reverseProxy.fields.cacheAssets")}
              inline
            >
              <NmxToggle
                checked={formCacheAssets}
                onCheckedChanged={setFormCacheAssets}
              />
            </NmxFormField>
            <NmxFormField
              label={t(
                "addon.frontgate.pages.reverseProxy.fields.http2Support",
              )}
              inline
            >
              <NmxToggle checked={formHttp2} onCheckedChanged={setFormHttp2} />
            </NmxFormField>

            <NmxFormField
              label={t("addon.frontgate.pages.reverseProxy.fields.hstsEnabled")}
              inline
              rowFlex={1}
            >
              <NmxToggle checked={formHsts} onCheckedChanged={setFormHsts} />
            </NmxFormField>
            <NmxFormField
              label={t(
                "addon.frontgate.pages.reverseProxy.fields.hstsSubdomains",
              )}
              inline
              rowFlex={1}
            >
              <NmxToggle
                checked={formHstsSub}
                onCheckedChanged={setFormHstsSub}
              />
            </NmxFormField>
            <NmxFormField
              label={t(
                "addon.frontgate.pages.reverseProxy.fields.trustForwardedProto",
              )}
              inline
            >
              <NmxToggle
                checked={formTrustForwardedProto}
                onCheckedChanged={setFormTrustForwardedProto}
              />
            </NmxFormField>
            <NmxFormField
              label={t(
                "addon.frontgate.pages.reverseProxy.fields.blockCommonExploits",
              )}
              inline
            >
              <NmxToggle
                checked={formBlockExploits}
                onCheckedChanged={setFormBlockExploits}
              />
            </NmxFormField>
            <NmxFormField
              label={t("addon.frontgate.pages.reverseProxy.fields.access")}
            >
              <NmxSelect
                value={formAccess}
                options={accessOptions}
                onChange={setFormAccess}
              />
            </NmxFormField>
          </NmxForm>
        )}
      </NmxAlertDialog>
    </div>
  )
}
