import React from "react"
import { useTranslation } from "react-i18next"

export const NetworkTrafficThreats: React.FC = () => {
  const { t } = useTranslation()
  return (
    <div className="nmx-addon__toolbar-content__placeholder">
      {t("addon.networkTraffic.threats.placeholder")}
    </div>
  )
}
