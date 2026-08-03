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
} from "@namorix/ui"
import {
  ApiError,
  formatCustomError,
  nmxToast,
  useDateTimeFormat,
  usePageSize,
} from "@namorix/core"
import { beaconController } from "./beacon.controller"
import {
  BeaconErrorCodes,
  type BcnHostnameDto,
  type BcnProviderInfo,
} from "./Beacon.types"

const CUSTOM_ID = "custom"
const CONFIG_INVALID = "BCN_CONFIG_INVALID"

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

export const BeaconHostnames: React.FC = () => {
  const { t } = useTranslation()
  const { dateTime } = useDateTimeFormat()
  const { pageSize, setPageSize, options: pageSizeOptions } = usePageSize()

  const [hosts, setHosts] = useState<BcnHostnameDto[]>([])
  const [providers, setProviders] = useState<BcnProviderInfo[]>([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<unknown>()

  const [showDialog, setShowDialog] = useState(false)
  const [editing, setEditing] = useState<BcnHostnameDto | null>(null)
  const [formSubmitting, setFormSubmitting] = useState(false)
  const [formHostname, setFormHostname] = useState("")
  const [formProviderId, setFormProviderId] = useState(CUSTOM_ID)
  const [formKind, setFormKind] = useState<"get" | "rest">("get")
  const [formConfig, setFormConfig] =
    useState<Record<string, string>>(initialConfig)
  const [testing, setTesting] = useState(false)

  const [deleting, setDeleting] = useState<BcnHostnameDto | null>(null)
  const [deleteSubmitting, setDeleteSubmitting] = useState(false)

  const [togglingId, setTogglingId] = useState<string | null>(null)

  const fetchHosts = useCallback(async (pg: number, size: number) => {
    setLoading(true)
    setError(undefined)
    setPage(pg)

    beaconController
      .listHostnames(pg, size)
      .then((res) => {
        setHosts(res.items)
        setTotal(res.total)
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    beaconController.listProviders().then(setProviders).catch(setError)
  }, [])

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchHosts(page, pageSize).catch(setError)
    }, 0)
    return () => clearTimeout(timeout)
  }, [page, pageSize, fetchHosts])

  const providerOptions = useMemo(() => {
    const opts: NmxSelectData<string>[] = [
      ...providers.map((p) => ({
        value: p.id,
        label: t(`addon.beacon.providers.${p.id}`),
        description: p.credentialFields.map((f) => f.key).join(", "),
      })),
      {
        value: CUSTOM_ID,
        label: t("addon.beacon.providers.custom"),
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

  const resetForm = useCallback(() => {
    setEditing(null)
    setFormHostname("izerocs.duckdns.org")
    setFormProviderId(CUSTOM_ID)
    setFormKind("get")
    setFormConfig({
      urlTemplate:
        "https://www.duckdns.org/update?domains={hostname}&token={token}&ip={ip}",
      token: "30141a2c-c9f9-498d-85ec-c92e50061156",
      successContains: "OK",
    })
  }, [])

  const formatBeaconError = useCallback(
    (err: unknown): string | ApiError => {
      const e = err as ApiError
      if (e?.code === CONFIG_INVALID) {
        const raw = e.field ?? ""
        console.log(raw)
        return t("addon.beacon.errors.configInvalid", {
          field: t(`addon.beacon.errors.configFields.${raw}`, {
            defaultValue: raw,
          }),
        })
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
      if (id !== CUSTOM_ID) {
        const kind = providers.find((p) => p.id === id)?.kind
        if (kind) setFormKind(kind)
      }
    },
    [providers],
  )

  const handleEdit = useCallback((host: BcnHostnameDto) => {
    setEditing(host)
    setFormHostname(host.hostname)
    setFormProviderId(host.providerId)
    setFormKind(host.kind)
    let parsed: Record<string, string>
    try {
      parsed = JSON.parse(host.configJson) as Record<string, string>
    } catch {
      parsed = {}
    }
    setFormConfig(parsed)
    setShowDialog(true)
  }, [])

  const buildPayload = useCallback(() => {
    const config = { ...formConfig }
    if (formProviderId === CUSTOM_ID && formKind === "get")
      config.successMatch = config.successMatch ?? "contains"
    return {
      hostname: formHostname.trim(),
      providerId: formProviderId,
      kind: formKind,
      configJson: JSON.stringify(config),
    }
  }, [formHostname, formProviderId, formKind, formConfig])

  const handleTest = useCallback(() => {
    if (!formHostname.trim()) return
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
  }, [buildPayload, formHostname, t])

  const handleConfirm = useCallback(() => {
    if (!formHostname.trim()) {
      nmxToast.error(
        t("core:common.validation.required", {
          field: t("addon.beacon.hostnames.fields.hostname"),
        }),
      )
      return
    }

    const missingField =
      !isCustom &&
      selectedProvider?.credentialFields.find(
        (f) => f.required && !formConfig[CRED_FIELD_TO_CONFIG[f.key] ?? f.key],
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
          ),
        ),
      )
      .finally(() => setFormSubmitting(false))
  }, [
    formHostname,
    isCustom,
    selectedProvider?.credentialFields,
    editing,
    buildPayload,
    t,
    formConfig,
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
        nmxToast.success(t("addon.beacon.hostnames.feedback.deleteSuccess"))
        setDeleting(null)
        return fetchHosts(page, pageSize)
      })
      .catch((err) =>
        nmxToast.error(
          formatCustomError(t, err, BeaconErrorCodes),
          t("addon.beacon.hostnames.feedback.deleteError"),
        ),
      )
      .finally(() => setDeleteSubmitting(false))
  }, [deleting, fetchHosts, t, page, pageSize])

  const handleToggle = useCallback(
    (host: BcnHostnameDto) => {
      setTogglingId(host.id)
      beaconController
        .toggleHostname(host.id)
        .then(() => {
          nmxToast.success(
            t(
              host.status === "disabled"
                ? "addon.beacon.hostnames.feedback.enableSuccess"
                : "addon.beacon.hostnames.feedback.disableSuccess",
            ),
          )
          return fetchHosts(page, pageSize)
        })
        .catch((err) =>
          nmxToast.error(
            formatCustomError(t, err, BeaconErrorCodes),
            t("addon.beacon.hostnames.feedback.toggleError"),
          ),
        )
        .finally(() => setTogglingId(null))
    },
    [fetchHosts, t, page, pageSize],
  )

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
      header: t("addon.beacon.hostnames.fields.hostname"),
      renderCell: (row) => (
        <div className="nmx-addon-beacon__domain-wrap">
          <span className="nmx-addon-beacon__domain">{row.hostname}</span>
          <span className="nmx-addon-beacon__created">
            {t("addon.frontgate.pages.reverseProxy.fields.createdAt", {
              time: dateTime(row.createdAt),
            })}
          </span>
        </div>
      ),
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
      hideBelow: "md",
      disableEllipsisCell: true,
    },
    {
      header: t("addon.beacon.hostnames.fields.currentIp"),
      renderCell: (row) => row.currentIpv4 ?? "—",
      grow: 1,
      enableUserSelectCell: true,
      hideBelow: "sm",
    },
    {
      header: "",
      renderCell: (row) => (
        <NmxMenuButton
          variant="ghost"
          arrowDisabled
          disabled={togglingId === row.id}
          options={[
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
          onSelect={(action) => {
            if (action === "delete") handleDelete(row)
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

  return (
    <>
      <NmxAlign direction="row" justify="end">
        <NmxButton semantic="success" onClick={handleDialogOpen}>
          <NmxIconFont symbol={NmxIconFontSymbol.ADD} />
          <span>{t("addon.beacon.hostnames.add")}</span>
        </NmxButton>
        <NmxButton onClick={() => fetchHosts(page, pageSize)}>
          <NmxIconFont symbol={NmxIconFontSymbol.REFRESH} />
          <span>{t("addon.frontgate.pages.reverseProxy.actions.refresh")}</span>
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
              setLoading(true)
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
        extraActionDisabled={!formHostname.trim() || testing}
        onExtraAction={handleTest}
      >
        <NmxForm className="nmx-addon-beacon__form">
          <NmxFormField label={t("addon.beacon.addDialog.hostname")} required>
            <NmxFormInput
              value={formHostname ?? ""}
              onValueChange={setFormHostname}
              placeholder={t("addon.beacon.addDialog.hostnamePlaceholder")}
            />
          </NmxFormField>
          <NmxFormField label={t("addon.beacon.addDialog.provider")} required>
            <NmxSelect
              value={formProviderId}
              options={providerOptions}
              onChange={handleProviderChange}
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
              <NmxFormField label={t("addon.beacon.addDialog.apiToken")}>
                <NmxFormInput
                  value={formConfig.apiToken ?? ""}
                  onValueChange={setCfg("apiToken")}
                  type="password"
                />
              </NmxFormField>
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
                  placeholder={
                    '{"type":"A","name":"{hostname}","content":"{ip}"}'
                  }
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
            hostname: deleting?.hostname,
          })}
        </p>
      </NmxAlertDialog>
    </>
  )
}
