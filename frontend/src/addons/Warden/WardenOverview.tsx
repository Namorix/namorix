import React, { useCallback, useEffect, useRef, useState } from "react"
import {
  WardenErrorCodes,
  type WdSecurityProfile,
  type WdSettings,
  type WdStats,
} from "./Warden.types"
import { wardenController, type WdSettingsPayload } from "./warden.controller"
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
  NmxSlider,
  NmxStatCard,
  NmxToggle,
} from "@namorix/ui"
import {
  ServerSignalREvent,
  ServerSignalRGroups,
  useServerSignalREvent,
  useServerSignalRGroup,
} from "../../signalr"

const ProfileOptions: WdSecurityProfile[] = ["low", "medium", "high", "custom"]

export const WardenOverview: React.FC = () => {
  const { t } = useTranslation()
  const [stats, setStats] = useState<WdStats | null>(null)
  const [settingsUpdating, setSettingsUpdating] = useState(false)
  const [settings, setSettings] = useState<WdSettings | null>(null)
  const [factorValues, setFactorValues] = useState({
    customThresholdFactor: 1,
    customDurationFactor: 1,
  })
  const sliderTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchStats = useCallback(() => {
    wardenController.getStats().then(setStats).catch(nmxToast.error)
  }, [])

  const fetchSettings = useCallback(() => {
    wardenController.getSettings().then(setSettings).catch(nmxToast.error)
  }, [])

  useEffect(() => {
    if (!settings) return
    const timeout = setTimeout(() => {
      setFactorValues({
        customThresholdFactor: settings.customThresholdFactor,
        customDurationFactor: settings.customDurationFactor,
      })
    }, 0)
    return () => clearTimeout(timeout)
  }, [settings])

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchStats()
      fetchSettings()
    }, 0)
    return () => clearTimeout(timeout)
  }, [fetchSettings, fetchStats])

  useEffect(() => {
    const id = setInterval(fetchStats, 30_000)
    return () => clearInterval(id)
  }, [fetchStats])

  useServerSignalRGroup(ServerSignalRGroups.Warden, true)
  useServerSignalREvent(ServerSignalREvent.WardenNewEvent, fetchStats)

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

  const persistSettings = useCallback(
    (patch: Partial<WdSettingsPayload>) => {
      if (!settings) return
      setSettingsUpdating(true)
      wardenController
        .updateSettings({
          firewallEnabled: settings.firewallEnabled,
          profile: settings.profile,
          customThresholdFactor: settings.customThresholdFactor,
          customDurationFactor: settings.customDurationFactor,
          ...patch,
        })
        .then(setSettings)
        .catch((err) =>
          nmxToast.error(formatCustomError(t, err, WardenErrorCodes)),
        )
        .finally(() => setSettingsUpdating(false))
    },
    [settings, t],
  )

  const handleFactorChange = useCallback(
    (field: "customThresholdFactor" | "customDurationFactor") =>
      (value: number) => {
        setFactorValues((prev) => ({ ...prev, [field]: value }))
        if (sliderTimer.current) clearTimeout(sliderTimer.current)
        sliderTimer.current = setTimeout(
          () => persistSettings({ [field]: value }),
          600,
        )
      },
    [persistSettings],
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
          <NmxGrid cols={4}>
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
              icon={NmxIconFontSymbol.ACTIVITY}
              label={t("addon.warden.pages.overview.fields.totalEvents")}
              value={stats?.totalEvents ?? null}
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

          {settings?.profile === "custom" && (
            <NmxSettingsWrap className="nmx-addon-warden__custom-factors">
              <NmxSettingsRow
                label={t(
                  "addon.warden.pages.overview.fields.customThresholdFactor",
                )}
                description={t(
                  "addon.warden.pages.overview.fields.customThresholdFactorHint",
                )}
              >
                <NmxSlider
                  value={factorValues.customThresholdFactor}
                  min={0.1}
                  max={3}
                  step={0.1}
                  showValue
                  unit="×"
                  onChange={handleFactorChange("customThresholdFactor")}
                />
              </NmxSettingsRow>
              <NmxSettingsRow
                label={t(
                  "addon.warden.pages.overview.fields.customDurationFactor",
                )}
                description={t(
                  "addon.warden.pages.overview.fields.customDurationFactorHint",
                )}
              >
                <NmxSlider
                  value={factorValues.customDurationFactor}
                  min={0.1}
                  max={3}
                  step={0.1}
                  showValue
                  unit="×"
                  onChange={handleFactorChange("customDurationFactor")}
                />
              </NmxSettingsRow>
            </NmxSettingsWrap>
          )}
        </NmxSettingsSection>
      </NmxSettingsWrap>
    </div>
  )
}
