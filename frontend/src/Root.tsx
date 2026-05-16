import { useEffect, useState } from "react"
import { getAllThemes, type ThemeManifest, ThemeProvider } from "@namorix/core"
import { App } from "./App"

export const Root = () => {
  const [themes, setThemes] = useState<ThemeManifest[]>([])

  useEffect(() => {
    getAllThemes().then(setThemes)
  }, [])

  return (
    <ThemeProvider themes={themes}>
      <App />
    </ThemeProvider>
  )
}
