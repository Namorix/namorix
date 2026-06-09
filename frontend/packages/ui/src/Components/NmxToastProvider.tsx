import { useCallback, useEffect, useRef, useState } from "react"
import { nmxToast, type NmxToastEvent, type NmxToastType } from "@namorix/core"
import { cx } from "../utils"
import { NmxIconFont, NmxIconFontSymbol } from "../Primitives"

const TOAST_DURATION = { short: 2500, long: 4000 }
const EXIT_ANIM_MS = 300

interface ToastItem extends NmxToastEvent {
  phase: "enter" | "exit"
}

const TOAST_ICONS: Record<NmxToastType, NmxIconFontSymbol> = {
  success: NmxIconFontSymbol.CHECK,
  error: NmxIconFontSymbol.CLOSE,
  warning: NmxIconFontSymbol.WARNING,
  info: NmxIconFontSymbol.INFO,
}

export const NmxToastProvider = () => {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map(),
  )

  const dismiss = useCallback((id: string) => {
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, phase: "exit" } : t)),
    )
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, EXIT_ANIM_MS)
  }, [])

  useEffect(() => {
    return nmxToast.subscribe((event) => {
      const id = event.id
      setToasts((prev) => {
        const next = prev.length >= 3 ? prev.slice(1) : prev
        return [...next, { ...event, phase: "enter" }]
      })
      const timer = setTimeout(() => {
        dismiss(id)
        timersRef.current.delete(id)
      }, TOAST_DURATION[event.duration])
      timersRef.current.set(id, timer)
    })
  }, [dismiss])

  return (
    <div className="nmx-toast-provider">
      {toasts.map((t) => (
        <button
          key={t.id}
          className={cx(
            "nmx-toast",
            `nmx-toast--${t.type}`,
            `nmx-toast--${t.phase}`,
          )}
          onClick={() => dismiss(t.id)}
        >
          <NmxIconFont symbol={TOAST_ICONS[t.type]} className="nmx-toast__icon"/>
          <span className="nmx-toast__msg">{t.message}</span>
        </button>
      ))}
    </div>
  )
}
