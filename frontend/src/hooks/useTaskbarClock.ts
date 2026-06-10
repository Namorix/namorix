import { useEffect, useState } from "react"
import { useAppearanceStore } from "@namorix/core"

const fmt = (timeFormat: string, dateFormat: string) => {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, "0")

  const is24h = timeFormat === "HH:mm"
  const time = is24h
    ? `${pad(d.getHours())}:${pad(d.getMinutes())}`
    : `${pad(d.getHours() % 12 || 12)}:${pad(d.getMinutes())} ${d.getHours() >= 12 ? "PM" : "AM"}`

  let date: string

  switch (dateFormat) {
    case "MM/DD/YYYY":
      date = `${pad(d.getMonth() + 1)}/${pad(d.getDate())}/${d.getFullYear()}`
      break
    case "YYYY-MM-DD":
      date = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
      break
    default:
      date = `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`
  }

  return { time, date }
}

export const useTaskbarClock = () => {
  const appearance = useAppearanceStore()
  const dateFormat = appearance?.appearance_date_format ?? "DD/MM/YYYY"
  const timeFormat = appearance?.appearance_time_format ?? "HH:mm"

  const [, setTick] = useState(0)

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

  return fmt(timeFormat, dateFormat)
}
