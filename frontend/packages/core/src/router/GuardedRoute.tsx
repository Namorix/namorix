import React, { useEffect, useState } from "react"
import { Navigate } from "react-router-dom"

interface Props {
  guard?: () => Promise<string | null>
  children: React.ReactNode
}

export function GuardedRoute({ guard, children }: Props) {
  const [target, setTarget] = useState<(string & {}) | null | "pending">(
    "pending",
  )

  useEffect(() => {
    if (!guard) return

    guard()
      .then(setTarget)
      .catch(() => {
        setTarget(null)
      })
  }, [guard])

  if (target === "pending") return null

  if (target) return <Navigate to={target} replace />

  return <>{children}</>
}
