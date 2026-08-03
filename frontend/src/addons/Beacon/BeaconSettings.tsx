import React, { useCallback, useEffect, useState } from "react"
import {
  NmxButton,
  NmxSelect,
  type NmxSelectData,
  NmxSettingsCard,
  NmxSettingsRow,
  NmxSettingsSection,
  NmxToggle,
} from "@namorix/ui"
import { useTranslation } from "react-i18next"
import { nmxToast } from "@namorix/core"
import { beaconController } from "./beacon.controller"

export const BeaconSettings: React.FC = () => {
  const { t } = useTranslation()
  const [interval, setInterval] = useState("15")
  const [ipService, setIpService] = useState("auto")
  const [ipv6, setIpv6] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    beaconController
      .getSettings()
      .then((s) => {
        setInterval(String(s.checkIntervalMinutes))
        setIpService(s.ipDetectionService)
        setIpv6(s.updateIpv6)
      })
      .catch(() => nmxToast.error(t("addon.beacon.settings.saveError")))
  }, [t])

  const handleSave = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault()
      setBusy(true)
      try {
        await beaconController.updateSettings({
          checkIntervalMinutes: parseInt(interval, 10),
          ipDetectionService: ipService,
          updateIpv6: ipv6,
        })
        nmxToast.success(t("addon.beacon.settings.saveSuccess"))
      } catch {
        nmxToast.error(t("addon.beacon.settings.saveError"))
      }
      setBusy(false)
    },
    [interval, ipService, ipv6, t],
  )

  const intervalOptions: NmxSelectData<string>[] = [
    { value: "5", label: t("addon.beacon.settings.interval5m") },
    { value: "15", label: t("addon.beacon.settings.interval15m") },
    { value: "60", label: t("addon.beacon.settings.interval1h") },
  ]

  const ipOptions: NmxSelectData<string>[] = [
    { value: "auto", label: t("addon.beacon.settings.ipAuto") },
    { value: "ifconfig.co", label: t("addon.beacon.settings.ipIfconfig") },
    { value: "ipify.org", label: t("addon.beacon.settings.ipIpify") },
  ]

  return (
    <>
      <NmxSettingsSection>
        <NmxSettingsCard>
          <NmxSettingsRow
            label={t("addon.beacon.settings.checkInterval")}
            description={t("addon.beacon.settings.checkIntervalHint")}
          >
            <NmxSelect
              value={interval}
              options={intervalOptions}
              onChange={setInterval}
            />
          </NmxSettingsRow>
          <NmxSettingsRow
            label={t("addon.beacon.settings.ipDetection")}
            description={t("addon.beacon.settings.ipDetectionHint")}
          >
            <NmxSelect
              value={ipService}
              options={ipOptions}
              onChange={setIpService}
            />
          </NmxSettingsRow>
          <NmxSettingsRow label={t("addon.beacon.settings.updateIpv6")}>
            <NmxToggle checked={ipv6} onCheckedChanged={setIpv6} />
          </NmxSettingsRow>
        </NmxSettingsCard>
      </NmxSettingsSection>
      <NmxButton
        onClick={handleSave}
        disabled={busy}
        label={t("addon.beacon.settings.save")}
        uppercase
        fullWidth
      />
    </>
  )
}
