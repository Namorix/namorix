import "./main.scss"

import { createRoot } from "react-dom/client"
import { BrowserRouter } from "react-router-dom"
import { configureCore, generateFingerprint } from "@namorix/core"
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

const { hostname } = location
const isLocal =
  hostname === "localhost" ||
  hostname === "::1" ||
  /^127\./.test(hostname) ||
  /^192\.168\./.test(hostname) ||
  /^10\./.test(hostname) ||
  /^172\.(1[6-9]|2\d|3[01])\./.test(hostname)

if (isLocal) {
  const script = document.createElement("script")
  script.src = "//unpkg.com/react-scan/dist/auto.global.js"
  script.crossOrigin = "anonymous"
  document.head.prepend(script)
}

createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <Root />
  </BrowserRouter>,
)
