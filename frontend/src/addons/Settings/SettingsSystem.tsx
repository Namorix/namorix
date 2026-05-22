import React, { useEffect, useState } from "react"
import {
  NmxButton,
  NmxForm,
  NmxFormActions,
  NmxFormField,
  type NmxFormSubmitEvent,
  NmxInlineAlert,
  type NmxSemanticColor,
  NmxTagInput,
  NmxToggle,
} from "@namorix/ui"
import { settingsController } from "./settings.controller"
import { useTranslation } from "react-i18next"

export const SettingsSystem: React.FC = () => {
  const { t } = useTranslation()
  const [proxies, setProxies] = useState<string[]>([])
  const [origins, setOrigins] = useState<string[]>([])
  const [registerEnabled, setRegisterEnabled] = useState(false)
  const [busy, setBusy] = useState(false)
  const [alert, setAlert] = useState<{
    semantic: NmxSemanticColor
    message?: string
  } | null>(null)

  useEffect(() => {
    settingsController.getAll().then((data) => {
      setProxies(data.proxies)
      setOrigins(data.origins)
      setRegisterEnabled(data.registerEnabled)
      console.log("Data", data)
    })
  }, [])

  const handleSave = async (e: NmxFormSubmitEvent) => {
    e.preventDefault()
    setAlert(null)
    setBusy(true)

    const ok = await settingsController.setAll({
      proxies,
      origins,
      registerEnabled,
    })

    if (!ok) {
      const data = await settingsController.getAll()
      setProxies(data.proxies)
      setOrigins(data.origins)
      setRegisterEnabled(data.registerEnabled)
      console.log(data)
    }

    setAlert({
      semantic: ok ? "success" : "error",
      message: ok
        ? t("addon.settings.system.saved")
        : t("addon.settings.system.saveFailed"),
    })

    setBusy(false)
  }

  return (
    <div className="nmx-addon-form__content nmx-addon-setting__appearance">
      <NmxForm onSubmit={handleSave}>
        <NmxInlineAlert
          semantic={alert?.semantic}
          message={alert?.message}
          shouldRender={!!alert}
        />
        <NmxFormField label={t("addon.settings.system.proxies")}>
          <NmxTagInput
            value={proxies}
            onChange={setProxies}
            placeholder="e.g. 10.0.0.0/8"
          />
        </NmxFormField>
        <NmxFormField label={t("addon.settings.system.origins")}>
          <NmxTagInput
            value={origins}
            onChange={setOrigins}
            placeholder="e.g. https://example.com"
          />
        </NmxFormField>
        <NmxToggle
          label={t("addon.settings.system.registerEnabled")}
          checked={registerEnabled}
          onCheckedChanged={setRegisterEnabled}
        />
        <NmxFormActions>
          <NmxButton
            type="submit"
            disabled={busy}
            uppercase
            fullWidth
            label={t("addon.settings.save")}
          />
        </NmxFormActions>
      </NmxForm>
    </div>
  )
}
