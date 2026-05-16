import type { ThemeManifest } from "./types"
import { http } from "../http"
import { getApiBaseUrl } from "../config"
import { ApiThemeRoutes, ThemeRoutes } from "../apiRoutes"
import { dedupe } from "../utils/dedupe"

async function getBuiltInThemes(): Promise<ThemeManifest[]> {
  const result = await http.getJson<{ themes: ThemeManifest[] }>(
    ThemeRoutes.builtin,
  )
  return result.success ? result.data.themes : []
}

export const getAllThemes = dedupe(async (): Promise<ThemeManifest[]> => {
  const [builtIn, external] = await Promise.allSettled([
    getBuiltInThemes(),
    http
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

  return themes
})
