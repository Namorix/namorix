import { ThemeRoutes } from "../apiRoutes"
import {
  NMX_THEME_CSS_ID,
  NMX_THEME_CSS_PATH_KEY,
  NMX_THEME_STORAGE_KEY,
} from "../constants"
import { sanitizePathSegment } from "../utils"
import type { AppearanceSettings } from "../types"

function appendStylesheet(
  id: string,
  path: string,
  callback?: (element: HTMLLinkElement) => void,
) {
  const safeSaveId = sanitizePathSegment(id)
  const safeSavePath = sanitizePathSegment(path)

  const link = document.createElement("link")
  link.id = NMX_THEME_CSS_ID
  link.rel = "stylesheet"
  link.href = ThemeRoutes.themes
    .replace("{id}", safeSaveId)
    .replace("{path}", safeSavePath)
  callback?.(link)
  document.head.appendChild(link)
}

export function restoreTheme(): void {
  const saveId = localStorage.getItem(NMX_THEME_STORAGE_KEY)
  const savePath = localStorage.getItem(NMX_THEME_CSS_PATH_KEY)
  if (!saveId || !savePath) {
    return
  }
  appendStylesheet(saveId, savePath)
}

export async function loadTheme(cssId: string, cssPath: string): Promise<void> {
  document.querySelector(`#${NMX_THEME_CSS_ID}`)?.remove()
  return new Promise((resolve, reject) => {
    appendStylesheet(cssId, cssPath, (element: HTMLLinkElement) => {
      element.onload = () => resolve()
      element.onerror = () => reject()
    })
  })
}

export function applyTheme(themeId: string): Promise<void> {
  const cssUrl = ThemeRoutes.themes
    .replace("{id}", themeId)
    .replace("{path}", themeId)
  return loadTheme(themeId, cssUrl)
}

export function applyAppearanceTokens(settings: AppearanceSettings) {
  const root = document.documentElement

  if (settings.appearance_accent_color !== "default") {
    root.style.setProperty(
      "--nmx-color-primary",
      `var(--nmx-accent-color-${settings.appearance_accent_color})`,
    )
  }

  root.style.setProperty(
    "--nmx-spacing-unit",
    `var(--nmx-spacing-unit-${settings.appearance_density})`,
  )

  root.style.setProperty(
    "--nmx-font-sans",
    `var(--nmx-font-family-${settings.appearance_font_family})`,
  )

  root.style.setProperty(
    "--nmx-font-size-unit",
    `var(--nmx-font-size-unit-${settings.appearance_font_size})`,
  )
}
