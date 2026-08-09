import React, { useCallback, useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import {
  NmxAddonRoot,
  NmxAlertDialog,
  NmxSection,
  NmxSettingsCard,
  NmxSettingsRow,
  NmxToggle,
} from "@namorix/ui"
import { formatCustomError, nmxToast } from "@namorix/core"
import { wardenController } from "./warden.controller"
import type { WdRulePayload } from "./warden.controller"
import { WardenBlockLog } from "./WardenBlockLog"
import { WardenProfile } from "./WardenProfile"
import { WardenRuleDialog } from "./WardenRuleDialog"
import { WardenRules } from "./WardenRules"
import { WardenStats } from "./WardenStats"
import {
  WardenErrorCodes,
  type WdFirewallRule,
  type WdSecurityEvent,
  type WdSecurityProfile,
  type WdSettings,
  type WdStats,
} from "./Warden.types"

export const Warden: React.FC = () => {
  const { t } = useTranslation()

  const [stats, setStats] = useState<WdStats | null>(null)
  const [rules, setRules] = useState<WdFirewallRule[]>([])
  const [rulesLoading, setRulesLoading] = useState(true)
  const [settings, setSettings] = useState<WdSettings | null>(null)
  const [settingsUpdating, setSettingsUpdating] = useState(false)
  const [events, setEvents] = useState<WdSecurityEvent[]>([])
  const [eventsLoading, setEventsLoading] = useState(true)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<WdFirewallRule | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<WdFirewallRule | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchStats = useCallback(() => {
    wardenController.getStats().then(setStats).catch(nmxToast.error)
  }, [])

  const fetchRules = useCallback(() => {
    setRulesLoading(true)
    wardenController
      .listRules()
      .then(setRules)
      .finally(() => setRulesLoading(false))
      .catch(nmxToast.error)
  }, [])

  const fetchSettings = useCallback(() => {
    wardenController.getSettings().then(setSettings).catch(nmxToast.error)
  }, [])

  const fetchEvents = useCallback(() => {
    setEventsLoading(true)
    wardenController
      .listEvents({ size: 20 })
      .then((res) => setEvents(res.items))
      .finally(() => setEventsLoading(false))
      .catch(nmxToast.error)
  }, [])

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchStats()
      fetchRules()
      fetchSettings()
      fetchEvents()
    }, 0)
    return () => clearTimeout(timeout)
  }, [fetchStats, fetchRules, fetchSettings, fetchEvents])

  const handleToggleFirewall = useCallback(
    (firewallEnabled: boolean) => {
      if (!settings) return
      setSettingsUpdating(true)
      wardenController
        .updateSettings({ firewallEnabled, profile: settings.profile })
        .then(setSettings)
        .catch((err) =>
          nmxToast.error(formatCustomError(t, err, WardenErrorCodes)),
        )
        .finally(() => setSettingsUpdating(false))
    },
    [settings, t],
  )

  const handleProfileChange = useCallback(
    (profile: WdSecurityProfile) => {
      if (!settings) return
      setSettingsUpdating(true)
      wardenController
        .updateSettings({ firewallEnabled: settings.firewallEnabled, profile })
        .then(setSettings)
        .catch((err) =>
          nmxToast.error(formatCustomError(t, err, WardenErrorCodes)),
        )
        .finally(() => setSettingsUpdating(false))
    },
    [settings, t],
  )

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
        .then(fetchStats)
        .catch((err) =>
          nmxToast.error(formatCustomError(t, err, WardenErrorCodes)),
        )
        .finally(() => setSubmitting(false))
    },
    [editing, fetchRules, fetchStats, t],
  )

  const handleToggleRule = useCallback(
    (rule: WdFirewallRule) => {
      wardenController
        .toggleRule(rule.id)
        .then(() => fetchRules())
        .then(fetchStats)
        .catch((err) =>
          nmxToast.error(formatCustomError(t, err, WardenErrorCodes)),
        )
    },
    [fetchRules, fetchStats, t],
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
      .then(fetchStats)
      .catch((err) =>
        nmxToast.error(formatCustomError(t, err, WardenErrorCodes)),
      )
      .finally(() => setDeleting(false))
  }, [deleteTarget, fetchRules, fetchStats, t])

  return (
    <NmxAddonRoot scrolled className="nmx-addon-warden">
      <NmxSettingsCard className="nmx-addon-warden__setting-row">
        <NmxSettingsRow
          label={t(
            settings?.firewallEnabled
              ? "addon.warden.firewallEnabled"
              : "addon.warden.firewallDisabled",
          )}
          description={t("addon.warden.description")}
        >
          <NmxToggle
            checked={settings?.firewallEnabled ?? false}
            onCheckedChanged={handleToggleFirewall}
            disabled={settingsUpdating || !settings}
          />
        </NmxSettingsRow>
      </NmxSettingsCard>

      <WardenStats stats={stats} />

      <NmxSection label={t("addon.warden.profile.title")}>
        <WardenProfile
          value={settings?.profile ?? "medium"}
          onChange={handleProfileChange}
        />
      </NmxSection>

      <WardenRules
        rules={rules}
        loading={rulesLoading}
        onAdd={handleAddRule}
        onEdit={handleEditRule}
        onDelete={setDeleteTarget}
        onToggle={handleToggleRule}
      />

      <NmxSection label={t("addon.warden.log.title")}>
        <WardenBlockLog events={events} loading={eventsLoading} />
      </NmxSection>

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
    </NmxAddonRoot>
  )
}
