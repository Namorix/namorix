import React, { useCallback, useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { formatCustomError, nmxToast, useDateTimeFormat } from "@namorix/core"
import {
  NmxAlertDialog,
  NmxAlign,
  NmxBadge,
  NmxButton,
  NmxDataTable,
  type NmxDataTableColumn,
  type NmxFallback,
  NmxIconFont,
  NmxIconFontSymbol,
  NmxMenuButton,
  NmxMetaItem,
  NmxMetaList,
  type NmxSemanticColor,
  useActiveTab,
} from "@namorix/ui"
import {
  WardenErrorCodes,
  type WdFirewallRule,
  type WdRuleAction,
} from "./Warden.types"
import { wardenController, type WdRulePayload } from "./warden.controller"
import { WardenRuleDialog } from "./WardenRuleDialog"
import type { WardenTab } from "./Warden"

const ActionSemantic: Record<WdRuleAction, NmxSemanticColor> = {
  allow: "success",
  deny: "error",
}

export const WardenRules: React.FC = () => {
  const { t } = useTranslation()
  const activeTab = useActiveTab<WardenTab>()
  const { dateTime } = useDateTimeFormat()
  const [rules, setRules] = useState<WdFirewallRule[]>([])
  const [rulesLoading, setRulesLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<WdFirewallRule | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<WdFirewallRule | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [detailTarget, setDetailTarget] = useState<WdFirewallRule | null>(null)

  const fetchRules = useCallback(() => {
    if (rules.length <= 0) setRulesLoading(true)
    wardenController
      .listRules()
      .then(setRules)
      .finally(() => setRulesLoading(false))
      .catch(nmxToast.error)
  }, [rules.length])

  useEffect(() => {
    if (activeTab !== "rules") return
    const timeout = setTimeout(fetchRules, 0)
    return () => clearTimeout(timeout)
  }, [activeTab, fetchRules])

  const handleAddRule = useCallback(() => {
    setEditing(null)
    setDialogOpen(true)
  }, [])

  const handleEditRule = useCallback((rule: WdFirewallRule) => {
    setEditing(rule)
    setDialogOpen(true)
  }, [])

  const handleSubmitRule = useCallback(
    (payload: WdRulePayload) => {
      setSubmitting(true)
      const isEdit = editing != null
      const request = isEdit
        ? wardenController.updateRule(editing.id, payload)
        : wardenController.createRule(payload)
      request
        .then(() => {
          setDialogOpen(false)
          nmxToast.success(
            t(
              isEdit
                ? "addon.warden.pages.rules.feedback.updateSuccess"
                : "addon.warden.pages.rules.feedback.addSuccess",
              { name: payload.name },
            ),
          )
          return fetchRules()
        })
        .catch((err) =>
          nmxToast.error(
            formatCustomError(t, err, WardenErrorCodes),
            t(
              isEdit
                ? "addon.warden.pages.rules.feedback.updateError"
                : "addon.warden.pages.rules.feedback.addError",
            ),
          ),
        )
        .finally(() => setSubmitting(false))
    },
    [editing, fetchRules, t],
  )

  const handleToggleRule = useCallback(
    (rule: WdFirewallRule) => {
      wardenController
        .toggleRule(rule.id)
        .then(fetchRules)
        .catch((err) =>
          nmxToast.error(formatCustomError(t, err, WardenErrorCodes)),
        )
    },
    [fetchRules, t],
  )

  const handleDeleteRule = useCallback(() => {
    if (!deleteTarget) return
    setDeleting(true)
    wardenController
      .deleteRule(deleteTarget.id)
      .then(() => {
        setDeleteTarget(null)
        return fetchRules()
      })
      .catch((err) =>
        nmxToast.error(formatCustomError(t, err, WardenErrorCodes)),
      )
      .finally(() => setDeleting(false))
  }, [deleteTarget, fetchRules, t])

  const columns: NmxDataTableColumn<WdFirewallRule>[] = [
    {
      header: t("addon.warden.pages.rules.columns.name"),
      grow: 1,
      renderCell: (rule) => <strong>{rule.name}</strong>,
    },
    {
      header: t("addon.warden.pages.rules.columns.source"),
      renderCell: (rule) =>
        rule.sourceCidr ?? t("addon.warden.pages.rules.sourceAny"),
      grow: 1,
    },
    {
      header: t("addon.warden.pages.rules.columns.ports"),
      renderCell: (rule) =>
        `${rule.ports ?? "*"} / ${rule.protocol.toUpperCase()}`,
      grow: 1,
      hideBelow: "md",
    },
    {
      header: t("addon.warden.pages.rules.columns.action"),
      renderCell: (rule) => (
        <NmxBadge semantic={ActionSemantic[rule.action]} size="sm">
          {t(`addon.warden.pages.rules.action.${rule.action}`)}
        </NmxBadge>
      ),
    },
    {
      header: "",
      btnIsMenu: true,
      alignCell: "end",
      renderCell: (rule) => (
        <NmxMenuButton<"toggle" | "edit" | "delete">
          variant="ghost"
          semantic="trace"
          arrowDisabled
          options={[
            {
              value: "toggle",
              label: t(
                rule.enabled
                  ? "addon.warden.pages.rules.menu.disable"
                  : "addon.warden.pages.rules.menu.enable",
              ),
            },
            { value: "edit", label: t("addon.warden.pages.rules.menu.edit") },
            {
              value: "delete",
              label: t("addon.warden.pages.rules.menu.delete"),
              semantic: "error",
            },
          ]}
          dividerIndexes={[{ value: "delete", position: "top" }]}
          onSelect={(v) => {
            if (v === "toggle") handleToggleRule(rule)
            else if (v === "edit") handleEditRule(rule)
            else setDeleteTarget(rule)
          }}
        >
          <NmxIconFont symbol={NmxIconFontSymbol.MENU_VERTICAL} />
        </NmxMenuButton>
      ),
    },
  ]

  const fallbackConditions: NmxFallback[] = [
    {
      state: "loading",
      condition: rulesLoading,
      content: t("addon.warden.pages.rules.fallbacks.loading"),
    },
    {
      state: "empty",
      condition: !rulesLoading && rules.length === 0,
      content: t("addon.warden.pages.rules.fallbacks.empty"),
    },
  ]

  return (
    <div className="nmx-addon-warden__page">
      <NmxAlign direction="row" justify="end">
        <NmxButton semantic="success" onClick={handleAddRule}>
          <NmxIconFont symbol={NmxIconFontSymbol.ADD} />
          <span>{t("addon.warden.pages.rules.add")}</span>
        </NmxButton>
      </NmxAlign>

      <NmxDataTable
        columns={columns}
        rows={rules}
        clickableRows
        onRowClick={(rule) => setDetailTarget(rule)}
        fallbackConditions={fallbackConditions}
        className="nmx-addon-page__data-table"
      />

      <WardenRuleDialog
        open={dialogOpen}
        editing={editing}
        submitting={submitting}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleSubmitRule}
      />

      <NmxAlertDialog
        open={detailTarget != null}
        title={t("addon.warden.pages.rules.detail.title")}
        closeLabel={t("addon.warden.pages.rules.detail.actions.close")}
        extraActionLabel={t("addon.warden.pages.rules.detail.actions.edit")}
        onExtraAction={() => {
          if (!detailTarget) return
          setDetailTarget(null)
          handleEditRule(detailTarget)
        }}
        onClose={() => setDetailTarget(null)}
      >
        {detailTarget && (
          <NmxMetaList>
            <NmxMetaItem
              label={t("addon.warden.pages.rules.detail.fields.name")}
              value={detailTarget.name}
              alignValue="end"
            />
            <NmxMetaItem
              label={t("addon.warden.pages.rules.detail.fields.source")}
              value={
                detailTarget.sourceCidr ??
                t("addon.warden.pages.rules.sourceAny")
              }
              alignValue="end"
            />
            <NmxMetaItem
              label={t("addon.warden.pages.rules.detail.fields.ports")}
              value={`${detailTarget.ports ?? "*"} / ${detailTarget.protocol.toUpperCase()}`}
              alignValue="end"
            />
            <NmxMetaItem
              label={t("addon.warden.pages.rules.detail.fields.action")}
              value={t(
                `addon.warden.pages.rules.action.${detailTarget.action}`,
              )}
              semantic={ActionSemantic[detailTarget.action]}
              alignValue="end"
            />
            <NmxMetaItem
              label={t("addon.warden.pages.rules.detail.fields.status")}
              value={
                detailTarget.enabled
                  ? t("addon.warden.pages.rules.detail.values.enabled")
                  : t("addon.warden.pages.rules.detail.values.disabled")
              }
              semantic={detailTarget.enabled ? "success" : "error"}
              alignValue="end"
            />
            <NmxMetaItem
              label={t("addon.warden.pages.rules.detail.fields.type")}
              value={
                detailTarget.auto
                  ? t("addon.warden.pages.rules.detail.values.auto")
                  : t("addon.warden.pages.rules.detail.values.manual")
              }
              alignValue="end"
            />
            {detailTarget.priority != null && (
              <NmxMetaItem
                label={t("addon.warden.pages.rules.detail.fields.priority")}
                value={String(detailTarget.priority)}
                alignValue="end"
              />
            )}
            {detailTarget.expiresAt && (
              <NmxMetaItem
                label={t("addon.warden.pages.rules.detail.fields.expiresAt")}
                value={dateTime(detailTarget.expiresAt)}
                alignValue="end"
              />
            )}
            <NmxMetaItem
              label={t("addon.warden.pages.rules.detail.fields.createdAt")}
              value={dateTime(detailTarget.createdAt)}
              alignValue="end"
            />
          </NmxMetaList>
        )}
      </NmxAlertDialog>

      <NmxAlertDialog
        open={deleteTarget != null}
        title={t("addon.warden.pages.rules.dialog.titleDelete")}
        confirmLabel={t("addon.warden.pages.rules.dialog.delete")}
        confirmSemantic="error"
        loading={deleting}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteRule}
        markupToHtmlEnabled={true}
      >
        <p>
          {t("addon.warden.pages.rules.dialog.deleteConfirm", {
            name: deleteTarget?.name ?? "",
          })}
        </p>
      </NmxAlertDialog>
    </div>
  )
}
