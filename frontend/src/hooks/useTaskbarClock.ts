import { useEffect, useState } from "react"
import { useDateTimeFormat } from "@namorix/core"

export const useTaskbarClock = () => {
  const [, setTick] = useState(0)
  const { clock } = useDateTimeFormat()

  useEffect(() => {
    let id: ReturnType<typeof setInterval>

    const start = () => {
      id = setInterval(() => setTick((t) => t + 1), 30_000)
    }

    const remaining = 30_000 - (Date.now() % 30_000)
    const timeout = setTimeout(() => {
      setTick((t) => t + 1)
      start()
    }, remaining)

    return () => {
      clearTimeout(timeout)
      clearInterval(id)
    }
  }, [])

  return clock(new Date())
}
