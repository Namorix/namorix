import React, { useEffect } from "react"
import { App } from "./App"
import { Provider } from "react-redux"
import { store } from "./store"
import { NmxHostContext, NmxToastProvider } from "@namorix/ui"
import { useAppearanceSync } from "./hooks"
import { listGlobalComponents } from "./addons"

export const GlobalAddonHandlers: React.FC = () => {
  const components = listGlobalComponents()
  return components.map((C, i) => <C key={i} />)
}

export const Root = () => {
  useEffect(() => {
    document.body.dataset.mode = "windowed"
  }, [])

  useAppearanceSync()

  return (
    <NmxHostContext value="shell">
      <Provider store={store}>
        <NmxToastProvider />
        <App />
        <GlobalAddonHandlers />
      </Provider>
    </NmxHostContext>
  )
}
