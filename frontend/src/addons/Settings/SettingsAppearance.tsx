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

export const SettingsAppearance: React.FC = () => {
  const [themes, setThemes] = useState<ThemeManifest[]>([])
  const currentId = useThemeStore()

  useEffect(() => {
    getAllThemes()
      .then(setThemes)
      .catch(() => {})
  }, [])

  const handleSelect = async (id: string) => {
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
    <div className="nmx-addon-form__content nmx-addon-setting__appearance">
      <div className="nmx-addon-setting__theme-list">
        {themes.map((theme) => (
          <button
            key={theme.id}
            className={`nmx-addon-setting__theme-item${
              currentId === theme.id
                ? " nmx-addon-setting__theme-item--active"
                : ""
            }`}
            onClick={() => handleSelect(theme.id)}
          >
            <span>{theme.name}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
