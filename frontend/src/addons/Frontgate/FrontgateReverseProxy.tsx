import React, { useCallback, useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import {
  cx,
  NmxAlertDialog,
  NmxAlign,
  NmxBadge,
  NmxButton,
  NmxDataTable,
  type NmxDataTableColumn,
  type NmxFallback,
  NmxForm,
  NmxFormField,
  NmxFormInput,
  NmxFormRow,
  NmxIconFont,
  NmxIconFontSymbol,
  NmxKeyValueEditor,
  NmxMenuButton,
  NmxMetaItem,
  NmxMetaList,
  NmxPagination,
  NmxSelect,
  type NmxSelectData,
  type NmxTab,
  NmxTabs,
  NmxToggle,
  useActiveTab,
} from "@namorix/ui"
import {
  formatCustomError,
  nmxToast,
  useDateTimeFormat,
  usePageSize,
} from "@namorix/core"
import {
  type AccessPolicy,
  type CreateReverseProxyRulePayload,
  frontgateController,
  type ReverseProxyRule,
  type ReverseProxyRuleAccess,
  type ReverseProxyRuleStatus,
} from "./frontgate.controller"
import {
  type FrontgateDryRunChangedPayload,
  FrontgateErrorCodes,
  type FrontgateRuleChangedPayload,
  getStatusSemantic,
} from "./Frontgate.types"
import type { FrontgateTab } from "./Frontgate"
import {
  ServerSignalREvent,
  ServerSignalRGroups,
  useServerSignalREvent,
  useServerSignalRGroup,
} from "../../signalr"

type FrontgateTabDialog = "general" | "headers" | "locations" | "advanced"

interface LocationRow {
  path: string
  scheme: string
  forwardHost: string
  forwardPort: number
}

const tabs: NmxTab<FrontgateTabDialog>[] = [
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
  source: "izerocs.duckdns.org",
  destinationScheme: "http",
  destinationHost: "192.168.31.150",
  destinationPort: 5000,
  http2Support: false,
  hstsEnabled: false,
  hstsSubdomains: false,
  access: "public",
  status: "active",
  webSocketsSupport: false,
  cacheAssets: false,
  forceSsl: false,
  trustForwardedProtoHeaders: true,
  blockCommonExploits: false,
}

const CERT_REQUEST_NEW = "__request_new__"

function formatDryRunRemaining(expiresAt: string, now: number): string {
  const seconds = Math.max(
    0,
    Math.floor((new Date(expiresAt).getTime() - now) / 1000),
  )
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`
}

function isDryRunActive(
  expiresAt: string | null | undefined,
  now: number,
): boolean {
  return expiresAt != null && new Date(expiresAt).getTime() > now
}

function renderAccess(access: ReverseProxyRuleAccess) {
  return (
    <NmxBadge
      semantic={
        access === "public"
          ? "warning"
          : access === "private"
            ? "info"
            : access === "restricted"
              ? "error"
              : "debug"
      }
      size="sm"
    >
      {access}
    </NmxBadge>
  )
}

function renderStatus(status: ReverseProxyRuleStatus) {
  return (
    <NmxBadge
      className={status}
      semantic={
        status === "active" ? "success" : status === "error" ? "error" : "debug"
      }
      size="sm"
    >
      {status}
    </NmxBadge>
  )
}

function renderSslStatus(rule: ReverseProxyRule) {
  if (!rule.certificateId) {
    return <span>—</span>
  }

  return (
    <NmxIconFont
      symbol={NmxIconFontSymbol.LOCK}
      size="lg"
      semantic={getStatusSemantic(rule.certStatus, rule.forceSsl)}
    />
  )
}

export const FrontgateReverseProxy: React.FC = () => {
  const { t } = useTranslation()
  const activeTab = useActiveTab<FrontgateTab>()
  const { dateOnly, dateTime } = useDateTimeFormat()
  const { pageSize, setPageSize, options: pageSizeOptions } = usePageSize()
  const [rules, setRules] = useState<ReverseProxyRule[]>([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<unknown>()

  const [showAddDialog, setShowAddDialog] = useState(false)
  const [activeTabDialog, setActiveTabDialog] =
    useState<FrontgateTabDialog>("general")
  const [formSubmitting, setFormSubmitting] = useState(false)
  const [infoRule, setInfoRule] = useState<ReverseProxyRule | null>(null)
  const [editingRule, setEditingRule] = useState<ReverseProxyRule | null>(null)
  const [deletingRule, setDeletingRule] = useState<ReverseProxyRule | null>(
    null,
  )
  const [deleteSubmitting, setDeleteSubmitting] = useState(false)

  // General tab
  const [formSource, setFormSource] = useState(initialForm.source)
  const [formScheme, setFormScheme] = useState(initialForm.destinationScheme)
  const [formHost, setFormHost] = useState(initialForm.destinationHost)
  const [formPort, setFormPort] = useState(initialForm.destinationPort)
  const [formForceSsl, setFormForceSsl] = useState(initialForm.forceSsl)
  const [formStatus, setFormStatus] = useState(initialForm.status)
  const [formCertificateId, setFormCertificateId] = useState("")
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

  const [formHsts, setFormHsts] = useState(initialForm.hstsEnabled)
  const [formHstsSub, setFormHstsSub] = useState(initialForm.hstsSubdomains)
  const [formTrustForwardedProto, setFormTrustForwardedProto] = useState(
    initialForm.trustForwardedProtoHeaders,
  )
  const [formBlockExploits, setFormBlockExploits] = useState(
    initialForm.blockCommonExploits,
  )
  const [formAccess, setFormAccess] = useState(initialForm.access)
  const [formPolicyId, setFormPolicyId] = useState("")
  const [accessPolicies, setAccessPolicies] = useState<AccessPolicy[]>([])

  const [formDryRun, setFormDryRun] = useState(false)
  const [formDryRunMinutes, setFormDryRunMinutes] = useState(1)
  const [now, setNow] = useState(() => Date.now())

  const fetchRules = useCallback(
    async (pg: number, size: number): Promise<ReverseProxyRule[]> => {
      setError(undefined)
      setPage(pg)

      if (rules.length <= 0) {
        setLoading(true)
      }

      try {
        const res = await frontgateController.listRules(pg, size)
        setRules(res.items)
        setTotal(res.total)
        return res.items
      } finally {
        setLoading(false)
      }
    },
    [rules.length],
  )

  const refresh = useCallback(() => {
    fetchRules(page, pageSize).then((items) => {
      setInfoRule((prev) =>
        prev ? (items.find((r) => r.id === prev.id) ?? null) : prev,
      )
    })
  }, [fetchRules, page, pageSize])

  useEffect(() => {
    if (activeTab !== "reverseProxy") return
    const timeout = setTimeout(() => {
      fetchRules(page, pageSize).catch(setError)
    }, 0)
    return () => clearTimeout(timeout)
  }, [activeTab, page, pageSize, fetchRules])

  useEffect(() => {
    if (activeTab !== "reverseProxy") return
    frontgateController
      .listAccessPolicies()
      .then(setAccessPolicies)
      .catch(nmxToast.error)
  }, [activeTab])

  useEffect(() => {
    if (activeTab !== "reverseProxy") return

    frontgateController
      .listAllCertificates()
      .then((certs) => {
        setCertificateOptions([
          {
            value: "",
            label: t(
              "addon.frontgate.pages.reverseProxy.fields.certificateNone",
            ),
            description: t(
              "addon.frontgate.pages.reverseProxy.certificateOptions.noneDescription",
            ),
          },
          {
            value: CERT_REQUEST_NEW,
            label: t(
              "addon.frontgate.pages.reverseProxy.fields.certificateRequestNew",
            ),
            description: t(
              "addon.frontgate.pages.reverseProxy.certificateOptions.requestNewDescription",
            ),
          },
          ...certs.items.map((c) => ({
            value: c.id,
            label: (
              <div className="nmx-addon-frontgate__select-domain-list">
                {c.domains?.map((d) => (
                  <span>{d}</span>
                ))}
              </div>
            ),
            description: t(
              "addon.frontgate.pages.reverseProxy.certificateOptions.existingDescription",
              { issuer: c.issuer, expires: dateOnly(c.expiresAt) },
            ),
          })),
        ] as NmxSelectData[])
      })
      .catch(nmxToast.error)
  }, [activeTab, dateOnly, t])

  useEffect(() => {
    if (activeTab !== "reverseProxy") return
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [activeTab])

  useServerSignalRGroup(ServerSignalRGroups.Frontgate, true)
  useServerSignalREvent<{ certId: string }>(
    ServerSignalREvent.FrontgateCertStatusChanged,
    useCallback(() => refresh(), [refresh]),
  )

  useServerSignalREvent<FrontgateDryRunChangedPayload>(
    ServerSignalREvent.FrontgateDryRunChanged,
    useCallback(() => refresh(), [refresh]),
  )

  useServerSignalREvent<FrontgateRuleChangedPayload>(
    ServerSignalREvent.FrontgateRuleChanged,
    useCallback(
      (data) => {
        const deleted = data.action === "deleted"
        const viewing = deleted && data.ruleId === infoRule?.id
        const editing = deleted && data.ruleId === editingRule?.id
        const deletedSource = viewing
          ? infoRule?.source
          : editing
            ? editingRule?.source
            : undefined

        if (viewing) setInfoRule(null)
        if (editing) {
          setEditingRule(null)
          setShowAddDialog(false)
        }

        if (viewing || editing) {
          nmxToast.warning(
            t(
              "addon.frontgate.pages.reverseProxy.feedback.ruleDeletedExternally",
              { source: deletedSource },
            ),
          )
        }

        refresh()
      },
      [
        editingRule?.id,
        editingRule?.source,
        infoRule?.id,
        infoRule?.source,
        refresh,
        t,
      ],
    ),
  )

  const resetForm = useCallback(() => {
    setActiveTabDialog("general")

    setFormSource(initialForm.source)
    setFormScheme(initialForm.destinationScheme)
    setFormHost(initialForm.destinationHost)
    setFormPort(initialForm.destinationPort)
    setFormCertificateId("")
    setFormStatus(initialForm.status)
    setFormForceSsl(initialForm.forceSsl)
    setFormDryRun(false)
    setFormDryRunMinutes(1)

    setFormWebSockets(initialForm.webSocketsSupport)
    setFormCacheAssets(initialForm.cacheAssets)
    setFormHttp2(initialForm.http2Support)

    setFormHsts(initialForm.hstsEnabled)
    setFormHstsSub(initialForm.hstsSubdomains)
    setFormTrustForwardedProto(initialForm.trustForwardedProtoHeaders)
    setFormBlockExploits(initialForm.blockCommonExploits)
    setFormAccess(initialForm.access)

    setFormHeaders([])
    setFormLocations([])

    setFormAccess("public")
    setFormPolicyId("")
  }, [])

  const fillForm = useCallback(
    (rule: ReverseProxyRule) => {
      setFormSource(rule.source)
      setFormScheme(rule.destinationScheme)
      setFormHost(rule.destinationHost)
      setFormPort(rule.destinationPort)
      setFormCertificateId(rule.certificateId ?? "")
      setFormForceSsl(rule.forceSsl)
      setFormDryRun(isDryRunActive(rule.dryRunExpiresAt, now))
      setFormStatus(rule.status)
      setFormWebSockets(rule.webSocketsSupport)
      setFormCacheAssets(rule.cacheAssets)
      setFormHttp2(rule.http2Support)
      setFormHsts(rule.hstsEnabled)
      setFormHstsSub(rule.hstsSubdomains)
      setFormTrustForwardedProto(rule.trustForwardedProtoHeaders)
      setFormBlockExploits(rule.blockCommonExploits)
      setFormAccess(rule.access)
      setFormPolicyId(rule.accessPolicyId ?? "")

      if (rule.additionalHeadersJson) {
        try {
          const parsed = JSON.parse(rule.additionalHeadersJson) as Record<
            string,
            string
          >
          setFormHeaders(
            Object.entries(parsed).map(([key, value]) => ({ key, value })),
          )
        } catch {
          setFormHeaders([])
        }
      } else {
        setFormHeaders([])
      }

      setFormLocations(
        rule.locations?.map((loc) => ({
          path: loc.path,
          scheme: loc.scheme,
          forwardHost: loc.forwardHost,
          forwardPort: loc.forwardPort,
        })) ?? [],
      )
    },
    [now],
  )

  const handleDialogOpen = useCallback(() => {
    setEditingRule(null)
    resetForm()
    setShowAddDialog(true)
  }, [resetForm])

  const handleDialogClose = useCallback(() => {
    setEditingRule(null)
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

  const handleConfirm = useCallback(() => {
    if (!formSource.trim()) {
      nmxToast.error(
        t("core:common.validation.required", {
          field: t("addon.frontgate.pages.reverseProxy.fields.source"),
        }),
      )
      return
    }

    if (!formHost.trim()) {
      nmxToast.error(
        t("core:common.validation.required", {
          field: t("addon.frontgate.pages.reverseProxy.fields.destinationHost"),
        }),
      )
      return
    }

    if (isNaN(formPort) || formPort <= 0) {
      nmxToast.error(
        t("core:common.validation.invalidFormat", {
          field: t("addon.frontgate.pages.reverseProxy.fields.destinationPort"),
        }),
      )
      return
    }

    const payload: CreateReverseProxyRulePayload = {
      source: formSource,
      destinationScheme: formScheme,
      destinationHost: formHost,
      destinationPort: formPort,
      certificateId:
        formCertificateId === CERT_REQUEST_NEW
          ? undefined
          : formCertificateId || undefined,
      access: formAccess,
      accessPolicyId: formPolicyId || undefined,
      status: formStatus,
      webSocketsSupport: formWebSockets,
      cacheAssets: formCacheAssets,
      forceSsl: formForceSsl,
      dryRun: formDryRun,
      dryRunMinutes: formDryRun ? formDryRunMinutes : undefined,
      http2Support: formHttp2,
      hstsEnabled: formHsts,
      hstsSubdomains: formHstsSub,
      trustForwardedProtoHeaders: formTrustForwardedProto,
      blockCommonExploits: formBlockExploits,
      additionalHeadersJson: serializeHeaders(),
      locations: formLocations.length > 0 ? formLocations : undefined,
      requestCert: formCertificateId === CERT_REQUEST_NEW,
    }

    setFormSubmitting(true)

    const action = editingRule
      ? frontgateController.updateRule(editingRule.id, payload)
      : frontgateController.createRule(payload)

    action
      .then(async () => {
        nmxToast.success(
          t(
            editingRule
              ? "addon.frontgate.pages.reverseProxy.feedback.updateSuccess"
              : "addon.frontgate.pages.reverseProxy.feedback.createSuccess",
          ),
        )

        setEditingRule(null)
        resetForm()
        setShowAddDialog(false)
        return fetchRules(page, pageSize)
      })

      .catch((err) =>
        nmxToast.error(
          formatCustomError(t, err, FrontgateErrorCodes),
          t(
            editingRule
              ? "addon.frontgate.pages.reverseProxy.feedback.updateError"
              : "addon.frontgate.pages.reverseProxy.feedback.createError",
          ),
        ),
      )
      .finally(() => setFormSubmitting(false))
  }, [
    formSource,
    formHost,
    formPort,
    formScheme,
    formCertificateId,
    formAccess,
    formPolicyId,
    formStatus,
    formWebSockets,
    formCacheAssets,
    formForceSsl,
    formDryRun,
    formDryRunMinutes,
    formHttp2,
    formHsts,
    formHstsSub,
    formTrustForwardedProto,
    formBlockExploits,
    serializeHeaders,
    formLocations,
    editingRule,
    t,
    resetForm,
    fetchRules,
    page,
    pageSize,
  ])

  const handleDelete = useCallback((rule: ReverseProxyRule) => {
    setDeletingRule(rule)
  }, [])

  const handleDeleteConfirm = useCallback(() => {
    if (!deletingRule) return
    setDeleteSubmitting(true)
    frontgateController
      .deleteRule(deletingRule.id)
      .then(() => {
        nmxToast.success(
          t("addon.frontgate.pages.reverseProxy.feedback.deleteSuccess"),
        )
        setDeletingRule(null)
        return fetchRules(page, pageSize)
      })
      .catch((err) =>
        nmxToast.error(
          formatCustomError(t, err, FrontgateErrorCodes),
          t("addon.frontgate.pages.reverseProxy.feedback.deleteError"),
        ),
      )
      .finally(() => setDeleteSubmitting(false))
  }, [deletingRule, fetchRules, t, page, pageSize])

  const handleDeleteCancel = useCallback(() => {
    setDeletingRule(null)
  }, [])

  const handleDryRunConfirm = useCallback(
    (id: string) => {
      frontgateController
        .confirmDryRun(id)
        .then(() => {
          nmxToast.success(
            t("addon.frontgate.pages.reverseProxy.dryRun.confirmSuccess"),
          )
          return fetchRules(page, pageSize)
        })
        .catch((err) =>
          nmxToast.error(
            formatCustomError(t, err, FrontgateErrorCodes),
            t("addon.frontgate.pages.reverseProxy.dryRun.confirmError"),
          ),
        )
    },
    [fetchRules, page, pageSize, t],
  )

  const handleDryRunCancel = useCallback(
    (id: string) => {
      frontgateController
        .cancelDryRun(id)
        .then(() => {
          nmxToast.success(
            t("addon.frontgate.pages.reverseProxy.dryRun.cancelSuccess"),
          )
          return fetchRules(page, pageSize)
        })
        .catch((err) =>
          nmxToast.error(
            formatCustomError(t, err, FrontgateErrorCodes),
            t("addon.frontgate.pages.reverseProxy.dryRun.cancelError"),
          ),
        )
    },
    [fetchRules, page, pageSize, t],
  )

  const handleAccessChange = (value: ReverseProxyRuleAccess) => {
    setFormAccess(value)
    if (value !== "restricted" && value !== "basicAuth") {
      setFormPolicyId("")
    }
  }

  const renderDryRun = useCallback(
    (row: ReverseProxyRule, flexEnd?: boolean) => {
      return (
        <div
          className={cx("nmx-addon-frontgate__dry-run", {
            "nmx-addon-frontgate__dry-run--flex-end": flexEnd === true,
          })}
        >
          {!isDryRunActive(row.dryRunExpiresAt, now) ? (
            <span>—</span>
          ) : (
            <>
              <NmxBadge semantic="warning" size="sm">
                {formatDryRunRemaining(row.dryRunExpiresAt ?? "", now)}
              </NmxBadge>
              <div className="nmx-addon-frontgate__btn-wrap">
                <NmxButton
                  semantic="success"
                  className="nmx-addon-frontgate__dry-run__btn"
                  data-row-action
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDryRunConfirm(row.id)
                  }}
                >
                  <NmxIconFont symbol={NmxIconFontSymbol.CHECK} size="xs" />
                </NmxButton>
                <NmxButton
                  semantic="error"
                  className="nmx-addon-frontgate__dry-run__btn"
                  data-row-action
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDryRunCancel(row.id)
                  }}
                >
                  <NmxIconFont symbol={NmxIconFontSymbol.UNDO} size="xs" />
                </NmxButton>
              </div>
            </>
          )}
        </div>
      )
    },
    [handleDryRunCancel, handleDryRunConfirm, now],
  )

  const columns: NmxDataTableColumn<ReverseProxyRule>[] = [
    {
      header: t("addon.frontgate.pages.reverseProxy.fields.source"),
      renderCell: (row) => (
        <div className="nmx-addon-frontgate__domain-wrap">
          <div className="nmx-addon-frontgate__domain-list">
            <a
              href={`https://${row.source}`}
              target="_blank"
              rel="noopener noreferrer"
              className="nmx-addon-frontgate__domain-item"
              onClick={(e) => e.stopPropagation()}
            >
              {row.source}
            </a>
          </div>
          <div className="nmx-addon-frontgate__destination">
            {`${row.destinationScheme}://${row.destinationHost}:${row.destinationPort}`}
          </div>
        </div>
      ),
      grow: 3,
      enableUserSelectCell: true,
    },
    {
      header: t("addon.frontgate.pages.reverseProxy.fields.ssl"),
      renderCell: (row) => renderSslStatus(row),
      grow: 0,
      alignHeader: "center",
      alignCell: "center",
      hideBelow: "md",
      disableEllipsisCell: true,
    },
    {
      header: t("addon.frontgate.pages.reverseProxy.fields.access"),
      renderCell: (row) => renderAccess(row.access),
      grow: 1,
      alignHeader: "center",
      alignCell: "center",
      hideBelow: "md",
      disableEllipsisCell: true,
    },
    {
      header: t("addon.frontgate.pages.reverseProxy.fields.status"),
      renderCell: (row) => renderStatus(row.status),
      grow: 1,
      alignHeader: "center",
      alignCell: "center",
      hideBelow: "md",
      disableEllipsisCell: true,
    },
    {
      header: t("addon.frontgate.pages.reverseProxy.fields.dryRun"),
      renderCell: (row) => renderDryRun(row),
      grow: 2,
      alignHeader: "center",
      alignCell: "center",
      disableEllipsisCell: true,
    },
    {
      header: "",
      renderCell: (row) => {
        return (
          <NmxMenuButton
            variant="ghost"
            semantic="trace"
            arrowDisabled
            options={[
              {
                value: "edit",
                label: t(
                  "addon.frontgate.pages.reverseProxy.actions.editProxy",
                ),
                icon: NmxIconFontSymbol.EDIT,
              },
              {
                value: "delete",
                label: t(
                  "addon.frontgate.pages.reverseProxy.actions.deleteProxy",
                ),
                semantic: "error",
                icon: NmxIconFontSymbol.DELETE,
              },
            ]}
            dividerIndexes={[
              { value: "edit", position: "top" },
              { value: "delete", position: "top" },
            ]}
            onSelect={(value) => {
              if (value === "edit") {
                setEditingRule(row)
                fillForm(row)
                setShowAddDialog(true)
              }

              if (value === "delete") handleDelete(row)
            }}
          >
            <NmxIconFont symbol={NmxIconFontSymbol.MENU_VERTICAL} />
          </NmxMenuButton>
        )
      },
      grow: 0,
      alignHeader: "center",
      alignCell: "center",
      disableEllipsisCell: true,
      btnIsIcon: true,
    },
  ]

  const fallbackConditions: NmxFallback[] = [
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

  const dryRunMinuteOptions: NmxSelectData[] = [
    {
      value: "1",
      label: t(
        "addon.frontgate.pages.reverseProxy.fields.dryRunMinuteOptions.dryRun1m",
      ),
    },
    {
      value: "5",
      label: t(
        "addon.frontgate.pages.reverseProxy.fields.dryRunMinuteOptions.dryRun5m",
      ),
    },
    {
      value: "10",
      label: t(
        "addon.frontgate.pages.reverseProxy.fields.dryRunMinuteOptions.dryRun10m",
      ),
    },
  ]

  const policyOptions: NmxSelectData[] = [
    {
      value: "",
      label: t("addon.frontgate.pages.reverseProxy.fields.selectPolicy"),
    },
    ...accessPolicies
      .filter((p) =>
        formAccess === "basicAuth"
          ? p.type === "basicAuth"
          : p.type !== "basicAuth",
      )
      .map((p) => ({ value: p.id, label: p.name })),
  ]

  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="nmx-addon-frontgate__page">
      <NmxAlign direction="row" justify="end">
        <NmxButton onClick={() => handleDialogOpen()} semantic="success">
          <NmxIconFont symbol={NmxIconFontSymbol.ADD} />
          <span>
            {t("addon.frontgate.pages.reverseProxy.actions.addProxy")}
          </span>
        </NmxButton>
        <NmxButton onClick={() => fetchRules(page, pageSize)}>
          <NmxIconFont symbol={NmxIconFontSymbol.REFRESH} />
          <span>{t("addon.frontgate.pages.reverseProxy.actions.refresh")}</span>
        </NmxButton>
      </NmxAlign>
      <div className="nmx-addon-frontgate__list">
        <NmxDataTable
          columns={columns}
          rows={rules}
          fallbackConditions={fallbackConditions}
          clickableRows={true}
          onRowClick={(row) => setInfoRule(row)}
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
              setError(undefined)
              setPage(pg)
            }}
          />
        )}
      </div>

      <NmxAlertDialog
        open={infoRule !== null}
        title={t("addon.frontgate.pages.reverseProxy.actions.proxyInfo")}
        extraActionLabel={t(
          "addon.frontgate.pages.reverseProxy.actions.editProxy",
        )}
        onExtraAction={() => {
          if (infoRule) {
            setEditingRule(infoRule)
            fillForm(infoRule)
            setShowAddDialog(true)
          }
          setInfoRule(null)
        }}
        confirmShouldRender={isDryRunActive(infoRule?.dryRunExpiresAt, now)}
        onClose={() => setInfoRule(null)}
        size="md"
      >
        {infoRule && (
          <>
            <NmxMetaList>
              <NmxMetaItem
                label={t("addon.frontgate.pages.reverseProxy.fields.source")}
                alignValue="end"
              >
                <a
                  href={`https://${infoRule.source}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="nmx-addon-frontgate__domain-item"
                >
                  {infoRule.source}
                </a>
              </NmxMetaItem>
              <NmxMetaItem
                label={t(
                  "addon.frontgate.pages.reverseProxy.fields.destination",
                )}
                value={`${infoRule.destinationScheme}://${infoRule.destinationHost}:${infoRule.destinationPort}`}
                alignValue="end"
              />
              <NmxMetaItem
                label={t("addon.frontgate.pages.reverseProxy.fields.ssl")}
                alignValue="end"
              >
                {renderSslStatus(infoRule)}
              </NmxMetaItem>
              <NmxMetaItem
                label={t("addon.frontgate.pages.reverseProxy.fields.access")}
                alignValue="end"
              >
                {renderAccess(infoRule.access)}
              </NmxMetaItem>
              <NmxMetaItem
                label={t("addon.frontgate.pages.reverseProxy.fields.status")}
                alignValue="end"
              >
                {renderStatus(infoRule.status)}
              </NmxMetaItem>
              <NmxMetaItem
                label={t("addon.frontgate.pages.reverseProxy.fields.createdAt")}
                value={dateTime(infoRule.createdAt)}
                alignValue="end"
              />
              {isDryRunActive(infoRule.dryRunExpiresAt, now) && (
                <NmxMetaItem
                  label={t("addon.frontgate.pages.reverseProxy.fields.dryRun")}
                  alignValue="end"
                >
                  {renderDryRun(infoRule, true)}
                </NmxMetaItem>
              )}
            </NmxMetaList>
          </>
        )}
      </NmxAlertDialog>

      <NmxAlertDialog
        open={showAddDialog}
        title={t(
          editingRule
            ? "addon.frontgate.pages.reverseProxy.actions.editProxy"
            : "addon.frontgate.pages.reverseProxy.actions.addProxy",
        )}
        onClose={() => handleDialogClose()}
        size="lg"
        noSpacingBody={true}
        noBodyScrollbar={true}
        onConfirm={handleConfirm}
        loading={formSubmitting}
        confirmLabel={t("addon.frontgate.pages.reverseProxy.actions.save")}
        extraActionLabel={
          activeTabDialog === "headers"
            ? t("addon.frontgate.pages.reverseProxy.actions.addHeader")
            : activeTabDialog === "locations"
              ? t("addon.frontgate.pages.reverseProxy.actions.addLocation")
              : undefined
        }
        onExtraAction={() => {
          if (activeTabDialog === "headers") {
            setFormHeaders((prev) => [...prev, { key: "", value: "" }])
          } else if (activeTabDialog === "locations") {
            setFormLocations((prev) => [
              ...prev,
              { path: "", scheme: "http", forwardHost: "", forwardPort: 0 },
            ])
          }
        }}
      >
        <NmxTabs
          tabs={tabs}
          value={activeTabDialog}
          onChange={setActiveTabDialog}
          t={t}
        />
        {activeTabDialog === "general" && (
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
            <NmxFormField
              label={t("addon.frontgate.pages.reverseProxy.fields.dryRun")}
              inline
            >
              <NmxToggle
                checked={formDryRun}
                onCheckedChanged={setFormDryRun}
              />
            </NmxFormField>
            {formDryRun && (
              <NmxFormField
                label={t(
                  "addon.frontgate.pages.reverseProxy.fields.dryRunMinutes",
                )}
              >
                <NmxSelect
                  value={String(formDryRunMinutes)}
                  options={dryRunMinuteOptions}
                  onChange={(v) => setFormDryRunMinutes(Number(v))}
                />
              </NmxFormField>
            )}
          </NmxForm>
        )}

        {activeTabDialog === "headers" && (
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
                buttonDeleteClass="nmx-addon-frontgate__btn-delete"
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

        {activeTabDialog === "locations" && (
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
                            semantic="error"
                            onClick={() => removeLocation(idx)}
                            className="nmx-addon-frontgate__btn-delete"
                          >
                            <NmxIconFont symbol={NmxIconFontSymbol.DELETE} />
                          </NmxButton>
                        </div>
                      </NmxFormField>
                    </NmxFormRow>
                    <NmxFormRow className="nmx-addon-frontgate__location-editor__card-row">
                      <NmxFormField label="Scheme" rowFlex="0 0 85px">
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
                      <NmxFormField label="Port" rowFlex="0 0 80px">
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

        {activeTabDialog === "advanced" && (
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
                onChange={handleAccessChange}
              />
            </NmxFormField>
            {(formAccess === "restricted" || formAccess === "basicAuth") && (
              <NmxFormField
                label={t(
                  "addon.frontgate.pages.reverseProxy.fields.accessPolicy",
                )}
              >
                <NmxSelect
                  value={formPolicyId}
                  options={policyOptions}
                  onChange={setFormPolicyId}
                />
              </NmxFormField>
            )}{" "}
          </NmxForm>
        )}
      </NmxAlertDialog>

      <NmxAlertDialog
        open={deletingRule !== null}
        title={t("addon.frontgate.pages.reverseProxy.actions.deleteProxy")}
        confirmLabel={t("addon.frontgate.pages.reverseProxy.actions.delete")}
        confirmSemantic="error"
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        loading={deleteSubmitting}
        markupToHtmlEnabled={true}
      >
        <p>
          {t("addon.frontgate.pages.reverseProxy.feedback.deleteConfirm", {
            source: deletingRule?.source,
          })}
        </p>
      </NmxAlertDialog>
    </div>
  )
}
