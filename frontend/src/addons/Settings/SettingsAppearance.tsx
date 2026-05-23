import React, { useState } from "react"
import { useTranslation } from "react-i18next"
import {
  type NmxAccentColorData,
  NmxAccentColorPicker,
  NmxSegmentedGroup,
  type NmxSegmentedGroupData,
  NmxSelect,
  type NmxSelectData,
  NmxSettingsCard,
  NmxSettingsRow,
  NmxSettingsSection,
  NmxToggle,
} from "@namorix/ui"
import { NmxAddonPage } from "@namorix/ui"

const ACCENT_COLORS: NmxAccentColorData[] = [
  { id: "blue", color: "#378ADD" },
  { id: "green", color: "#1D9E75" },
  { id: "purple", color: "#7F77DD" },
  { id: "orange", color: "#D85A30" },
  { id: "pink", color: "#D4537E" },
]

const FONT_OPTIONS: NmxSelectData[] = [
  { value: "Inter", label: "Inter" },
  { value: "Geist", label: "Geist" },
  { value: "JetBrains Mono", label: "JetBrains Mono" },
  { value: "system", label: "System default" },
]

const DENSITY_OPTIONS: NmxSegmentedGroupData<string>[] = [
  { value: "compact", label: "Compact" },
  { value: "default", label: "Default" },
  { value: "spacious", label: "Spacious" },
]

const FONT_SIZE_OPTIONS = [
  { value: "sm", label: "Aa" },
  { value: "md", label: "Aa" },
  { value: "lg", label: "Aa" },
]

const LANG_OPTIONS: NmxSelectData[] = [
  { value: "en", label: "English" },
  { value: "vi", label: "Tiếng Việt" },
]

const DATE_OPTIONS: NmxSelectData[] = [
  { value: "DD/MM/YYYY", label: "DD/MM/YYYY" },
  { value: "MM/DD/YYYY", label: "MM/DD/YYYY" },
  { value: "YYYY-MM-DD", label: "YYYY-MM-DD" },
]

const THEMES: NmxSelectData[] = [{ value: "dark", label: "Dark" }]

export const SettingsAppearance: React.FC = () => {
  const { t } = useTranslation()
  const [collapsedDefault, setCollapsedDefault] = useState(false)
  const [density, setDensity] = useState("default")
  const [fontFamily, setFontFamily] = useState("Inter")
  const [fontSize, setFontSize] = useState("md")
  const [accentColor, setAccentColor] = useState("blue")

  return (
    <NmxAddonPage className="nmx-addon-setting__appearance">
      <NmxSettingsSection title={t("addon.settings.appearance.theme")}>
        <NmxSettingsCard>
          <NmxSettingsRow
            label={t("addon.settings.appearance.theme")}
            description={t("addon.settings.appearance.themeDesc")}
          >
            <NmxSelect defaultValue="en" options={THEMES} />
          </NmxSettingsRow>
          <NmxSettingsRow
            label={t("addon.settings.appearance.accentColor")}
            description={t("addon.settings.appearance.accentColorDesc")}
          >
            <NmxAccentColorPicker
              colors={ACCENT_COLORS}
              value={accentColor}
              onChange={setAccentColor}
            />
          </NmxSettingsRow>
        </NmxSettingsCard>
      </NmxSettingsSection>

      <NmxSettingsSection title={t("addon.settings.appearance.layout")}>
        <NmxSettingsCard>
          <NmxSettingsRow
            label={t("addon.settings.appearance.collapsedByDefault")}
            description={t("addon.settings.appearance.collapsedByDefaultDesc")}
          >
            <NmxToggle
              checked={collapsedDefault}
              onCheckedChanged={setCollapsedDefault}
            />
          </NmxSettingsRow>
          <NmxSettingsRow
            label={t("addon.settings.appearance.density")}
            description={t("addon.settings.appearance.densityDesc")}
          >
            <NmxSegmentedGroup
              value={density}
              options={DENSITY_OPTIONS}
              onChange={setDensity}
            />
          </NmxSettingsRow>
        </NmxSettingsCard>
      </NmxSettingsSection>

      <NmxSettingsSection title={t("addon.settings.appearance.typography")}>
        <NmxSettingsCard>
          <NmxSettingsRow
            label={t("addon.settings.appearance.fontFamily")}
            description={t("addon.settings.appearance.fontFamilyDesc")}
          >
            <NmxSelect
              value={fontFamily}
              options={FONT_OPTIONS}
              onChange={setFontFamily}
            />
          </NmxSettingsRow>
          <NmxSettingsRow
            label={t("addon.settings.appearance.fontSize")}
            description={t("addon.settings.appearance.fontSizeDesc")}
          >
            <NmxSegmentedGroup
              value={fontSize}
              options={FONT_SIZE_OPTIONS}
              onChange={setFontSize}
            />
          </NmxSettingsRow>
        </NmxSettingsCard>
      </NmxSettingsSection>

      <NmxSettingsSection title={t("addon.settings.appearance.languageRegion")}>
        <NmxSettingsCard>
          <NmxSettingsRow
            label={t("addon.settings.appearance.language")}
            description={t("addon.settings.appearance.languageDesc")}
          >
            <NmxSelect defaultValue="en" options={LANG_OPTIONS} />
          </NmxSettingsRow>
          <NmxSettingsRow
            label={t("addon.settings.appearance.dateFormat")}
            description={t("addon.settings.appearance.dateFormatDesc")}
          >
            <NmxSelect defaultValue="DD/MM/YYYY" options={DATE_OPTIONS} />
          </NmxSettingsRow>
        </NmxSettingsCard>
      </NmxSettingsSection>
    </NmxAddonPage>
  )
}
