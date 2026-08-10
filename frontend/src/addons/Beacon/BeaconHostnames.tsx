import React, { useCallback, useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import {
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
  NmxIconFont,
  NmxIconFontSymbol,
  NmxMenuButton,
  NmxPagination,
  NmxSelect,
  type NmxSelectData,
  NmxTagInput,
  useActiveTab,
} from "@namorix/ui"
import {
  ApiError,
  formatCustomError,
  nmxToast,
  usePageSize,
} from "@namorix/core"
import { beaconController } from "./beacon.controller"
import {
  BeaconErrorCodes,
  type BcnHostnameDto,
  type BcnProviderInfo,
  bcnErrorDetail,
  type BcnHostnameChangedPayload,
  type BcnHostnameStatusChangePayload,
  type BcnHostnamesRefreshPayload,
} from "./Beacon.types"
import { ServerSignalREvents, useServerSignalREvent } from "../../signalr"
import type { TFunction } from "i18next"
import type { BeaconTab } from "./Beacon"

const CUSTOM_ID = "custom"
const SECRET_PREFIX = "CfDJ8"
const CONFIG_INVALID = "BCN_CONFIG_INVALID"
const PROVIDER_ERROR = "BCN_PROVIDER_ERROR"

// credential field key → BcnProviderConfig JSON key
const CRED_FIELD_TO_CONFIG: Record<string, string> = {
  username: "user",
  password: "password",
  token: "token",
  apiToken: "apiToken",
  apiKey: "apiKey",
  apiSecret: "apiSecret",
  zone: "zone",
}

const initialConfig: Record<string, string> = {}

function renderBeaconCodeMessage(
  t: TFunction,
  code: string | undefined,
  params?: Record<string, unknown>,
): string | null {
  const key = code ? BeaconErrorCodes[code] : undefined
  if (!key) {
    return null
  }

  const p = { ...(params ?? {}) }
  if (p.provider) {
    p.provider = t(`addon.beacon.providers.${p.provider}`, {
      defaultValue: String(p.provider),
    })
  }

  return t(key, { ...p, detail: bcnErrorDetail(p) })
}

export const BeaconHostnames: React.FC = () => {
  const { t } = useTranslation()
  const { pageSize, setPageSize, options: pageSizeOptions } = usePageSize()
  const activityTab = useActiveTab<BeaconTab>()

  const [hosts, setHosts] = useState<BcnHostnameDto[]>([])
  const [providers, setProviders] = useState<BcnProviderInfo[]>([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<unknown>()

  const [showDialog, setShowDialog] = useState(false)
  const [editing, setEditing] = useState<BcnHostnameDto | null>(null)
  const [formSubmitting, setFormSubmitting] = useState(false)
  const [formHost, setFormHost] = useState<string[]>([])
  const [formDomain, setFormDomain] = useState("")
  const [formProviderId, setFormProviderId] = useState(CUSTOM_ID)
  const [formKind, setFormKind] = useState<"get" | "rest">("get")
  const [formConfig, setFormConfig] =
    useState<Record<string, string>>(initialConfig)
  const [testing, setTesting] = useState(false)
  const [keptSecrets, setKeptSecrets] = useState<Record<string, string>>({})

  const [deleting, setDeleting] = useState<BcnHostnameDto | null>(null)
  const [deleteSubmitting, setDeleteSubmitting] = useState(false)
  const [busyRowId, setBusyRowId] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const fetchHosts = useCallback(
    async (pg: number, size: number): Promise<BcnHostnameDto[]> => {
      setError(undefined)
      setPage(pg)

      if (hosts.length === 0) {
        setLoading(true)
      }

      try {
        const res = await beaconController.listHostnames(pg, size)
        setHosts(res.items)
        setTotal(res.total)
        return res.items
      } finally {
        setLoading(false)
      }
    },
    [hosts.length],
  )

  useEffect(() => {
    beaconController.listProviders().then(setProviders).catch(setError)
  }, [])

  useEffect(() => {
    if (activityTab !== "hostnames") return
    const timeout = setTimeout(() => {
      fetchHosts(page, pageSize).catch(setError)
    }, 0)
    return () => clearTimeout(timeout)
  }, [page, pageSize, fetchHosts, activityTab])

  useServerSignalREvent<BcnHostnameStatusChangePayload>(
    ServerSignalREvents.BeaconHostnameStatusChanged,
    useCallback(
      (payload) => {
        fetchHosts(page, pageSize).catch(nmxToast.error)
        if (payload?.status === "error") {
          nmxToast.error(
            t("addon.beacon.hostnames.feedback.updateError", {
              hostname: payload.hostname,
            }),
          )
        }
      },
      [fetchHosts, page, pageSize, t],
    ),
  )

  useServerSignalREvent<BcnHostnamesRefreshPayload>(
    ServerSignalREvents.BeaconHostnamesRefreshed,
    useCallback(() => {
      fetchHosts(page, pageSize).catch(nmxToast.error)
      setRefreshing(false)
    }, [fetchHosts, page, pageSize]),
  )

  const providerOptions = useMemo(() => {
    const opts: NmxSelectData[] = [
      ...providers.map((p) => ({
        value: p.id,
        label: (
          <span className="nmx-addon-beacon__provider-label">
            <span>{t(`addon.beacon.providers.${p.id}`)}</span>
            {p.tested && (
              <NmxBadge semantic="success" size="sm">
                {t("addon.beacon.providers.tested")}
              </NmxBadge>
            )}
          </span>
        ),
        description: t(`addon.beacon.providers.descriptions.${p.id}`),
      })),
      {
        value: CUSTOM_ID,
        label: t("addon.beacon.providers.custom"),
        description: t("addon.beacon.providers.descriptions.custom"),
      },
    ]
    return opts
  }, [providers, t])

  const providerName = useCallback(
    (id: string) => {
      const key = `addon.beacon.providers.${id}`
      const translated = t(key)
      return translated !== key ? translated : id
    },
    [t],
  )

  const setCfg = useCallback(
    (key: string) => (value: string) => {
      setFormConfig((prev) => ({ ...prev, [key]: value }))
    },
    [],
  )

  const isCustom = formProviderId === CUSTOM_ID
  const selectedProvider = providers.find((p) => p.id === formProviderId)

  const fieldLabel = useCallback(
    (key: string) => {
      const k = `addon.beacon.addDialog.credentialFields.${key}`
      const translated = t(k)
      return translated !== k ? translated : key
    },
    [t],
  )

  const fieldPlaceholder = (fieldKey: string, cfgKey: string) =>
    keptSecrets[cfgKey]
      ? t("addon.beacon.addDialog.secretPlaceholder")
      : t(`addon.beacon.addDialog.credentialPlaceholders.${fieldKey}`, {
          defaultValue: "",
        })

  const hostnameLabel = (host: string, domain: string, isDomain: boolean) =>
    isDomain ? domain : `${host} · ${domain}`

  const resetForm = useCallback(() => {
    setEditing(null)
    setFormHost([])
    setFormDomain("")
    setFormProviderId("")
    setFormKind("get")
    setFormConfig({})
    setKeptSecrets({})
  }, [])

  const formatBeaconError = useCallback(
    (err: unknown): string | ApiError => {
      const e = err as ApiError

      if (e?.code === CONFIG_INVALID) {
        const raw = e.field ?? ""
        return t("addon.beacon.errors.configInvalid", {
          field: t(`addon.beacon.errors.configFields.${raw}`, {
            defaultValue: raw,
          }),
        })
      }

      if (e?.code === PROVIDER_ERROR) {
        return renderBeaconCodeMessage(t, e.code, e.meta) ?? e
      }

      return formatCustomError(t, e, BeaconErrorCodes)
    },
    [t],
  )

  const handleDialogOpen = useCallback(() => {
    resetForm()
    setShowDialog(true)
  }, [resetForm])

  const handleDialogClose = useCallback(() => {
    resetForm()
    setShowDialog(false)
  }, [resetForm])

  const handleProviderChange = useCallback(
    (id: string) => {
      setFormProviderId(id)
      setFormConfig({})
      setKeptSecrets({})
      if (id !== CUSTOM_ID) {
        const kind = providers.find((p) => p.id === id)?.kind
        if (kind) setFormKind(kind)
      }
    },
    [providers],
  )

  const handleEdit = useCallback((host: BcnHostnameDto) => {
    setEditing(host)
    setFormHost(host.host.split(",").filter(Boolean))
    setFormDomain(host.domain)
    setFormProviderId(host.providerId)
    setFormKind(host.kind)

    let parsed: Record<string, string>
    const kept: Record<string, string> = {}

    try {
      parsed = JSON.parse(host.configJson) as Record<string, string>
      for (const [k, v] of Object.entries(parsed)) {
        if (typeof v === "string" && v.startsWith(SECRET_PREFIX)) {
          kept[k] = v
          delete parsed[k]
        }
      }
    } catch {
      parsed = {}
    }

    setKeptSecrets(kept)
    setFormConfig(parsed)
    setShowDialog(true)
  }, [])

  const buildPayload = useCallback(() => {
    const config = { ...keptSecrets, ...formConfig }
    if (formProviderId === CUSTOM_ID && formKind === "get")
      config.successMatch = config.successMatch ?? "contains"

    return {
      host: selectedProvider?.hostIsDomain
        ? formDomain.trim()
        : formHost.join(","),
      domain: formDomain.trim(),
      providerId: formProviderId,
      kind: formKind,
      configJson: JSON.stringify(config),
    }
  }, [
    keptSecrets,
    formConfig,
    formProviderId,
    formKind,
    selectedProvider?.hostIsDomain,
    formDomain,
    formHost,
  ])

  const handleTest = useCallback(() => {
    if (
      (!selectedProvider?.hostIsDomain && !formHost.length) ||
      !formDomain.trim()
    )
      return
    setTesting(true)

    beaconController
      .testProvider(buildPayload())
      .then((res) => {
        if (res.success) {
          nmxToast.success(t("addon.beacon.addDialog.testSuccess"))
        } else {
          const key = res.code ? BeaconErrorCodes[res.code] : undefined
          nmxToast.error(
            key
              ? t(key, { ...(res.params ?? {}) })
              : t("addon.beacon.addDialog.testError"),
          )
        }
      })
      .catch(() => nmxToast.error(t("addon.beacon.addDialog.testError")))
      .finally(() => setTesting(false))
  }, [
    buildPayload,
    formDomain,
    formHost.length,
    selectedProvider?.hostIsDomain,
    t,
  ])

  const handleConfirm = useCallback(() => {
    if (
      (!selectedProvider?.hostIsDomain && !formHost.length) ||
      !formDomain.trim()
    ) {
      nmxToast.error(
        t("core:common.validation.required", {
          field: t(
            !selectedProvider?.hostIsDomain && !formHost.length
              ? "addon.beacon.hostnames.fields.host"
              : "addon.beacon.hostnames.fields.domain",
          ),
        }),
      )
      return
    }

    const missingField =
      !isCustom &&
      selectedProvider?.credentialFields.find(
        (f) =>
          f.required &&
          !formConfig[CRED_FIELD_TO_CONFIG[f.key] ?? f.key] &&
          !keptSecrets[CRED_FIELD_TO_CONFIG[f.key] ?? f.key],
      )

    if (missingField) {
      nmxToast.error(
        t("addon.beacon.errors.configInvalid", {
          field: fieldLabel(missingField.key),
        }),
      )
      return
    }

    setFormSubmitting(true)
    const action = editing
      ? beaconController.updateHostname(editing.id, buildPayload())
      : beaconController.createHostname(buildPayload())
    action
      .then(() => {
        nmxToast.success(
          t(
            editing
              ? "addon.beacon.hostnames.feedback.updateSuccess"
              : "addon.beacon.hostnames.feedback.createSuccess",
            {
              hostname: hostnameLabel(
                formHost.join(","),
                formDomain.trim(),
                !!selectedProvider?.hostIsDomain,
              ),
            },
          ),
        )
        resetForm()
        setShowDialog(false)
        return fetchHosts(page, pageSize)
      })
      .catch((err) =>
        nmxToast.error(
          formatBeaconError(err),
          t(
            editing
              ? "addon.beacon.hostnames.feedback.updateError"
              : "addon.beacon.hostnames.feedback.createError",
            { hostname: formDomain.trim() },
          ),
        ),
      )
      .finally(() => setFormSubmitting(false))
  }, [
    selectedProvider?.hostIsDomain,
    selectedProvider?.credentialFields,
    formHost,
    formDomain,
    isCustom,
    editing,
    buildPayload,
    t,
    formConfig,
    keptSecrets,
    fieldLabel,
    resetForm,
    fetchHosts,
    page,
    pageSize,
    formatBeaconError,
  ])

  const handleDelete = useCallback(
    (host: BcnHostnameDto) => setDeleting(host),
    [],
  )

  const handleDeleteConfirm = useCallback(() => {
    if (!deleting) return
    setDeleteSubmitting(true)
    beaconController
      .deleteHostname(deleting.id)
      .then(() => {
        nmxToast.success(
          t("addon.beacon.hostnames.feedback.deleteSuccess", {
            hostname: deleting.domain,
          }),
        )
        setDeleting(null)
        return fetchHosts(page, pageSize)
      })
      .catch((err) =>
        nmxToast.error(
          formatCustomError(t, err, BeaconErrorCodes),
          t("addon.beacon.hostnames.feedback.deleteError", {
            hostname: deleting.domain,
          }),
        ),
      )
      .finally(() => setDeleteSubmitting(false))
  }, [deleting, fetchHosts, t, page, pageSize])

  const handleToggle = useCallback(
    (host: BcnHostnameDto) => {
      setBusyRowId(host.id)
      beaconController
        .toggleHostname(host.id)
        .then(() => {
          nmxToast.success(
            t(
              host.status === "disabled"
                ? "addon.beacon.hostnames.feedback.enableSuccess"
                : "addon.beacon.hostnames.feedback.disableSuccess",
              { hostname: host.domain },
            ),
          )
          return fetchHosts(page, pageSize)
        })
        .catch((err) =>
          nmxToast.error(
            formatCustomError(t, err, BeaconErrorCodes),
            t("addon.beacon.hostnames.feedback.toggleError", {
              hostname: host.domain,
            }),
          ),
        )
        .finally(() => setBusyRowId(null))
    },
    [fetchHosts, t, page, pageSize],
  )

  const handleCheck = useCallback(
    (host: BcnHostnameDto) => {
      setBusyRowId(host.id)
      nmxToast.long(
        t(
          host.status === "error"
            ? "addon.beacon.hostnames.feedback.retrying"
            : "addon.beacon.hostnames.feedback.checking",
          { hostname: host.domain },
        ),
        "info",
      )
      beaconController
        .checkHostname(host.id)
        .then((result) => {
          if (result.success) {
            nmxToast.success(
              t("addon.beacon.hostnames.feedback.checkSuccess", {
                hostname: host.domain,
              }),
            )
          } else {
            const msg =
              renderBeaconCodeMessage(t, result.code, result.params) ??
              t("addon.beacon.hostnames.feedback.checkError", {
                hostname: host.domain,
              })
            nmxToast.error(msg, t("addon.beacon.hostnames.feedback.checkError"))
          }
          return fetchHosts(page, pageSize)
        })
        .catch(() =>
          nmxToast.error(
            t("addon.beacon.hostnames.feedback.checkError", {
              hostname: host.domain,
            }),
          ),
        )
        .finally(() => setBusyRowId(null))
    },
    [fetchHosts, t, page, pageSize],
  )

  const handleRefresh = useCallback(() => {
    setRefreshing(true)
    fetchHosts(page, pageSize).catch(nmxToast.error)

    beaconController
      .refreshHostnames()
      .catch((err) =>
        nmxToast.error(formatCustomError(t, err, BeaconErrorCodes)),
      )
  }, [fetchHosts, t, page, pageSize])

  const columns: NmxDataTableColumn<BcnHostnameDto>[] = [
    {
      header: t("addon.beacon.hostnames.fields.status"),
      renderCell: (row) => (
        <NmxBadge
          semantic={
            row.status === "active"
              ? "success"
              : row.status === "error"
                ? "error"
                : row.status === "updating"
                  ? "warning"
                  : "trace"
          }
          size="sm"
        >
          {t(`addon.beacon.hostnames.status.${row.status}`)}
        </NmxBadge>
      ),
      grow: 1,
      alignHeader: "center",
      alignCell: "center",
      disableEllipsisCell: true,
    },
    {
      header: t("addon.beacon.hostnames.fields.host"),
      renderCell: (row) => {
        const isHostDomain = providers.find(
          (p) => p.id === row.providerId,
        )?.hostIsDomain

        return (
          <div className="nmx-addon-beacon__domain-wrap">
            <span className="nmx-addon-beacon__domain">
              {hostnameLabel(row.host, row.domain, isHostDomain ?? false)}
            </span>
            <span className="nmx-addon-beacon__ip">
              {row.currentIpv4 ?? "—"}
              {row.currentIpv6 ? ` · ${row.currentIpv6}` : null}
            </span>
          </div>
        )
      },
      grow: 3,
      enableUserSelectCell: true,
    },
    {
      header: t("addon.beacon.hostnames.fields.provider"),
      renderCell: (row) => (
        <NmxBadge semantic="debug" size="sm">
          {providerName(row.providerId)}
        </NmxBadge>
      ),
      grow: 1,
      hideBelow: "sm",
      disableEllipsisCell: true,
    },
    {
      header: "",
      renderCell: (row) => (
        <NmxMenuButton
          variant="ghost"
          arrowDisabled
          disabled={busyRowId === row.id}
          options={[
            {
              value: "check",
              label: t(
                row.status === "error"
                  ? "addon.beacon.hostnames.actions.retry"
                  : "addon.beacon.hostnames.actions.update",
              ),
              semantic: row.status === "error" ? "warning" : "success",
              icon:
                row.status === "error"
                  ? NmxIconFontSymbol.REFRESH
                  : NmxIconFontSymbol.UPDATE,
            },
            {
              value: row.status === "disabled" ? "enable" : "disable",
              label: t(
                row.status === "disabled"
                  ? "addon.beacon.hostnames.actions.enable"
                  : "addon.beacon.hostnames.actions.disable",
              ),
              icon:
                row.status === "disabled"
                  ? NmxIconFontSymbol.PLAY
                  : NmxIconFontSymbol.PAUSE,
              semantic: row.status === "disabled" ? "success" : "warning",
            },
            {
              value: "delete",
              label: t("addon.beacon.hostnames.actions.delete"),
              semantic: "error",
              icon: NmxIconFontSymbol.DELETE,
            },
          ]}
          filterItem={(opt) =>
            !(row.status === "disabled" && opt.value === "check")
          }
          onSelect={(action) => {
            if (action === "delete") handleDelete(row)
            else if (action === "check") handleCheck(row)
            else handleToggle(row)
          }}
          dividerIndexes={[{ value: "delete", position: "top" }]}
        >
          <NmxIconFont symbol={NmxIconFontSymbol.MENU_VERTICAL} />
        </NmxMenuButton>
      ),
      grow: 0,
      alignHeader: "center",
      alignCell: "center",
      disableEllipsisCell: true,
      btnIsMenu: true,
    },
  ]

  const fallbackConditions: NmxFallback[] = [
    {
      state: "loading",
      condition: loading,
      content: t("addon.beacon.hostnames.fallbacks.loading"),
    },
    {
      state: "error",
      condition: error,
      content: t("addon.beacon.hostnames.fallbacks.error"),
    },
    {
      state: "empty",
      condition: !loading && hosts.length === 0,
      content: t("addon.beacon.hostnames.fallbacks.empty"),
    },
  ]

  const kindOptions: NmxSelectData<"get" | "rest">[] = [
    { value: "get", label: t("addon.beacon.addDialog.simpleGet") },
    { value: "rest", label: t("addon.beacon.addDialog.restJson") },
  ]

  const authOptions: NmxSelectData[] = [
    { value: "none", label: t("addon.beacon.addDialog.authNone") },
    { value: "basic", label: t("addon.beacon.addDialog.authBasic") },
  ]

  const successMatchOptions: NmxSelectData[] = [
    { value: "contains", label: t("addon.beacon.addDialog.successContains") },
    { value: "http200", label: t("addon.beacon.addDialog.successHttp200") },
    { value: "custom", label: t("addon.beacon.addDialog.successCustom") },
  ]

  const methodOptions: NmxSelectData[] = [
    { value: "PATCH", label: t("addon.beacon.addDialog.methodPatch") },
    { value: "PUT", label: t("addon.beacon.addDialog.methodPut") },
    { value: "POST", label: t("addon.beacon.addDialog.methodPost") },
  ]

  const totalPages = Math.ceil(total / pageSize)

  useServerSignalREvent<BcnHostnameChangedPayload>(
    ServerSignalREvents.BeaconHostnameChanged,
    useCallback(
      (payload) => {
        const deleted = payload?.action === "deleted"
        const editingDeleted = deleted && payload.hostnameId === editing?.id

        if (editingDeleted) {
          resetForm()
          setShowDialog(false)
          nmxToast.warning(
            t("addon.beacon.hostnames.feedback.deletedExternally", {
              hostname: payload.hostname,
            }),
          )
        }
        fetchHosts(page, pageSize).catch(nmxToast.error)
      },
      [editing?.id, resetForm, fetchHosts, page, pageSize, t],
    ),
  )

  return (
    <>
      <NmxAlign direction="row" justify="end">
        <NmxButton semantic="success" onClick={handleDialogOpen}>
          <NmxIconFont symbol={NmxIconFontSymbol.ADD} />
          <span>{t("addon.beacon.hostnames.add")}</span>
        </NmxButton>
        <NmxButton onClick={handleRefresh} disabled={refreshing}>
          <NmxIconFont symbol={NmxIconFontSymbol.REFRESH} />
          <span>{t("addon.beacon.hostnames.actions.refresh")}</span>
        </NmxButton>
      </NmxAlign>

      <div className="nmx-addon-beacon__list">
        <NmxDataTable
          columns={columns}
          rows={hosts}
          fallbackConditions={fallbackConditions}
          clickableRows={true}
          onRowClick={handleEdit}
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
        open={showDialog}
        title={t(
          editing
            ? "addon.beacon.addDialog.editTitle"
            : "addon.beacon.addDialog.title",
        )}
        onClose={handleDialogClose}
        size="lg"
        onConfirm={handleConfirm}
        loading={formSubmitting}
        confirmLabel={t("addon.beacon.addDialog.save")}
        extraActionLabel={t("addon.beacon.addDialog.test")}
        extraActionDisabled={
          (!selectedProvider?.hostIsDomain && !formHost.length) ||
          !formDomain.trim() ||
          !formProviderId ||
          testing
        }
        onExtraAction={handleTest}
      >
        <NmxForm className="nmx-addon-beacon__form">
          <NmxFormField
            label={t("addon.beacon.addDialog.domain")}
            helper={t("addon.beacon.addDialog.domainHint")}
            required
          >
            <NmxFormInput
              value={formDomain}
              onValueChange={setFormDomain}
              placeholder={t("addon.beacon.addDialog.domainPlaceholder")}
            />
          </NmxFormField>
          <NmxFormField
            label={t("addon.beacon.addDialog.host")}
            helper={t("addon.beacon.addDialog.hostHint")}
            required
            shouldRender={!selectedProvider?.hostIsDomain}
          >
            <NmxTagInput
              value={formHost}
              onChange={setFormHost}
              placeholder={t("addon.beacon.addDialog.hostPlaceholder")}
            />
          </NmxFormField>
          <NmxFormField label={t("addon.beacon.addDialog.provider")} required>
            <NmxSelect
              value={formProviderId}
              options={providerOptions}
              onChange={handleProviderChange}
              placeholder={t("addon.beacon.addDialog.providerPlaceholder")}
            />
          </NmxFormField>
          {isCustom && (
            <NmxFormField
              label={t("addon.beacon.addDialog.updateStyle")}
              required
            >
              <NmxSelect
                value={formKind}
                options={kindOptions}
                onChange={(k) => {
                  setFormKind(k)
                  setFormConfig({})
                }}
              />
            </NmxFormField>
          )}
          {!isCustom &&
            selectedProvider?.credentialFields.map((field) => {
              const cfgKey = CRED_FIELD_TO_CONFIG[field.key] ?? field.key
              return (
                <NmxFormField
                  key={field.key}
                  label={fieldLabel(field.key)}
                  required={field.required}
                >
                  <NmxFormInput
                    value={formConfig[cfgKey] ?? ""}
                    onValueChange={setCfg(cfgKey)}
                    type={field.type === "secret" ? "password" : "text"}
                    placeholder={fieldPlaceholder(field.key, cfgKey)}
                  />
                </NmxFormField>
              )
            })}
          {isCustom && formKind === "get" && (
            <>
              <NmxFormField
                label={t("addon.beacon.addDialog.urlTemplate")}
                helper={t("addon.beacon.addDialog.urlTemplateHint")}
                required
              >
                <NmxFormInput
                  value={formConfig.urlTemplate ?? ""}
                  onValueChange={setCfg("urlTemplate")}
                  placeholder={t(
                    "addon.beacon.addDialog.urlTemplatePlaceholder",
                  )}
                />
              </NmxFormField>
              <NmxFormField label={t("addon.beacon.addDialog.auth")}>
                <NmxSelect
                  value={formConfig.authType ?? "none"}
                  options={authOptions}
                  onChange={setCfg("authType")}
                />
              </NmxFormField>
              {formConfig.authType !== "none" && (
                <NmxFormField
                  label={t("addon.beacon.addDialog.token")}
                  helper={t("addon.beacon.addDialog.tokenHint")}
                >
                  <NmxFormInput
                    value={formConfig.token ?? ""}
                    onValueChange={setCfg("token")}
                    type="password"
                    placeholder={fieldPlaceholder("token", "token")}
                  />
                </NmxFormField>
              )}
              <NmxFormField label={t("addon.beacon.addDialog.successMeans")}>
                <NmxSelect
                  value={formConfig.successMatch ?? "contains"}
                  options={successMatchOptions}
                  onChange={setCfg("successMatch")}
                />
              </NmxFormField>

              {(formConfig.successMatch ?? "contains") !== "http200" && (
                <NmxFormField
                  label={t("addon.beacon.addDialog.successContains")}
                >
                  <NmxFormInput
                    value={formConfig.successContains ?? ""}
                    onValueChange={setCfg("successContains")}
                    placeholder="OK"
                  />
                </NmxFormField>
              )}
            </>
          )}
          {isCustom && formKind === "rest" && (
            <>
              <NmxFormField
                label={t("addon.beacon.addDialog.endpointUrl")}
                required
              >
                <NmxFormInput
                  value={formConfig.endpointTemplate ?? ""}
                  onValueChange={setCfg("endpointTemplate")}
                  placeholder="https://api.example.com/update/{recordId}"
                />
              </NmxFormField>
              <NmxFormField label={t("addon.beacon.addDialog.method")}>
                <NmxSelect
                  value={formConfig.method ?? "PATCH"}
                  options={methodOptions}
                  onChange={setCfg("method")}
                />
              </NmxFormField>
              <NmxFormInput
                value={formConfig.apiToken ?? ""}
                onValueChange={setCfg("apiToken")}
                type="password"
                placeholder={fieldPlaceholder("apiToken", "apiToken")}
              />
              <NmxFormField label={t("addon.beacon.addDialog.zone")}>
                <NmxFormInput
                  value={formConfig.zone ?? ""}
                  onValueChange={setCfg("zone")}
                />
              </NmxFormField>
              <NmxFormField
                label={t("addon.beacon.addDialog.bodyTemplate")}
                helper={t("addon.beacon.addDialog.bodyTemplateHint")}
              >
                <NmxFormInput
                  value={formConfig.bodyTemplate ?? ""}
                  onValueChange={setCfg("bodyTemplate")}
                  placeholder={t(
                    "addon.beacon.addDialog.bodyTemplatePlaceholder",
                  )}
                />
              </NmxFormField>
              <NmxFormField
                label={t("addon.beacon.addDialog.successPath")}
                helper={t("addon.beacon.addDialog.successPathHint")}
              >
                <NmxFormInput
                  value={formConfig.successPath ?? ""}
                  onValueChange={setCfg("successPath")}
                />
              </NmxFormField>
            </>
          )}
        </NmxForm>
      </NmxAlertDialog>

      <NmxAlertDialog
        open={deleting !== null}
        title={t("addon.beacon.hostnames.actions.delete")}
        confirmLabel={t("addon.beacon.hostnames.actions.delete")}
        confirmSemantic="error"
        onClose={() => setDeleting(null)}
        onConfirm={handleDeleteConfirm}
        loading={deleteSubmitting}
        markupToHtmlEnabled={true}
      >
        <p>
          {t("addon.beacon.hostnames.feedback.deleteConfirm", {
            hostname: deleting?.domain,
          })}
        </p>
      </NmxAlertDialog>
    </>
  )
}
