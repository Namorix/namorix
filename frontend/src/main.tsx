import "./styles/main.scss"

import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { BrowserRouter } from "react-router-dom"
import { configureCore, generateFingerprint, restoreTheme } from "@namorix/core"
import { Root } from "./Root"
import "./i18n"
import "./addons"

configureCore({
  apiBaseUrl:
    (import.meta.env.VITE_API_URL ?? window.location.host === "izerocs.space")
      ? "https://api.izerocs.space"
      : window.location.origin,
})

generateFingerprint().catch(console.error)

if (!import.meta.env.DEV) {
  restoreTheme()
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <Root />
    </BrowserRouter>
  </StrictMode>,
)
