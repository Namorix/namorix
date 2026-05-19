import React from "react"
import type { WindowData } from "../../../store"

export const useWindowAnimVars = (win?: WindowData | null) => {
  const maximizeVars =
    win?.animState === "maximizing"
      ? ({
          "--nmx-scale-x": window.innerWidth / win.width,
          "--nmx-scale-y": window.innerHeight / win.height,
          "--nmx-translate-x": `${window.innerWidth / 2 - (win.x + win.width / 2)}px`,
          "--nmx-translate-y": `${window.innerHeight / 2 - (win.y + win.height) / 2}px`,
        } as React.CSSProperties)
      : undefined

  const unmaximizeVars =
    win?.animState === "unmaximizing" && win.preMaximize
      ? ({
          "--nmx-scale-x": win.preMaximize.width / window.innerWidth,
          "--nmx-scale-y": win.preMaximize.height / window.innerHeight,
          "--nmx-translate-x": `${win.preMaximize.x + win.preMaximize.width / 2 - window.innerWidth / 2}px`,
          "--nmx-translate-y": `${win.preMaximize.y + win.preMaximize.height / 2 - window.innerHeight / 2}px`,
        } as React.CSSProperties)
      : undefined

  return { maximizeVars, unmaximizeVars }
}
