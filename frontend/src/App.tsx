import {
  addOnCloseHandler,
  type ApiErrorCode,
  authService,
  createAuthGuard,
  createLoginGuard,
  createRegisterGuard,
  DefaultPaths,
  GuardedRoute,
  isHasBeenConnected,
  nmxToast,
  removeOnCloseHandler,
  useSignalRStatus,
} from "@namorix/core"
import React, { useEffect, useState } from "react"
import { Navigate, Route, Routes } from "react-router-dom"
import { Desktop, Register, Login, Blocked } from "./pages"
import { healthController } from "./controllers"
import { NmxLoading } from "@namorix/ui"

const authGuard = createAuthGuard(authService)
const loginGuard = createLoginGuard(authService)
const registerGuard = createRegisterGuard(authService)

export const App: React.FC = () => {
  const [blocked, setBlocked] = useState<ApiErrorCode | null | undefined>(null)
  const [checking, setChecking] = useState(true)
  const signalStatus = useSignalRStatus()
  const shouldShowReconnecting =
    isHasBeenConnected() && signalStatus !== "connected"

  useEffect(() => {
    const handler = () => {
      console.warn("[app] signalR disconnected")
    }

    healthController
      .checkUntrustedProxy()
      .then((result) => {
        if (!result.success) {
          return setBlocked(result.code)
        }
        addOnCloseHandler(handler)
      })
      .catch((err) => nmxToast.error(err))
      .finally(() => setChecking(false))
    return () => removeOnCloseHandler(handler)
  }, [])

  if (checking) return <NmxLoading />

  if (blocked) {
    return <Blocked code={blocked} />
  }

  return (
    <>
      <Routes>
        <Route
          path={DefaultPaths.LOGIN}
          element={
            <GuardedRoute guard={loginGuard}>
              <Login />
            </GuardedRoute>
          }
        />
        <Route
          path={DefaultPaths.REGISTER}
          element={
            <GuardedRoute guard={registerGuard}>
              <Register />
            </GuardedRoute>
          }
        />
        <Route
          path={DefaultPaths.HOME}
          element={
            <GuardedRoute guard={authGuard}>
              <Desktop />
            </GuardedRoute>
          }
        />
        <Route path="*" element={<Navigate to={DefaultPaths.HOME} replace />} />
      </Routes>
      <NmxLoading
        overlay
        shouldRender={!checking && !blocked && shouldShowReconnecting}
      />
    </>
  )
}
