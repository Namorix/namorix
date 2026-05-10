import {
  authService,
  createAuthGuard,
  createSignInGuard,
  createSignUpGuard,
  GuardedRoute,
} from "@namorix/core"
import type React from "react"
import { Navigate, Route, Routes } from "react-router-dom"
import { Desktop, SignUp, SignIn } from "./pages"

const authGuard = createAuthGuard(authService)
const signInGuard = createSignInGuard(authService)
const signUpGuard = createSignUpGuard(authService)

export const App: React.FC = () => {
  return (
    <Routes>
      <Route
        path="/signin"
        element={
          <GuardedRoute guard={signInGuard}>
            <SignIn />
          </GuardedRoute>
        }
      />
      <Route
        path="/signup"
        element={
          <GuardedRoute guard={signUpGuard}>
            <SignUp />
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
