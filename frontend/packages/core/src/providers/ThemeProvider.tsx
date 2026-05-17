import type { ThemeManifest } from "../theme"
import React, { createContext, useContext, useState } from "react"
import { loadTheme } from "../theme"
import { NMX_THEME_CSS_PATH_KEY } from "../constants"

export interface ThemeContextValue {
  current: string | null
  themes: ThemeManifest[]
  switchTheme: (id: string) => Promise<void>
}

const ThemeContext = createContext<ThemeContextValue | null>(null)
type onSwitchHandler = (manifest: ThemeManifest) => void

interface ThemeProviderProps {
  themes: ThemeManifest[]
  initialThemeId?: string
  onSwitch?: onSwitchHandler
  children: React.ReactNode
}

export const ThemeProvider = ({
  themes,
  initialThemeId,
  onSwitch,
  children,
}: ThemeProviderProps) => {
  const [currentId, setCurrentId] = useState<string | null>(
    initialThemeId ?? null,
  )

  const switchTheme = async (id: string) => {
    const manifest = themes.find((theme) => theme.id === id)
    if (!manifest) {
      return
    }

    await loadTheme(manifest.id, manifest.cssPath)
    localStorage.setItem(NMX_THEME_CSS_PATH_KEY, manifest.cssPath)
    setCurrentId(id)
    onSwitch?.(manifest)
  }

  return (
    <ThemeContext.Provider value={{ current: currentId, themes, switchTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

// TODO last check
// eslint-disable-next-line react-refresh/only-export-components
export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider")
  }
  return context
}
