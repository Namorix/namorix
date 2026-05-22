import React, { useEffect, useState } from "react"
import {
  getAllThemes,
  getApiBaseUrl,
  nmxHttp,
  ApiUserRoutes,
  type ThemeManifest,
  useThemeStore,
  loadTheme,
  setThemeStore,
} from "@namorix/core"
import { useTranslation } from "react-i18next"
import { NmxSegmentedGroup, NmxSelect, NmxSlider, NmxToggle } from "@namorix/ui"

const ACCENT_COLORS = [
  { id: "blue", color: "#378ADD" },
  { id: "green", color: "#1D9E75" },
  { id: "purple", color: "#7F77DD" },
  { id: "orange", color: "#D85A30" },
  { id: "pink", color: "#D4537E" },
]
const FONT_OPTIONS = [
  { value: "Inter", label: "Inter" },
  { value: "Geist", label: "Geist" },
  { value: "JetBrains Mono", label: "JetBrains Mono" },
  { value: "system", label: "System default" },
]
const DENSITY_OPTIONS = [
  { value: "compact", label: "Compact" },
  { value: "default", label: "Default" },
  { value: "spacious", label: "Spacious" },
]
const FONT_SIZE_OPTIONS = [
  { value: "sm", label: "Aa" },
  { value: "md", label: "Aa" },
  { value: "lg", label: "Aa" },
]
const LANG_OPTIONS = [
  { value: "en", label: "English" },
  { value: "vi", label: "Tiếng Việt" },
  { value: "ja", label: "日本語" },
  { value: "zh", label: "中文" },
]
const DATE_OPTIONS = [
  { value: "DD/MM/YYYY", label: "DD/MM/YYYY" },
  { value: "MM/DD/YYYY", label: "MM/DD/YYYY" },
  { value: "YYYY-MM-DD", label: "YYYY-MM-DD" },
]
const NUMBER_OPTIONS = [
  { value: "EU", label: "1.000,00 (EU)" },
  { value: "US", label: "1,000.00 (US)" },
]
const THEME_PREVIEWS: Record<string, string> = {
  light: "linear-gradient(135deg, #f5f5f5 50%, #e0e0e0 50%)",
  dark: "linear-gradient(135deg, #1e1e2e 50%, #2a2a3e 50%)",
}
function getThemePreview(id: string): string {
  return THEME_PREVIEWS[id] ?? `var(--nmx-color-surface-mid)`
}

export const SettingsAppearance: React.FC = () => {
  const { t } = useTranslation()
  const [themes, setThemes] = useState<ThemeManifest[]>([])
  const currentId = useThemeStore()
  const [sidebarWidth, setSidebarWidth] = useState(240)
  const [collapsedDefault, setCollapsedDefault] = useState(false)
  const [density, setDensity] = useState("default")
  const [fontFamily, setFontFamily] = useState("Inter")
  const [fontSize, setFontSize] = useState("md")
  const [accentColor, setAccentColor] = useState("blue")
  useEffect(() => {
    getAllThemes()
      .then(setThemes)
      .catch(() => {})
  }, [])
  const handleThemeSelect = async (id: string) => {
    const manifest = themes.find((t) => t.id === id)
    if (!manifest) return
    const res = await nmxHttp
      .url(getApiBaseUrl() + ApiUserRoutes.theme)
      .put({ themeId: id })
      .json()
    if (!res.success) return
    await loadTheme(manifest.id, manifest.cssPath)
    setThemeStore(id, manifest.cssPath)
  }
  return (
    <div className="nmx-addon-setting__appearance">
      {/* Theme */}
      <section className="nmx-addon-setting__section">
        <h3 className="nmx-addon-setting__section-title">
          {t("addon.settings.appearance.theme")}
        </h3>
        <div className="nmx-addon-setting__theme-grid">
          {themes.map((theme) => (
            <button
              key={theme.id}
              className={`nmx-addon-setting__theme-card${
                currentId === theme.id
                  ? " nmx-addon-setting__theme-card--active"
                  : ""
              }`}
              onClick={() => handleThemeSelect(theme.id)}
            >
              <div
                className="nmx-addon-setting__theme-preview"
                style={{ background: getThemePreview(theme.id) }}
              />
              <span className="nmx-addon-setting__theme-name">
                {theme.name}
              </span>
            </button>
          ))}
        </div>
        <div className="nmx-addon-setting__card">
          <div className="nmx-addon-setting__row">
            <div>
              <div className="nmx-addon-setting__row-label">
                {t("addon.settings.appearance.accentColor")}
              </div>
              <div className="nmx-addon-setting__row-desc">
                {t("addon.settings.appearance.accentColorDesc")}
              </div>
            </div>
            <div className="nmx-addon-setting__accent-row">
              {ACCENT_COLORS.map((c) => (
                <div
                  key={c.id}
                  className={`nmx-addon-setting__accent-dot${
                    accentColor === c.id
                      ? " nmx-addon-setting__accent-dot--active"
                      : ""
                  }`}
                  style={{ background: c.color }}
                  onClick={() => setAccentColor(c.id)}
                />
              ))}
            </div>
          </div>
        </div>
      </section>
      {/* Layout */}
      <section className="nmx-addon-setting__section">
        <h3 className="nmx-addon-setting__section-title">
          {t("addon.settings.appearance.layout")}
        </h3>
        <div className="nmx-addon-setting__card">
          <div className="nmx-addon-setting__row">
            <div>
              <div className="nmx-addon-setting__row-label">
                {t("addon.settings.appearance.sidebarWidth")}
              </div>
              <div className="nmx-addon-setting__row-desc">
                {t("addon.settings.appearance.sidebarWidthDesc")}
              </div>
            </div>
            <div style={{ width: 200 }}>
              <NmxSlider
                value={sidebarWidth}
                min={160}
                max={320}
                step={40}
                showValue
                onChange={setSidebarWidth}
              />
            </div>
          </div>
          <div className="nmx-addon-setting__row">
            <div>
              <div className="nmx-addon-setting__row-label">
                {t("addon.settings.appearance.collapsedByDefault")}
              </div>
              <div className="nmx-addon-setting__row-desc">
                {t("addon.settings.appearance.collapsedByDefaultDesc")}
              </div>
            </div>
            <NmxToggle
              checked={collapsedDefault}
              onCheckedChanged={setCollapsedDefault}
            />
          </div>
          <div className="nmx-addon-setting__row">
            <div>
              <div className="nmx-addon-setting__row-label">
                {t("addon.settings.appearance.density")}
              </div>
              <div className="nmx-addon-setting__row-desc">
                {t("addon.settings.appearance.densityDesc")}
              </div>
            </div>
            <div style={{ width: 200 }}>
              <NmxSegmentedGroup
                value={density}
                options={DENSITY_OPTIONS}
                onChange={setDensity}
              />
            </div>
          </div>
        </div>
      </section>
      {/* Typography */}
      <section className="nmx-addon-setting__section">
        <h3 className="nmx-addon-setting__section-title">
          {t("addon.settings.appearance.typography")}
        </h3>
        <div className="nmx-addon-setting__card">
          <div className="nmx-addon-setting__row">
            <div className="nmx-addon-setting__row-label">
              {t("addon.settings.appearance.fontFamily")}
            </div>
            <NmxSelect
              value={fontFamily}
              options={FONT_OPTIONS}
              onChange={setFontFamily}
            />
          </div>
          <div className="nmx-addon-setting__row">
            <div className="nmx-addon-setting__row-label">
              {t("addon.settings.appearance.fontSize")}
            </div>
            <div style={{ width: 140 }}>
              <NmxSegmentedGroup
                value={fontSize}
                options={FONT_SIZE_OPTIONS}
                onChange={setFontSize}
              />
            </div>
          </div>
        </div>
      </section>
      {/* Language & Region */}
      <section className="nmx-addon-setting__section">
        <h3 className="nmx-addon-setting__section-title">
          {t("addon.settings.appearance.languageRegion")}
        </h3>
        <div className="nmx-addon-setting__card">
          <div className="nmx-addon-setting__row">
            <div className="nmx-addon-setting__row-label">
              {t("addon.settings.appearance.language")}
            </div>
            <NmxSelect defaultValue="en" options={LANG_OPTIONS} />
          </div>
          <div className="nmx-addon-setting__row">
            <div className="nmx-addon-setting__row-label">
              {t("addon.settings.appearance.dateFormat")}
            </div>
            <NmxSelect defaultValue="DD/MM/YYYY" options={DATE_OPTIONS} />
          </div>
          <div className="nmx-addon-setting__row">
            <div className="nmx-addon-setting__row-label">
              {t("addon.settings.appearance.numberFormat")}
            </div>
            <NmxSelect defaultValue="EU" options={NUMBER_OPTIONS} />
          </div>
        </div>
      </section>
    </div>
  )
}
