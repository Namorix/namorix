import { useEffect, useState } from "react"
import { getAllThemes, type ThemeManifest, ThemeProvider } from "@namorix/core"
import { App } from "./App"
import { Provider } from "react-redux"
import { store } from "./store"
import { NmxHostContext } from "@namorix/ui"

export const Root = () => {
  const [themes, setThemes] = useState<ThemeManifest[]>([])

  useEffect(() => {
    document.body.dataset.mode = "windowed"
    getAllThemes().then(setThemes)
  }, [])

  return (
    <NmxHostContext value="shell">
      <Provider store={store}>
        <ThemeProvider themes={themes}>
          <App />
        </ThemeProvider>
      </Provider>
    </NmxHostContext>
  )
}
