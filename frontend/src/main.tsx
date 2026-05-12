import "./styles/main.scss"

import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { BrowserRouter } from "react-router-dom"
import { configureCore, generateFingerprint } from "@namorix/core"
import { App } from "./App"
import "./i18n"

configureCore({
  apiBaseUrl:
    import.meta.env.VITE_API_URL ??
    "http://" + window.location.hostname + ":3000",
})
generateFingerprint().catch(console.error)

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
