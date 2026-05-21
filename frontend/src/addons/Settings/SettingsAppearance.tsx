import React, { useEffect, useState } from "react"
import {
  getAllThemes,
  getApiBaseUrl,
  http,
  ApiUserRoutes,
  type ThemeManifest,
  useThemeStore,
  loadTheme,
  themeStore,
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
    const res = await http
      .url(getApiBaseUrl() + ApiUserRoutes.theme)
      .put({ themeId: id })
      .json()
    if (!res.success) return
    await loadTheme(manifest.id, manifest.cssPath)
    themeStore.set(id, manifest.cssPath)
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
