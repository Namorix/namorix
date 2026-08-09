import React, { useCallback, useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { formatCustomError, nmxToast } from "@namorix/core"
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
  type NmxSemanticColor,
} from "@namorix/ui"
import {
  WardenErrorCodes,
  type WdFirewallRule,
  type WdRuleAction,
} from "./Warden.types"
import { wardenController, type WdRulePayload } from "./warden.controller"
import { WardenRuleDialog } from "./WardenRuleDialog"

const ActionSemantic: Record<WdRuleAction, NmxSemanticColor> = {
  allow: "success",
  deny: "error",
}

export const WardenRules: React.FC = () => {
  const { t } = useTranslation()
  const [rules, setRules] = useState<WdFirewallRule[]>([])
  const [rulesLoading, setRulesLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<WdFirewallRule | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<WdFirewallRule | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchRules = useCallback(() => {
    setRulesLoading(true)
    wardenController
      .listRules()
      .then(setRules)
      .finally(() => setRulesLoading(false))
      .catch(nmxToast.error)
  }, [])

  useEffect(() => {
    const timeout = setTimeout(fetchRules, 0)
    return () => clearTimeout(timeout)
  }, [fetchRules])

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
      const request = editing
        ? wardenController.updateRule(editing.id, payload)
        : wardenController.createRule(payload)
      request
        .then(() => {
          setDialogOpen(false)
          return fetchRules()
        })
        .catch((err) =>
          nmxToast.error(formatCustomError(t, err, WardenErrorCodes)),
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
    },
    {
      header: t("addon.warden.pages.rules.columns.action"),
      renderCell: (rule) => (
        <NmxBadge semantic={ActionSemantic[rule.action]}>
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
        open={deleteTarget != null}
        title={t("addon.warden.dialog.titleDelete")}
        confirmLabel={t("addon.warden.dialog.delete")}
        confirmSemantic="error"
        loading={deleting}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteRule}
      >
        <p>
          {t("addon.warden.dialog.deleteConfirm", {
            name: deleteTarget?.name ?? "",
          })}
        </p>
      </NmxAlertDialog>
    </div>
  )
}
