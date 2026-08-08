import React, { useCallback, useEffect, useState } from "react"
import {
  NmxAlertDialog,
  NmxAlign,
  NmxBadge,
  NmxButton,
  NmxDataTable,
  type NmxDataTableColumn,
  type NmxFallback,
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
  useActiveTab,
} from "@namorix/ui"
import { useTranslation } from "react-i18next"
import {
  type CertificateItem,
  frontgateController,
  type ReverseCertificateStatus,
} from "./frontgate.controller"
import {
  formatCustomError,
  nmxToast,
  useDateTimeFormat,
  usePageSize,
} from "@namorix/core"
import type { TFunction } from "i18next"
import {
  type FrontgateCertChangedPayload,
  type FrontgateCertificateKeyType,
  FrontgateErrorCodes,
  getStatusSemantic,
} from "./Frontgate.types"
import {
  ServerSignalREvent,
  ServerSignalRGroups,
  useServerSignalREvent,
  useServerSignalRGroup,
} from "../../signalr"
import type { FrontgateTab } from "./Frontgate"

type FrontgateCertificateType = "letsEncryptHttp" | "custom"
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
  status: ReverseCertificateStatus | undefined,
  isInUse: boolean | undefined,
  t: TFunction,
) => {
  let label: string
  if (status === "pending")
    label = t("addon.frontgate.pages.certificate.fields.statusValues.pending")
  else if (status === "error")
    label = t("addon.frontgate.pages.certificate.fields.statusValues.error")
  else if (isInUse)
    label = t("addon.frontgate.pages.certificate.fields.inUseValues.true")
  else label = t("addon.frontgate.pages.certificate.fields.inUseValues.false")

  return (
    <NmxBadge semantic={getStatusSemantic(status, isInUse)} size="sm">
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
  const activeTab = useActiveTab<FrontgateTab>()
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
  const [certAutoRenew, setCertAutoRenew] = useState(false)
  const [certKey, setCertKey] = useState("")
  const [certBody, setCertBody] = useState("")
  const [certIntermediate, setCertIntermediate] = useState("")
  const [addSubmitting, setAddSubmitting] = useState(false)

  const [testing, setTesting] = useState(false)

  const fetchCerts = useCallback(
    async (pg: number, sz: number): Promise<CertificateItem[]> => {
      setError(undefined)

      if (certs.length <= 0) {
        setLoading(true)
      }

      try {
        const res = await frontgateController.listCertificates(pg, sz)
        setCerts(res.items)
        setTotal(res.total)
        return res.items
      } finally {
        setLoading(false)
      }
    },
    [certs.length],
  )

  useEffect(() => {
    if (activeTab !== "certificate") return
    const timeout = setTimeout(() => {
      fetchCerts(page, pageSize).catch(setError)
    }, 0)
    return () => clearTimeout(timeout)
  }, [activeTab, fetchCerts, page, pageSize])

  useEffect(() => {
    frontgateController
      .listUnusedDomains()
      .then(setDomainSuggestions)
      .catch(nmxToast.error)
  }, [])

  useServerSignalRGroup(ServerSignalRGroups.Frontgate, true)
  useServerSignalREvent<{ certId: string; status: string }>(
    ServerSignalREvent.FrontgateCertStatusChanged,
    useCallback(() => {
      fetchCerts(page, pageSize).catch(nmxToast.error)
    }, [fetchCerts, page, pageSize]),
  )

  useServerSignalREvent<FrontgateCertChangedPayload>(
    ServerSignalREvent.FrontgateCertChanged,
    useCallback(
      (payload) => {
        const deleted = payload?.action === "deleted"
        const viewingDeleted = deleted && payload.certId === selectedCert?.id

        if (viewingDeleted) {
          setSelectedCert(null)
          nmxToast.warning(
            t("addon.frontgate.pages.certificate.feedback.deletedExternally", {
              domain: selectedCert?.domains?.[0],
            }),
          )
        }

        fetchCerts(page, pageSize).catch(nmxToast.error)
      },
      [selectedCert?.id, selectedCert?.domains, fetchCerts, page, pageSize, t],
    ),
  )

  const handleAction = useCallback(
    (value: FrontgateActionMenuType, row: CertificateItem) => {
      if (value === "retry") {
        frontgateController
          .retryCertificate(row.id)
          .then(() => {
            nmxToast.success(
              t("addon.frontgate.pages.certificate.feedback.retrySuccess"),
            )
            fetchCerts(page, pageSize).catch(nmxToast.error)
          })
          .catch((err) => {
            nmxToast.error(
              formatCustomError(t, err, FrontgateErrorCodes),
              t("addon.frontgate.pages.certificate.feedback.retryError"),
            )
          })
      }

      if (value === "renew") {
        frontgateController
          .renewCertificate(row.id)
          .then(() => {
            nmxToast.success(
              t("addon.frontgate.pages.certificate.feedback.renewSuccess"),
            )
            fetchCerts(page, pageSize).catch(nmxToast.error)
          })
          .catch((err) =>
            nmxToast.error(
              formatCustomError(t, err, FrontgateErrorCodes),
              t("addon.frontgate.pages.certificate.feedback.renewError"),
            ),
          )
      }

      if (value === "delete") setDeletingCert(row)
    },
    [fetchCerts, page, pageSize, t],
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
        fetchCerts(page, pageSize).catch(nmxToast.error)
      })
      .catch((err) => {
        nmxToast.error(
          formatCustomError(t, err, FrontgateErrorCodes),
          t("addon.frontgate.pages.certificate.feedback.deleteError"),
        )
      })
      .finally(() => setDeleteSubmitting(false))
  }, [deletingCert, fetchCerts, page, pageSize, t])

  const handleConfirmLetsEncrypt = useCallback(() => {
    setAddSubmitting(true)
    frontgateController
      .createLetsEncryptCert({
        domains: certDomains.map((d) => d.trim()).filter(Boolean),
        keyType: certType,
        autoRenew: certAutoRenew,
      })
      .then(() => {
        setAddDialogType(null)
        fetchCerts(page, pageSize).catch(nmxToast.error)
        nmxToast.success(
          t(
            "addon.frontgate.pages.certificate.dialogs.letsEncryptHttp.success",
          ),
        )
      })
      .catch((err) => {
        nmxToast.error(
          formatCustomError(t, err, FrontgateErrorCodes),
          t("addon.frontgate.pages.certificate.dialogs.letsEncryptHttp.error"),
        )
      })
      .finally(() => setAddSubmitting(false))
  }, [certAutoRenew, certDomains, certType, fetchCerts, page, pageSize, t])

  const handleTestLetsEncrypt = useCallback(() => {
    setTesting(true)
    frontgateController
      .testLetsEncryptHttp(certDomains.map((d) => d.trim()).filter(Boolean))
      .then((res) => {
        if (res.passed) {
          nmxToast.success(
            t(
              "addon.frontgate.pages.certificate.dialogs.letsEncryptHttp.testSuccess",
            ),
          )
          if (res.warnings?.length) {
            nmxToast.warning(
              t(
                "addon.frontgate.pages.certificate.dialogs.letsEncryptHttp.testWarning",
              ),
            )
          }
        } else {
          nmxToast.error(
            res.message ??
              t(
                "addon.frontgate.pages.certificate.dialogs.letsEncryptHttp.testError",
              ),
          )
        }
      })
      .catch((err) =>
        nmxToast.error(formatCustomError(t, err, FrontgateErrorCodes)),
      )
      .finally(() => setTesting(false))
  }, [certDomains, t])

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
            {t("addon.frontgate.pages.certificate.fields.createdTime", {
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
          arrowDisabled={true}
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

  const certOptions: NmxMenuButtonOption<FrontgateCertificateType>[] = [
    {
      value: "letsEncryptHttp",
      label: t("addon.frontgate.pages.certificate.options.letsEncryptHttp"),
      icon: NmxIconFontSymbol.HTTP,
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

  const fallbackConditions: NmxFallback[] = [
    { state: "loading", condition: loading },
    { state: "error", condition: !!error },
    { state: "empty", condition: certs.length === 0 },
  ]

  return (
    <div className="nmx-addon-frontgate__page">
      <NmxAlign direction="row" justify="end">
        <NmxMenuButton
          options={certOptions}
          onSelect={(value) => {
            setAddDialogType(value)
            setAddSubmitting(false)
            setCertName("")
            setCertDomains([])
            setCertType("ecdsa")
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
      </NmxAlign>

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
        loading={addSubmitting || testing}
        confirmDisabled={certDomains.every((d) => !d.trim())}
        extraActionDisabled={testing || certDomains.every((d) => !d.trim())}
        onExtraAction={handleTestLetsEncrypt}
        onClose={() => setAddDialogType(null)}
        onConfirm={handleConfirmLetsEncrypt}
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
