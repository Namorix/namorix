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
} from "@namorix/ui"
import { settingsController } from "./settings.controller"
import { useTranslation } from "react-i18next"

export const SettingsSystem: React.FC = () => {
  const { t } = useTranslation()
  const [proxies, setProxies] = useState<string[]>([])
  const [origins, setOrigins] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  const [alert, setAlert] = useState<{
    semantic: NmxSemanticColor
    message?: string
  } | null>(null)

  useEffect(() => {
    Promise.all([
      settingsController.getProxies(),
      settingsController.getOrigins(),
    ]).then(([proxy, origin]) => {
      setProxies(proxy)
      setOrigins(origin)
    })
  }, [])

  const handleSave = async (e: NmxFormSubmitEvent) => {
    e.preventDefault()
    setAlert(null)
    setBusy(true)

    const [okProxy, okOrigin] = await Promise.all([
      settingsController.setProxies(proxies),
      settingsController.setOrigins(origins),
    ])

    if (!okProxy) setProxies(await settingsController.getProxies())
    if (!okOrigin) setOrigins(await settingsController.getOrigins())

    setAlert({
      semantic: okProxy && okOrigin ? "success" : "error",
      message: okProxy && okOrigin ? "Saved" : "Failed",
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
