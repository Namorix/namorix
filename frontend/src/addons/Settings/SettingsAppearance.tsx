import React, { useLayoutEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import {
  NmxAccentColorPicker,
  NmxAlertDialog,
  NmxButton,
  NmxIconFontSymbol,
  NmxSegmentedGroup,
  NmxSelect,
  type NmxSelectData,
  NmxSettingsCard,
  NmxSettingsRow,
  NmxSettingsSection,
  NmxToggle,
} from "@namorix/ui"
import {
  type AppearanceOptionsResponse,
  settingsController,
} from "./settings.controller"
import {
  AppearanceDefaults,
  type AppearanceSettings,
  nmxToast,
  resolveError,
  UserRole,
  useUserStore,
} from "@namorix/core"

const THEMES: NmxSelectData[] = [{ value: "dark", label: "Dark" }]

export const SettingsAppearance: React.FC = () => {
  const { t } = useTranslation()
  const [options, setOptions] = useState<AppearanceOptionsResponse | null>(null)
  const [collapsedDefault, setCollapsedDefault] = useState(false)
  const [theme, setTheme] = useState(AppearanceDefaults.appearance_theme)
  const [density, setDensity] = useState(AppearanceDefaults.appearance_density)
  const [fontFamily, setFontFamily] = useState(
    AppearanceDefaults.appearance_font_family,
  )
  const [fontSize, setFontSize] = useState(
    AppearanceDefaults.appearance_font_size,
  )
  const [accentColor, setAccentColor] = useState(
    AppearanceDefaults.appearance_accent_color!,
  )
  const [language, setLanguage] = useState(
    AppearanceDefaults.appearance_language,
  )
  const [dateFormat, setDateFormat] = useState(
    AppearanceDefaults.appearance_date_format,
  )
  const [busy, setBusy] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)

  const user = useUserStore()
  const isAdmin = user?.role === UserRole.Admin

  useLayoutEffect(() => {
    settingsController.getAppearanceOptions().then(setOptions)
    settingsController.getUserSettings().then((s) => {
      setCollapsedDefault(s.appearance_collapsed === "true")
      setDensity(s.appearance_density ?? AppearanceDefaults.appearance_density)
      setFontFamily(
        s.appearance_font_family ?? AppearanceDefaults.appearance_font_family,
      )
      setFontSize(
        s.appearance_font_size ?? AppearanceDefaults.appearance_font_size,
      )
      setAccentColor(
        s.appearance_accent_color ??
          AppearanceDefaults.appearance_accent_color!,
      )
      setLanguage(
        s.appearance_language ?? AppearanceDefaults.appearance_language,
      )
      setDateFormat(
        s.appearance_date_format ?? AppearanceDefaults.appearance_date_format,
      )
    })
  }, [])

  const densityIconMap: Record<string, NmxIconFontSymbol> = {
    compact: NmxIconFontSymbol.DENSITY_COMPACT,
    default: NmxIconFontSymbol.DENSITY_DEFAULT,
    spacious: NmxIconFontSymbol.DENSITY_SPACIOUS,
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
  const densities = (options?.densities ?? []).map((d) => ({
    ...d,
    label: "",
    icon: densityIconMap[d.value],
  }))

  const buildSettings = (): AppearanceSettings => ({
    appearance_theme: theme,
    appearance_accent_color: accentColor,
    appearance_collapsed: String(collapsedDefault),
    appearance_density: density,
    appearance_font_family: fontFamily,
    appearance_font_size: fontSize,
    appearance_language: language,
    appearance_date_format: dateFormat,
  })

  const handleSaveForMySelf = async () => {
    setBusy(true)
    try {
      await settingsController.saveUserSettings(buildSettings())
      nmxToast.success(t("addon.settings.appearance.saved"))
    } catch (err) {
      nmxToast.error(
        resolveError(t, err, "addon.settings.appearance.saveFailed"),
      )
    }
    setBusy(false)
  }

  const handleSaveAsSystemDefault = async () => {
    setBusy(true)
    try {
      await settingsController.setAppearanceDefaults(buildSettings())
      nmxToast.success(t("addon.settings.appearance.savedAsDefault"))
    } catch (err) {
      nmxToast.error(
        resolveError(t, err, "addon.settings.appearance.saveFailed"),
      )
    }
    setBusy(false)
    setDialogOpen(false)
  }

  return (
    <>
      <NmxSettingsSection title={t("addon.settings.appearance.theme")}>
        <NmxSettingsCard>
          <NmxSettingsRow
            label={t("addon.settings.appearance.theme")}
            description={t("addon.settings.appearance.themeDesc")}
          >
            <NmxSelect value={theme} options={THEMES} onChange={setTheme} />
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
            <NmxSelect
              value={language}
              options={languages}
              onChange={setLanguage}
            />
          </NmxSettingsRow>
          <NmxSettingsRow
            label={t("addon.settings.appearance.dateFormat")}
            description={t("addon.settings.appearance.dateFormatDesc")}
          >
            <NmxSelect
              value={dateFormat}
              options={dateFormats}
              onChange={setDateFormat}
            />
          </NmxSettingsRow>
        </NmxSettingsCard>
      </NmxSettingsSection>
      <NmxSettingsSection className="nmx-settings-section__horizontal">
        {isAdmin && (
          <NmxButton
            disabled={busy}
            label={t("addon.settings.saveAsSystemDefault")}
            semantic="error"
            variant="ghost"
            uppercase
            fullWidth
            onClick={() => setDialogOpen(true)}
          />
        )}
        <NmxButton
          disabled={busy}
          label={t("addon.settings.save")}
          uppercase
          fullWidth
          onClick={handleSaveForMySelf}
        />
      </NmxSettingsSection>
      <NmxAlertDialog
        open={dialogOpen}
        title={t("addon.settings.appearance.dialogConfirmSaveTitle")}
        description={t(
          "addon.settings.appearance.dialogConfirmSaveDescription",
        )}
        confirmLabel={t("addon.settings.save")}
        onConfirm={handleSaveAsSystemDefault}
        onCancel={() => setDialogOpen(false)}
        loading={busy}
      />
    </>
  )
}
