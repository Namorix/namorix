import type { ThemeManifest } from "./types"
import { nmxHttp } from "../http"
import { getApiBaseUrl } from "../config"
import { ApiThemeRoutes, ThemeRoutes } from "../apiRoutes"

async function getBuiltInThemes(): Promise<ThemeManifest[]> {
  const result = await nmxHttp.getJson<{ themes: ThemeManifest[] }>(
    ThemeRoutes.builtin,
  )
  return result.success ? result.data.themes : []
}

export const getAllThemes = async (): Promise<ThemeManifest[]> => {
  const [builtIn, external] = await Promise.allSettled([
    getBuiltInThemes(),
    nmxHttp
      .url(getApiBaseUrl() + ApiThemeRoutes.themes)
      .get()
      .json<ThemeManifest[]>(),
  ])

  const themes: ThemeManifest[] = []

  if (builtIn.status === "fulfilled") {
    themes.push(...builtIn.value)
  }

  if (external.status === "fulfilled" && external.value.success) {
    themes.push(...external.value.data)
  }

  const seen = new Set<string>()
  return themes.filter((t) => {
    if (seen.has(t.id)) return false
    seen.add(t.id)
    return true
  })
}
