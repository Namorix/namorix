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
  const [heartbeat, setHeartbeat] = useState("1")
  const [ipService, setIpService] = useState("auto")
  const [ipv6, setIpv6] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    beaconController
      .getSettings()
      .then((s) => {
        setInterval(String(s.checkIntervalMinutes || 15))
        setHeartbeat(String(s.heartbeatIntervalHours || 1))
        setIpService(s.ipDetectionService)
        setIpv6(s.updateIpv6)
      })
      .catch(() =>
        nmxToast.error(t("addon.beacon.settings.feedback.saveError")),
      )
  }, [t])

  const handleSave = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault()
      setBusy(true)
      try {
        await beaconController.updateSettings({
          checkIntervalMinutes: parseInt(interval, 10),
          heartbeatIntervalHours: parseInt(heartbeat, 10),
          ipDetectionService: ipService,
          updateIpv6: ipv6,
        })
        nmxToast.success(t("addon.beacon.settings.feedback.saveSuccess"))
      } catch {
        nmxToast.error(t("addon.beacon.settings.feedback.saveError"))
      }
      setBusy(false)
    },
    [heartbeat, interval, ipService, ipv6, t],
  )

  const intervalOptions: NmxSelectData[] = [
    { value: "5", label: t("addon.beacon.settings.interval5m") },
    { value: "15", label: t("addon.beacon.settings.interval15m") },
    { value: "30", label: t("addon.beacon.settings.interval30m") },
    { value: "45", label: t("addon.beacon.settings.interval45m") },
    { value: "60", label: t("addon.beacon.settings.interval60m") },
    { value: "90", label: t("addon.beacon.settings.interval90m") },
  ]

  const heartbeatOptions: NmxSelectData[] = [
    { value: "1", label: t("addon.beacon.settings.heartbeat1h") },
    { value: "3", label: t("addon.beacon.settings.heartbeat3h") },
    { value: "6", label: t("addon.beacon.settings.heartbeat6h") },
    { value: "12", label: t("addon.beacon.settings.heartbeat12h") },
    { value: "24", label: t("addon.beacon.settings.heartbeat24h") },
  ]

  const ipOptions: NmxSelectData[] = [
    { value: "auto", label: t("addon.beacon.settings.ipAuto") },
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
            label={t("addon.beacon.settings.heartbeatInterval")}
            description={t("addon.beacon.settings.heartbeatIntervalHint")}
          >
            <NmxSelect
              value={heartbeat}
              options={heartbeatOptions}
              onChange={setHeartbeat}
            />
          </NmxSettingsRow>
          <NmxSettingsRow
            label={t("addon.beacon.settings.ipDetection")}
            description={t("addon.beacon.settings.ipDetectionHint")}
          >
            <NmxSelect
              value={ipService}
              onChange={setIpService}
              options={ipOptions}
            />
          </NmxSettingsRow>
          <NmxSettingsRow
            label={t("addon.beacon.settings.updateIpv6")}
            description={t("addon.beacon.settings.updateIpv6Hint")}
          >
            <NmxToggle checked={ipv6} onCheckedChanged={setIpv6} />
          </NmxSettingsRow>{" "}
        </NmxSettingsCard>
      </NmxSettingsSection>
      <NmxSettingsSection>
        <NmxButton
          onClick={handleSave}
          disabled={busy}
          label={t("addon.beacon.settings.save")}
          uppercase
          fullWidth
        />
      </NmxSettingsSection>
    </>
  )
}
