import { ThemeRoutes } from "../apiRoutes"
import {
  NMX_THEME_CSS_ID,
  NMX_THEME_CSS_PATH_KEY,
  NMX_THEME_STORAGE_KEY,
} from "../constants"
import { sanitizePathSegment } from "../utils"

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
