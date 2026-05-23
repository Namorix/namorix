import React from "react"
import { useTranslation } from "react-i18next"
import { NmxAddonPage } from "@namorix/ui"

export const NetworkTrafficThreats: React.FC = () => {
  const { t } = useTranslation()
  return (
    <NmxAddonPage className="nmx-addon__placeholder">
      {t("addon.networkTraffic.threats.placeholder")}
    </NmxAddonPage>
  )
}
