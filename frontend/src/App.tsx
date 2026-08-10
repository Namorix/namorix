import {
  type ApiErrorCode,
  createAuthGuard,
  createLoginGuard,
  createRegisterGuard,
  DefaultPaths,
  GuardedRoute,
  nmxToast,
} from "@namorix/core"
import React, { useEffect, useState } from "react"
import { Navigate, Route, Routes, useNavigate } from "react-router-dom"
import { Desktop, Register, Login, Blocked } from "./pages"
import { healthController } from "./controllers"
import { NmxLoadingOverlay } from "@namorix/ui"
import { closeAllWindows, useAppDispatch } from "./store"
import { coreConfig } from "./config/coreConfig"
import { useSignalRStatus } from "./signalr"

const authGuard = createAuthGuard(coreConfig.auth)
const loginGuard = createLoginGuard(coreConfig.auth)
const registerGuard = createRegisterGuard(coreConfig.auth)

export const App: React.FC = () => {
  const [blocked, setBlocked] = useState<ApiErrorCode | null | undefined>(null)
  const [checking, setChecking] = useState(true)
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const signalStatus = useSignalRStatus()
  const shouldShowReconnecting =
    coreConfig.signalr.isHasBeenConnected() && signalStatus !== "connected"

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
        coreConfig.signalr.addOnCloseHandler(handler)
      })
      .catch(nmxToast.error)
      .finally(() => setChecking(false))

    return () => coreConfig.signalr.removeOnCloseHandler(handler)
  }, [])

  useEffect(() => {
    coreConfig.authRefresh.setOnUnauthorized(async () => {
      if (
        window.location.pathname === DefaultPaths.LOGIN ||
        window.location.pathname === DefaultPaths.REGISTER
      ) {
        return
      }

      dispatch(closeAllWindows())
      coreConfig.signalr.setHasBeenConnected(false)
      await coreConfig.signalr.stopConnection()
      navigate(DefaultPaths.LOGIN, { replace: true })
    })
  }, [dispatch, navigate])

  if (checking) return <NmxLoadingOverlay />

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
      <NmxLoadingOverlay
        overlay
        shouldRender={!checking && !blocked && shouldShowReconnecting}
      />
    </>
  )
}
