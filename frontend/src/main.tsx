import "./styles/main.scss"

import { StrictMode, useEffect, useState } from "react"
import { createRoot } from "react-dom/client"
import { BrowserRouter } from "react-router-dom"
import {
  ThemeProvider,
  configureCore,
  generateFingerprint,
  getAllThemes,
  restoreTheme,
  type ThemeManifest,
} from "@namorix/core"
import { App } from "./App"
import "./i18n"
import "./addons"

configureCore({
  apiBaseUrl:
    (import.meta.env.VITE_API_URL ?? window.location.host === "izerocs.space")
      ? "https://api.izerocs.space"
      : window.location.origin,
})

generateFingerprint().catch(console.error)
restoreTheme()

const container = document.getElementById("root")!
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

createRoot(container).render(
  <StrictMode>
    <BrowserRouter>
      <Root />
    </BrowserRouter>
  </StrictMode>,
)
