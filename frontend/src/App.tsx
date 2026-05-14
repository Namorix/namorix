import {
  type ApiErrorCode,
  authService,
  createAuthGuard,
  createLoginGuard,
  createRegisterGuard,
  GuardedRoute,
} from "@namorix/core"
import React, { useEffect, useState } from "react"
import { Navigate, Route, Routes } from "react-router-dom"
import { Desktop, Register, Login, Blocked } from "./pages"
import { healthController } from "./controllers/health.controller"

const authGuard = createAuthGuard(authService)
const loginGuard = createLoginGuard(authService)
const registerGuard = createRegisterGuard(authService)

export const App: React.FC = () => {
  const [blocked, setBlocked] = useState<ApiErrorCode | null>(null)

  useEffect(() => {
    healthController
      .checkUntrustedProxy()
      .then((result) => {
        if (!result.success) {
          setBlocked(result.code as ApiErrorCode)
        }
      })
      .catch(() => {})
  }, [])

  if (blocked) {
    return <Blocked code={blocked} />
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={
          <GuardedRoute guard={loginGuard}>
            <Login />
          </GuardedRoute>
        }
      />
      <Route
        path="/register"
        element={
          <GuardedRoute guard={registerGuard}>
            <Register />
          </GuardedRoute>
        }
      />
      <Route
        path="/"
        element={
          <GuardedRoute guard={authGuard}>
            <Desktop />
          </GuardedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
