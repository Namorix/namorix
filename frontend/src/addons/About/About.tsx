import React from "react"
import {
  NmxIconSvg,
  NmxIconSvgSymbol,
  NmxMetaList,
  NmxMetaItem,
  NmxButton,
  NmxAddonRoot,
} from "@namorix/ui"
import { useTranslation } from "react-i18next"
import { NMX_NAME } from "@namorix/core"

declare const __APP_VERSION__: string
declare const __CORE_VERSION__: string
declare const __STYLES_VERSION__: string
declare const __UI_VERSION__: string
declare const __BACKEND_CORE_VERSION__: string
declare const __BACKEND_SERVER_VERSION__: string

export const About: React.FC = () => {
  const { t } = useTranslation()

  return (
    <NmxAddonRoot className="nmx-addon-about-wrap">
      <div className="nmx-addon-about">
        <div className="nmx-addon-about__header">
          <NmxIconSvg
            symbol={NmxIconSvgSymbol.LOGO}
            className="nmx-addon-about__logo"
          />
          <div className="nmx-addon-about__name">{NMX_NAME}</div>
          <div className="nmx-addon-about__version">
            {t("addon.about.version")} {__APP_VERSION__}
          </div>
        </div>

        <p className="nmx-addon-about__information">
          {t("addon.about.information")}
        </p>

        <div className="nmx-addon-about__divider" />

        <NmxMetaList className="nmx-addon-about__meta-list">
          <NmxMetaItem
            label={t("addon.about.meta.author")}
            value="IzeroCs"
            className="nmx-addon-about__meta-item"
            alignValue="end"
          />
          <NmxMetaItem
            label={t("addon.about.meta.license")}
            value="AGPL-3.0"
            className="nmx-addon-about__meta-item"
            alignValue="end"
          />
          <NmxMetaItem
            label={t("addon.about.meta.stack")}
            value="React · .NET 10 · SQLite"
            className="nmx-addon-about__meta-item"
            alignValue="end"
          />
        </NmxMetaList>

        <div className="nmx-addon-about__divider" />

        <NmxMetaList className="nmx-addon-about__meta-list">
          <NmxMetaItem
            label="Namorix.Core"
            value={__BACKEND_CORE_VERSION__}
            className="nmx-addon-about__meta-item"
            alignValue="end"
          />
          <NmxMetaItem
            label="Namorix.Server"
            value={__BACKEND_SERVER_VERSION__}
            className="nmx-addon-about__meta-item"
            alignValue="end"
          />
        </NmxMetaList>

        <div className="nmx-addon-about__divider" />

        <NmxMetaList className="nmx-addon-about__meta-list">
          <NmxMetaItem
            label="@namorix/core"
            value={__CORE_VERSION__}
            className="nmx-addon-about__meta-item"
            alignValue="end"
          />
          <NmxMetaItem
            label="@namorix/styles"
            value={__STYLES_VERSION__}
            className="nmx-addon-about__meta-item"
            alignValue="end"
          />
          <NmxMetaItem
            label="@namorix/ui"
            value={__UI_VERSION__}
            className="nmx-addon-about__meta-item"
            alignValue="end"
          />
        </NmxMetaList>

        <div className="nmx-addon-about__links">
          <NmxButton
            variant="outline"
            fullWidth
            onClick={() =>
              window.open("https://github.com/Namorix/namorix", "_blank")
            }
            className="nmx-addon-about__button"
          >
            {t("addon.about.links.github")}
          </NmxButton>
          <NmxButton
            variant="outline"
            fullWidth
            onClick={() =>
              window.open("https://github.com/Namorix/namorix/issues", "_blank")
            }
            className="nmx-addon-about__button"
          >
            {t("addon.about.links.issues")}
          </NmxButton>
        </div>

        <div className="nmx-addon-about__copyright">© 2026 IzeroCs</div>
      </div>
    </NmxAddonRoot>
  )
}
