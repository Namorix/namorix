import { useEffect, useState } from "react"

export const useTaskbarClock = () => {
  const fmt = () => {
    const d = new Date()
    const pad = (n: number) => String(n).padStart(2, "0")
    return {
      time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
      date: `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`,
    }
  }

  const [clock, setClock] = useState(fmt)

  useEffect(() => {
    const id = setInterval(() => setClock(fmt()), 30_000)
    return () => clearInterval(id)
  }, [])

  return clock
}
