import React, { useEffect, useState } from "react"
import { Navigate, useLocation } from "react-router-dom"

interface Props {
  guard?: () => Promise<string | null>
  children: React.ReactNode
}

export function GuardedRoute({ guard, children }: Props) {
  const location = useLocation()
  const [target, setTarget] = useState<(string & {}) | null | "pending">(
    "pending",
  )

  useEffect(() => {
    if (!guard) {
      setTarget(null)
      return
    }
    guard()
      .then(setTarget)
      .catch(() => {
        setTarget(null)
      })
  }, [location.key])

  if (target === "pending") {
    return null
  }

  if (target) {
    return <Navigate to={target} replace />
  }

  return <>{children}</>
}
