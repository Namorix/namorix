import { useEffect, useState } from "react"

export function isDryRunActive(
  expiresAt: string | null | undefined,
  now: number,
): boolean {
  return expiresAt != null && new Date(expiresAt).getTime() > now
}

export function useDryRunClock(expiresAt: string | null | undefined): number {
  const [now, setNow] = useState(() => Date.now())
  const active = isDryRunActive(expiresAt, now)

  useEffect(() => {
    if (!active) return
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [active, expiresAt])

  return now
}

export function useDryRunActive(expiresAt: string | null | undefined): boolean {
  const now = useDryRunClock(expiresAt)
  return isDryRunActive(expiresAt, now)
}
