import {
  authService,
  createAuthGuard,
  createLoginGuard,
  createRegisterGuard,
  GuardedRoute,
} from "@namorix/core"
import type React from "react"
import { Navigate, Route, Routes } from "react-router-dom"
import { Desktop, Register, Login } from "./pages"

const authGuard = createAuthGuard(authService)
const loginGuard = createLoginGuard(authService)
const registerGuard = createRegisterGuard(authService)

export const App: React.FC = () => {
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
