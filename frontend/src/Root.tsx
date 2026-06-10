import { useEffect } from "react"
import { App } from "./App"
import { Provider } from "react-redux"
import { store } from "./store"
import { NmxHostContext, NmxToastProvider } from "@namorix/ui"
import { nmxToast, useUserStore } from "@namorix/core"
import { authController, loadSystemDefaults } from "./controllers"

export const Root = () => {
  const user = useUserStore()

  useEffect(() => {
    document.body.dataset.mode = "windowed"
  }, [])

  useEffect(() => {
    if (!user) {
      loadSystemDefaults().catch((err) => nmxToast.error(err))
    } else {
      authController.loadAppearance().catch((err) => nmxToast.error(err))
    }
  }, [user])

  return (
    <NmxHostContext value="shell">
      <Provider store={store}>
        <NmxToastProvider />
        <App />
      </Provider>
    </NmxHostContext>
  )
}
