import React, { useCallback, useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import {
  NmxAlertDialog,
  NmxAlign,
  NmxButton,
  type NmxFallback,
  NmxIconFont,
  NmxIconFontSymbol,
  type NmxLogEntry,
  NmxLogList,
  NmxMetaItem,
  NmxMetaList,
  NmxPagination,
  type NmxSemanticColor,
  useActiveTab,
} from "@namorix/ui"
import { nmxToast, useDateTimeFormat, usePageSize } from "@namorix/core"
import {
  frontgateController,
  type AuditAction,
  type AuditLogItem,
} from "./frontgate.controller"
import type { FrontgateTab } from "./Frontgate"
import {
  ServerSignalREvents,
  ServerSignalRGroups,
  useServerSignalREvent,
  useServerSignalRGroup,
} from "../../signalr"
import type { FrontgateAuditCreatedPayload } from "./Frontgate.types"

const ACTION_SEMANTIC: Record<AuditAction, NmxSemanticColor> = {
  created: "success",
  updated: "info",
  deleted: "error",
  dryRunConfirm: "success",
  dryRunCancel: "warning",
  dryRunExpire: "warning",
  certRetry: "warning",
  certRenew: "success",
  auditCleared: "error",
}

function formatJson(json?: string | null): string {
  if (!json) return ""
  try {
    return JSON.stringify(JSON.parse(json), null, 2)
  } catch {
    return json
  }
}

export const FrontgateAudit: React.FC = () => {
  const { t } = useTranslation()
  const { dateTime } = useDateTimeFormat()
  const { pageSize, setPageSize, options: pageSizeOptions } = usePageSize()
  const [items, setItems] = useState<AuditLogItem[]>([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<unknown>()
  const [confirmClear, setConfirmClear] = useState(false)
  const [clearing, setClearing] = useState(false)
  const [viewingLog, setViewingLog] = useState<AuditLogItem | null>(null)
  const activeTab = useActiveTab<FrontgateTab>()

  const fetchAudit = useCallback(
    async (pg: number, size: number) => {
      setError(undefined)
      setPage(pg)
      if (items.length === 0) setLoading(true)
      frontgateController
        .listAudit(pg, size)
        .then((res) => {
          setItems(res.items)
          setTotal(res.total)
        })
        .finally(() => setLoading(false))
    },
    [items.length],
  )

  useEffect(() => {
    if (activeTab !== "audit") return
    const timeout = setTimeout(() => {
      fetchAudit(page, pageSize).catch(setError)
    }, 0)
    return () => clearTimeout(timeout)
  }, [page, pageSize, fetchAudit, activeTab])

  const renderMessage = (row: AuditLogItem): string => {
    const action = t(
      `addon.frontgate.pages.audit.fields.actionOptions.${row.action}`,
    )
    const target = row.targetName
      ? t("addon.frontgate.pages.audit.fields.targetPrint", {
          target: row.targetName,
        })
      : t(`addon.frontgate.pages.audit.fields.targetTypes.${row.targetType}`)
    const suffix = row.clientIp ? ` · ${row.clientIp}` : ""
    return `${action} · ${target} · ${row.actor}${suffix}`
  }

  useServerSignalRGroup(ServerSignalRGroups.Frontgate, true)
  useServerSignalREvent<FrontgateAuditCreatedPayload>(
    ServerSignalREvents.FrontgateAuditCreated,
    useCallback(() => {
      fetchAudit(page, pageSize).catch(nmxToast.error)
    }, [fetchAudit, page, pageSize]),
  )

  const handleClearConfirm = useCallback(() => {
    setClearing(true)
    frontgateController
      .clearAudit()
      .then((res) => {
        nmxToast.success(
          t("addon.frontgate.pages.audit.feedback.clearSuccess", {
            count: res.deleted,
          }),
        )
        setConfirmClear(false)
        return fetchAudit(1, pageSize)
      })
      .catch(() =>
        nmxToast.error(t("addon.frontgate.pages.audit.feedback.clearError")),
      )
      .finally(() => setClearing(false))
  }, [fetchAudit, pageSize, t])

  const entries: NmxLogEntry[] = items.map((row) => ({
    id: String(row.id),
    time: dateTime(row.timestamp),
    message: renderMessage(row),
    semantic: ACTION_SEMANTIC[row.action],
    markupToHtmlEnabled: true,
  }))

  const logById = useMemo(
    () => new Map(items.map((row) => [String(row.id), row])),
    [items],
  )

  const fallbackConditions: NmxFallback[] = [
    {
      state: "loading",
      condition: loading,
      content: t("addon.frontgate.pages.audit.fallbacks.loading"),
    },
    {
      state: "error",
      condition: error,
      content: t("addon.frontgate.pages.audit.fallbacks.error"),
    },
    {
      state: "empty",
      condition: !loading && items.length === 0,
      content: t("addon.frontgate.pages.audit.fallbacks.empty"),
    },
  ]

  const totalPages = Math.ceil(total / pageSize)

  return (
    <>
      <NmxAlign direction="row" justify="end">
        {entries.length > 0 && (
          <NmxButton semantic="error" onClick={() => setConfirmClear(true)}>
            <NmxIconFont symbol={NmxIconFontSymbol.DELETE} />
            <span>{t("addon.frontgate.pages.audit.actions.clear")}</span>
          </NmxButton>
        )}
        <NmxButton onClick={() => fetchAudit(page, pageSize)}>
          <NmxIconFont symbol={NmxIconFontSymbol.REFRESH} />
          <span>{t("addon.frontgate.pages.audit.actions.refresh")}</span>
        </NmxButton>
      </NmxAlign>

      <div className="nmx-addon-frontgate__list">
        <NmxLogList
          items={entries}
          contained
          fallbackConditions={fallbackConditions}
          onItemClick={(entry) => {
            const row = logById.get(String(entry.id))
            if (row) setViewingLog(row)
          }}
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
        open={viewingLog !== null}
        title={t("addon.frontgate.pages.audit.actions.view")}
        onClose={() => setViewingLog(null)}
        size="lg"
      >
        {viewingLog && (
          <div className="nmx-addon-frontgate__audit-detail">
            <NmxMetaList>
              <NmxMetaItem
                label={t("addon.frontgate.pages.audit.fields.action")}
                value={t(
                  `addon.frontgate.pages.audit.fields.actionOptions.${viewingLog.action}`,
                )}
                semantic={ACTION_SEMANTIC[viewingLog.action]}
                alignValue="end"
              />
              <NmxMetaItem
                label={t("addon.frontgate.pages.audit.fields.timestamp")}
                value={dateTime(viewingLog.timestamp)}
                alignValue="end"
              />
              <NmxMetaItem
                label={t("addon.frontgate.pages.audit.fields.actor")}
                value={viewingLog.actor}
                alignValue="end"
              />
              {viewingLog.clientIp && (
                <NmxMetaItem
                  label={t("addon.frontgate.pages.audit.fields.clientIp")}
                  value={viewingLog.clientIp}
                  alignValue="end"
                />
              )}
              <NmxMetaItem
                label={t("addon.frontgate.pages.audit.fields.target")}
                value={
                  viewingLog.targetName
                    ? viewingLog.targetName
                    : t(
                        `addon.frontgate.pages.audit.fields.targetTypes.${viewingLog.targetType}`,
                      )
                }
                alignValue="end"
              />
              {viewingLog?.beforeJson && viewingLog.beforeJson?.length > 0 && (
                <NmxMetaItem
                  label={t("addon.frontgate.pages.audit.fields.before")}
                  alignValue="end"
                  isBlockMessage={true}
                >
                  <div className="nmx-addon-frontgate__audit-json">
                    {formatJson(viewingLog.beforeJson)}
                  </div>
                </NmxMetaItem>
              )}
            </NmxMetaList>
          </div>
        )}
      </NmxAlertDialog>

      <NmxAlertDialog
        open={confirmClear}
        title={t("addon.frontgate.pages.audit.actions.clear")}
        confirmLabel={t("addon.frontgate.pages.audit.actions.clear")}
        confirmSemantic="error"
        onClose={() => setConfirmClear(false)}
        onConfirm={handleClearConfirm}
        loading={clearing}
      >
        <p>{t("addon.frontgate.pages.audit.feedback.clearConfirm")}</p>
      </NmxAlertDialog>
    </>
  )
}
