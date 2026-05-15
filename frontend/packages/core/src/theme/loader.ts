import { ThemeRoutes } from "../apiRoutes"
import { NMX_THEME_CSS_ID, NMX_THEME_STORAGE_KEY } from "../constants"

export function restoreTheme(): void {
  const saveId = localStorage.getItem(NMX_THEME_STORAGE_KEY)
  if (!saveId) {
    return
  }

  const link = document.createElement("link")
  link.id = NMX_THEME_CSS_ID
  link.rel = "stylesheet"
  link.href = ThemeRoutes.themes.replace("{id}", saveId)
  document.head.appendChild(link)
}

export async function loadTheme(cssUrl: string): Promise<void> {
  document.querySelector(`#${NMX_THEME_CSS_ID}`)?.remove()
  return new Promise((resolve, reject) => {
    const link = document.createElement("link")
    link.id = NMX_THEME_CSS_ID
    link.rel = "stylesheet"
    link.href = cssUrl
    link.onload = () => resolve()
    link.onerror = () => reject()
    document.head.appendChild(link)
  })
}
