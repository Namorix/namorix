import { useEffect } from "react"
import { App } from "./App"
import { Provider } from "react-redux"
import { store } from "./store"
import { NmxHostContext, NmxToastProvider } from "@namorix/ui"

export const Root = () => {
  useEffect(() => {
    document.body.dataset.mode = "windowed"
  }, [])

  return (
    <NmxHostContext value="shell">
      <Provider store={store}>
        <NmxToastProvider />
        <App />
      </Provider>
    </NmxHostContext>
  )
}
