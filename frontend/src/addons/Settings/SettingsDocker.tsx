import React, { useEffect, useState } from "react"
import {
  NmxButton,
  NmxFormInput,
  NmxSettingsCard,
  NmxSettingsRow,
  NmxSettingsSection,
} from "@namorix/ui"
import { settingsController } from "./settings.controller"
import { useTranslation } from "react-i18next"
import { nmxToast } from "@namorix/core"

export const SettingsDocker: React.FC = () => {
  const { t } = useTranslation()
  const [desktopDomain, setDesktopDomain] = useState("")
  const [containerName, setContainerName] = useState("")
  const [networkName, setNetworkName] = useState("")
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    settingsController.getDocker().then((data) => {
      setDesktopDomain(data.desktopDomain)
      setContainerName(data.containerName)
      setNetworkName(data.networkName)
    })
  }, [])

  const handleSave = async (e: React.MouseEvent) => {
    e.preventDefault()
    setBusy(true)

    const ok = await settingsController.setDocker({
      desktopDomain,
      containerName,
      networkName,
    })

    if (!ok) {
      const data = await settingsController.getDocker()
      setDesktopDomain(data.desktopDomain)
      setContainerName(data.containerName)
      setNetworkName(data.networkName)
      nmxToast.error(t("addon.settings.docker.saveFailed"))
    } else {
      nmxToast.success(t("addon.settings.docker.saved"))
    }

    setBusy(false)
  }

  return (
    <>
      <NmxSettingsSection title={t("addon.settings.docker.section")}>
        <NmxSettingsCard>
          <NmxSettingsRow
            label={t("addon.settings.docker.desktopDomain")}
            description={t("addon.settings.docker.desktopDomainDesc")}
          >
            <NmxFormInput
              type="text"
              value={desktopDomain}
              onValueChange={setDesktopDomain}
              placeholder="http://192.168.1.10:5000"
              disabled={busy}
            />
          </NmxSettingsRow>
          <NmxSettingsRow
            label={t("addon.settings.docker.containerName")}
            description={t("addon.settings.docker.containerNameDesc")}
          >
            <NmxFormInput
              type="text"
              value={containerName}
              onValueChange={setContainerName}
              placeholder="namorix"
              disabled={busy}
            />
          </NmxSettingsRow>
          <NmxSettingsRow
            label={t("addon.settings.docker.networkName")}
            description={t("addon.settings.docker.networkNameDesc")}
          >
            <NmxFormInput
              type="text"
              value={networkName}
              onValueChange={setNetworkName}
              placeholder="namorix_default"
              disabled={busy}
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
