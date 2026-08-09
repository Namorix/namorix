import React, { useCallback, useEffect, useState } from "react"
import {
  WardenErrorCodes,
  type WdSecurityProfile,
  type WdSettings,
  type WdStats,
} from "./Warden.types"
import { wardenController } from "./warden.controller"
import { formatCustomError, nmxToast } from "@namorix/core"
import { useTranslation } from "react-i18next"
import {
  NmxGrid,
  NmxIconFontSymbol,
  NmxSegmentedGroup,
  NmxSettingsCard,
  NmxSettingsRow,
  NmxSettingsSection,
  NmxSettingsWrap,
  NmxStatCard,
  NmxToggle,
} from "@namorix/ui"

const ProfileOptions: WdSecurityProfile[] = ["low", "medium", "high", "custom"]

export const WardenOverview: React.FC = () => {
  const { t } = useTranslation()
  const [stats, setStats] = useState<WdStats | null>(null)
  const [settingsUpdating, setSettingsUpdating] = useState(false)
  const [settings, setSettings] = useState<WdSettings | null>(null)

  const fetchStats = useCallback(() => {
    wardenController.getStats().then(setStats).catch(nmxToast.error)
  }, [])

  const fetchSettings = useCallback(() => {
    wardenController.getSettings().then(setSettings).catch(nmxToast.error)
  }, [])

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchStats()
      fetchSettings()
    }, 0)
    return () => clearTimeout(timeout)
  }, [fetchSettings, fetchStats])

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

  return (
    <div className="nmx-addon-warden__page nmx-addon-warden__overview">
      <NmxSettingsWrap>
        <NmxSettingsSection>
          <NmxSettingsCard>
            <NmxSettingsRow
              label={t(
                settings?.firewallEnabled
                  ? "addon.warden.pages.overview.fields.firewallEnabled"
                  : "addon.warden.overview.fields.firewallDisabled",
              )}
              description={t(
                "addon.warden.pages.overview.fields.firewallDescription",
              )}
            >
              <NmxToggle
                checked={settings?.firewallEnabled ?? false}
                onCheckedChanged={handleToggleFirewall}
                disabled={settingsUpdating || !settings}
              />
            </NmxSettingsRow>
          </NmxSettingsCard>
        </NmxSettingsSection>

        <NmxSettingsSection title={t("addon.warden.pages.overview.stats")}>
          <NmxGrid cols={3}>
            <NmxStatCard
              icon={NmxIconFontSymbol.SECURITY}
              label={t("addon.warden.pages.overview.fields.activeRules")}
              value={stats?.activeRules ?? null}
            />
            <NmxStatCard
              icon={NmxIconFontSymbol.ERROR}
              semantic="error"
              label={t("addon.warden.pages.overview.fields.blockedToday")}
              value={stats?.blockedToday ?? null}
            />
            <NmxStatCard
              icon={NmxIconFontSymbol.NETWORK}
              label={t("addon.warden.pages.overview.fields.openPorts")}
              value={stats?.openPorts ?? null}
            />
          </NmxGrid>
        </NmxSettingsSection>

        <NmxSettingsSection
          title={t("addon.warden.pages.overview.fields.profile")}
        >
          <NmxSegmentedGroup<WdSecurityProfile>
            value={settings?.profile ?? "medium"}
            onChange={handleProfileChange}
            options={ProfileOptions.map((p) => ({
              value: p,
              label: t(`addon.warden.pages.overview.profileOptions.${p}`),
            }))}
          />
        </NmxSettingsSection>
      </NmxSettingsWrap>
    </div>
  )
}
