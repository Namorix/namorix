import React, { useEffect, useState } from "react"
import {
  NmxButton,
  NmxSettingsCard,
  NmxSettingsRow,
  NmxSettingsSection,
  NmxTagInput,
  NmxToggle,
} from "@namorix/ui"
import { settingsController } from "./settings.controller"
import { useTranslation } from "react-i18next"
import { nmxToast } from "@namorix/core"

export const SettingsSystem: React.FC = () => {
  const { t } = useTranslation()
  const [proxies, setProxies] = useState<string[]>([])
  const [origins, setOrigins] = useState<string[]>([])
  const [registerEnabled, setRegisterEnabled] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    settingsController.getSystem().then((data) => {
      setProxies(data.proxies)
      setOrigins(data.origins)
      setRegisterEnabled(data.registerEnabled)
    })
  }, [])

  const handleSave = async (e: React.MouseEvent) => {
    e.preventDefault()
    setBusy(true)

    const ok = await settingsController.setSystem({
      proxies,
      origins,
      registerEnabled,
    })

    if (!ok) {
      const data = await settingsController.getSystem()
      setProxies(data.proxies)
      setOrigins(data.origins)
      setRegisterEnabled(data.registerEnabled)
      nmxToast.error(t("addon.settings.system.saveFailed"))
    } else {
      nmxToast.success(t("addon.settings.system.saved"))
    }

    setBusy(false)
  }

  return (
    <>
      <NmxSettingsSection title={t("addon.settings.system.proxySection")}>
        <NmxSettingsCard>
          <NmxSettingsRow
            label={t("addon.settings.system.proxies")}
            description={t("addon.settings.system.proxiesDesc")}
          >
            <NmxTagInput
              value={proxies}
              onChange={setProxies}
              placeholder="e.g. 10.0.0.0/8"
            />
          </NmxSettingsRow>
          <NmxSettingsRow
            label={t("addon.settings.system.origins")}
            description={t("addon.settings.system.originsDesc")}
          >
            <NmxTagInput
              value={origins}
              onChange={setOrigins}
              placeholder="e.g. https://example.com"
            />
          </NmxSettingsRow>
        </NmxSettingsCard>
      </NmxSettingsSection>
      <NmxSettingsSection
        title={t("addon.settings.system.registrationSection")}
      >
        <NmxSettingsCard>
          <NmxSettingsRow
            label={t("addon.settings.system.registerEnabled")}
            description={t("addon.settings.system.registerEnabledDesc")}
          >
            <NmxToggle
              checked={registerEnabled}
              onCheckedChanged={setRegisterEnabled}
            />
          </NmxSettingsRow>
        </NmxSettingsCard>
      </NmxSettingsSection>
      <NmxSettingsSection>
        <NmxButton
          onClick={handleSave}
          disabled={busy}
          label={t("addon.settings.save")}
          uppercase
          fullWidth
        />
      </NmxSettingsSection>
    </>
  )
}
