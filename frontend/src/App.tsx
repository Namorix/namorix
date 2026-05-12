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
const signInGuard = createLoginGuard(authService)
const signUpGuard = createRegisterGuard(authService)

export const App: React.FC = () => {
  return (
    <Routes>
      <Route
        path="/signin"
        element={
          <GuardedRoute guard={signInGuard}>
            <Login />
          </GuardedRoute>
        }
      />
      <Route
        path="/signup"
        element={
          <GuardedRoute guard={signUpGuard}>
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
