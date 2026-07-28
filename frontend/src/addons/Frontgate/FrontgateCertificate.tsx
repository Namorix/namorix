import React, { useCallback, useEffect, useState } from "react"
import {
  NmxAlertDialog,
  NmxBadge,
  NmxButton,
  NmxDataTable,
  type NmxDataTableColumn,
  type NmxDataTableFallback,
  NmxFileInput,
  NmxForm,
  NmxFormField,
  NmxFormInput,
  NmxIconFont,
  NmxIconFontSymbol,
  NmxInlineAlert,
  NmxMenuButton,
  type NmxMenuButtonOption,
  NmxMetaItem,
  NmxMetaList,
  NmxPagination,
  NmxSelect,
  type NmxSelectData,
  type NmxSemanticColor,
  NmxTagInput,
  NmxToggle,
} from "@namorix/ui"
import { useTranslation } from "react-i18next"
import {
  type CertificateItem,
  frontgateController,
} from "./frontgate.controller"
import {
  formatCustomError,
  nmxToast,
  useDateTimeFormat,
  usePageSize,
} from "@namorix/core"
import type { TFunction } from "i18next"
import {
  type FrontgateCertificateKeyType,
  FrontgateErrorCodes,
} from "./Frontgate.types"

type FrontgateCertificateType = "letsEncryptHttp" | "letsEncryptDns" | "custom"
type FrontgateActionMenuType = "renew" | "retry" | "download" | "delete"

function getExpirySemantic(expiresAt: string): NmxSemanticColor {
  const days = Math.floor(
    (new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
  )
  return days < 0 ? "error" : days < 30 ? "warning" : "success"
}

function renderType(type: FrontgateCertificateKeyType) {
  return (
    <NmxBadge semantic={type === "ecdsa" ? "info" : "debug"} size="sm">
      {type}
    </NmxBadge>
  )
}

const renderStatus = (
  status: string | undefined,
  isInUse: boolean | undefined,
  t: TFunction,
) => {
  let label: string
  let semantic: NmxSemanticColor
  if (status === "pending") {
    label = t("addon.frontgate.pages.certificate.fields.statusValues.pending")
    semantic = "warning"
  } else if (status === "error") {
    label = t("addon.frontgate.pages.certificate.fields.statusValues.error")
    semantic = "error"
  } else if (isInUse) {
    label = t("addon.frontgate.pages.certificate.fields.inUseValues.true")
    semantic = "success"
  } else {
    label = t("addon.frontgate.pages.certificate.fields.inUseValues.false")
    semantic = "trace"
  }
  return (
    <NmxBadge semantic={semantic} size="sm">
      {label}
    </NmxBadge>
  )
}

function renderExpiry(
  expiresAt: string,
  status: string | undefined,
  dateOnly: (d: string) => string,
) {
  const hidden =
    !expiresAt ||
    expiresAt.startsWith("0001") ||
    (status && status !== "active")
  return (
    <NmxBadge
      semantic={hidden ? "trace" : getExpirySemantic(expiresAt)}
      size="sm"
      bgEnabled={false}
    >
      {hidden ? "—" : dateOnly(expiresAt)}
    </NmxBadge>
  )
}

function renderSource(source: string) {
  return (
    <NmxBadge semantic="info" size="sm" uppercase={false}>
      {source}
    </NmxBadge>
  )
}

export const FrontgateCertificate: React.FC = () => {
  const { t } = useTranslation()
  const { dateOnly, dateTime } = useDateTimeFormat()
  const [certs, setCerts] = useState<CertificateItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<unknown>()
  const { pageSize, setPageSize, options: pageSizeOptions } = usePageSize()
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)

  const [selectedCert, setSelectedCert] = useState<CertificateItem | null>(null)
  const [deletingCert, setDeletingCert] = useState<CertificateItem | null>(null)
  const [deleteSubmitting, setDeleteSubmitting] = useState(false)
  const [addDialogType, setAddDialogType] =
    useState<FrontgateCertificateType | null>(null)
  const [domainSuggestions, setDomainSuggestions] = useState<string[]>([])

  const [certName, setCertName] = useState("")
  const [certDomains, setCertDomains] = useState<string[]>([])
  const [certType, setCertType] = useState<FrontgateCertificateKeyType>("ecdsa")
  const [dnsProviders, setDnsProviders] = useState<string[]>([])
  const [dnsProvider, setDnsProvider] = useState("")
  const [certAutoRenew, setCertAutoRenew] = useState(false)
  const [certKey, setCertKey] = useState("")
  const [certBody, setCertBody] = useState("")
  const [certIntermediate, setCertIntermediate] = useState("")
  const [addSubmitting, setAddSubmitting] = useState(false)

  const fetchCerts = useCallback((pg: number, sz: number) => {
    setLoading(true)
    setError(undefined)
    frontgateController
      .listCertificates(pg, sz)
      .then((res) => {
        setCerts(res.items)
        setTotal(res.total)
      })
      .catch(setError)
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    const timeout = setTimeout(() => fetchCerts(page, pageSize), 0)
    return () => clearTimeout(timeout)
  }, [fetchCerts, page, pageSize])

  useEffect(() => {
    frontgateController
      .listDnsProviders()
      .then(setDnsProviders)
      .catch((err) => nmxToast.error(err))
  }, [])

  useEffect(() => {
    frontgateController
      .listUnusedDomains()
      .then(setDomainSuggestions)
      .catch((err) => nmxToast.error(err))
  }, [])

  const handleAction = useCallback(
    (value: FrontgateActionMenuType, row: CertificateItem) => {
      if (value === "delete") setDeletingCert(row)
    },
    [],
  )

  const handleDeleteConfirm = useCallback(() => {
    if (!deletingCert) return

    setDeleteSubmitting(true)
    frontgateController
      .deleteCertificate(deletingCert.id)
      .then(() => {
        nmxToast.success(
          t("addon.frontgate.pages.certificate.feedback.deleteSuccess"),
        )
        setDeletingCert(null)
        fetchCerts(page, pageSize)
      })
      .catch((err) => {
        nmxToast.error(
          formatCustomError(t, err, FrontgateErrorCodes),
          t("addon.frontgate.pages.certificate.feedback.deleteError"),
        )
      })
      .finally(() => setDeleteSubmitting(false))
  }, [deletingCert, fetchCerts, page, pageSize, t])

  const actionOptions: NmxMenuButtonOption<FrontgateActionMenuType>[] = [
    {
      value: "renew",
      label: t("addon.frontgate.pages.certificate.actions.renew"),
      icon: NmxIconFontSymbol.REFRESH,
      semantic: "success",
    },
    {
      value: "retry",
      label: t("addon.frontgate.pages.certificate.actions.retry"),
      icon: NmxIconFontSymbol.REFRESH,
      semantic: "warning",
    },
    {
      value: "download",
      label: t("addon.frontgate.pages.certificate.actions.download"),
      icon: NmxIconFontSymbol.DOWNLOAD,
    },
    {
      value: "delete",
      label: t("addon.frontgate.pages.certificate.actions.delete"),
      icon: NmxIconFontSymbol.DELETE,
      semantic: "error",
    },
  ]

  const columns: NmxDataTableColumn<CertificateItem>[] = [
    {
      header: t("addon.frontgate.pages.certificate.fields.domains"),
      renderCell: (row) => (
        <div className="nmx-addon-frontgate__domain-wrap">
          <div className="nmx-addon-frontgate__domain-list">
            {row.domains?.map((d) => (
              <a
                key={d}
                href={`https://${d}`}
                target="_blank"
                rel="noopener noreferrer"
                className="nmx-addon-frontgate__domain-item"
                onClick={(e) => e.stopPropagation()}
              >
                {d}
              </a>
            ))}
          </div>
          <span className="nmx-addon-frontgate__created">
            {t("addon.frontgate.pages.certificate.fields.createdAt", {
              time: dateTime(row.createdAt),
            })}
          </span>
        </div>
      ),
      grow: 3,
    },
    {
      header: t("addon.frontgate.pages.certificate.fields.issuer"),
      renderCell: (row) => row.issuer,
      grow: 2,
      hideBelow: "sm",
    },
    {
      header: t("addon.frontgate.pages.certificate.fields.type"),
      renderCell: (row) => renderType(row.type),
      grow: 1,
      alignHeader: "center",
      alignCell: "center",
      hideBelow: "md",
      disableEllipsisCell: true,
    },
    {
      header: t("addon.frontgate.pages.certificate.fields.status"),
      renderCell: (row) => renderStatus(row.status, row.isInUse, t),
      grow: 1,
      alignHeader: "center",
      alignCell: "center",
      disableEllipsisCell: true,
    },
    {
      header: t("addon.frontgate.pages.certificate.fields.expires"),
      renderCell: (row) => renderExpiry(row.expiresAt, row.status, dateOnly),
      grow: 1,
      alignHeader: "center",
      alignCell: "center",
      disableEllipsisCell: true,
    },
    {
      header: "",
      renderCell: (row) => (
        <NmxMenuButton
          options={actionOptions}
          filterItem={(opt) =>
            row.status === "pending"
              ? opt.value === "delete"
              : row.status !== "error"
                ? opt.value !== "retry"
                : opt.value !== "renew" && opt.value !== "download"
          }
          onSelect={(menu) => handleAction(menu, row)}
          variant="ghost"
          semantic="trace"
          arrowDisabled={true}
          dividerIndexes={[{ value: "delete", position: "top" }]}
          className="nmx-addon-frontgate__btn-menu"
        >
          <NmxIconFont symbol={NmxIconFontSymbol.MENU_VERTICAL} />
        </NmxMenuButton>
      ),
      grow: 0,
      alignHeader: "center",
      alignCell: "center",
      disableEllipsisCell: true,
    },
  ]

  const certOptions: NmxMenuButtonOption<FrontgateCertificateType>[] = [
    {
      value: "letsEncryptHttp",
      label: t("addon.frontgate.pages.certificate.options.letsEncryptHttp"),
      icon: NmxIconFontSymbol.HTTP,
    },
    {
      value: "letsEncryptDns",
      label: t("addon.frontgate.pages.certificate.options.letsEncryptDns"),
      icon: NmxIconFontSymbol.DNS,
    },
    {
      value: "custom",
      label: t("addon.frontgate.pages.certificate.options.custom"),
      icon: NmxIconFontSymbol.UPLOAD,
    },
  ]

  const certTypeOptions: NmxSelectData<FrontgateCertificateKeyType>[] = [
    {
      value: "ecdsa",
      label: t("addon.frontgate.pages.certificate.fields.keyTypes.ecdsa"),
    },
    {
      value: "rsa",
      label: t("addon.frontgate.pages.certificate.fields.keyTypes.rsa"),
    },
  ]

  const dnsProviderOptions: NmxSelectData<string>[] = dnsProviders.map(
    (id) => ({
      value: id,
      label: t(`addon.frontgate.pages.certificate.dnsProviders.${id}`),
    }),
  )

  const fallbackConditions: NmxDataTableFallback[] = [
    { state: "loading", condition: loading },
    { state: "error", condition: !!error },
    { state: "empty", condition: certs.length === 0 },
  ]

  return (
    <div className="nmx-addon-frontgate__page">
      <div className="nmx-addon-frontgate__actions">
        <NmxMenuButton
          options={certOptions}
          onSelect={(value) => {
            setAddDialogType(value)
            setAddSubmitting(false)
            setCertName("")
            setCertDomains([])
            setCertType("ecdsa")
            setDnsProvider("")
            setCertAutoRenew(false)
            setCertKey("")
            setCertBody("")
            setCertIntermediate("")
          }}
          semantic="success"
        >
          <NmxIconFont symbol={NmxIconFontSymbol.ADD} />
          <span>
            {t("addon.frontgate.pages.certificate.actions.addCertificate")}
          </span>
        </NmxMenuButton>
        <NmxButton onClick={() => fetchCerts(page, pageSize)}>
          <NmxIconFont symbol={NmxIconFontSymbol.REFRESH} />
          <span>{t("addon.frontgate.pages.certificate.actions.refresh")}</span>
        </NmxButton>
      </div>

      <NmxDataTable
        columns={columns}
        rows={certs}
        rowCellSpacing="xs"
        clickableRows={true}
        onRowClick={(row) => setSelectedCert(row)}
        fallbackConditions={fallbackConditions}
        className="nmx-addon-page__data-table"
      />

      {total > 0 && (
        <NmxPagination
          page={page}
          totalPages={Math.ceil(total / pageSize)}
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

      <NmxAlertDialog
        open={!!selectedCert}
        title={t("addon.frontgate.pages.certificate.titleInformation")}
        onClose={() => setSelectedCert(null)}
        size="md"
      >
        {selectedCert && (
          <NmxMetaList>
            <NmxMetaItem
              label={t("addon.frontgate.pages.certificate.fields.domains")}
              alignValue="end"
            >
              <div className="nmx-addon-frontgate__domain-list">
                {selectedCert.domains?.map((d) => (
                  <a
                    key={d}
                    href={`https://${d}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="nmx-addon-frontgate__domain-item"
                  >
                    {d}
                  </a>
                ))}
              </div>
            </NmxMetaItem>
            <NmxMetaItem
              label={t("addon.frontgate.pages.certificate.fields.issuer")}
              value={selectedCert.issuer}
              alignValue="end"
            />
            <NmxMetaItem
              label={t("addon.frontgate.pages.certificate.fields.createdAt")}
              value={dateOnly(selectedCert.createdAt)}
              alignValue="end"
            />
            <NmxMetaItem
              label={t("addon.frontgate.pages.certificate.fields.source")}
              alignValue="end"
            >
              {renderSource(selectedCert.source)}
            </NmxMetaItem>
            <NmxMetaItem
              label={t("addon.frontgate.pages.certificate.fields.type")}
              alignValue="end"
            >
              {renderType(selectedCert.type)}
            </NmxMetaItem>
            <NmxMetaItem
              label={t("addon.frontgate.pages.certificate.fields.status")}
              alignValue="end"
            >
              {renderStatus(selectedCert.status, selectedCert.isInUse, t)}
            </NmxMetaItem>
            <NmxMetaItem
              label={t("addon.frontgate.pages.certificate.fields.expires")}
              alignValue="end"
            >
              {renderExpiry(
                selectedCert.expiresAt,
                selectedCert.status,
                dateOnly,
              )}
            </NmxMetaItem>
          </NmxMetaList>
        )}
      </NmxAlertDialog>

      <NmxAlertDialog
        open={deletingCert !== null}
        title={t("addon.frontgate.pages.certificate.actions.delete")}
        confirmLabel={t("addon.frontgate.pages.certificate.actions.delete")}
        confirmSemantic="error"
        onClose={() => setDeletingCert(null)}
        onConfirm={handleDeleteConfirm}
        loading={deleteSubmitting}
        markupToHtmlEnabled={true}
      >
        <p>
          {t("addon.frontgate.pages.certificate.feedback.deleteConfirm", {
            domain: deletingCert?.domains?.[0],
          })}
        </p>
      </NmxAlertDialog>

      <NmxAlertDialog
        open={addDialogType === "letsEncryptHttp"}
        title={t(
          "addon.frontgate.pages.certificate.dialogs.letsEncryptHttp.title",
        )}
        confirmLabel={t(
          "addon.frontgate.pages.certificate.dialogs.letsEncryptHttp.confirm",
        )}
        extraActionLabel={t(
          "addon.frontgate.pages.certificate.dialogs.letsEncryptHttp.test",
        )}
        loading={addSubmitting}
        confirmDisabled={certDomains.every((d) => !d.trim())}
        extraActionDisabled={certDomains.every((d) => !d.trim())}
        onClose={() => setAddDialogType(null)}
        onConfirm={() => {
          setAddSubmitting(true)
          frontgateController
            .createLetsEncryptCert({
              domains: certDomains.map((d) => d.trim()).filter(Boolean),
              keyType: certType,
              autoRenew: certAutoRenew,
            })
            .then(() => {
              setAddDialogType(null)
              fetchCerts(page, pageSize)
              nmxToast.success(
                t(
                  "addon.frontgate.pages.certificate.dialogs.letsEncryptHttp.success",
                ),
              )
            })
            .catch((err) => {
              nmxToast.error(
                formatCustomError(t, err, FrontgateErrorCodes),
                t(
                  "addon.frontgate.pages.certificate.dialogs.letsEncryptHttp.error",
                ),
              )
            })
            .finally(() => setAddSubmitting(false))
        }}
        size="md"
      >
        <NmxForm>
          <NmxInlineAlert
            semantic="info"
            shouldRender={true}
            message={t(
              "addon.frontgate.pages.certificate.dialogs.letsEncryptHttp.info",
            )}
          />
          <NmxFormField
            label={t("addon.frontgate.pages.certificate.fields.domains")}
            required
          >
            <NmxTagInput
              value={certDomains}
              onChange={setCertDomains}
              suggestions={domainSuggestions}
              placeholder={t(
                "addon.frontgate.pages.certificate.dialogs.letsEncryptHttp.domainPlaceholder",
              )}
            />
          </NmxFormField>
          <NmxFormField
            label={t("addon.frontgate.pages.certificate.fields.keyType")}
            required
          >
            <NmxSelect
              value={certType}
              options={certTypeOptions}
              onChange={setCertType}
            />
          </NmxFormField>
          <NmxFormField
            label={t(
              "addon.frontgate.pages.certificate.dialogs.letsEncryptHttp.autoRenew",
            )}
            inline
          >
            <NmxToggle
              checked={certAutoRenew}
              onCheckedChanged={setCertAutoRenew}
            />
          </NmxFormField>
        </NmxForm>
      </NmxAlertDialog>

      <NmxAlertDialog
        open={addDialogType === "letsEncryptDns"}
        title={t(
          "addon.frontgate.pages.certificate.dialogs.letsEncryptDns.title",
        )}
        confirmLabel={t(
          "addon.frontgate.pages.certificate.dialogs.letsEncryptDns.confirm",
        )}
        extraActionLabel={t(
          "addon.frontgate.pages.certificate.dialogs.letsEncryptDns.test",
        )}
        loading={addSubmitting}
        confirmDisabled={certDomains.every((d) => !d.trim())}
        extraActionDisabled={certDomains.every((d) => !d.trim())}
        onClose={() => setAddDialogType(null)}
        onConfirm={() => {
          setAddSubmitting(true)
          frontgateController
            .createLetsEncryptDnsCert({
              domains: certDomains.map((d) => d.trim()).filter(Boolean),
              keyType: certType,
              dnsProviderId: dnsProvider,
              autoRenew: certAutoRenew,
            })
            .then(() => {
              setAddDialogType(null)
              fetchCerts(page, pageSize)
              nmxToast.success(
                t(
                  "addon.frontgate.pages.certificate.dialogs.letsEncryptDns.success",
                ),
              )
            })
            .catch((err) => {
              nmxToast.error(
                formatCustomError(t, err, FrontgateErrorCodes),
                t(
                  "addon.frontgate.pages.certificate.dialogs.letsEncryptDns.error",
                ),
              )
            })
            .finally(() => setAddSubmitting(false))
        }}
        size="md"
      >
        <NmxForm>
          <NmxInlineAlert
            semantic="info"
            message={t(
              "addon.frontgate.pages.certificate.dialogs.letsEncryptDns.info",
            )}
          />
          <NmxFormField
            label={t("addon.frontgate.pages.certificate.fields.domains")}
            required
          >
            <NmxTagInput
              value={certDomains}
              onChange={setCertDomains}
              suggestions={domainSuggestions}
              placeholder={t(
                "addon.frontgate.pages.certificate.dialogs.letsEncryptDns.domainPlaceholder",
              )}
            />
          </NmxFormField>
          <NmxFormField
            label={t("addon.frontgate.pages.certificate.fields.keyType")}
            required
          >
            <NmxSelect
              value={certType}
              options={certTypeOptions}
              onChange={setCertType}
            />
          </NmxFormField>
          <NmxFormField
            label={t(
              "addon.frontgate.pages.certificate.dialogs.letsEncryptDns.dnsProvider",
            )}
            required
          >
            <NmxSelect
              value={dnsProvider}
              options={dnsProviderOptions}
              onChange={setDnsProvider}
              placeholder={t(
                "addon.frontgate.pages.certificate.dialogs.letsEncryptDns.dnsProviderPlaceholder",
              )}
            />
          </NmxFormField>
          <NmxFormField
            label={t(
              "addon.frontgate.pages.certificate.dialogs.letsEncryptDns.autoRenew",
            )}
            inline
          >
            <NmxToggle
              checked={certAutoRenew}
              onCheckedChanged={setCertAutoRenew}
            />
          </NmxFormField>
        </NmxForm>
      </NmxAlertDialog>

      <NmxAlertDialog
        open={addDialogType === "custom"}
        title={t("addon.frontgate.pages.certificate.dialogs.custom.title")}
        confirmLabel={t(
          "addon.frontgate.pages.certificate.dialogs.custom.confirm",
        )}
        loading={addSubmitting}
        confirmDisabled={!certKey.trim() || !certBody.trim()}
        onClose={() => setAddDialogType(null)}
        onConfirm={() => {
          setAddSubmitting(true)
          frontgateController
            .createCustomCert({
              name: certName,
              certificateKey: certKey,
              certificate: certBody,
              intermediate: certIntermediate || undefined,
            })
            .then(() => {
              setAddDialogType(null)
              fetchCerts(page, pageSize)
              nmxToast.success(
                t("addon.frontgate.pages.certificate.dialogs.custom.success"),
              )
            })
            .catch((err) => {
              nmxToast.error(
                formatCustomError(t, err, FrontgateErrorCodes),
                t("addon.frontgate.pages.certificate.dialogs.custom.error"),
              )
            })
            .finally(() => setAddSubmitting(false))
        }}
        size="md"
      >
        <NmxForm>
          <NmxFormField
            label={t("addon.frontgate.pages.certificate.dialogs.custom.name")}
            required
          >
            <NmxFormInput
              value={certName}
              onValueChange={setCertName}
              placeholder="e.g. my-domain-cert"
            />
          </NmxFormField>

          <NmxFormField
            label={t(
              "addon.frontgate.pages.certificate.dialogs.custom.certificateKey",
            )}
            required
          >
            <NmxFileInput
              value={certKey}
              onValueChange={setCertKey}
              accept=".pem,.key,.txt"
            />
          </NmxFormField>

          <NmxFormField
            label={t(
              "addon.frontgate.pages.certificate.dialogs.custom.certificate",
            )}
            required
          >
            <NmxFileInput
              value={certBody}
              onValueChange={setCertBody}
              accept=".pem,.crt,.cert,.txt"
              placeholder="Select certificate file..."
            />
          </NmxFormField>

          <NmxFormField
            label={t(
              "addon.frontgate.pages.certificate.dialogs.custom.intermediate",
            )}
          >
            <NmxFileInput
              value={certIntermediate}
              onValueChange={setCertIntermediate}
              accept=".pem,.crt,.cert,.txt"
              placeholder="Select intermediate certificate (optional)..."
            />
          </NmxFormField>
        </NmxForm>
      </NmxAlertDialog>
    </div>
  )
}
