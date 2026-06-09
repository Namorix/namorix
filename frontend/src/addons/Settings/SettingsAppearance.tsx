import React, { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import {
  NmxAccentColorPicker,
  NmxAlertDialog,
  NmxButton,
  NmxIconFontSymbol,
  NmxSegmentedGroup,
  NmxSelect,
  type NmxSelectData,
  type NmxSemanticColor,
  NmxSettingsCard,
  NmxSettingsRow,
  NmxSettingsSection,
  NmxToggle,
} from "@namorix/ui"
import {
  type AppearanceOptionsResponse,
  settingsController,
} from "./settings.controller"
import { UserRole, useUserStore } from "@namorix/core"

const THEMES: NmxSelectData[] = [{ value: "dark", label: "Dark" }]

export const SettingsAppearance: React.FC = () => {
  const { t } = useTranslation()
  const [options, setOptions] = useState<AppearanceOptionsResponse | null>(null)
  const [collapsedDefault, setCollapsedDefault] = useState(false)
  const [density, setDensity] = useState("default")
  const [fontFamily, setFontFamily] = useState("Inter")
  const [fontSize, setFontSize] = useState("md")
  const [accentColor, setAccentColor] = useState("blue")
  const [busy, setBusy] = useState(false)
  const [alert, setAlert] = useState<{
    semantic: NmxSemanticColor
    message?: string
  } | null>(null)

  const user = useUserStore()
  const isAdmin = user?.role === UserRole.Admin
  const [saveAsDefault, setSaveAsDefault] = useState(false)

  const [dialogOpen, setDialogOpen] = useState(false)
  const handleSaveClick = () => setDialogOpen(true)

  const handleConfirm = async () => {
    setDialogOpen(false)
  }

  useEffect(() => {
    settingsController.getAppearanceOptions().then(setOptions)
  }, [])

  const densityIconMap : Record<string, NmxIconFontSymbol> = {
    compact: NmxIconFontSymbol.DENSITY_COMPACT,
    default: NmxIconFontSymbol.DENSITY_DEFAULT,
    spacious: NmxIconFontSymbol.DENSITY_SPACIOUS
  }

  const fontSizeValueMap: Record<string, string> = {
    sm: "--nmx-font-size-preview-sm",
    md: "--nmx-font-size-preview-md",
    lg: "--nmx-font-size-preview-lg",
  }

  const accentColors = options?.accentColors ?? []
  const fontFamilies = options?.fontFamilies ?? []
  const fontSizes = options?.fontSizes ?? []
  const languages = options?.languages ?? []
  const dateFormats = options?.dateFormats ?? []
  const densities = (options?.densities ?? []).map(d => ({
    ...d, label: "", icon: densityIconMap[d.value]
  }))

  return (
    <>
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
              colors={accentColors}
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
              options={densities}
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
              options={fontFamilies}
              onChange={setFontFamily}
            />
          </NmxSettingsRow>
          <NmxSettingsRow
            label={t("addon.settings.appearance.fontSize")}
            description={t("addon.settings.appearance.fontSizeDesc")}
          >
            <NmxSegmentedGroup
              value={fontSize}
              options={fontSizes}
              onChange={setFontSize}
              renderItem={(opt) => (
                <span
                  style={{
                    fontSize: `var(${fontSizeValueMap[opt.value]})`,
                    lineHeight: 1,
                  }}
                >
                  {opt.label}
                </span>
              )}
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
            <NmxSelect defaultValue="en" options={languages} />
          </NmxSettingsRow>
          <NmxSettingsRow
            label={t("addon.settings.appearance.dateFormat")}
            description={t("addon.settings.appearance.dateFormatDesc")}
          >
            <NmxSelect defaultValue="DD/MM/YYYY" options={dateFormats} />
          </NmxSettingsRow>
        </NmxSettingsCard>
      </NmxSettingsSection>
      <NmxSettingsSection className="nmx-settings-section__horizontal">
        {isAdmin && (
          <>
            <NmxButton
              disabled={busy}
              label={t("addon.settings.saveForMySelf")}
              uppercase
              fullWidth
            />
            <NmxButton
              disabled={busy}
              label={t("addon.settings.saveAsSystemDefault")}
              semantic="error"
              uppercase
              fullWidth
              onClick={() => setDialogOpen(true)}
            />
          </>
        )}
        {!isAdmin && (
          <NmxButton
            disabled={busy}
            label={t("addon.settings.save")}
            uppercase
            fullWidth
          />
        )}
      </NmxSettingsSection>
      <NmxAlertDialog
        open={dialogOpen}
        title={t("addon.settings.appearance.dialogConfirmSaveTitle")}
        description={t(
          "addon.settings.appearance.dialogConfirmSaveDescription",
        )}
        confirmLabel={t("addon.settings.save")}
        onConfirm={handleConfirm}
        onCancel={() => setDialogOpen(false)}
        loading={busy}
      />
    </>
  )
}
