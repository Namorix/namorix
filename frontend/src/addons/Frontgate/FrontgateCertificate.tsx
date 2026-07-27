import React, { useCallback, useEffect, useState } from "react"
import {
  NmxAlertDialog,
  NmxBadge,
  NmxButton,
  NmxDataTable,
  type NmxDataTableColumn,
  type NmxDataTableFallback,
  NmxIconFont,
  NmxIconFontSymbol,
  NmxMenuButton,
  type NmxMenuButtonOption,
  NmxMetaItem,
  NmxMetaList,
  NmxPagination,
  type NmxSemanticColor,
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
import { FrontgateErrorCodes } from "./Frontgate.types"

type FrontgateCertificateType = "letsEncryptHttp" | "letsEncryptDns" | "custom"
type FrontgateActionMenuType = "renew" | "retry" | "download" | "delete"

function getExpirySemantic(expiresAt: string): NmxSemanticColor {
  const days = Math.floor(
    (new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
  )
  return days < 0 ? "error" : days < 30 ? "warning" : "success"
}

function renderType(type: string) {
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

function renderExpiry(expiresAt: string, dateOnly: (d: string) => string) {
  return (
    <NmxBadge
      semantic={getExpirySemantic(expiresAt)}
      size="sm"
      bgEnabled={false}
    >
      {dateOnly(expiresAt)}
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
  const { dateOnly } = useDateTimeFormat()
  const [certs, setCerts] = useState<CertificateItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<unknown>()
  const { pageSize, setPageSize, options: pageSizeOptions } = usePageSize()
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)

  const [selectedCert, setSelectedCert] = useState<CertificateItem | null>(null)
  const [deletingCert, setDeletingCert] = useState<CertificateItem | null>(null)
  const [deleteSubmitting, setDeleteSubmitting] = useState(false)

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
      header: t("addon.frontgate.pages.certificate.fields.domain"),
      renderCell: (row) => row.domain,
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
      renderCell: (row) => renderExpiry(row.expiresAt, dateOnly),
      grow: 1,
      alignHeader: "center",
      alignCell: "center",
      disableEllipsisCell: true,
    },
    {
      header: t("addon.frontgate.pages.certificate.fields.action"),
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
          onSelect={() => {}}
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
        size="sm"
      >
        {selectedCert && (
          <NmxMetaList>
            <NmxMetaItem
              label={t("addon.frontgate.pages.certificate.fields.domain")}
              value={selectedCert.domain}
              alignValue="end"
            />
            <NmxMetaItem
              label={t("addon.frontgate.pages.certificate.fields.issuer")}
              value={selectedCert.issuer}
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
              {renderExpiry(selectedCert.expiresAt, dateOnly)}
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
            domain: deletingCert?.domain,
          })}
        </p>
      </NmxAlertDialog>
    </div>
  )
}
