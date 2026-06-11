import { useCallback, useRef } from "react"

export function useDoubleTap<T extends (...args: never[]) => void>(
  handler: T,
  delay: number = 300,
): (...args: Parameters<T>) => void {
  const lastTap = useRef(0)

  return useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now()
      if (now - lastTap.current < delay) {
        handler(...args)
      }
      lastTap.current = now
    },
    [handler, delay],
  )
}
