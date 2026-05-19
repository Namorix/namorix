import { useEffect, useState } from "react"
import { getAllThemes, type ThemeManifest, ThemeProvider } from "@namorix/core"
import { App } from "./App"
import { Provider } from "react-redux"
import { store } from "./store"

export const Root = () => {
  const [themes, setThemes] = useState<ThemeManifest[]>([])

  useEffect(() => {
    getAllThemes().then(setThemes)
  }, [])

  return (
    <Provider store={store}>
      <ThemeProvider themes={themes}>
        <App />
      </ThemeProvider>
    </Provider>
  )
}
