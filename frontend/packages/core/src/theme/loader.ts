import { ThemeRoutes } from "../apiRoutes"
import {
  NMX_THEME_CSS_ID,
  NMX_THEME_CSS_PATH_KEY,
  NMX_THEME_STORAGE_KEY,
} from "../constants"
import { sanitizePath } from "../utils"
import type { AppearanceSettings } from "../types"
import { isShellDesktopEnv } from "../config"

interface ThemeLoadRecord {
  key: string
  promise: Promise<void>
}

const pendingLoads = new Map<string, ThemeLoadRecord>()

function appendStylesheet(
  id: string,
  path: string,
  callback?: (element: HTMLLinkElement) => void,
  elementId: string = NMX_THEME_CSS_ID,
) {
  const safeSaveId = sanitizePath(id)
  const safeSavePath = sanitizePath(path)

  const link = document.createElement("link")
  link.id = elementId
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

export async function loadTheme(
  cssId: string,
  cssPath: string,
  elementId: string = NMX_THEME_CSS_ID,
): Promise<void> {
  const key = `${cssId}::${cssPath}`
  const existing = pendingLoads.get(elementId)

  if (existing && existing.key === key) {
    return existing.promise
  }

  const promise = new Promise<void>((resolve, reject) => {
    document.querySelector(`#${elementId}`)?.remove()
    appendStylesheet(
      cssId,
      cssPath,
      (element: HTMLLinkElement) => {
        element.onload = () => resolve()
        element.onerror = () => reject()
      },
      elementId,
    )
  })

  pendingLoads.set(elementId, { key, promise })
  promise.catch(() => {
    if (pendingLoads.get(elementId)?.key === key) {
      pendingLoads.delete(elementId)
    }
  })

  return promise
}

export async function applyTheme(themeId: string): Promise<void> {
  const targets: Array<{ path: string; elementId?: string }> = [
    { path: "theme.css" },
  ]

  if (isShellDesktopEnv()) {
    targets.push({
      path: "shell.css",
      elementId: `${NMX_THEME_CSS_ID}-shell`,
    })
  }

  await Promise.all(
    targets.map(({ path, elementId }) => loadTheme(themeId, path, elementId)),
  )
}

export function applyAppearanceTokens(settings: AppearanceSettings) {
  const root = document.documentElement

  if (settings.appearance_accent_color !== "default") {
    root.style.setProperty(
      "--nmx-color-primary",
      `var(--nmx-accent-color-${settings.appearance_accent_color})`,
    )
  }

  if (settings.appearance_density) {
    root.style.setProperty(
      "--nmx-spacing-unit",
      `var(--nmx-spacing-unit-${settings.appearance_density})`,
    )
  }

  if (settings.appearance_font_family) {
    root.style.setProperty(
      "--nmx-font-sans",
      `var(--nmx-font-family-${settings.appearance_font_family})`,
    )
  }

  if (settings.appearance_font_size) {
    root.style.setProperty(
      "--nmx-font-size-unit",
      `var(--nmx-font-size-unit-${settings.appearance_font_size})`,
    )
  }
}
